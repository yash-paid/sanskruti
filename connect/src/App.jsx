import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import GlowWave from './components/GlowWave';
import AuthCard from './components/AuthCard';
import SetProfileScreen from './components/SetProfileScreen';
import HomeScreen from './components/HomeScreen';
import WalletScreen from './components/WalletScreen';
import ProfileScreen from './components/ProfileScreen';
import VipScreen from './components/VipScreen';

const VALID_PAGES = ['login', 'setup-profile', 'home', 'wallet', 'profile', 'vip'];

const getInitialPage = () => {
  // 1. Check URL hash (e.g. #wallet, #vip, #profile, #home, #setup-profile)
  try {
    const hash = window.location.hash.replace('#', '').toLowerCase();
    if (VALID_PAGES.includes(hash)) {
      return hash;
    }
  } catch (e) {}

  // 2. Check saved page in localStorage
  try {
    const savedPage = localStorage.getItem('connect_current_page');
    if (savedPage && VALID_PAGES.includes(savedPage)) {
      return savedPage;
    }
  } catch (e) {}

  // 3. Check if user logged in previously
  try {
    const isLoggedIn = localStorage.getItem('connect_is_logged_in') === 'true';
    if (isLoggedIn) return 'home';
  } catch (e) {}

  return 'login';
};

export default function App() {
  // Pages: 'login' | 'setup-profile' | 'home' | 'wallet' | 'profile' | 'vip'
  const [page, setPage] = useState(getInitialPage);

  // User Profile state persisted across reloads
  const [userProfile, setUserProfile] = useState(() => {
    try {
      const saved = localStorage.getItem('connect_user_profile');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      name: 'Rahul Sharma',
      username: '@rahul_connect',
      phone: '+91 98765 43210',
      userId: 'CN-894204',
      avatar: '/default-avatars/1.png',
      dob: '2000-01-01',
    };
  });

  // Coins balance persisted in localStorage - Reset to 0 as requested for all accounts
  const [coins, setCoins] = useState(() => {
    try {
      if (localStorage.getItem('connect_coins_reset_all_to_zero_v4') !== 'true') {
        localStorage.setItem('connect_coins', '0');
        localStorage.setItem('connect_coins_reset_all_to_zero_v4', 'true');
        return 0;
      }
      const saved = localStorage.getItem('connect_coins');
      return saved ? parseInt(saved, 10) : 0;
    } catch (e) {
      return 0;
    }
  });

  const coinsRef = useRef(coins);
  useEffect(() => {
    coinsRef.current = coins;
  }, [coins]);

  const handleDeductCoins = (amount) => {
    if (typeof amount !== 'number' || amount <= 0) return false;
    if (coinsRef.current >= amount) {
      const next = Math.max(0, coinsRef.current - amount);
      coinsRef.current = next;
      setCoins(next);
      try {
        localStorage.setItem('connect_coins', next.toString());
      } catch (e) {}
      return true;
    }
    return false;
  };

  const [toastMessage, setToastMessage] = useState('');

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

  // Navigate to any page and persist across reloads
  const goToPage = (newPage) => {
    if (!VALID_PAGES.includes(newPage)) return;
    setPage(newPage);
    try {
      localStorage.setItem('connect_current_page', newPage);
      if (newPage !== 'login') {
        localStorage.setItem('connect_is_logged_in', 'true');
      }
      window.history.replaceState(null, '', `#${newPage}`);
    } catch (e) {}
  };

  const changeHomeTab = (tab) => {
    setInitialHomeTab(tab);
    try {
      localStorage.setItem('connect_home_tab', tab);
    } catch (e) {}
  };

  // Sync with browser back/forward and hash changes
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '').toLowerCase();
      if (VALID_PAGES.includes(hash) && hash !== page) {
        setPage(hash);
        try {
          localStorage.setItem('connect_current_page', hash);
        } catch (e) {}
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [page]);

  // Ensure current URL hash reflects current page on load
  useEffect(() => {
    try {
      if (window.location.hash.replace('#', '') !== page) {
        window.history.replaceState(null, '', `#${page}`);
      }
    } catch (e) {}
  }, [page]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  // Called when credentials are submitted on login/signup page:
  // Directs immediately to Profile Setup screen
  const handleLogin = (formData) => {
    setIsGuest(false);
    try {
      localStorage.setItem('connect_is_guest', 'false');
      localStorage.setItem('connect_is_logged_in', 'true');
      if (formData?.name) {
        setUserProfile((prev) => ({
          ...prev,
          name: formData.name,
          username: '@' + formData.name.toLowerCase().replace(/[^a-z0-9]/g, '_'),
        }));
      }
    } catch (e) {}
    showToast('Credentials accepted! Complete your profile.');
    goToPage('setup-profile');
  };

  // Called when user clicks "Continue with Google"
  const handleGoogleLogin = () => {
    setIsGuest(false);
    try {
      localStorage.setItem('connect_is_guest', 'false');
      localStorage.setItem('connect_is_logged_in', 'true');
      setUserProfile((prev) => ({
        ...prev,
        name: prev.name === 'Guest User' ? 'Rahul Sharma' : prev.name,
        username: prev.username === '@guest' ? '@rahul_connect' : prev.username,
      }));
    } catch (e) {}
    showToast('✨ Signed in with Google! Welcome to CONNECT.');
    const setupDone = localStorage.getItem('connect_profile_setup_done') === 'true';
    if (!setupDone) {
      goToPage('setup-profile');
    } else {
      goToPage('home');
    }
  };

  // Called when user clicks "Continue as Guest"
  // DIRECT HOME KHULNA CHAIYE - NOT setup-profile!
  const handleGuestLogin = () => {
    setIsGuest(true);
    try {
      localStorage.setItem('connect_is_guest', 'true');
      localStorage.setItem('connect_is_logged_in', 'true');
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
  const handleProfileConfirm = (updatedProfile) => {
    setUserProfile(updatedProfile);
    try {
      localStorage.setItem('connect_user_profile', JSON.stringify(updatedProfile));
      localStorage.setItem('connect_is_logged_in', 'true');
      localStorage.setItem('connect_profile_setup_done', 'true');
    } catch (e) {}
    goToPage('home');
  };

  const handleLogout = () => {
    showToast('Logged out successfully.');
    setIsGuest(false);
    try {
      localStorage.removeItem('connect_is_logged_in');
      localStorage.removeItem('connect_is_guest');
      localStorage.setItem('connect_current_page', 'login');
      window.history.replaceState(null, '', '#login');
    } catch (e) {}
    setAuthInitialMode('login');
    setPage('login');
  };

  const handleAddCoins = (amount = 100) => {
    setCoins((prev) => {
      const next = Math.max(0, prev + amount);
      coinsRef.current = next;
      try {
        localStorage.setItem('connect_coins', next.toString());
      } catch (e) {}
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
                const COIN_MAP = {
                  'connect-pack-19': 50,
                  'connect-pack-49': 160,
                  'connect-pack-99': 440,
                  'connect-pack-149': 880,
                  'connect-pack-199': 1250,
                };
                const coinsToAdd = COIN_MAP[item.id] || 440;
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
      response = await fetch('/api/payu-initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
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
            onUpdateProfile={(updated) => setUserProfile(updated)}
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
          isGuest={isGuest}
          initialTab={initialHomeTab}
          initialCallingExpert={autoStartExpert}
          onClearAutoStartExpert={() => setAutoStartExpert(null)}
          onLogout={handleLogout}
          onAddCoins={handleAddCoins}
          onDeductCoins={handleDeductCoins}
          onOpenWallet={() => goToPage('wallet')}
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
