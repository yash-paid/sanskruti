import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import GlowWave from './components/GlowWave';
import AuthCard from './components/AuthCard';
import SetProfileScreen from './components/SetProfileScreen';
import HomeScreen from './components/HomeScreen';
import WalletScreen from './components/WalletScreen';
import ProfileScreen from './components/ProfileScreen';
import VipScreen from './components/VipScreen';
import { markPackAsPurchased } from './data/packages';
import { auth } from './firebase/config';
import {
  signInWithGoogle,
  signInWithEmail,
  signUpWithEmail,
  logOut,
  subscribeToAuth,
  handleRedirectResult,
  getAuthErrorMessage,
  detectIdentifierType,
  normalizeIndianMobile,
  authenticateWithPhone,
  getStoredPhoneUser,
  clearPhoneAuthSession,
} from './firebase/authService';
import {
  fetchUserProfile,
  saveUserProfile,
  fetchUserWallet,
  transactUserCoins,
  recordUserCall,
  fetchUserVipEntitlement,
  activateUserVip,
} from './firebase/userService';

const VALID_PAGES = ['login', 'setup-profile', 'home', 'wallet', 'profile', 'vip'];

const getPageFromUrl = () => {
  try {
    const pathname = window.location.pathname || '';
    const match = pathname.match(/^\/connect\/?([a-z0-9\-_]+)?\/?$/i);
    if (match && match[1]) {
      const sub = match[1].toLowerCase();
      if (VALID_PAGES.includes(sub)) return sub;
    }
  } catch (e) {}

  try {
    const hash = (window.location.hash || '').replace('#', '').toLowerCase();
    if (VALID_PAGES.includes(hash)) return hash;
  } catch (e) {}

  return null;
};

const getUrlForPage = (pageName) => {
  if (pageName === 'home' || pageName === 'login') return '/connect/';
  return `/connect/${pageName}`;
};

const getInitialPage = () => {
  const urlPage = getPageFromUrl();
  const isGuest = (() => {
    try {
      return localStorage.getItem('connect_is_guest') === 'true';
    } catch (e) {
      return false;
    }
  })();
  const hasPhoneSession = Boolean(getStoredPhoneUser());
  const hasAuth = Boolean(auth.currentUser) || hasPhoneSession || isGuest;

  if (urlPage) {
    // Protected pages require authentication
    if (!hasAuth && (urlPage === 'wallet' || urlPage === 'profile' || urlPage === 'vip' || urlPage === 'setup-profile')) {
      return 'login';
    }
    return urlPage;
  }

  // 2. Check saved page in localStorage
  try {
    const savedPage = localStorage.getItem('connect_current_page');
    if (savedPage && VALID_PAGES.includes(savedPage)) {
      if (!hasAuth && (savedPage === 'wallet' || savedPage === 'profile' || savedPage === 'vip')) {
        return 'login';
      }
      return savedPage;
    }
  } catch (e) {}

  // 3. Fallback to home if authenticated or guest, else login
  return hasAuth ? 'home' : 'login';
};

