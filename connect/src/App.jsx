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
} from './firebase/userService';

const VALID_PAGES = ['login', 'setup-profile', 'home', 'wallet', 'profile', 'vip'];

// ── Clean Slate Wipe for Fresh ID Creation ──
const CLEAN_SLATE_KEY = 'connect_v3_fresh_reset';
try {
  if (typeof window !== 'undefined' && localStorage.getItem(CLEAN_SLATE_KEY) !== 'done') {
    const lang = localStorage.getItem('connect_lang');
    localStorage.clear();
    if (lang) localStorage.setItem('connect_lang', lang);
    localStorage.setItem(CLEAN_SLATE_KEY, 'done');
    localStorage.setItem('connect_current_page', 'login');
    try {
      logOut();
    } catch (e) {}
  }
} catch (e) {}

// Helper to determine if a user has already completed initial profile setup
const isProfileSetupDone = (uid, profile = null) => {
  if (!uid) return false;
  try {
    if (localStorage.getItem(`connect_profile_setup_done_${uid}`) === 'true') {
      return true;
    }
  } catch (e) {}
  if (profile?.isProfileComplete === true) {
    return true;
  }
  return false;
};

// Helper to retrieve persisted favourites for a given user or guest
const getStoredFavourites = (uid) => {
  try {
    const key = uid ? `connect_favourites_${uid}` : 'connect_favourites';
    const saved = localStorage.getItem(key) || localStorage.getItem('connect_favourites');
    if (!saved) return [];
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
};

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
  const storedPhone = getStoredPhoneUser();
  const hasPhoneSession = Boolean(storedPhone);
  const storedSession = (() => {
    try {
      const raw = localStorage.getItem('connect_user_session');
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  })();
  const isLoggedInFlag = (() => {
    try {
      return localStorage.getItem('connect_logged_in') === 'true';
    } catch (e) {
      return false;
    }
  })();
  const lastAuthUid = (() => {
    try {
      return localStorage.getItem('connect_last_auth_uid') || '';
    } catch (e) {
      return '';
    }
  })();

  const hasAuth =
    isLoggedInFlag ||
    Boolean(storedSession) ||
    Boolean(lastAuthUid) ||
    Boolean(auth.currentUser) ||
    hasPhoneSession ||
    isGuest;

  const currentUid =
    auth.currentUser?.uid ||
    storedPhone?.uid ||
    storedSession?.uid ||
    lastAuthUid ||
    null;

  // Strict check: if this user has already completed profile setup, never allow setup-profile
  if (currentUid && isProfileSetupDone(currentUid)) {
    if (urlPage === 'setup-profile') {
      try {
        localStorage.setItem('connect_current_page', 'home');
        window.history.replaceState({ page: 'home' }, '', '/connect/');
      } catch (e) {}
      return 'home';
    }
    try {
      if (localStorage.getItem('connect_current_page') === 'setup-profile') {
        localStorage.setItem('connect_current_page', 'home');
      }
    } catch (e) {}
  }

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
      if (!hasAuth && (savedPage === 'wallet' || savedPage === 'profile' || savedPage === 'vip' || savedPage === 'setup-profile')) {
        return 'login';
      }
      if (savedPage === 'setup-profile' && currentUid && isProfileSetupDone(currentUid)) {
        return 'home';
      }
      // If user has an active authenticated session, never show login page
      if (hasAuth && savedPage === 'login') {
        return 'home';
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

  // User Profile state for authenticated user (instant restore from session)
  const [userProfile, setUserProfile] = useState(() => {
    try {
      const raw = localStorage.getItem('connect_user_session') || localStorage.getItem('connect_user_profile');
      if (raw) {
        const p = JSON.parse(raw);
        if (p && (p.uid || p.userId)) return p;
      }
      const phone = getStoredPhoneUser();
      if (phone && phone.uid) {
        return {
          uid: phone.uid,
          name: phone.displayName || phone.name || 'CONNECT User',
          username: phone.username || '',
          phone: phone.phoneNumber || phone.phone || '',
          avatar: '/default-avatars/1.png',
          dob: '2000-01-01',
          isProfileComplete: isProfileSetupDone(phone.uid),
        };
      }
    } catch (e) {}
    return {
      name: '',
      username: '',
      phone: '',
      userId: '',
      avatar: '/default-avatars/1.png',
      dob: '2000-01-01',
      isProfileComplete: false,
    };
  });

  // Confirmed coins balance from live backend
  const [coins, setCoins] = useState(() => {
    try {
      const last = localStorage.getItem('connect_last_known_balance');
      return last ? parseInt(last, 10) || 0 : 0;
    } catch (e) {
      return 0;
    }
  });

  const coinsRef = useRef(coins);
  useEffect(() => {
    coinsRef.current = coins;
    try {
      localStorage.setItem('connect_last_known_balance', String(coins));
    } catch (e) {}
  }, [coins]);

  const currentUid =
    auth.currentUser?.uid ||
    getStoredPhoneUser()?.uid ||
    userProfile?.uid ||
    (() => {
      try {
        return localStorage.getItem('connect_last_auth_uid') || null;
      } catch (e) {
        return null;
      }
    })() ||
    null;

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

    const previousBalance = coinsRef.current;
    const nextLocal = Math.max(0, previousBalance - amount);
    coinsRef.current = nextLocal;
    setCoins(nextLocal);

    if (currentUid) {
      try {
        const res = await transactUserCoins(currentUid, {
          amount,
          isCredit: false,
          type: metadata.type || 'call',
          title: metadata.title || 'Video Call Coins',
          metadata,
        });
        if (typeof res?.newBalance === 'number') {
          setCoins(res.newBalance);
          coinsRef.current = res.newBalance;
        }
        return true;
      } catch (err) {
        console.warn('transactUserCoins debit error:', err);
        // Revert optimistic update since backend rejected transaction
        coinsRef.current = previousBalance;
        setCoins(previousBalance);
        showToast('⚠️ Insufficient Coins! Please recharge to continue.');
        return false;
      }
    }

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

  // ── Shared Persistent Favourites Set (Never lost across screen transitions) ──
  const [favourites, setFavourites] = useState(() => {
    const initialUid = auth.currentUser?.uid || getStoredPhoneUser()?.uid || null;
    return new Set(getStoredFavourites(initialUid));
  });

  // Keep favourites in sync whenever user logs in, switches accounts, or profile loads
  useEffect(() => {
    if (currentUid) {
      const stored = getStoredFavourites(currentUid);
      if (Array.isArray(userProfile?.favourites) && userProfile.favourites.length > 0) {
        const merged = Array.from(new Set([...stored, ...userProfile.favourites]));
        setFavourites(new Set(merged));
        try {
          localStorage.setItem(`connect_favourites_${currentUid}`, JSON.stringify(merged));
          localStorage.setItem('connect_favourites', JSON.stringify(merged));
        } catch (e) {}
      } else {
        setFavourites(new Set(stored));
      }
    }
  }, [currentUid, userProfile?.favourites]);

  const handleToggleFav = (expertId) => {
    if (!expertId) return;
    setFavourites((prev) => {
      const next = new Set(prev);
      if (next.has(expertId)) {
        next.delete(expertId);
      } else {
        next.add(expertId);
      }
      const arr = Array.from(next);
      try {
        const key = currentUid ? `connect_favourites_${currentUid}` : 'connect_favourites';
        localStorage.setItem(key, JSON.stringify(arr));
        localStorage.setItem('connect_favourites', JSON.stringify(arr));
        window.dispatchEvent(new CustomEvent('connect_favourites_updated', { detail: arr }));
      } catch (e) {}

      if (currentUid) {
        saveUserProfile(currentUid, { favourites: arr }).catch(() => {});
      }
      return next;
    });
  };

  // Expert queued to auto-call after a successful recharge
  const [autoStartExpert, setAutoStartExpert] = useState(null);

  // Navigate to any page and persist across reloads (NEVER sets auth state)
  const goToPage = (newPage) => {
    if (!VALID_PAGES.includes(newPage)) return;
    // Guard: If user has already completed profile setup, NEVER allow navigating to setup-profile
    if (newPage === 'setup-profile') {
      const uid = auth.currentUser?.uid || getStoredPhoneUser()?.uid;
      if (uid && isProfileSetupDone(uid, userProfile)) {
        newPage = 'home';
      }
    }
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
      const isLoggedInFlag = (() => {
        try {
          return localStorage.getItem('connect_logged_in') === 'true';
        } catch (e) {
          return false;
        }
      })();
      const hasAuth =
        isLoggedInFlag ||
        Boolean(auth.currentUser) ||
        Boolean(getStoredPhoneUser()) ||
        Boolean(localStorage.getItem('connect_last_auth_uid')) ||
        isGuestUser;

      if (!targetPage || targetPage === 'home' || targetPage === 'login') {
        targetPage = hasAuth ? 'home' : 'login';
      } else if (!hasAuth && (targetPage === 'wallet' || targetPage === 'profile' || targetPage === 'vip' || targetPage === 'setup-profile')) {
        targetPage = 'login';
      } else if (targetPage === 'setup-profile' && (auth.currentUser?.uid || getStoredPhoneUser()?.uid)) {
        const uid = auth.currentUser?.uid || getStoredPhoneUser()?.uid;
        if (isProfileSetupDone(uid)) {
          targetPage = 'home';
        }
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
    if (!uid) return;
    try {
      localStorage.setItem('connect_logged_in', 'true');
      localStorage.setItem('connect_last_auth_uid', uid);
    } catch (e) {}

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

      const alreadyDone = isProfileSetupDone(uid, serverProfile);
      const isAnon = fallbackData.isGuest || Boolean(auth.currentUser?.isAnonymous);
      const skipSetup = alreadyDone || isAnon;

      const resolvedName = (fallbackData.name && fallbackData.name !== 'CONNECT User')
        ? fallbackData.name
        : (serverProfile?.name && serverProfile.name !== 'CONNECT User')
        ? serverProfile.name
        : (fallbackData.name || serverProfile?.name || 'CONNECT User');

      if (serverProfile) {
        const fullProfile = {
          ...serverProfile,
          name: resolvedName,
          isProfileComplete: skipSetup || Boolean(serverProfile.isProfileComplete),
        };
        setUserProfile(fullProfile);
        try {
          localStorage.setItem('connect_user_profile', JSON.stringify(fullProfile));
          localStorage.setItem('connect_user_session', JSON.stringify(fullProfile));
          localStorage.setItem('connect_home_tab', 'call');
        } catch (e) {}
        setInitialHomeTab('call');

        // Open setup-profile if user has never completed initial profile setup
        if (!skipSetup) {
          goToPage('setup-profile');
        } else {
          try {
            localStorage.setItem(`connect_profile_setup_done_${uid}`, 'true');
          } catch (e) {}
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

    const alreadyDone = isProfileSetupDone(uid, null);
    const isAnon = fallbackData.isGuest || Boolean(auth.currentUser?.isAnonymous);
    const skipSetup = alreadyDone || isAnon;
    const displayName = (fallbackData.name && fallbackData.name !== 'CONNECT User')
      ? fallbackData.name
      : (fallbackData.name || 'CONNECT User');

    const newProfile = {
      uid,
      userId: 'CN-' + uid.replace(/[^a-zA-Z0-9]/g, '').slice(-6).toUpperCase(),
      name: displayName,
      username:
        fallbackData.username ||
        '@' +
        (displayName && displayName !== 'CONNECT User'
          ? displayName.toLowerCase().replace(/[^a-z0-9]/g, '_')
          : 'user_' + uid.slice(-4)),
      phone: fallbackData.phone || '',
      email: fallbackData.email || '',
      avatar: fallbackData.avatar || '/default-avatars/1.png',
      dob: '2000-01-01',
      isProfileComplete: skipSetup,
    };

    setUserProfile(newProfile);
    try {
      localStorage.setItem('connect_user_profile', JSON.stringify(newProfile));
      localStorage.setItem('connect_user_session', JSON.stringify(newProfile));
      localStorage.setItem('connect_home_tab', 'call');
    } catch (e) {}
    setInitialHomeTab('call');

    // Open setup-profile if user has never completed initial profile setup
    if (!skipSetup) {
      goToPage('setup-profile');
    } else {
      try {
        localStorage.setItem(`connect_profile_setup_done_${uid}`, 'true');
        localStorage.setItem('connect_current_page', 'home');
        window.history.replaceState({ page: 'home' }, '', getUrlForPage('home'));
      } catch (e) {}
      setPage((prevPage) => {
        if (prevPage === 'login' || prevPage === 'setup-profile') {
          return 'home';
        }
        return prevPage;
      });
    }
  };

  // Guard: if current user already completed profile setup, NEVER let them stay on setup-profile
  useEffect(() => {
    if (page === 'setup-profile' && currentUid) {
      if (isProfileSetupDone(currentUid, userProfile)) {
        setPage('home');
        try {
          localStorage.setItem('connect_current_page', 'home');
          window.history.replaceState({ page: 'home' }, '', getUrlForPage('home'));
        } catch (e) {}
      }
    }
  }, [page, currentUid, userProfile]);

  // Listen to real Firebase authentication state (onAuthStateChanged) + phone session
  useEffect(() => {
    const unsubscribe = subscribeToAuth((firebaseUser) => {
      if (firebaseUser) {
        const isAnon = Boolean(firebaseUser.isAnonymous);
        setIsGuest(isAnon);
        try {
          localStorage.setItem('connect_is_guest', isAnon ? 'true' : 'false');
          localStorage.setItem('connect_logged_in', 'true');
          localStorage.setItem('connect_last_auth_uid', firebaseUser.uid);
        } catch (e) {}

        const uid = firebaseUser.uid;
        loadProfileForUid(uid, {
          name: isAnon ? 'Guest User' : (firebaseUser.displayName || 'CONNECT User'),
          username: isAnon ? '@guest_' + uid.slice(-4) : undefined,
          phone: firebaseUser.phoneNumber || '',
          avatar: firebaseUser.photoURL || '/default-avatars/1.png',
          email: firebaseUser.email || '',
          isGuest: isAnon,
        });
      } else {
        // Check for active phone session
        const phoneUser = getStoredPhoneUser();
        if (phoneUser) {
          setIsGuest(false);
          try {
            localStorage.setItem('connect_is_guest', 'false');
            localStorage.setItem('connect_logged_in', 'true');
            localStorage.setItem('connect_last_auth_uid', phoneUser.uid);
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

        const isLoggedInFlag = (() => {
          try {
            return localStorage.getItem('connect_logged_in') === 'true';
          } catch (e) {
            return false;
          }
        })();

        const lastAuthUid = (() => {
          try {
            return localStorage.getItem('connect_last_auth_uid') || '';
          } catch (e) {
            return '';
          }
        })();

        // If user already logged in previously, preserve session and re-sync in background
        if (isLoggedInFlag && lastAuthUid) {
          loadProfileForUid(lastAuthUid);
          return;
        }

        if (!isGuestUser && !isLoggedInFlag) {
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
            isBrandNewRegistration: true,
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
            isBrandNewRegistration: false,
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
          if (userCred?.user) {
            loadProfileForUid(userCred.user.uid, {
              name: formData.name || userCred.user.displayName || 'CONNECT User',
              email: userCred.user.email || '',
              avatar: userCred.user.photoURL || '/default-avatars/1.png',
              isBrandNewRegistration: true,
            });
          }
          showToast(`🎉 Account created! Welcome, ${formData.name || rawIdentifier}!`);
        } else {
          showToast('Signing in with Firebase...');
          const userCred = await signInWithEmail(
            rawIdentifier,
            formData.password
          );
          if (userCred?.user) {
            loadProfileForUid(userCred.user.uid, {
              name: userCred.user.displayName || 'CONNECT User',
              email: userCred.user.email || '',
              avatar: userCred.user.photoURL || '/default-avatars/1.png',
              isBrandNewRegistration: false,
            });
          }
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
  const handleGuestLogin = async () => {
    try {
      showToast('⚡ Connecting as Guest...');
      const cred = await signInAsGuest();
      const guestUser = cred?.user;
      if (!guestUser) {
        throw new Error('Failed to establish anonymous guest session.');
      }

      setIsGuest(true);
      const guestUid = guestUser.uid;
      try {
        localStorage.setItem('connect_is_guest', 'true');
        localStorage.setItem('connect_logged_in', 'true');
        localStorage.setItem('connect_last_auth_uid', guestUid);
        localStorage.setItem('connect_current_page', 'home');
      } catch (e) {}

      await loadProfileForUid(guestUid, {
        name: 'Guest User',
        username: '@guest_' + guestUid.slice(-4),
        avatar: '/default-avatars/1.png',
        isGuest: true,
      });

      showToast('⚡ Welcome to CONNECT!');
      goToPage('home');
    } catch (err) {
      console.warn('Guest login failed:', err);
      const msg = getAuthErrorMessage(err);
      showToast(`❌ Guest login failed: ${msg}`);
    }
  };

  // Triggered when a guest clicks Call or Buy Coins
  const handleRequireLogin = (targetMode = 'signup') => {
    setAuthInitialMode(targetMode);
    goToPage('login');
  };

  // Called when user clicks "Confirm & Continue" on SetProfileScreen
  const handleProfileConfirm = async (updatedProfile) => {
    const finalProfile = { ...updatedProfile, isProfileComplete: true };
    setUserProfile(finalProfile);
    const storedPhone = getStoredPhoneUser();
    const uid = auth.currentUser?.uid || storedPhone?.uid || currentUid;
    if (uid) {
      try {
        localStorage.setItem(`connect_profile_setup_done_${uid}`, 'true');
        localStorage.setItem('connect_logged_in', 'true');
        localStorage.setItem('connect_last_auth_uid', uid);
        localStorage.setItem('connect_user_profile', JSON.stringify(finalProfile));
        localStorage.setItem('connect_user_session', JSON.stringify(finalProfile));
        localStorage.setItem('connect_current_page', 'home');
        localStorage.setItem('connect_home_tab', 'call');
        window.history.replaceState({ page: 'home' }, '', getUrlForPage('home'));
        await saveUserProfile(uid, finalProfile);
      } catch (e) {
        console.warn('saveUserProfile error:', e);
      }
    }
    setInitialHomeTab('call');
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
      localStorage.removeItem('connect_logged_in');
      localStorage.removeItem('connect_last_auth_uid');
      localStorage.removeItem('connect_user_session');
      localStorage.removeItem('connect_user_profile');
      localStorage.removeItem('connect_last_known_balance');
      localStorage.removeItem('connect_is_guest');
      localStorage.setItem('connect_current_page', 'login');
      window.history.replaceState({ page: 'login' }, '', getUrlForPage('login'));
    } catch (e) {}
    setAuthInitialMode('login');
    setPage('login');
    showToast('Logged out successfully.');
  };

  const handleAddCoins = async () => {
    const uid = currentUid || auth.currentUser?.uid || getStoredPhoneUser()?.uid;
    if (uid) {
      try {
        const serverBalance = await fetchUserWallet(uid);
        if (typeof serverBalance === 'number') {
          setCoins(serverBalance);
          coinsRef.current = serverBalance;
        }
      } catch (err) {
        console.warn('handleAddCoins wallet refresh error:', err);
      }
    }
  };

  // Ref to track processed payment transaction IDs and prevent double coin execution in StrictMode
  const processedTxnsRef = useRef(new Set());

  // ── Server-Side PayU Verification Callback Handler ──
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const status = params.get('status');
      const txnid = params.get('txnid');
      const coinsParam = params.get('coins');

      if (status && txnid) {
        // Prevent 2x execution: if this transaction ID was already processed, ignore!
        if (processedTxnsRef.current.has(txnid)) {
          return;
        }
        try {
          if (localStorage.getItem(`connect_processed_txn_${txnid}`) === 'true') {
            return;
          }
        } catch (e) {}

        // Clean query parameters from URL immediately to prevent re-execution on re-render/popstate
        const cleanUrl = window.location.pathname + window.location.hash;
        window.history.replaceState(null, '', cleanUrl);

        processedTxnsRef.current.add(txnid);
        try {
          localStorage.setItem(`connect_processed_txn_${txnid}`, 'true');
        } catch (e) {}

        if (status === 'success') {
          const isVipReturn = params.get('type') === 'vip' || Boolean(params.get('plan'));
          const activeUid = currentUid || auth.currentUser?.uid || getStoredPhoneUser()?.uid;
          if (activeUid) {
            if (isVipReturn) {
              fetchUserVipEntitlement(activeUid)
                .then((res) => {
                  if (res?.entitlement && res.entitlement.active) {
                    setVipEntitlement(res.entitlement);
                    setUserProfile((prev) => ({
                      ...prev,
                      isVip: true,
                      vipPlan: res.entitlement?.planName || 'VIP Member',
                      vipExpiry: res.entitlement?.expiryDate,
                    }));
                    showToast(`👑 Payment Verified! You are now an active ${res.entitlement?.planName || 'VIP'} Member! 🎉`);
                    goToPage('vip');
                  }
                })
                .catch(() => {});
            } else {
              fetchUserWallet(activeUid)
                .then((newCoins) => {
                  if (typeof newCoins === 'number') {
                    setCoins(newCoins);
                    coinsRef.current = newCoins;
                  }
                })
                .catch((err) => console.warn('fetchUserWallet error after payment:', err));

              showToast(
                coinsParam
                  ? `🎉 Verified payment! Added ${coinsParam} Coins to your wallet.`
                  : '🎉 Verified payment! Coins added to your wallet.'
              );
            }

            fetchUserProfile(activeUid)
              .then((prof) => {
                if (prof) setUserProfile(prof);
              })
              .catch(() => {});
          }

          try {
            localStorage.removeItem('connect_pending_recharge_pack');
            localStorage.removeItem('connect_pending_recharge_uid');
            const pendingExpert = localStorage.getItem('connect_pending_call_expert');
            if (pendingExpert) {
              const expertObj = JSON.parse(pendingExpert);
              setAutoStartExpert(expertObj);
              localStorage.removeItem('connect_pending_call_expert');
            }
          } catch (e) {}
        } else if (
          status === 'failure' ||
          status === 'cancel' ||
          status === 'failed' ||
          status === 'cancelled' ||
          status === 'tampered'
        ) {
          const msg =
            params.get('msg') ||
            (status === 'tampered'
              ? 'Payment verification failed: security hash mismatch.'
              : 'Payment was cancelled or unsuccessful.');
          showToast(`❌ ${msg}`);
        }
      }
    } catch (e) {}
  }, [currentUid]);

  // ── Initiate PayU Checkout for Recharge Pack ──
  const handleInitiateRecharge = async (pack, pendingExpert) => {
    try {
      if (pendingExpert) {
        localStorage.setItem('connect_pending_call_expert', JSON.stringify(pendingExpert));
      } else {
        localStorage.removeItem('connect_pending_call_expert');
      }
    } catch (e) {}

    const token = await auth.currentUser?.getIdToken?.();
    if (!token) {
      showToast('Please log in first to recharge coins.');
      return;
    }

    const payload = {
      packageId: pack.id,
      name: userProfile?.name || 'CONNECT User',
      phone: (userProfile?.phone || '9876543210').replace(/[^0-9]/g, '').slice(-10),
      email: `${(userProfile?.username || 'user').replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || 'user'}@connect.local`,
    };

    let response;
    try {
      response = await fetch('/.netlify/functions/connect-payu-initiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      if (response.status === 404) {
        response = await fetch('/api/connect-payu-initiate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
      }
    } catch (netErr) {
      showToast('Network error: Unable to connect to payment server.');
      return;
    }

    if (!response || response.status === 404) {
      showToast('Payment service is currently unavailable.');
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
    const token = await auth.currentUser?.getIdToken?.();
    if (!token) {
      showToast('Please log in first to purchase VIP membership.');
      return;
    }

    const payload = {
      planId: plan.id,
      name: userProfile?.name || 'CONNECT VIP User',
      phone: (userProfile?.phone || '9876543210').replace(/[^0-9]/g, '').slice(-10),
      email: `${(userProfile?.username || 'user').replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || 'user'}@connect.local`,
    };

    let response;
    try {
      response = await fetch('/.netlify/functions/connect-payu-initiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      if (response.status === 404) {
        response = await fetch('/api/connect-payu-initiate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
      }
    } catch (netErr) {
      showToast('Network error: Unable to connect to VIP payment server.');
      return;
    }

    if (!response || response.status === 404) {
      showToast('VIP checkout service is currently unavailable.');
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
      throw new Error(data.error || 'Failed to initiate VIP payment.');
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
            onInitiateRecharge={handleInitiateRecharge}
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
            favCount={favourites.size}
            favourites={favourites}
            onFavToggle={handleToggleFav}
            onRewardClaimed={(awarded, newBalance) => {
              if (typeof newBalance === 'number') {
                setCoins(newBalance);
                coinsRef.current = newBalance;
              } else {
                handleAddCoins(awarded);
              }
            }}
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
            onRewardClaimed={(awarded, newBalance) => {
              if (typeof newBalance === 'number') {
                setCoins(newBalance);
                coinsRef.current = newBalance;
              } else {
                handleAddCoins(awarded);
              }
            }}
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
          favourites={favourites}
          onFavToggle={handleToggleFav}
          initialTab={initialHomeTab}
          initialCallingExpert={autoStartExpert}
          onClearAutoStartExpert={() => setAutoStartExpert(null)}
          onLogout={handleLogout}
          onAddCoins={handleAddCoins}
          onRewardClaimed={(awarded, newBalance) => {
            if (typeof newBalance === 'number') {
              setCoins(newBalance);
              coinsRef.current = newBalance;
            } else {
              handleAddCoins(awarded);
            }
          }}
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
