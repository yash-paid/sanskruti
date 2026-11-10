import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { TOP_EXPERTS, NORMAL_EXPERTS } from '../data/experts';
import TransactionsModal from './TransactionsModal';
import VideoCallScreen from './VideoCallScreen';
import InsufficientCoinsModal from './InsufficientCoinsModal';
import LoginRequiredModal from './LoginRequiredModal';
import DailyRewardModal from './DailyRewardModal';
import heartLogoImg from '../../assets/images/heart-logo-transparent.png';
import { useLanguage } from '../context/LanguageContext';
import { recordUserCall } from '../firebase/userService';

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

/* ─── Safe Expert Image with Graceful Initial Placeholder ──── */
function ExpertImage({ src, alt, name, className }) {
  const [hasError, setHasError] = useState(false);

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
      className={className}
      draggable="false"
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
      setCallingExpert(initialCallingExpert);
      onClearAutoStartExpert?.();
    }
  }, [initialCallingExpert, onClearAutoStartExpert]);

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
        recordUserCall(uid, {
          name: expert.name,
          type: 'Video',
          duration: formatted,
          durationSeconds: duration,
          coins: Math.max(1, Math.ceil(duration / 60)) * rate,
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
          onClick={onLogout}
          title="Logout"
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
            const exp = callingExpert;
            setCallingExpert(null);
            setPendingCallExpert(exp);
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
          expert={pendingCallExpert}
          userProfile={userProfile}
          onClose={handleCloseInsufficient}
          onProceedPay={async (pack) => {
            if (onInitiateRecharge) {
              await onInitiateRecharge(pack, pendingCallExpert);
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
    </div>
  );
}