export default function App() {
  // Pages: 'login' | 'setup-profile' | 'home' | 'wallet' | 'profile' | 'vip'
  const [page, setPage] = useState(getInitialPage);

  // User Profile state for authenticated user
  const [userProfile, setUserProfile] = useState({
    name: '',
    username: '',
    phone: '',
    userId: '',
    avatar: '/default-avatars/1.png',
    dob: '2000-01-01',
    isProfileComplete: false,
  });

  // Confirmed coins balance from live backend
  const [coins, setCoins] = useState(0);

  const coinsRef = useRef(coins);
  useEffect(() => {
    coinsRef.current = coins;
  }, [coins]);

  const currentUid = auth.currentUser?.uid || getStoredPhoneUser()?.uid || null;

  // Sync confirmed live wallet coins and profile from backend whenever user changes
  useEffect(() => {
    let isMounted = true;
    if (currentUid) {
      fetchUserWallet(currentUid)
        .then((balance) => {
          if (isMounted) {
            setCoins(balance);
            coinsRef.current = balance;
          }
        })
        .catch((err) => console.warn('fetchUserWallet error:', err));

      fetchUserProfile(currentUid)
        .then((profile) => {
          if (isMounted && profile) {
            setUserProfile(profile);
          }
        })
        .catch((err) => console.warn('fetchUserProfile error:', err));

      fetchUserVipEntitlement(currentUid)
        .then((res) => {
          if (isMounted && res?.entitlement && res.entitlement.active) {
            setVipEntitlement(res.entitlement);
          } else if (isMounted) {
            setVipEntitlement(null);
          }
        })
        .catch((err) => console.warn('fetchUserVipEntitlement error:', err));
    } else {
      setCoins(0);
      coinsRef.current = 0;
      setVipEntitlement(null);
    }
    return () => {
      isMounted = false;
    };
  }, [currentUid]);

  const handleDeductCoins = async (amount, metadata = {}) => {
    if (typeof amount !== 'number' || amount <= 0) return false;
    if (coinsRef.current < amount) {
      showToast('⚠️ Insufficient Coins! Please recharge to continue.');
      return false;
    }

    if (currentUid) {
      try {
        const res = await transactUserCoins(currentUid, {
          amount,
          isCredit: false,
          type: metadata.type || 'call',
          title: metadata.title || 'Video Call Coins',
          metadata,
        });
        setCoins(res.newBalance);
        coinsRef.current = res.newBalance;
        return true;
      } catch (err) {
        showToast(`⚠️ ${err.message || 'Transaction failed'}`);
        return false;
      }
    }

    const next = Math.max(0, coinsRef.current - amount);
    coinsRef.current = next;
    setCoins(next);
    return true;
  };

  const [toastMessage, setToastMessage] = useState('');
  const [vipEntitlement, setVipEntitlement] = useState(null);

  // Guest user status (Guests can browse but cannot call or buy coins without logging in)
  const [isGuest, setIsGuest] = useState(() => {
    try {
      return localStorage.getItem('connect_is_guest') === 'true';
    } catch (e) {
      return false;
    }
  });

  // Initial mode for AuthCard when opened ('login' | 'signup')
  const [authInitialMode, setAuthInitialMode] = useState('login');

  // Initial tab for home screen ('call' | 'stars')
  const [initialHomeTab, setInitialHomeTab] = useState(() => {
    try {
      return localStorage.getItem('connect_home_tab') || 'call';
    } catch (e) {
      return 'call';
    }
  });

  // Expert queued to auto-call after a successful recharge
  const [autoStartExpert, setAutoStartExpert] = useState(null);

  // Navigate to any page and persist across reloads (NEVER sets auth state)
  const goToPage = (newPage) => {
    if (!VALID_PAGES.includes(newPage)) return;
    setPage(newPage);
    try {
      localStorage.setItem('connect_current_page', newPage);
      const targetUrl = getUrlForPage(newPage);
      if (window.location.pathname !== targetUrl) {
        window.history.pushState({ page: newPage }, '', targetUrl);
      }
    } catch (e) {}
  };

  const changeHomeTab = (tab) => {
    setInitialHomeTab(tab);
    try {
      localStorage.setItem('connect_home_tab', tab);
    } catch (e) {}
  };

  // Sync with browser back/forward buttons (popstate) and hash changes
  useEffect(() => {
    const handlePopState = (event) => {
      let targetPage = event?.state?.page;
      if (!targetPage || !VALID_PAGES.includes(targetPage)) {
        targetPage = getPageFromUrl();
      }
      const isGuestUser = (() => {
        try {
          return localStorage.getItem('connect_is_guest') === 'true';
        } catch (e) {
          return false;
        }
      })();
      const hasAuth = Boolean(auth.currentUser) || Boolean(getStoredPhoneUser()) || isGuestUser;

      if (!targetPage || targetPage === 'home' || targetPage === 'login') {
        targetPage = hasAuth ? 'home' : 'login';
      } else if (!hasAuth && (targetPage === 'wallet' || targetPage === 'profile' || targetPage === 'vip' || targetPage === 'setup-profile')) {
        targetPage = 'login';
      }

      setPage(targetPage);
      try {
        localStorage.setItem('connect_current_page', targetPage);
      } catch (e) {}
    };

    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '').toLowerCase();
      if (VALID_PAGES.includes(hash) && hash !== page) {
        setPage(hash);
        try {
          localStorage.setItem('connect_current_page', hash);
        } catch (e) {}
      }
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('hashchange', handleHashChange);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, [page]);

  // Ensure current URL reflects current page on load/change
  useEffect(() => {
    try {
      const targetUrl = getUrlForPage(page);
      if (window.location.pathname !== targetUrl && !window.location.hash) {
        window.history.replaceState({ page }, '', targetUrl);
      }
    } catch (e) {}
  }, [page]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  // Handle mobile redirect sign-in result on initial mount
  useEffect(() => {
    handleRedirectResult()
      .then((result) => {
        if (result?.user) {
          showToast(`✨ Welcome, ${result.user.displayName || 'User'}!`);
        }
      })
      .catch((err) => {
        if (err.code !== 'auth/null-user') {
          showToast(`❌ ${getAuthErrorMessage(err)}`);
        }
      });
  }, []);

  // Helper to load or initialize user profile by UID from backend
  const loadProfileForUid = async (uid, fallbackData = {}) => {
    try {
      const serverCoins = await fetchUserWallet(uid);
      setCoins(serverCoins);
      coinsRef.current = serverCoins;

      const serverProfile = await fetchUserProfile(uid);
      try {
        const vipRes = await fetchUserVipEntitlement(uid);
        if (vipRes?.entitlement && vipRes.entitlement.active) {
          setVipEntitlement(vipRes.entitlement);
        } else {
          setVipEntitlement(null);
        }
      } catch (err) {}

      if (serverProfile) {
        setUserProfile(serverProfile);
        if (!serverProfile.isProfileComplete) {
          goToPage('setup-profile');
        } else {
          setPage((prevPage) => {
            if (prevPage === 'login' || prevPage === 'setup-profile') {
              try {
                localStorage.setItem('connect_current_page', 'home');
                window.history.replaceState({ page: 'home' }, '', getUrlForPage('home'));
              } catch (e) {}
              return 'home';
            }
            return prevPage;
          });
        }
        return;
      }
    } catch (e) {
      console.warn('Backend loadProfileForUid error:', e);
    }

    const displayName = fallbackData.name || 'CONNECT User';
    const newProfile = {
      uid,
      userId: 'CN-' + uid.replace(/[^a-zA-Z0-9]/g, '').slice(-6).toUpperCase(),
      name: displayName,
      username:
        fallbackData.username ||
        '@' +
        (displayName
          ? displayName.toLowerCase().replace(/[^a-z0-9]/g, '_')
          : 'user_' + uid.slice(-4)),
      phone: fallbackData.phone || '',
      email: fallbackData.email || '',
      avatar: fallbackData.avatar || '/default-avatars/1.png',
      dob: '2000-01-01',
      isProfileComplete: false,
    };

    setUserProfile(newProfile);
    goToPage('setup-profile');
  };

  // Listen to real Firebase authentication state (onAuthStateChanged) + phone session
  useEffect(() => {
    const unsubscribe = subscribeToAuth((firebaseUser) => {
      if (firebaseUser) {
        setIsGuest(false);
        try {
          localStorage.setItem('connect_is_guest', 'false');
        } catch (e) {}

        const uid = firebaseUser.uid;
        loadProfileForUid(uid, {
          name: firebaseUser.displayName || 'CONNECT User',
          phone: firebaseUser.phoneNumber || '',
          avatar: firebaseUser.photoURL || '/default-avatars/1.png',
          email: firebaseUser.email || '',
        });
      } else {
        // Check for active phone session
        const phoneUser = getStoredPhoneUser();
        if (phoneUser) {
          setIsGuest(false);
          try {
            localStorage.setItem('connect_is_guest', 'false');
          } catch (e) {}
          loadProfileForUid(phoneUser.uid, {
            name: phoneUser.displayName || phoneUser.name || 'CONNECT User',
            username: phoneUser.username,
            phone: phoneUser.phoneNumber || phoneUser.phone || '',
            avatar: '/default-avatars/1.png',
            email: '',
          });
          return;
        }

        const isGuestUser = (() => {
          try {
            return localStorage.getItem('connect_is_guest') === 'true';
          } catch (e) {
            return false;
          }
        })();

        if (!isGuestUser) {
          setPage((prevPage) => {
            if (prevPage !== 'login') {
              try {
                localStorage.setItem('connect_current_page', 'login');
                window.history.replaceState({ page: 'login' }, '', getUrlForPage('login'));
              } catch (e) {}
              return 'login';
            }
            return prevPage;
          });
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Called when credentials are submitted on login/signup page
  const handleLogin = async (formData) => {
    try {
      const rawIdentifier = (formData.identifier || formData.email || '').trim();
      if (!rawIdentifier) {
        showToast('Please enter mobile number or email');
        return;
      }

      // Check for mobile number validation
      if (!rawIdentifier.includes('@')) {
        const digits = rawIdentifier.replace(/[^0-9]/g, '');
        if (digits.length === 8 || digits.length === 9 || (digits.length > 0 && digits.length < 10)) {
          showToast('❌ Wrong number! Please input correct 10-digit mobile number.');
          return;
        }
        if (digits.length === 10 && !/^[6-9]\d{9}$/.test(digits)) {
          showToast('❌ Wrong number! Please input correct 10-digit mobile number starting with 6, 7, 8, or 9.');
          return;
        }
      }

      const idType = detectIdentifierType(rawIdentifier);

      if (idType === 'phone') {
        const normalized = normalizeIndianMobile(rawIdentifier);
        if (formData.mode === 'signup') {
          showToast('Creating account with mobile number...');
          const result = await authenticateWithPhone({
            mode: 'signup',
            phone: normalized,
            password: formData.password,
            name: formData.name,
          });
          loadProfileForUid(result.uid, {
            name: result.name || 'CONNECT User',
            username: result.username,
            phone: result.phone,
          });
          showToast(`🎉 Account created! Welcome, ${result.name || result.phone}!`);
        } else {
          showToast('Logging in with mobile number...');
          const result = await authenticateWithPhone({
            mode: 'login',
            phone: normalized,
            password: formData.password,
          });
          loadProfileForUid(result.uid, {
            name: result.name || 'CONNECT User',
            username: result.username,
            phone: result.phone,
          });
          showToast(`✅ Welcome back, ${result.name || result.phone}!`);
        }
      } else {
        // Email + Password flow with Firebase
        if (formData.mode === 'signup') {
          showToast('Creating account with Firebase...');
          const userCred = await signUpWithEmail(
            rawIdentifier,
            formData.password,
            formData.name
          );
          showToast(`🎉 Account created! Welcome, ${formData.name || rawIdentifier}!`);
        } else {
          showToast('Signing in with Firebase...');
          const userCred = await signInWithEmail(
            rawIdentifier,
            formData.password
          );
          showToast(`✅ Welcome back, ${userCred.user?.displayName || rawIdentifier}!`);
        }
      }
    } catch (err) {
      console.warn('Auth error:', err);
      const code = err.code || '';
      if (
        formData.mode === 'login' &&
        (code === 'auth/user-not-found' ||
          code === 'auth/invalid-credential' ||
          err?.status === 404 ||
          err?.message?.toLowerCase().includes('user-not-found') ||
          err?.message?.toLowerCase().includes('no account found'))
      ) {
        showToast('⚠️ No account found..!! Switched to Sign Up.');
      } else {
        const msg = getAuthErrorMessage(err);
        showToast(`❌ ${msg}`);
      }
      throw err;
    }
  };

  // Called when user clicks "Continue with Google"
  const handleGoogleLogin = async () => {
    try {
      showToast('✨ Connecting Google Account...');
      const result = await signInWithGoogle();
      if (result?.user) {
        showToast(`✨ Welcome, ${result.user.displayName || 'User'}!`);
      }
    } catch (err) {
      console.warn('Google sign-in error:', err);
      showToast(`❌ ${getAuthErrorMessage(err)}`);
    }
  };

  // Called when user clicks "Continue as Guest"
  const handleGuestLogin = () => {
    setIsGuest(true);
    try {
      localStorage.setItem('connect_is_guest', 'true');
      setUserProfile((prev) => ({
        ...prev,
        name: 'Guest User',
        username: '@guest',
        userId: 'CN-GUEST',
        avatar: '/default-avatars/1.png',
      }));
    } catch (e) {}
    showToast('⚡ Continuing as Guest. Welcome to CONNECT!');
    goToPage('home');
  };

  // Triggered when a guest clicks Call or Buy Coins
  const handleRequireLogin = (targetMode = 'signup') => {
    setAuthInitialMode(targetMode);
    goToPage('login');
  };

  // Called when user clicks "Confirm & Continue" on SetProfileScreen
  const handleProfileConfirm = async (updatedProfile) => {
    setUserProfile(updatedProfile);
    const storedPhone = getStoredPhoneUser();
    const uid = auth.currentUser?.uid || storedPhone?.uid;
    if (uid) {
      try {
        await saveUserProfile(uid, { ...updatedProfile, isProfileComplete: true });
        localStorage.setItem(`connect_profile_setup_done_${uid}`, 'true');
      } catch (e) {
        console.warn('saveUserProfile error:', e);
      }
    }
    showToast(`🎉 Profile saved! Welcome, ${updatedProfile.name}!`);
    goToPage('home');
  };

  const handleLogout = async () => {
    try {
      await logOut();
    } catch (e) {}
    clearPhoneAuthSession();
    setIsGuest(false);
    setCoins(0);
    coinsRef.current = 0;
    setUserProfile({
      name: '',
      username: '',
      phone: '',
      userId: '',
      avatar: '/default-avatars/1.png',
      dob: '2000-01-01',
      isProfileComplete: false,
    });
    try {
      localStorage.removeItem('connect_is_guest');
      localStorage.setItem('connect_current_page', 'login');
      window.history.replaceState({ page: 'login' }, '', getUrlForPage('login'));
    } catch (e) {}
    setAuthInitialMode('login');
    setPage('login');
    showToast('Logged out successfully.');
  };

  const handleAddCoins = async (amount = 100, title = 'Coins Recharged') => {
    const uid = auth.currentUser?.uid || getStoredPhoneUser()?.uid;
    if (uid && amount > 0) {
      try {
        const res = await transactUserCoins(uid, {
          amount,
          isCredit: true,
          type: 'purchase',
          title,
        });
        setCoins(res.newBalance);
        coinsRef.current = res.newBalance;
        showToast(`✅ Added ${amount} Coins to your wallet!`);
        return;
      } catch (err) {
        console.warn('handleAddCoins backend error:', err);
      }
    }

    setCoins((prev) => {
      const next = Math.max(0, prev + amount);
      coinsRef.current = next;
      return next;
    });
    if (amount > 0) {
      showToast(`✅ Added ${amount} Coins to your wallet!`);
    }
  };

  // ── Server-Side PayU Verification Callback Handler ──
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const status = params.get('status');
      const txnid = params.get('txnid');
      const token = params.get('token');

      if (status && txnid) {
        if (status === 'success' && token) {
          showToast('Verifying payment server-side...');
          const verifyPayment = async () => {
            try {
              let res = await fetch(
                `/.netlify/functions/payu-verify?txnid=${encodeURIComponent(txnid)}&token=${encodeURIComponent(token)}`
              );
              if (res.status === 404) {
                res = await fetch(
                  `/api/payu-verify?txnid=${encodeURIComponent(txnid)}&token=${encodeURIComponent(token)}`
                );
              }
              const data = await res.json();
              if (data.success && data.verified) {
                const item = (data.items && data.items[0]) || {};
                const itemId = String(item.id || '');
                const isVipPurchase = itemId.includes('vip') || itemId.startsWith('connect-vip-');

                if (isVipPurchase) {
                  let planId = item.planId;
                  if (!planId) {
                    if (itemId.includes('diamond')) planId = 'diamond';
                    else if (itemId.includes('gold')) planId = 'gold';
                    else if (itemId.includes('silver')) planId = 'silver';
                    else planId = 'gold';
                  }

                  const activeUid = currentUid || localStorage.getItem('connect_last_auth_uid') || '';
                  if (activeUid) {
                    try {
                      const res = await activateUserVip(activeUid, planId);
                      setVipEntitlement(res.entitlement);
                      setUserProfile((prev) => ({
                        ...prev,
                        isVip: true,
                        vipPlan: res.entitlement?.planName || 'VIP Member',
                        vipExpiry: res.entitlement?.expiryDate,
                      }));
                      try {
                        localStorage.setItem(`connect_vip_active_${activeUid}`, 'true');
                      } catch (e) {}
                      showToast(`👑 Payment Verified! You are now an active ${res.entitlement?.planName || 'VIP'} Member! 🎉`);
                      goToPage('profile');
                    } catch (vipErr) {
                      console.warn('VIP activation error after payment:', vipErr);
                      showToast('👑 Payment Verified! VIP Membership is now active.');
                      goToPage('profile');
                    }
                  } else {
                    showToast('👑 Payment Verified! VIP Membership purchased successfully.');
                    goToPage('profile');
                  }
                } else {
                  // Coin Pack Recharge
                  const COIN_MAP = {
                    'connect-pack-19': 50,
                    'connect-pack-49': 160,
                    'connect-pack-99': 440,
                    'connect-pack-149': 880,
                    'connect-pack-199': 1250,
                  };
                  const coinsToAdd = COIN_MAP[item.id] || 440;
                  if (item.id) {
                    markPackAsPurchased(item.id);
                  }
                  handleAddCoins(coinsToAdd);
                  showToast(`🎉 Verified payment! Added ${coinsToAdd} Coins.`);

                  try {
                    const pendingExpert = localStorage.getItem('connect_pending_call_expert');
                    if (pendingExpert) {
                      const expertObj = JSON.parse(pendingExpert);
                      setAutoStartExpert(expertObj);
                      localStorage.removeItem('connect_pending_call_expert');
                    }
                  } catch (e) {}
                }
              } else {
                showToast(data.error || 'Payment verification failed server-side.');
              }
            } catch (err) {
              showToast('Could not verify payment with server.');
            } finally {
              const cleanUrl = window.location.pathname + window.location.hash;
              window.history.replaceState(null, '', cleanUrl);
            }
          };
          verifyPayment();
        } else if (status === 'failure' || status === 'cancel') {
          const msg = params.get('msg') || 'Payment was cancelled or failed.';
          showToast(`❌ ${msg}`);
          const cleanUrl = window.location.pathname + window.location.hash;
          window.history.replaceState(null, '', cleanUrl);
        }
      }
    } catch (e) {}
  }, []);

  // ── Initiate PayU Checkout for Recharge Pack ──
  const handleInitiateRecharge = async (pack, pendingExpert) => {
    try {
      if (pendingExpert) {
        localStorage.setItem('connect_pending_call_expert', JSON.stringify(pendingExpert));
      } else {
        localStorage.removeItem('connect_pending_call_expert');
      }
    } catch (e) {}

    const payload = {
      itemType: 'connect',
      itemId: pack.id.startsWith('connect-') ? pack.id : `connect-${pack.id}`,
      name: userProfile?.name || 'CONNECT User',
      phone: (userProfile?.phone || '9876543210').replace(/[^0-9]/g, '').slice(-10),
      email: `${(userProfile?.username || 'user').replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || 'user'}@connect.local`,
      source: 'connect-web',
    };

    let response;
    try {
      response = await fetch('/.netlify/functions/payu-initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (response.status === 404) {
        response = await fetch('/api/payu-initiate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }
    } catch (netErr) {
      // Local dev server fallback when Netlify Functions backend is offline
      markPackAsPurchased(pack.id);
      const fallbackCoins = pack.coins || 400;
      handleAddCoins(fallbackCoins);
      showToast(`🎉 Preview Mode: Added ${fallbackCoins} Coins for testing!`);
      return;
    }

    if (!response || response.status === 404) {
      // Local dev server fallback when Netlify Functions backend is offline
      markPackAsPurchased(pack.id);
      const fallbackCoins = pack.coins || 400;
      handleAddCoins(fallbackCoins);
      showToast(`🎉 Preview Mode: Added ${fallbackCoins} Coins for testing!`);
      return;
    }

    const contentType = response?.headers?.get('content-type') || '';
    let data;
    if (contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const rawText = await response.text();
      throw new Error(`Server returned status ${response?.status} (${rawText.slice(0, 100)})`);
    }

    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Failed to initiate PayU payment.');
    }

    showToast('Redirecting to 100% Secure PayU Checkout...');

    // Build and submit hidden POST form to PayU Hosted Checkout endpoint
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = data.actionUrl;
    form.style.display = 'none';

    for (const [key, val] of Object.entries(data.params || {})) {
      const hiddenInput = document.createElement('input');
      hiddenInput.type = 'hidden';
      hiddenInput.name = key;
      hiddenInput.value = val;
      form.appendChild(hiddenInput);
    }

    document.body.appendChild(form);
    form.submit();
  };

  // ── Initiate PayU Checkout for VIP Membership ──
  const handleInitiateVipPayment = async (plan) => {
    if (!currentUid) {
      showToast('Please log in first to purchase VIP membership.');
      return;
    }

    const payload = {
      itemType: 'connect',
      itemId: `connect-vip-${plan.id}`,
      name: userProfile?.name || 'CONNECT VIP User',
      phone: (userProfile?.phone || '9876543210').replace(/[^0-9]/g, '').slice(-10),
      email: `${(userProfile?.username || 'user').replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || 'user'}@connect.local`,
      source: 'connect-web',
    };

    let response;
    try {
      response = await fetch('/.netlify/functions/payu-initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (response.status === 404) {
        response = await fetch('/api/payu-initiate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }
    } catch (netErr) {
      // Local dev server fallback when Netlify Functions backend is offline
      const res = await activateUserVip(currentUid, plan.id);
      setVipEntitlement(res.entitlement);
      setUserProfile((prev) => ({
        ...prev,
        isVip: true,
        vipPlan: res.entitlement?.planName || 'VIP Member',
        vipExpiry: res.entitlement?.expiryDate,
      }));
      showToast(`🎉 Preview Mode: Activated ${plan.name} for testing!`);
      return;
    }

    if (!response || response.status === 404) {
      const res = await activateUserVip(currentUid, plan.id);
      setVipEntitlement(res.entitlement);
      setUserProfile((prev) => ({
        ...prev,
        isVip: true,
        vipPlan: res.entitlement?.planName || 'VIP Member',
        vipExpiry: res.entitlement?.expiryDate,
      }));
      showToast(`🎉 Preview Mode: Activated ${plan.name} for testing!`);
      return;
    }

    const contentType = response?.headers?.get('content-type') || '';
    let data;
    if (contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const rawText = await response.text();
      throw new Error(`Server returned status ${response?.status} (${rawText.slice(0, 100)})`);
    }

    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Failed to initiate PayU payment.');
    }

    showToast(`Redirecting to 100% Secure PayU Checkout for ${plan.name}...`);

    const form = document.createElement('form');
    form.method = 'POST';
    form.action = data.actionUrl;
    form.style.display = 'none';

    for (const [key, val] of Object.entries(data.params || {})) {
      const hiddenInput = document.createElement('input');
      hiddenInput.type = 'hidden';
      hiddenInput.name = key;
      hiddenInput.value = val;
      form.appendChild(hiddenInput);
    }

    document.body.appendChild(form);
    form.submit();
  };

  /* ── PAGE 1: LOGIN / SIGNUP ── */
  if (page === 'login') {
    return (
      <div className="connect-page-wrapper">
        <div className="connect-app-container">
          <div className="ambient-glow-top" aria-hidden="true" />
          <div className="ambient-glow-mid" aria-hidden="true" />
          <Header />
          <GlowWave />
          <AuthCard
            initialMode={authInitialMode}
            onToast={showToast}
            onLoginSuccess={handleLogin}
            onGoogleLogin={handleGoogleLogin}
            onGuestLogin={handleGuestLogin}
          />
          {toastMessage && (
            <div className="toast-notification" role="status" aria-live="polite">
              <span>{toastMessage}</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ── PAGE 1.5: SET UP PROFILE (Asked on login: Name, Photo, DOB) ── */
  if (page === 'setup-profile') {
    return (
      <div className="connect-page-wrapper">
        <div className="connect-app-container">
          <SetProfileScreen
            initialProfile={userProfile}
            onConfirm={handleProfileConfirm}
            onToast={showToast}
          />
          {toastMessage && (
            <div className="toast-notification" role="status" aria-live="polite">
              <span>{toastMessage}</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ── PAGE 3: WALLET ── */
  if (page === 'wallet') {
    return (
      <div className="connect-page-wrapper">
        <div className="connect-app-container">
          <WalletScreen
            coins={coins}
            userProfile={userProfile}
            uid={currentUid}
            isGuest={isGuest}
            onBack={() => goToPage('home')}
            onNavigateTab={(tab) => {
              if (tab === 'call') {
                changeHomeTab('call');
                goToPage('home');
              } else if (tab === 'stars') {
                changeHomeTab('stars');
                goToPage('home');
              } else if (tab === 'profile') {
                goToPage('profile');
              }
            }}
            onAddCoins={handleAddCoins}
            onOpenVip={() => goToPage('vip')}
            onRequireLogin={handleRequireLogin}
            onGoogleLogin={handleGoogleLogin}
            onToast={showToast}
          />
          {toastMessage && (
            <div className="toast-notification" role="status" aria-live="polite">
              <span>{toastMessage}</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ── PAGE 4: MY PROFILE ── */
  if (page === 'profile') {
    return (
      <div className="connect-page-wrapper">
        <div className="connect-app-container">
          <ProfileScreen
            coins={coins}
            userProfile={userProfile}
            uid={currentUid}
            onRewardClaimed={(awarded) => handleAddCoins(awarded)}
            onUpdateProfile={async (updated) => {
              setUserProfile(updated);
              if (currentUid) {
                try {
                  await saveUserProfile(currentUid, updated);
                } catch (e) {
                  console.warn('saveUserProfile error:', e);
                }
              }
            }}
            onBack={() => goToPage('home')}
            onNavigateTab={(tab) => {
              if (tab === 'call') {
                changeHomeTab('call');
                goToPage('home');
              } else if (tab === 'stars') {
                changeHomeTab('stars');
                goToPage('home');
              }
            }}
            onOpenWallet={() => goToPage('wallet')}
            onOpenVip={() => goToPage('vip')}
            onLogout={handleLogout}
            onToast={showToast}
          />
          {toastMessage && (
            <div className="toast-notification" role="status" aria-live="polite">
              <span>{toastMessage}</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ── PAGE 5: VIP MEMBERSHIP ── */
  if (page === 'vip') {
    return (
      <div className="connect-page-wrapper">
        <div className="connect-app-container">
          <VipScreen
            coins={coins}
            uid={currentUid}
            userProfile={userProfile}
            onInitiateVipPayment={handleInitiateVipPayment}
            onAddCoins={handleAddCoins}
            onBack={() => goToPage('profile')}
            onNavigateTab={(tab) => {
              if (tab === 'call') {
                changeHomeTab('call');
                goToPage('home');
              } else if (tab === 'stars') {
                changeHomeTab('stars');
                goToPage('home');
              } else if (tab === 'profile') {
                goToPage('profile');
              }
            }}
            onOpenWallet={() => goToPage('wallet')}
            onToast={showToast}
          />
          {toastMessage && (
            <div className="toast-notification" role="status" aria-live="polite">
              <span>{toastMessage}</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ── PAGE 2: HOME SCREEN (Default logged-in view) ── */
  return (
    <div className="connect-page-wrapper">
      <div className="connect-app-container">
        <HomeScreen
          coins={coins}
          userProfile={userProfile}
          vipEntitlement={vipEntitlement}
          uid={currentUid}
          isGuest={isGuest}
          initialTab={initialHomeTab}
          initialCallingExpert={autoStartExpert}
          onClearAutoStartExpert={() => setAutoStartExpert(null)}
          onLogout={handleLogout}
          onAddCoins={handleAddCoins}
          onDeductCoins={handleDeductCoins}
          onOpenWallet={() => goToPage('wallet')}
          onOpenVip={() => goToPage('vip')}
          onOpenProfile={() => goToPage('profile')}
          onInitiateRecharge={handleInitiateRecharge}
          onRequireLogin={handleRequireLogin}
          onGoogleLogin={handleGoogleLogin}
          onToast={showToast}
        />
        {toastMessage && (
          <div className="toast-notification" role="status" aria-live="polite">
            <span>{toastMessage}</span>
          </div>
        )}
      </div>
    </div>
  );
}
