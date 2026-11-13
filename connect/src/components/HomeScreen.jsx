import React, { useState, useEffect, useRef } from 'react';
import {
  Menu,
  Bell,
  Plus,
  Phone,
  CheckCircle2,
  Heart,
  Star,
  Wallet,
  User,
  Crown,
  LogOut,
  X,
  Gift,
  FileText,
  AlertTriangle,
} from 'lucide-react';
import { TOP_EXPERTS, NORMAL_EXPERTS } from '../data/experts';
import TransactionsModal from './TransactionsModal';
import VideoCallScreen from './VideoCallScreen';
import InsufficientCoinsModal from './InsufficientCoinsModal';
import LoginRequiredModal from './LoginRequiredModal';
import DailyRewardModal from './DailyRewardModal';
import DemoIncomingCallModal from './DemoIncomingCallModal';
import DemoPostCallModal from './DemoPostCallModal';
import heartLogoImg from '../../assets/images/heart-logo-transparent.png';
import { useLanguage } from '../context/LanguageContext';
import { recordUserCall } from '../firebase/userService';
import { recordLocalCall, recordLocalTransaction } from '../firebase/rewardService';

const ALL_EXPERTS = [...TOP_EXPERTS, ...NORMAL_EXPERTS];

/* ─── Status Dot ─────────────────────────────────────────── */
function StatusDot({ status }) {
  return (
    <span
      className={`status-dot ${status === 'online' ? 'dot-online' : 'dot-busy'}`}
      aria-label={status}
    />
  );
}

/* ─── Safe Expert Image with Graceful Initial Placeholder & Off-thread Lazy Decode ──── */
function ExpertImage({ src, alt, name, className }) {
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  if (hasError || !src) {
    return (
      <div className={`${className} photo-placeholder-box`}>
        <span className="placeholder-letter">{name ? name.charAt(0).toUpperCase() : 'C'}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt || name}
      className={`${className} ${isLoaded ? 'img-loaded' : 'img-loading'}`}
      draggable="false"
      loading="lazy"
      decoding="async"
      onLoad={() => setIsLoaded(true)}
      onError={() => setHasError(true)}
    />
  );
}

/* ─── Coin Badge ─────────────────────────────────────────── */
function CoinBadge({ price }) {
  const { t } = useLanguage();
  return (
    <span className="coin-badge">
      <span className="coin-emoji">🪙</span>
      {price} {t('coins_per_min', 'Coins / Min')}
    </span>
  );
}

/* ─── Top Expert Card ────────────────────────────────────── */
function TopExpertCard({ expert, onCall, onFavToggle, isFav }) {
  const { t } = useLanguage();
  return (
    <div className="top-expert-card">
      <div className="top-badge-row">
        <span className="top-badge">👑 TOP</span>
        <button
          className={`fav-heart-btn ${isFav ? 'fav-active' : ''}`}
          onClick={() => onFavToggle(expert.id)}
          aria-label="Favourite"
        >
          <Heart size={18} fill={isFav ? '#ff2a8d' : 'none'} strokeWidth={2} />
        </button>
      </div>

      <div className="top-expert-photo-wrap">
        <ExpertImage src={expert.photo} name={expert.name} className="top-expert-photo" />
        <div className="top-expert-status-row">
          <StatusDot status={expert.status} />
          <span className="top-expert-status-label">
            {expert.status === 'online' ? t('online', 'Online') : t('busy', 'Busy')}
          </span>
        </div>
      </div>

      <div className="top-expert-info">
        <div className="top-expert-name-row">
          <span className="top-expert-name">{expert.name}</span>
          {expert.verified && (
            <CheckCircle2 size={14} className="verified-tick" fill="#2196f3" color="#fff" />
          )}
        </div>
        <div className="top-expert-age">{expert.age} Y</div>
        <div className="top-expert-rating">
          <Star size={13} fill="#FFD700" color="#FFD700" />
          <span>{expert.rating}</span>
        </div>
        <CoinBadge price={expert.price} />
        <button className="call-btn-primary" onClick={() => onCall(expert)}>
          <Phone size={16} fill="white" strokeWidth={0} />
          {t('call_btn', 'Call')}
        </button>
      </div>
    </div>
  );
}

