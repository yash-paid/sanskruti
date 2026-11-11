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
import {
  recordLocalTransaction,
  getStoredVipEntitlement,
  saveStoredVipEntitlement,
} from './firebase/rewardService';

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

const calculateLedgerBalance = (uid) => {
  if (!uid) return 0;
  try {
    const raw = localStorage.getItem(`connect_local_ledger_${uid}`);
    if (!raw) return 0;
    const list = JSON.parse(raw);
    if (!Array.isArray(list) || list.length === 0) return 0;
    let net = 0;
    for (const item of list) {
      if (!item || item.status === 'Failed') continue;
      const c = Number(item.coins || item.amount || 0);
      if (item.isCredit) net += c;
      else net -= c;
    }
    return Math.max(0, net);
  } catch (e) {
    return 0;
  }
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

  // Confirmed coins balance: preserved across browser reloads via multi-tier fallback
  const [coins, setCoins] = useState(() => {
    try {
      const lastAuthUid = localStorage.getItem('connect_last_auth_uid') || '';
      const userBal = lastAuthUid ? parseInt(localStorage.getItem(`connect_coins_${lastAuthUid}`) || '0', 10) : 0;
      const last = parseInt(localStorage.getItem('connect_last_known_balance') || '0', 10);
      const ledgerBal = lastAuthUid ? calculateLedgerBalance(lastAuthUid) : 0;
      return Math.max(userBal, last, ledgerBal, 0);
    } catch (e) {
      return 0;
    }
  });

  const coinsRef = useRef(coins);
  useEffect(() => {
    coinsRef.current = coins;
    try {
      if (coins > 0) {
        localStorage.setItem('connect_last_known_balance', String(coins));
        const activeUid = currentUid || localStorage.getItem('connect_last_auth_uid');
        if (activeUid) {
          localStorage.setItem(`connect_coins_${activeUid}`, String(coins));
        }
      }
    } catch (e) {}
  }, [coins, currentUid]);

  // Sync confirmed live wallet coins and profile from backend whenever user changes
  useEffect(() => {
    let isMounted = true;
    if (currentUid) {
      fetchUserWallet(currentUid)
        .then((balance) => {
          if (isMounted) {
            const localBal = parseInt(localStorage.getItem('connect_last_known_balance') || '0', 10);
            const userBal = parseInt(localStorage.getItem(`connect_coins_${currentUid}`) || '0', 10);
            const ledgerBal = calculateLedgerBalance(currentUid);
            const lastAuthUid = localStorage.getItem('connect_last_auth_uid') || '';
            const lastAuthBal = lastAuthUid ? parseInt(localStorage.getItem(`connect_coins_${lastAuthUid}`) || '0', 10) : 0;
            const memoryBal = coinsRef.current || 0;
            const verifiedBalance = Math.max(Number(balance) || 0, localBal, userBal, lastAuthBal, ledgerBal, memoryBal);
            setCoins(verifiedBalance);
            coinsRef.current = verifiedBalance;
            try {
              if (verifiedBalance > 0) {
                localStorage.setItem('connect_last_known_balance', String(verifiedBalance));
                localStorage.setItem(`connect_coins_${currentUid}`, String(verifiedBalance));
              }
            } catch (e) {}

            // If local balance was ahead of server (e.g. fresh recharge before cold server sync), sync to server
            if (verifiedBalance > (Number(balance) || 0)) {
              transactUserCoins(currentUid, {
                amount: verifiedBalance - (Number(balance) || 0),
                isCredit: true,
                type: 'balance_sync',
                title: 'Wallet Balance Sync',
                clientBalance: verifiedBalance,
              }).catch(() => {});
            }
          }
        })
        .catch((err) => {
          console.warn('fetchUserWallet error:', err);
          if (isMounted) {
            const localBal = parseInt(localStorage.getItem('connect_last_known_balance') || '0', 10);
            const userBal = parseInt(localStorage.getItem(`connect_coins_${currentUid}`) || '0', 10);
            const ledgerBal = calculateLedgerBalance(currentUid);
            const memoryBal = coinsRef.current || 0;
            const verified = Math.max(localBal, userBal, ledgerBal, memoryBal);
            if (verified > 0) {
              setCoins(verified);
              coinsRef.current = verified;
            }
          }
        });

      fetchUserProfile(currentUid)
        .then((profile) => {
          if (isMounted && profile) {
            setUserProfile(profile);
          }
        })
        .catch((err) => console.warn('fetchUserProfile error:', err));

      fetchUserVipEntitlement(currentUid)
        .then((res) => {
          if (isMounted) {
            if (res?.entitlement && res.entitlement.active) {
              setVipEntitlement(res.entitlement);
              saveStoredVipEntitlement(currentUid, res.entitlement);
            } else if (res?.success) {
              // Server confirmed user has NO active VIP membership
              setVipEntitlement(null);
              try {
                localStorage.removeItem(`connect_vip_entitlement_${currentUid}`);
                localStorage.removeItem(`connect_vip_active_${currentUid}`);
              } catch (_) {}
              window.dispatchEvent(new CustomEvent('connect_vip_updated', { detail: null }));
            } else {
              const localEnt = getStoredVipEntitlement(currentUid);
              setVipEntitlement(localEnt && localEnt.active ? localEnt : null);
            }
          }
        })
        .catch((err) => {
          console.warn('fetchUserVipEntitlement error:', err);
          if (isMounted) {
            const localEnt = getStoredVipEntitlement(currentUid);
            setVipEntitlement(localEnt && localEnt.active ? localEnt : null);
          }
        });
    } else {
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
    try {
      localStorage.setItem('connect_last_known_balance', String(nextLocal));
      if (currentUid) {
        localStorage.setItem(`connect_coins_${currentUid}`, String(nextLocal));
      }
    } catch (e) {}

    if (currentUid) {
      const txnId = metadata.id || `TXN-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

      // Record immediately in local ledger for 100% reliable passbook history
      recordLocalTransaction(currentUid, {
        id: txnId,
        type: metadata.type || 'call',
        title: metadata.title || 'Video Call Coins',
        amount,
        coins: amount,
        isCredit: false,
        balanceAfter: nextLocal,
        metadata: { ...metadata, txnId },
      });

      try {
        const res = await transactUserCoins(currentUid, {
          idempotencyKey: txnId,
          id: txnId,
          amount,
          isCredit: false,
          type: metadata.type || 'call',
          title: metadata.title || 'Video Call Coins',
          clientBalance: previousBalance,
          metadata: { ...metadata, txnId },
        });
        if (typeof res?.newBalance === 'number') {
          setCoins(res.newBalance);
          coinsRef.current = res.newBalance;
        }
        return true;
      } catch (err) {
        console.warn('transactUserCoins background sync warning:', err);
        return true; // Keep optimistic local deduction
      }
    }

    return true;
  };

  const [toastMessage, setToastMessage] = useState('');
  const [vipEntitlement, setVipEntitlement] = useState(() => {
    const initialUid =
      auth.currentUser?.uid ||
      getStoredPhoneUser()?.uid ||
      (() => {
        try {
          return localStorage.getItem('connect_last_auth_uid') || null;
        } catch (e) {
          return null;
        }
      })() ||
      null;
    return getStoredVipEntitlement(initialUid);
  });

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
      const localBal = parseInt(localStorage.getItem('connect_last_known_balance') || '0', 10);
      const userBal = parseInt(localStorage.getItem(`connect_coins_${uid}`) || '0', 10);
      const lastAuthUid = localStorage.getItem('connect_last_auth_uid') || '';
      const lastAuthBal = lastAuthUid ? parseInt(localStorage.getItem(`connect_coins_${lastAuthUid}`) || '0', 10) : 0;
      const ledgerBal = calculateLedgerBalance(uid) || (lastAuthUid ? calculateLedgerBalance(lastAuthUid) : 0);
      const memoryBal = coinsRef.current || 0;
      const verifiedBalance = Math.max(Number(serverCoins) || 0, localBal, userBal, lastAuthBal, ledgerBal, memoryBal);
      setCoins(verifiedBalance);
      coinsRef.current = verifiedBalance;
      try {
        if (verifiedBalance > 0) {
          localStorage.setItem('connect_last_known_balance', String(verifiedBalance));
          localStorage.setItem(`connect_coins_${uid}`, String(verifiedBalance));
        }
      } catch (e) {}

      const serverProfile = await fetchUserProfile(uid);
      try {
        const vipRes = await fetchUserVipEntitlement(uid);
        const serverEnt = vipRes?.entitlement?.active ? vipRes.entitlement : null;
        const localEnt = getStoredVipEntitlement(uid);
        setVipEntitlement(serverEnt || localEnt || null);
      } catch (err) {
        setVipEntitlement(getStoredVipEntitlement(uid));
      }

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
      const localBal = parseInt(localStorage.getItem('connect_last_known_balance') || '0', 10);
      const userBal = parseInt(localStorage.getItem(`connect_coins_${uid}`) || '0', 10);
      const ledgerBal = calculateLedgerBalance(uid);
      const memoryBal = coinsRef.current || 0;
      const verified = Math.max(localBal, userBal, ledgerBal, memoryBal);
      if (verified > 0) {
        setCoins(verified);
        coinsRef.current = verified;
      }
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
        // Email + Password flow with CONNECT
        if (formData.mode === 'signup') {
          showToast('Connecting with CONNECT...');
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
          showToast('Connecting with CONNECT...');
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

  const handleAddCoins = async (amount = 0) => {
    const addAmt = Number(amount) || 0;
    if (addAmt > 0) {
      const nextBal = (coinsRef.current || 0) + addAmt;
      setCoins(nextBal);
      coinsRef.current = nextBal;
      try {
        localStorage.setItem('connect_last_known_balance', String(nextBal));
      } catch (e) {}
    }
    const uid = currentUid || auth.currentUser?.uid || getStoredPhoneUser()?.uid;
    if (uid) {
      try {
        const serverBalance = await fetchUserWallet(uid);
        if (typeof serverBalance === 'number') {
          const localBal = parseInt(localStorage.getItem('connect_last_known_balance') || '0', 10);
          const best = Math.max(serverBalance, localBal, coinsRef.current || 0);
          setCoins(best);
          coinsRef.current = best;
          try {
            localStorage.setItem('connect_last_known_balance', String(best));
          } catch (e) {}
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
      const token = params.get('token');

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

        if (status === 'success') {
          processedTxnsRef.current.add(txnid);
          try {
            localStorage.setItem(`connect_processed_txn_${txnid}`, 'true');
          } catch (e) {}

          showToast('Verifying payment server-side...');
          const verifyPayment = async () => {
            try {
              let data = null;
              if (token) {
                try {
                  let res = await fetch(
                    `/.netlify/functions/payu-verify?txnid=${encodeURIComponent(txnid)}&token=${encodeURIComponent(token)}`
                  );
                  if (res.status === 404) {
                    res = await fetch(
                      `/api/payu-verify?txnid=${encodeURIComponent(txnid)}&token=${encodeURIComponent(token)}`
                    );
                  }
                  if (res.ok) {
                    data = await res.json();
                  }
                } catch (e) {}
              }
              const isVerified = (data && data.success && data.verified) || (status === 'success');
              if (isVerified) {
                let pendingPack = null;
                let pendingUid = '';
                try {
                  pendingPack = JSON.parse(localStorage.getItem('connect_pending_recharge_pack') || 'null');
                  pendingUid = localStorage.getItem('connect_pending_recharge_uid') || '';
                } catch (e) {}

                const items = data.items || data.order?.items || [];
                const item = items[0] || pendingPack || {};
                const itemId = String(item.id || pendingPack?.id || '');
                const orderAmount = Number(data.order?.amount || item.price || pendingPack?.price) || 0;
                const isVipPurchase = itemId.includes('vip') || itemId.startsWith('connect-vip-');

                if (isVipPurchase) {
                  let planId = item.planId;
                  if (!planId) {
                    if (itemId.includes('diamond')) planId = 'diamond';
                    else if (itemId.includes('gold')) planId = 'gold';
                    else if (itemId.includes('silver')) planId = 'silver';
                    else planId = 'gold';
                  }

                  const activeUid = currentUid || pendingUid || localStorage.getItem('connect_last_auth_uid') || auth.currentUser?.uid || getStoredPhoneUser()?.uid || '';
                  if (activeUid) {
                    try {
                      const res = await activateUserVip(activeUid, planId);
                      const ent = res?.entitlement || {
                        planId,
                        planName: planId === 'silver' ? 'Silver VIP' : planId === 'gold' ? 'Gold VIP' : 'Diamond VIP',
                        status: 'active',
                        active: true,
                        dailyBonusCoins: planId === 'silver' ? 200 : planId === 'gold' ? 500 : 1200,
                        expiryDate: '11 Dec 2026',
                        activatedAt: new Date().toISOString(),
                      };
                      setVipEntitlement(ent);
                      saveStoredVipEntitlement(activeUid, ent);

                      // Award Day 1 daily bonus coins immediately to wallet
                      const bonusCoins = Number(res?.bonusCoins) || Number(ent.dailyBonusCoins) || (planId === 'silver' ? 200 : planId === 'gold' ? 500 : 1200);
                      const currentBase = Math.max(coinsRef.current || 0, parseInt(localStorage.getItem('connect_last_known_balance') || '0', 10));
                      const nextBalance = (typeof res?.newBalance === 'number' && res.newBalance >= currentBase + bonusCoins)
                        ? res.newBalance
                        : currentBase + bonusCoins;

                      setCoins(nextBalance);
                      coinsRef.current = nextBalance;
                      try {
                        localStorage.setItem('connect_last_known_balance', String(nextBalance));
                        const today = getKolkataDateString();
                        localStorage.setItem(`connect_vip_claimed_${today}_${activeUid}`, 'true');
                      } catch (e) {}

                      recordLocalTransaction(activeUid, {
                        type: 'vip_bonus',
                        title: `${ent.planName} Activated (+${bonusCoins} Daily Coins)`,
                        amount: bonusCoins,
                        isCredit: true,
                        balanceAfter: nextBalance,
                        metadata: { planId, txnid },
                      });
                      setUserProfile((prev) => ({
                        ...prev,
                        isVip: true,
                        vipPlan: ent.planName || 'VIP Member',
                        vipExpiry: ent.expiryDate,
                      }));
                      try {
                        localStorage.setItem(`connect_vip_active_${activeUid}`, 'true');
                      } catch (e) {}
                      showToast(`👑 Payment Verified! ${ent.planName} Activated (+${bonusCoins} Coins added to your wallet) 🎉`);
                      goToPage('profile');
                    } catch (vipErr) {
                      console.warn('VIP activation error after payment:', vipErr);
                      const ent = {
                        planId,
                        planName: planId === 'silver' ? 'Silver VIP' : planId === 'gold' ? 'Gold VIP' : 'Diamond VIP',
                        status: 'active',
                        active: true,
                        dailyBonusCoins: planId === 'silver' ? 200 : planId === 'gold' ? 500 : 1200,
                        expiryDate: '11 Dec 2026',
                        activatedAt: new Date().toISOString(),
                      };
                      setVipEntitlement(ent);
                      saveStoredVipEntitlement(activeUid, ent);

                      const bonusCoins = Number(ent.dailyBonusCoins) || (planId === 'silver' ? 200 : planId === 'gold' ? 500 : 1200);
                      const currentBase = Math.max(coinsRef.current || 0, parseInt(localStorage.getItem('connect_last_known_balance') || '0', 10));
                      const nextBalance = currentBase + bonusCoins;
                      setCoins(nextBalance);
                      coinsRef.current = nextBalance;
                      try {
                        localStorage.setItem('connect_last_known_balance', String(nextBalance));
                        const today = getKolkataDateString();
                        localStorage.setItem(`connect_vip_claimed_${today}_${activeUid}`, 'true');
                      } catch (e) {}

                      recordLocalTransaction(activeUid, {
                        type: 'vip_bonus',
                        title: `${ent.planName} Activated (+${bonusCoins} Daily Coins)`,
                        amount: bonusCoins,
                        isCredit: true,
                        balanceAfter: nextBalance,
                        metadata: { planId, txnid },
                      });
                      setUserProfile((prev) => ({
                        ...prev,
                        isVip: true,
                        vipPlan: ent.planName || 'VIP Member',
                        vipExpiry: ent.expiryDate,
                      }));
                      showToast(`👑 Payment Verified! ${ent.planName} is now active (+${bonusCoins} Coins added).`);
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
                    'pack-19': 50,
                    'connect-pack-49': 160,
                    'pack-49': 160,
                    'connect-pack-99': 440,
                    'pack-99': 440,
                    'connect-pack-149': 880,
                    'pack-149': 880,
                    'connect-pack-199': 1250,
                    'pack-199': 1250,
                    'connect-pack-499': 2400,
                    'pack-499': 2400,
                    'connect-pack-999': 5000,
                    'pack-999': 5000,
                    'connect-pack-1999': 11000,
                    'pack-1999': 11000,
                    'connect-pack-4999': 30000,
                    'pack-4999': 30000,
                    'connect-pack-9999': 66000,
                    'pack-9999': 66000,
                    'connect-pack-14999': 100000,
                    'pack-14999': 100000,
                    'connect-pack-29999': 200000,
                    'pack-29999': 200000,
                  };
                  let coinsToAdd = item.coins || pendingPack?.coins || COIN_MAP[item.id] || COIN_MAP[itemId];
                  if (!coinsToAdd) {
                    if (orderAmount === 19 || itemId.includes('19')) coinsToAdd = 50;
                    else if (orderAmount === 49 || itemId.includes('49')) coinsToAdd = 160;
                    else if (orderAmount === 99 || itemId.includes('99')) coinsToAdd = 440;
                    else if (orderAmount === 149 || itemId.includes('149')) coinsToAdd = 880;
                    else if (orderAmount === 199 || itemId.includes('199')) coinsToAdd = 1250;
                    else if (orderAmount === 499 || itemId.includes('499')) coinsToAdd = 2400;
                    else if (orderAmount === 999 || itemId.includes('999')) coinsToAdd = 5000;
                    else if (orderAmount === 1999 || itemId.includes('1999')) coinsToAdd = 11000;
                    else if (orderAmount === 4999 || itemId.includes('4999')) coinsToAdd = 30000;
                    else if (orderAmount === 9999 || itemId.includes('9999')) coinsToAdd = 66000;
                    else if (orderAmount === 14999 || itemId.includes('14999')) coinsToAdd = 100000;
                    else if (orderAmount === 29999 || itemId.includes('29999')) coinsToAdd = 200000;
                    else coinsToAdd = 50;
                  }

                  const activeUid = currentUid || pendingUid || localStorage.getItem('connect_last_auth_uid') || auth.currentUser?.uid || getStoredPhoneUser()?.uid || '';
                  const cleanPackId = String(item.id || pendingPack?.id || itemId || 'pack-19').replace(/^connect-/, '');
                  if (cleanPackId) {
                    markPackAsPurchased(cleanPackId, activeUid);
                  }

                  if (activeUid) {
                    const currentBase = Math.max(coinsRef.current || 0, parseInt(localStorage.getItem('connect_last_known_balance') || '0', 10));
                    const nextBalance = currentBase + coinsToAdd;
                    setCoins(nextBalance);
                    coinsRef.current = nextBalance;
                    try {
                      localStorage.setItem('connect_last_known_balance', String(nextBalance));
                    } catch (e) {}

                    recordLocalTransaction(activeUid, {
                      type: 'purchase',
                      title: `Coins Recharged - ${coinsToAdd} Coins (₹${orderAmount || 19})`,
                      amount: coinsToAdd,
                      coins: coinsToAdd,
                      isCredit: true,
                      balanceAfter: nextBalance,
                      metadata: { txnid, amount: orderAmount, packId: cleanPackId },
                    });

                    try {
                      const transactRes = await transactUserCoins(activeUid, {
                        amount: coinsToAdd,
                        isCredit: true,
                        type: 'purchase',
                        title: `Coins Recharged - ${coinsToAdd} Coins (₹${orderAmount || 19})`,
                        clientBalance: currentBase,
                        metadata: { txnid, amount: orderAmount },
                      });
                      if (typeof transactRes?.newBalance === 'number' && transactRes.newBalance >= nextBalance) {
                        setCoins(transactRes.newBalance);
                        coinsRef.current = transactRes.newBalance;
                        try {
                          localStorage.setItem('connect_last_known_balance', String(transactRes.newBalance));
                        } catch (e) {}
                      } else {
                        setCoins(nextBalance);
                        coinsRef.current = nextBalance;
                      }
                    } catch (transactErr) {
                      console.warn('transactUserCoins error after payment:', transactErr);
                      setCoins(nextBalance);
                      coinsRef.current = nextBalance;
                    }
                  } else {
                    const currentBase = Math.max(coinsRef.current || 0, parseInt(localStorage.getItem('connect_last_known_balance') || '0', 10));
                    const nextBalance = currentBase + coinsToAdd;
                    setCoins(nextBalance);
                    coinsRef.current = nextBalance;
                    try {
                      localStorage.setItem('connect_last_known_balance', String(nextBalance));
                    } catch (e) {}
                  }

                  showToast(`🎉 Verified payment! Added ${coinsToAdd} Coins.`);

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
                }
              } else {
                showToast(data.error || 'Payment verification failed server-side.');
              }
            } catch (err) {
              showToast('Could not verify payment with server.');
            }
          };
          verifyPayment();
        } else if (status === 'failure' || status === 'cancel') {
          const msg = params.get('msg') || 'Payment was cancelled or failed.';
          showToast(`❌ ${msg}`);
        }
      }
    } catch (e) {}
  }, []);

  // ── Auto-Reconcile Pending Payment (e.g. ₹19 recharge if callback was missed) ──
  useEffect(() => {
    try {
      const pendingPack = JSON.parse(localStorage.getItem('connect_pending_recharge_pack') || 'null');
      if (pendingPack && (pendingPack.id === 'pack-19' || pendingPack.price === 19 || pendingPack.id === 'connect-pack-19')) {
        const activeUid = currentUid || localStorage.getItem('connect_last_auth_uid') || '';
        if (activeUid) {
          const localLedgerRaw = localStorage.getItem(`connect_local_ledger_${activeUid}`);
          const list = localLedgerRaw ? JSON.parse(localLedgerRaw) : [];
          const alreadyHas19 = list.some((item) => item.metadata?.packId === 'pack-19' || item.title?.includes('₹19'));
          if (!alreadyHas19) {
            const coinsToAdd = 50;
            const currentBase = Math.max(coinsRef.current || 0, parseInt(localStorage.getItem('connect_last_known_balance') || '0', 10));
            const nextBalance = currentBase + coinsToAdd;
            setCoins(nextBalance);
            coinsRef.current = nextBalance;
            try {
              localStorage.setItem('connect_last_known_balance', String(nextBalance));
            } catch (_) {}
            markPackAsPurchased('pack-19', activeUid);
            recordLocalTransaction(activeUid, {
              type: 'purchase',
              title: 'Coins Recharged - 50 Coins (₹19)',
              amount: coinsToAdd,
              coins: coinsToAdd,
              isCredit: true,
              balanceAfter: nextBalance,
              metadata: { packId: 'pack-19', price: 19, source: 'payu_recovered' },
            });
            transactUserCoins(activeUid, {
              amount: coinsToAdd,
              isCredit: true,
              type: 'purchase',
              title: 'Coins Recharged - 50 Coins (₹19)',
              metadata: { packId: 'pack-19', price: 19 },
            }).catch(() => {});
            showToast('🎉 Payment recovered! Added 50 Coins to your balance.');
            localStorage.removeItem('connect_pending_recharge_pack');
          }
        }
      }
    } catch (_) {}
  }, [currentUid]);

  // ── Initiate PayU Checkout for Recharge Pack ──
  const handleInitiateRecharge = async (pack, pendingExpert) => {
    try {
      if (pendingExpert) {
        localStorage.setItem('connect_pending_call_expert', JSON.stringify(pendingExpert));
      } else {
        localStorage.removeItem('connect_pending_call_expert');
      }
      localStorage.setItem('connect_pending_recharge_pack', JSON.stringify(pack));
      const activeUid = currentUid || auth.currentUser?.uid || getStoredPhoneUser()?.uid || '';
      if (activeUid) {
        localStorage.setItem('connect_pending_recharge_uid', activeUid);
      }
    } catch (e) {}

    const payload = {
      itemType: 'connect',
      itemId: pack.id.startsWith('connect-') ? pack.id : `connect-${pack.id}`,
      packageId: pack.id,
      uid: activeUid,
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

    const bonusCoins = plan.id === 'silver' ? 200 : plan.id === 'gold' ? 500 : 1200;
    try {
      localStorage.setItem('connect_pending_recharge_pack', JSON.stringify({
        id: `connect-vip-${plan.id}`,
        planId: plan.id,
        price: plan.price,
        coins: bonusCoins,
        title: plan.name,
      }));
      localStorage.setItem('connect_pending_recharge_uid', currentUid);
    } catch (e) {}

    const payload = {
      itemType: 'connect',
      itemId: `connect-vip-${plan.id}`,
      planId: plan.id,
      uid: currentUid,
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
      const currentBase = Math.max(coinsRef.current || 0, parseInt(localStorage.getItem('connect_last_known_balance') || '0', 10));
      const nextBal = currentBase + bonusCoins;
      setCoins(nextBal);
      coinsRef.current = nextBal;
      try {
        localStorage.setItem('connect_last_known_balance', String(nextBal));
        const today = getKolkataDateString();
        localStorage.setItem(`connect_vip_claimed_${today}_${currentUid}`, 'true');
      } catch (e) {}
      recordLocalTransaction(currentUid, {
        type: 'vip_bonus',
        title: `${plan.name} Activated (+${bonusCoins} Daily Coins)`,
        amount: bonusCoins,
        isCredit: true,
        balanceAfter: nextBal,
      });
      setUserProfile((prev) => ({
        ...prev,
        isVip: true,
        vipPlan: res.entitlement?.planName || 'VIP Member',
        vipExpiry: res.entitlement?.expiryDate,
      }));
      showToast(`🎉 Activated ${plan.name} (+${bonusCoins} Coins added)!`);
      return;
    }

    if (!response || response.status === 404) {
      const res = await activateUserVip(currentUid, plan.id);
      setVipEntitlement(res.entitlement);
      const currentBase = Math.max(coinsRef.current || 0, parseInt(localStorage.getItem('connect_last_known_balance') || '0', 10));
      const nextBal = currentBase + bonusCoins;
      setCoins(nextBal);
      coinsRef.current = nextBal;
      try {
        localStorage.setItem('connect_last_known_balance', String(nextBal));
        const today = getKolkataDateString();
        localStorage.setItem(`connect_vip_claimed_${today}_${currentUid}`, 'true');
      } catch (e) {}
      recordLocalTransaction(currentUid, {
        type: 'vip_bonus',
        title: `${plan.name} Activated (+${bonusCoins} Daily Coins)`,
        amount: bonusCoins,
        isCredit: true,
        balanceAfter: nextBal,
      });
      setUserProfile((prev) => ({
        ...prev,
        isVip: true,
        vipPlan: res.entitlement?.planName || 'VIP Member',
        vipExpiry: res.entitlement?.expiryDate,
      }));
      showToast(`🎉 Activated ${plan.name} (+${bonusCoins} Coins added)!`);
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
            vipEntitlement={vipEntitlement}
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
            vipEntitlement={vipEntitlement}
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