/* ─── Normal Expert Card ─────────────────────────────────── */
function NormalExpertCard({ expert, onCall, onFavToggle, isFav }) {
  const { t } = useLanguage();
  return (
    <div className="normal-expert-card">
      <div className="normal-photo-wrap">
        <StatusDot status={expert.status} />
        <ExpertImage src={expert.photo} name={expert.name} className="normal-expert-photo" />
      </div>

      <div className="normal-expert-info">
        <div className="normal-name-row">
          <span className="normal-expert-name">{expert.name}</span>
          {expert.verified && (
            <CheckCircle2 size={13} className="verified-tick" fill="#2196f3" color="#fff" />
          )}
          <span className="normal-expert-age">{expert.age} Y</span>
          <span className="normal-rating">
            <Star size={12} fill="#FFD700" color="#FFD700" />
            {expert.rating}
          </span>
        </div>

        <CoinBadge price={expert.price} />

        <div className="language-tags">
          {(expert.languages || []).map((lang) => (
            <span key={lang} className="lang-tag">
              {lang}
            </span>
          ))}
        </div>
      </div>

      <div className="normal-expert-actions">
        <button
          className={`fav-star-btn ${isFav ? 'fav-star-active' : ''}`}
          onClick={() => onFavToggle(expert.id)}
          aria-label="Favourite"
        >
          <Star
            size={22}
            fill={isFav ? '#FFD700' : 'none'}
            color={isFav ? '#FFD700' : '#c9b4d5'}
            strokeWidth={1.5}
          />
        </button>
        <button className="call-btn-normal" onClick={() => onCall(expert)}>
          <Phone size={14} fill="white" strokeWidth={0} />
          {t('call_btn', 'Call')}
        </button>
      </div>
    </div>
  );
}



/* ─── Stars / Favourites Page ────────────────────────────── */
function StarsPage({ favourites, onCall, onFavToggle }) {
  const { t } = useLanguage();
  const favExperts = ALL_EXPERTS.filter((e) => favourites.has(e.id));

  if (favExperts.length === 0) {
    return (
      <div className="stars-empty-state">
        <div className="stars-empty-icon">
          <Star size={56} color="rgba(255,215,0,0.3)" strokeWidth={1.2} />
        </div>
        <p className="stars-empty-title">{t('no_favs_title', 'No Favourites Yet')}</p>
        <p className="stars-empty-sub">
          {t('no_favs_sub', "Tap the ⭐ star on any expert's card to save them here for quick access.")}
        </p>
      </div>
    );
  }

  return (
    <div className="stars-page-content">
      <div className="stars-page-header">
        <Star size={20} fill="#FFD700" color="#FFD700" />
        <span className="stars-page-title">{t('your_favs', 'Your Favourites')}</span>
        <span className="stars-count-badge">{favExperts.length}</span>
      </div>
      <div className="normal-experts-list">
        {favExperts.map((expert) => (
          <NormalExpertCard
            key={expert.id}
            expert={expert}
            onCall={onCall}
            onFavToggle={onFavToggle}
            isFav={true}
          />
        ))}
      </div>
    </div>
  );
}

/* ─── Home Screen ────────────────────────────────────────── */
export default function HomeScreen({
  coins = 0,
  userProfile,
  vipEntitlement,
  uid,
  isGuest = false,
  favourites: propFavourites,
  onFavToggle: propOnFavToggle,
  initialTab = 'call',
  initialCallingExpert = null,
  onClearAutoStartExpert,
  onLogout,
  onAddCoins,
  onRewardClaimed,
  onDeductCoins,
  onOpenWallet,
  onOpenVip,
  onOpenProfile,
  onInitiateRecharge,
  onRequireLogin,
  onGoogleLogin,
  onToast,
}) {
  const { t } = useLanguage();
  const [activeFilter, setActiveFilter] = useState('all');
  const [favourites, setFavourites] = useState(() => {
    if (propFavourites instanceof Set) return propFavourites;
    try {
      const key = uid ? `connect_favourites_${uid}` : 'connect_favourites';
      const saved = localStorage.getItem(key) || localStorage.getItem('connect_favourites');
      return new Set(saved ? JSON.parse(saved) : []);
    } catch (e) {
      return new Set();
    }
  });

  useEffect(() => {
    if (propFavourites instanceof Set) {
      setFavourites(propFavourites);
    }
  }, [propFavourites]);

  const toggleFav = (id) => {
    if (propOnFavToggle) {
      propOnFavToggle(id);
      return;
    }
    setFavourites((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      try {
        const arr = Array.from(next);
        const key = uid ? `connect_favourites_${uid}` : 'connect_favourites';
        localStorage.setItem(key, JSON.stringify(arr));
        localStorage.setItem('connect_favourites', JSON.stringify(arr));
        window.dispatchEvent(new CustomEvent('connect_favourites_updated', { detail: arr }));
      } catch (e) {}
      return next;
    });
  };

  const [activeNav, setActiveNav] = useState(initialTab);
  const [callingExpert, setCallingExpert] = useState(null);
  const [insufficientModal, setInsufficientModal] = useState(false);
  const [pendingCallExpert, setPendingCallExpert] = useState(null);
  const [loginReqAction, setLoginReqAction] = useState(null); // null | 'call' | 'recharge'
  const [notification, setNotification] = useState(false);
  const [showTransactions, setShowTransactions] = useState(false);
  const [showDailyReward, setShowDailyReward] = useState(false);
  const [showMenuDrawer, setShowMenuDrawer] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // ── CONNECT Demo Incoming Call Experience ──
  const [incomingDemoCall, setIncomingDemoCall] = useState(null);
  const [activeDemoCall, setActiveDemoCall] = useState(null);
  const [demoPostCall, setDemoPostCall] = useState(null);

  const callingExpertRef = useRef(callingExpert);
  callingExpertRef.current = callingExpert || activeDemoCall;

  const insufficientModalRef = useRef(insufficientModal);
  insufficientModalRef.current = insufficientModal;

  const showDailyRewardRef = useRef(showDailyReward);
  showDailyRewardRef.current = showDailyReward;

  const showTransactionsRef = useRef(showTransactions);
  showTransactionsRef.current = showTransactions;

  const activeNavRef = useRef(activeNav);
  activeNavRef.current = activeNav;

  const demoTimerRef = useRef(null);
  const lastDemoCallerRef = useRef(null);

  // All 23 Platform Experts can call dynamically (no longer fixed to only Uma/Simran)
  const DEMO_CALLERS = ALL_EXPERTS;

  const getDemoSession = () => {
    try {
      const key = `connect_demo_session_${uid || 'guest'}`;
      const saved = sessionStorage.getItem(key);
      if (!saved) {
        const initial = { callCount: 0, enteredAt: Date.now(), lastEndedAt: null };
        sessionStorage.setItem(key, JSON.stringify(initial));
        return initial;
      }
      const parsed = JSON.parse(saved);
      return {
        callCount: Number(parsed.callCount) || 0,
        enteredAt: parsed.enteredAt ? Number(parsed.enteredAt) : Date.now(),
        lastEndedAt: parsed.lastEndedAt ? Number(parsed.lastEndedAt) : null,
      };
    } catch (e) {
      return { callCount: 0, enteredAt: Date.now(), lastEndedAt: null };
    }
  };

  const saveDemoSession = (callCount, lastEndedAt, enteredAt) => {
    try {
      const key = `connect_demo_session_${uid || 'guest'}`;
      const prev = getDemoSession();
      sessionStorage.setItem(
        key,
        JSON.stringify({
          callCount,
          enteredAt: enteredAt || prev.enteredAt || Date.now(),
          lastEndedAt,
        })
      );
    } catch (e) {}
  };

  const scheduleNextDemo = (count, lastEnd, entered) => {
    if (demoTimerRef.current) clearTimeout(demoTimerRef.current);
    if (count >= 3) return; // Strict maximum: 3 demo calls per session

    let delayMs = 60000; // 1st call: 1 minute (60,000 ms) after entering Home
    if (count === 0) {
      const entry = entered || Date.now();
      const elapsed = Date.now() - entry;
      delayMs = Math.max(0, 60000 - elapsed);
    } else if (count === 1) {
      // 2nd call: 2 minutes (120,000 ms) after first demo call ends
      const elapsed = lastEnd ? Date.now() - lastEnd : 120000;
      delayMs = Math.max(0, 120000 - elapsed);
    } else if (count === 2) {
      // 3rd call: 5 minutes (300,000 ms) after second demo call ends
      const elapsed = lastEnd ? Date.now() - lastEnd : 300000;
      delayMs = Math.max(0, 300000 - elapsed);
    }

    demoTimerRef.current = setTimeout(() => {
      // Strict Guard: ONLY trigger when user is specifically on the CALL screen ('call') of Home screen
      // AND not busy on an active video call or modal
      if (
        activeNavRef.current !== 'call' ||
        callingExpertRef.current ||
        insufficientModalRef.current ||
        showDailyRewardRef.current ||
        showTransactionsRef.current
      ) {
        // Retry in 3 seconds if user is temporarily on Stars or Profile tab or busy
        demoTimerRef.current = setTimeout(() => {
          scheduleNextDemo(count, lastEnd, entered);
        }, 3000);
        return;
      }
      // Random selection from all 23 girls, avoiding consecutive duplicates
      const availableCallers = DEMO_CALLERS.filter((c) => c.id !== lastDemoCallerRef.current);
      const pool = availableCallers.length > 0 ? availableCallers : DEMO_CALLERS;
      const chosen = pool[Math.floor(Math.random() * pool.length)];
      lastDemoCallerRef.current = chosen.id;
      setIncomingDemoCall(chosen);
    }, delayMs);
  };

  // Schedule demo calls whenever Home screen is active
  useEffect(() => {
    const session = getDemoSession();
    if (session.callCount < 3) {
      scheduleNextDemo(session.callCount, session.lastEndedAt, session.enteredAt);
    }
    return () => {
      if (demoTimerRef.current) clearTimeout(demoTimerRef.current);
    };
  }, [uid]);

  // When activeNav changes, update ref and immediately re-evaluate demo call if user switched to 'call'
  useEffect(() => {
    activeNavRef.current = activeNav;
    if (activeNav === 'call') {
      const session = getDemoSession();
      if (session.callCount < 3 && !callingExpertRef.current && !incomingDemoCall && !activeDemoCall) {
        scheduleNextDemo(session.callCount, session.lastEndedAt, session.enteredAt);
      }
    }
  }, [activeNav]);

  const handleDeclineDemo = () => {
    setIncomingDemoCall(null);
    const session = getDemoSession();
    const nextCount = session.callCount + 1;
    const now = Date.now();
    saveDemoSession(nextCount, now, session.enteredAt);
    if (nextCount < 3) {
      scheduleNextDemo(nextCount, now, session.enteredAt);
    }
  };

  const handleAcceptDemo = () => {
    const caller = incomingDemoCall;
    setIncomingDemoCall(null);
    if (!caller) return;

    // Incoming calls are 100% free to pick up for 10 seconds (no coins required upfront!)
    setActiveDemoCall(caller);
  };

  const handleEndDemoCall = (caller) => {
    setActiveDemoCall(null);
    const session = getDemoSession();
    const nextCount = session.callCount + 1;
    const now = Date.now();
    saveDemoSession(nextCount, now, session.enteredAt);
    // Show post-call wallet & recharge / call-back modal
    setDemoPostCall(caller);
  };

  const handleCloseDemoPostCall = () => {
    setDemoPostCall(null);
    const session = getDemoSession();
    if (session.callCount < 3) {
      scheduleNextDemo(session.callCount, session.lastEndedAt, session.enteredAt);
    }
  };

  const handleStartRealCallFromDemo = (caller) => {
    setDemoPostCall(null);
    // Standard real call trigger: checks guest -> login modal, insufficient coins -> recharge modal, sufficient -> real video call
    handleCall(caller);
  };

  useEffect(() => {
    setActiveNav(initialTab);
  }, [initialTab]);

  // Auto-launch Daily Reward popup on login for registered users
  useEffect(() => {
    if (!isGuest && uid) {
      const sessionKey = `connect_daily_rwd_shown_${uid}`;
      const alreadyShown = sessionStorage.getItem(sessionKey);
      if (!alreadyShown) {
        sessionStorage.setItem(sessionKey, 'true');
        const timer = setTimeout(() => {
          setShowDailyReward(true);
        }, 600);
        return () => clearTimeout(timer);
      }
    }
  }, [isGuest, uid]);

  // Auto-launch call if returned from verified payment recharge
  useEffect(() => {
    if (initialCallingExpert) {
      const isTop = initialCallingExpert?.id === 'simran' || initialCallingExpert?.id === 'uma' || initialCallingExpert?.top;
      const callRate = isTop ? 65 : (Number(initialCallingExpert?.price) || 30);
      const userCoins = Number(coins) || 0;
      if (userCoins >= callRate) {
        setCallingExpert(initialCallingExpert);
      } else {
        setPendingCallExpert(initialCallingExpert);
        setInsufficientModal(true);
        onToast?.(`⚠️ You need at least ${callRate} Coins to start call with ${initialCallingExpert?.name || 'Expert'}. Balance: ${userCoins}`);
      }
      onClearAutoStartExpert?.();
    }
  }, [initialCallingExpert, coins, onClearAutoStartExpert]);

  // Intercept call: verify guest status and coin balance
  const handleCall = (expert) => {
    if (isGuest) {
      setLoginReqAction('call');
      return;
    }
    const isTop = expert?.id === 'simran' || expert?.id === 'uma' || expert?.top;
    const callRate = isTop ? 65 : (Number(expert?.price) || 30);
    const userCoins = Number(coins) || 0;
    if (userCoins < callRate) {
      setPendingCallExpert(expert);
      setInsufficientModal(true);
      onToast?.(`⚠️ You need at least ${callRate} Coins to start call with ${expert?.name || 'Expert'}. Balance: ${userCoins}`);
      return;
    }
    setCallingExpert(expert);
  };

  const handleCloseInsufficient = () => {
    setInsufficientModal(false);
    setPendingCallExpert(null);
  };

  const handleEndCall = (duration = 0) => {
    const expert = callingExpert;
    setCallingExpert(null);
    if (duration > 0) {
      const m = Math.floor(duration / 60);
      const s = duration % 60;
      const formatted = m > 0 ? `${m}m ${s}s` : `${s}s`;
      onToast?.(`Call ended • Duration: ${formatted}`);
      if (uid && expert) {
        const isTop = expert.id === 'simran' || expert.id === 'uma' || expert.top;
        const rate = isTop ? 65 : (expert.price || 30);
        const coinsSpent = Math.max(1, Math.ceil(duration / 60)) * rate;
        recordLocalCall(uid, {
          name: expert.name,
          type: 'Video',
          duration: formatted,
          durationSeconds: duration,
          coins: coinsSpent,
        });
        recordLocalTransaction(uid, {
          type: 'call',
          title: `Video Call with ${expert.name} (${formatted})`,
          amount: coinsSpent,
          isCredit: false,
          metadata: { expertId: expert.id, expertName: expert.name, durationSeconds: duration },
        });
        recordUserCall(uid, {
          name: expert.name,
          type: 'Video',
          duration: formatted,
          durationSeconds: duration,
          coins: coinsSpent,
        }).catch(() => { });
      }
    }
  };

  const filteredNormal = NORMAL_EXPERTS.filter((e) => {
    if (activeFilter === 'online') return e.status === 'online';
    if (activeFilter === 'popular') return e.rating >= 4.7;
    if (activeFilter === 'new')
      return ['ananya', 'kavya', 'megha', 'pooja', 'noor', 'aditi'].includes(e.id);
    return true;
  });

  const filters = [
    { key: 'all', label: t('all_experts', 'All Experts'), icon: '⊞' },
    { key: 'online', label: t('filter_online', 'Online'), icon: '●' },
    { key: 'popular', label: t('filter_popular', 'Popular'), icon: '🔥' },
    { key: 'new', label: t('filter_new', 'New'), icon: '✦' },
  ];

  const favCount = favourites.size;

  return (
    <div className="home-screen">
      {/* ── Header ── */}
      <header className="home-header">
        <button
          className="header-menu-btn"
          aria-label="Menu"
          onClick={() => setShowMenuDrawer(true)}
          title="Menu"
        >
          <Menu size={22} color="#ff5eb0" />
        </button>

        <div className="home-header-brand">
          <img src={heartLogoImg} alt="CONNECT" className="home-brand-logo" />
          <div className="home-brand-text">
            <span className="home-brand-name">CONNECT</span>
            <span className="home-brand-sub">
              {t('brand_sub', 'Live Call • Real Experts')}
            </span>
          </div>
        </div>

        <div className="home-header-actions">
          {vipEntitlement?.active && (
            <div
              className="home-vip-badge-pill"
              onClick={onOpenVip}
              title={`${vipEntitlement.planName} Active (Expires ${vipEntitlement.expiryDate})`}
            >
              <Crown size={12} color="#FFD700" fill="#FFD700" />
              <span>{vipEntitlement.planName?.replace(' VIP', '') || 'VIP'}</span>
            </div>
          )}
          <div
            className="coin-wallet"
            onClick={() => {
              if (isGuest) {
                setLoginReqAction('recharge');
                return;
              }
              onOpenWallet();
            }}
            title="Open Wallet"
          >
            <span className="coin-wallet-icon">🪙</span>
            <span className="coin-wallet-balance">{coins.toLocaleString()}</span>
            <button
              className="coin-plus-btn"
              aria-label="Add Coins"
              onClick={(e) => {
                e.stopPropagation();
                if (isGuest) {
                  setLoginReqAction('recharge');
                  return;
                }
                onOpenWallet();
              }}
            >
              <Plus size={14} strokeWidth={3} />
            </button>
          </div>
          {!isGuest && (
            <button
              type="button"
              className="daily-rwd-nav-btn"
              onClick={() => setShowDailyReward(true)}
              aria-label="Daily Rewards"
              title="Daily Rewards"
            >
              🎁
            </button>
          )}
          <button
            className={`notif-btn ${notification ? 'notif-active' : ''}`}
            onClick={() => setNotification((n) => !n)}
            aria-label="Notifications"
          >
            <Bell size={22} color="#c9b4d5" />
            {notification && <span className="notif-dot" />}
          </button>
        </div>
      </header>

      {/* ── Scrollable Content ── */}
      <div className="home-content">
        {/* ════ STARS TAB ════ */}
        {activeNav === 'stars' && (
          <StarsPage
            favourites={favourites}
            onCall={handleCall}
            onFavToggle={toggleFav}
          />
        )}

        {/* ════ CALL / HOME TAB ════ */}
        {activeNav === 'call' && (
          <>
            {/* Top Experts Section */}
            <section className="section-block">
              <div className="section-header">
                <span className="section-title">👑 {t('top_experts', 'Top Experts')}</span>
                <button
                  type="button"
                  className="view-all-btn"
                  onClick={() => document.querySelector('.normal-experts-list')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  {t('view_all', 'View All →')}
                </button>
              </div>
              <div className="top-experts-grid">
                {TOP_EXPERTS.map((expert) => (
                  <TopExpertCard
                    key={expert.id}
                    expert={expert}
                    onCall={handleCall}
                    onFavToggle={toggleFav}
                    isFav={favourites.has(expert.id)}
                  />
                ))}
              </div>
            </section>

            {/* Filter Tabs */}
            <div className="filter-tabs">
              {filters.map((f) => (
                <button
                  key={f.key}
                  className={`filter-tab ${activeFilter === f.key ? 'filter-active' : ''}`}
                  onClick={() => setActiveFilter(f.key)}
                >
                  <span className="filter-tab-icon">{f.icon}</span>
                  {f.label}
                </button>
              ))}
            </div>

            {/* Normal Experts List */}
            <section className="normal-experts-list">
              {filteredNormal.length === 0 ? (
                <div className="empty-filter-msg">No experts available for this filter.</div>
              ) : (
                filteredNormal.map((expert) => (
                  <NormalExpertCard
                    key={expert.id}
                    expert={expert}
                    onCall={handleCall}
                    onFavToggle={toggleFav}
                    isFav={favourites.has(expert.id)}
                  />
                ))
              )}
            </section>
          </>
        )}

        {/* ════ MY PROFILE TAB ════ */}
        {activeNav === 'profile' && (
          <div className="placeholder-tab-page">
            <div className="profile-center-avatar-wrap">
              <img
                src={userProfile?.avatar || '/default-avatars/1.png'}
                alt={userProfile?.name || 'My Profile'}
                className="profile-center-avatar-large"
                onError={(e) => {
                  e.target.src = '/default-avatars/1.png';
                }}
              />
            </div>
            <p className="placeholder-tab-title">{userProfile?.name || t('nav_profile', 'My Profile')}</p>
            <p className="placeholder-tab-sub">{userProfile?.username || 'Connected User'}</p>
            <div className="profile-coins-chip" onClick={onOpenWallet}>
              🪙 {coins.toLocaleString()} {t('coins', 'Coins')}
            </div>
            <button className="logout-link-btn" onClick={onLogout}>
              {t('logout', 'Log Out')}
            </button>
          </div>
        )}
      </div>

      {/* ── Bottom Navigation (4 items: Call, Stars, Wallet, My Profile) ── */}
      <nav className="bottom-nav" aria-label="Bottom Navigation">
        {/* 1. Call */}
        <button
          className={`bottom-nav-item ${activeNav === 'call' ? 'nav-active' : ''}`}
          onClick={() => setActiveNav('call')}
        >
          {activeNav === 'call' ? (
            <div className="bottom-nav-call-pill">
              <Phone size={20} fill="white" strokeWidth={0} />
            </div>
          ) : (
            <Phone size={22} strokeWidth={1.8} />
          )}
          <span className="bottom-nav-label">{t('nav_call', 'Call')}</span>
        </button>

        {/* 2. Stars */}
        <button
          className={`bottom-nav-item ${activeNav === 'stars' ? 'nav-active' : ''}`}
          onClick={() => setActiveNav('stars')}
        >
          <div className="stars-nav-wrap">
            <Star
              size={22}
              strokeWidth={1.8}
              fill={activeNav === 'stars' ? '#FFD700' : 'none'}
              color={activeNav === 'stars' ? '#FFD700' : 'currentColor'}
            />
            {favCount > 0 && <span className="fav-count-badge">{favCount}</span>}
          </div>
          <span className="bottom-nav-label">{t('nav_stars', 'Stars')}</span>
        </button>

        {/* 3. Wallet (Opens Wallet Page) */}
        <button className="bottom-nav-item" onClick={onOpenWallet}>
          <Wallet size={22} strokeWidth={1.8} />
          <span className="bottom-nav-label">{t('nav_wallet', 'Wallet')}</span>
        </button>

        {/* 4. My Profile (Opens Page 4 Profile Screen) */}
        <button
          className="bottom-nav-item"
          onClick={onOpenProfile}
        >
          <User size={22} strokeWidth={1.8} />
          <span className="bottom-nav-label">{t('nav_profile', 'My Profile')}</span>
        </button>
      </nav>

      {/* ── Call Overlay ── */}
      {callingExpert && (
        <VideoCallScreen
          expert={callingExpert}
          uid={uid}
          coins={coins}
          onEndCall={handleEndCall}
          onToast={onToast}
          onDeductCoins={onDeductCoins}
          onAddCoins={onAddCoins}
          onInsufficientCoins={() => {
            // Guard: If user has sufficient coins (>= call rate), NEVER interrupt the call
            const isTop = callingExpert?.id === 'simran' || callingExpert?.id === 'uma' || callingExpert?.top;
            const rate = isTop ? 65 : (Number(callingExpert?.price) || 30);
            const userCoins = Number(coins) || 0;
            if (userCoins >= rate) {
              console.warn('Blocked opening insufficient modal because balance is sufficient:', userCoins);
              return;
            }
            // DO NOT setCallingExpert(null) - keeps the active video call running in background!
            setPendingCallExpert(callingExpert);
            setInsufficientModal(true);
          }}
          onOpenRecharge={() => {
            setPendingCallExpert(callingExpert);
            setInsufficientModal(true);
          }}
        />
      )}

      {/* ── Transactions History Modal ── */}
      {showTransactions && (
        <TransactionsModal uid={uid} coins={coins} onClose={() => setShowTransactions(false)} />
      )}

      {/* ── Daily Login Reward Popup Modal (PART 1) ── */}
      <DailyRewardModal
        isOpen={showDailyReward}
        uid={uid}
        onClose={() => setShowDailyReward(false)}
        onRewardClaimed={(awarded, newBalance) => {
          // If server returned newBalance, sync the wallet state directly.
          // NEVER re-credit awarded coins via onAddCoins, otherwise user gets 2x coins!
          if (onRewardClaimed) {
            onRewardClaimed(awarded, newBalance);
          } else if (typeof newBalance !== 'number') {
            onAddCoins?.(awarded);
          }
        }}
        onToast={onToast}
      />

      {/* ── Insufficient Coins Recharge Bottom Sheet Modal ── */}
      {insufficientModal && (
        <InsufficientCoinsModal
          coins={coins}
          expert={pendingCallExpert || callingExpert}
          userProfile={userProfile}
          onClose={handleCloseInsufficient}
          onProceedPay={async (pack) => {
            if (onInitiateRecharge) {
              await onInitiateRecharge(pack, pendingCallExpert || callingExpert);
            }
          }}
          onToast={onToast}
        />
      )}

      {/* ── Login Required Modal for Guests ── */}
      {loginReqAction && (
        <LoginRequiredModal
          actionType={loginReqAction}
          onClose={() => setLoginReqAction(null)}
          onGoToAuth={(targetMode) => {
            setLoginReqAction(null);
            onRequireLogin?.(targetMode);
          }}
          onGoogleLogin={() => {
            setLoginReqAction(null);
            onGoogleLogin?.();
          }}
        />
      )}

      {/* ── CONNECT Demo Incoming Call Experience ── */}
      {incomingDemoCall && (
        <DemoIncomingCallModal
          caller={incomingDemoCall}
          onAccept={handleAcceptDemo}
          onDecline={handleDeclineDemo}
        />
      )}

      {/* ── Active Video Call Screen for Incoming Call (100% Identical to Real Call) ── */}
      {activeDemoCall && (
        <VideoCallScreen
          expert={activeDemoCall}
          uid={uid}
          coins={coins}
          isDemo={true}
          onEndCall={() => {
            const caller = activeDemoCall;
            handleEndDemoCall(caller);
          }}
          onToast={onToast}
          onDeductCoins={onDeductCoins}
          onAddCoins={onAddCoins}
          onInsufficientCoins={() => {
            setPendingCallExpert(activeDemoCall);
            setInsufficientModal(true);
          }}
          onOpenRecharge={() => {
            setPendingCallExpert(activeDemoCall);
            setInsufficientModal(true);
          }}
        />
      )}

      {/* ── Demo Post-Call Explore / Recharge Modal ── */}
      {demoPostCall && (
        <DemoPostCallModal
          caller={demoPostCall}
          coins={coins}
          onStartRealCall={handleStartRealCallFromDemo}
          onClose={handleCloseDemoPostCall}
        />
      )}

      {/* ── Slide-Out / Popup Menu Drawer (MED-07) ── */}
      {showMenuDrawer && (
        <div
          className="menu-drawer-overlay"
          onClick={() => setShowMenuDrawer(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(5px)',
            zIndex: 999,
            display: 'flex',
            justifyContent: 'flex-start',
            alignItems: 'stretch',
          }}
        >
          <div
            className="menu-drawer-panel"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '82%',
              maxWidth: '320px',
              height: '100%',
              background: 'linear-gradient(180deg, #18081f 0%, #0d0414 100%)',
              borderRight: '1px solid rgba(255, 42, 141, 0.25)',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '4px 0 24px rgba(255, 42, 141, 0.25)',
              overflowY: 'auto',
              padding: '20px 16px',
            }}
          >
            {/* Header with Close */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <img src={heartLogoImg} alt="CONNECT" style={{ width: '28px', height: 'auto' }} />
                <span style={{ color: '#fff', fontWeight: 800, fontSize: '18px', letterSpacing: '0.5px' }}>CONNECT</span>
              </div>
              <button
                type="button"
                onClick={() => setShowMenuDrawer(false)}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#fff',
                }}
                aria-label="Close menu"
              >
                <X size={16} />
              </button>
            </div>

            {/* User Profile Summary Card */}
            <div
              style={{
                background: 'rgba(255, 42, 141, 0.08)',
                border: '1px solid rgba(255, 42, 141, 0.25)',
                borderRadius: '16px',
                padding: '14px',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <img
                src={userProfile?.avatar || '/default-avatars/1.png'}
                alt="Profile"
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '50%',
                  border: '2px solid #ff2a8d',
                  objectFit: 'cover',
                }}
                onError={(e) => {
                  e.target.src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80';
                }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: '#fff', fontWeight: 700, fontSize: '15px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {userProfile?.name || (isGuest ? 'Guest User' : 'CONNECT User')}
                </div>
                <div style={{ color: '#a0a0a0', fontSize: '12px' }}>
                  {userProfile?.phone || (isGuest ? 'Guest Session' : (uid ? `ID: ${uid.slice(0, 8)}...` : ''))}
                </div>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    background: 'rgba(255, 215, 0, 0.12)',
                    border: '1px solid rgba(255, 215, 0, 0.3)',
                    borderRadius: '12px',
                    padding: '2px 8px',
                    marginTop: '6px',
                    fontSize: '11px',
                    color: '#FFD700',
                    fontWeight: 700,
                  }}
                >
                  <span>🪙 {coins} Coins</span>
                </div>
              </div>
            </div>

            {/* Menu Navigation Items */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
              <button
                type="button"
                onClick={() => {
                  setShowMenuDrawer(false);
                  onOpenProfile?.();
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 14px',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  color: '#fff',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <User size={18} color="#ff5eb0" />
                <span>{t('nav_profile', 'My Profile')}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowMenuDrawer(false);
                  onOpenWallet?.();
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 14px',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  color: '#fff',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <Wallet size={18} color="#FFD700" />
                <span>{t('nav_wallet', 'Wallet & Coins')}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowMenuDrawer(false);
                  onOpenVip?.();
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 14px',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  color: '#fff',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <Crown size={18} color="#FFD700" />
                <span>VIP Membership</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowMenuDrawer(false);
                  setShowTransactions(true);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 14px',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  color: '#fff',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <FileText size={18} color="#4ade80" />
                <span>Transaction History</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowMenuDrawer(false);
                  setShowDailyReward(true);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 14px',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  color: '#fff',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <Gift size={18} color="#f472b6" />
                <span>Daily Login Reward</span>
              </button>
            </div>

            {/* Logout button at bottom of drawer */}
            <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <button
                type="button"
                onClick={() => {
                  setShowMenuDrawer(false);
                  setShowLogoutConfirm(true);
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '12px',
                  borderRadius: '12px',
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.28)',
                  color: '#f87171',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                <LogOut size={16} />
                <span>{t('logout', 'Log Out')}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Logout Confirmation Dialog (MED-07) ── */}
      {showLogoutConfirm && (
        <div
          className="logout-confirm-overlay"
          onClick={() => setShowLogoutConfirm(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(6px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <div
            className="logout-confirm-card"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '340px',
              background: '#160820',
              border: '1px solid rgba(255, 42, 141, 0.3)',
              borderRadius: '20px',
              padding: '24px 20px',
              textAlign: 'center',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6)',
            }}
          >
            <div
              style={{
                width: '54px',
                height: '54px',
                borderRadius: '50%',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
              }}
            >
              <LogOut size={26} color="#ef4444" />
            </div>

            <h3 style={{ color: '#fff', fontSize: '18px', fontWeight: 800, margin: '0 0 8px' }}>
              Log Out of CONNECT?
            </h3>
            <p style={{ color: '#9ca3af', fontSize: '13px', lineHeight: 1.5, margin: '0 0 22px' }}>
              Are you sure you want to log out? Your coin balance and progress are securely saved.
            </p>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.16)',
                  color: '#fff',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowLogoutConfirm(false);
                  onLogout?.();
                }}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
                  border: 'none',
                  color: '#fff',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(239, 68, 68, 0.4)',
                }}
              >
                Yes, Log Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
