import React, { useState, useRef } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Bell,
  Plus,
  Camera,
  CheckCircle2,
  Copy,
  Check,
  PhoneCall,
  Star,
  Clock,
  Phone,
  Wallet,
  User,
  ArrowLeftRight,
  Heart,
  Globe,
  Headphones,
  Info,
  LogOut,
  Edit3,
  X,
  Crown,
  Sparkles,
  Upload,
  Gift,
  Calendar,
} from 'lucide-react';
import { CoinStackGraphic } from './CoinGraphic';
import TransactionsModal from './TransactionsModal';
import LanguageModal from './LanguageModal';
import ProfileDailyRewardCalendar from './ProfileDailyRewardCalendar';
import { calculateAge, getMaxDobFor18Plus, isAtLeast18 } from '../utils/dateUtils';
import { compressImage } from '../utils/imageUtils';
import { useLanguage } from '../context/LanguageContext';
import heartLogoImg from '../../assets/images/heart-logo-transparent.png';
import { DEFAULT_AVATARS } from '../data/defaultAvatars';
import { fetchUserCallHistory, fetchUserVipEntitlement, saveUserProfile, redeemPromoCode } from '../firebase/userService';
import {
  getLocalCallHistory,
  getStoredVipEntitlement,
  saveStoredVipEntitlement,
  claimVipDailyBonus,
  getKolkataDateString,
} from '../firebase/rewardService';

const formatDobDisplay = (dobStr) => {
  if (!dobStr) return '1 Jan 2000';
  try {
    const parts = String(dobStr).split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const monthIdx = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      if (!isNaN(day) && !isNaN(monthIdx) && monthIdx >= 0 && monthIdx < 12 && !isNaN(year)) {
        return `${day} ${months[monthIdx]} ${year}`;
      }
    }
    const d = new Date(dobStr);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    }
  } catch (e) {}
  return '1 Jan 2000';
};

export default function ProfileScreen({
  coins = 0,
  userProfile,
  vipEntitlement: propVipEntitlement,
  uid,
  favCount: propFavCount,
  favourites,
  onFavToggle,
  onRewardClaimed,
  onUpdateProfile,
  onBack,
  onNavigateTab,
  onOpenWallet,
  onOpenVip,
  onLogout,
  onToast,
}) {
  const { t, currentLanguageMeta } = useLanguage();
  const [profileData, setProfileData] = useState(() => {
    if (userProfile) return userProfile;
    try {
      const saved = localStorage.getItem('connect_user_profile');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      name: '',
      username: '',
      phone: '',
      userId: '',
      avatar: '/default-avatars/1.png',
      dob: '2000-01-01',
    };
  });

  const [copiedId, setCopiedId] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showTransactions, setShowTransactions] = useState(false);
  const [showCallHistory, setShowCallHistory] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [isRedeeming, setIsRedeeming] = useState(false);

  const [callHistory, setCallHistory] = useState(() => getLocalCallHistory(uid));
  const [isLoadingCalls, setIsLoadingCalls] = useState(false);
  const [activeVip, setActiveVip] = useState(() => {
    return propVipEntitlement || getStoredVipEntitlement(uid);
  });

  const today = getKolkataDateString();
  const [isVipBonusClaimedToday, setIsVipBonusClaimedToday] = useState(() => {
    try {
      return localStorage.getItem(`connect_vip_claimed_${today}_${uid}`) === 'true';
    } catch (e) {
      return false;
    }
  });
  const [isClaimingVipBonus, setIsClaimingVipBonus] = useState(false);

  const handleClaimVipBonus = async () => {
    if (!activeVip || !activeVip.active || isVipBonusClaimedToday || isClaimingVipBonus) return;
    setIsClaimingVipBonus(true);
    try {
      const res = await claimVipDailyBonus(uid);
      const bonus = res.bonusAmount || activeVip.dailyBonusCoins || 1200;
      setIsVipBonusClaimedToday(true);
      onRewardClaimed?.(bonus, res.newBalance);
      onToast?.(`👑 Claimed ${activeVip.planName} Daily Bonus: +${bonus} Coins! 🎉`);
    } catch (err) {
      console.warn('VIP bonus claim error:', err);
      onToast?.(err.message || 'Could not claim VIP daily bonus.');
    } finally {
      setIsClaimingVipBonus(false);
    }
  };

  React.useEffect(() => {
    if (propVipEntitlement && propVipEntitlement.active) {
      setActiveVip(propVipEntitlement);
    }
  }, [propVipEntitlement]);

  React.useEffect(() => {
    const handleVipUpdate = (e) => {
      if (e?.detail) setActiveVip(e.detail);
    };
    const handleCallUpdate = () => {
      setCallHistory(getLocalCallHistory(uid));
    };
    window.addEventListener('connect_vip_updated', handleVipUpdate);
    window.addEventListener('connect_call_history_updated', handleCallUpdate);
    return () => {
      window.removeEventListener('connect_vip_updated', handleVipUpdate);
      window.removeEventListener('connect_call_history_updated', handleCallUpdate);
    };
  }, [uid]);

  React.useEffect(() => {
    let isMounted = true;
    if (uid) {
      setIsLoadingCalls(true);
      fetchUserCallHistory(uid)
        .then((calls) => {
          if (isMounted) {
            const local = getLocalCallHistory(uid);
            const seen = new Set();
            const merged = [];
            for (const c of calls || []) {
              if (c.id && !seen.has(c.id)) {
                seen.add(c.id);
                merged.push(c);
              }
            }
            for (const c of local) {
              if (c.id && !seen.has(c.id)) {
                seen.add(c.id);
                merged.push(c);
              }
            }
            merged.sort((a, b) => new Date(b.timestamp || b.time) - new Date(a.timestamp || a.time));
            setCallHistory(merged);
            setIsLoadingCalls(false);
          }
        })
        .catch(() => {
          if (isMounted) setIsLoadingCalls(false);
        });

      fetchUserVipEntitlement(uid)
        .then((res) => {
          if (isMounted && res?.entitlement && res.entitlement.active) {
            setActiveVip(res.entitlement);
            saveStoredVipEntitlement(uid, res.entitlement);
          } else if (isMounted) {
            const cached = getStoredVipEntitlement(uid);
            if (cached && cached.active) {
              setActiveVip(cached);
            }
          }
        })
        .catch(() => {
          if (isMounted) {
            const cached = getStoredVipEntitlement(uid);
            if (cached && cached.active) setActiveVip(cached);
          }
        });
    }
    return () => {
      isMounted = false;
    };
  }, [uid]);

  const totalCallsCount = callHistory.length;
  const totalDurationSeconds = callHistory.reduce((acc, c) => acc + (c.durationSeconds || 0), 0);
  const totalDurationFormatted =
    totalDurationSeconds === 0
      ? '0h'
      : totalDurationSeconds < 3600
      ? `${Math.ceil(totalDurationSeconds / 60)}m`
      : `${(totalDurationSeconds / 3600).toFixed(1)} h`;

  const [favCount, setFavCount] = useState(() => {
    if (typeof propFavCount === 'number') return propFavCount;
    try {
      const key = uid ? `connect_favourites_${uid}` : 'connect_favourites';
      const favs = JSON.parse(localStorage.getItem(key) || localStorage.getItem('connect_favourites') || '[]');
      return Array.isArray(favs) ? favs.length : 0;
    } catch (e) {
      return 0;
    }
  });

  React.useEffect(() => {
    if (typeof propFavCount === 'number') {
      setFavCount(propFavCount);
    }
  }, [propFavCount]);

  React.useEffect(() => {
    const handleSync = (e) => {
      if (Array.isArray(e?.detail)) {
        setFavCount(e.detail.length);
      } else {
        try {
          const key = uid ? `connect_favourites_${uid}` : 'connect_favourites';
          const favs = JSON.parse(localStorage.getItem(key) || localStorage.getItem('connect_favourites') || '[]');
          setFavCount(Array.isArray(favs) ? favs.length : 0);
        } catch (err) {}
      }
    };
    window.addEventListener('connect_favourites_updated', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('connect_favourites_updated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, [uid]);

  // Edit form state
  const [editForm, setEditForm] = useState({ ...profileData });
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const editFileInputRef = useRef(null);

  React.useEffect(() => {
    if (userProfile) {
      setProfileData(userProfile);
      setEditForm(userProfile);
    }
  }, [userProfile]);

  const handleCopyId = () => {
    navigator.clipboard?.writeText(profileData.userId);
    setCopiedId(true);
    onToast?.(`Copied User ID: ${profileData.userId}`);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleAvatarFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      onToast?.('⚠️ Please choose a valid image file');
      return;
    }

    try {
      const compressedDataUrl = await compressImage(file, {
        maxWidth: 512,
        maxHeight: 512,
        quality: 0.82,
      });
      setEditForm((prev) => ({ ...prev, avatar: compressedDataUrl }));
      onToast?.('📸 Profile photo selected!');
    } catch (err) {
      console.warn('Image compression fallback:', err);
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setEditForm((prev) => ({ ...prev, avatar: event.target.result }));
          onToast?.('📸 Profile photo selected!');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!editForm.name?.trim()) {
      onToast?.('⚠️ Name cannot be empty');
      return;
    }
    if (editForm.phone && editForm.phone.trim()) {
      const digits = editForm.phone.replace(/[^0-9]/g, '');
      if (digits.length === 8 || digits.length === 9 || (digits.length > 0 && digits.length < 10)) {
        onToast?.('❌ Wrong number! Please input correct 10-digit mobile number.');
        return;
      }
      if (digits.length === 10 && !/^[6-9]\d{9}$/.test(digits)) {
        onToast?.('❌ Wrong number! Please input correct 10-digit mobile number starting with 6, 7, 8, or 9.');
        return;
      }
    }
    if (editForm.dob && !isAtLeast18(editForm.dob)) {
      const currentAge = calculateAge(editForm.dob);
      onToast?.(`⚠️ You must be at least 18 years old. (Current age: ${currentAge} years)`);
      return;
    }

    const updated = {
      ...profileData,
      ...editForm,
      name: editForm.name.trim(),
      username: editForm.username?.trim().startsWith('@')
        ? editForm.username.trim()
        : `@${editForm.username?.trim() || 'user'}`,
    };

    setIsSavingProfile(true);
    setProfileData(updated);

    try {
      localStorage.setItem('connect_user_profile', JSON.stringify(updated));
    } catch (err) {}

    if (uid) {
      try {
        await saveUserProfile(uid, updated);
      } catch (err) {
        console.warn('saveUserProfile error:', err);
      }
    }

    setIsSavingProfile(false);
    onUpdateProfile?.(updated);
    setShowEditModal(false);
    onToast?.('🎉 Profile updated successfully!');
  };

  return (
    <div className="profile-screen">
      {/* ── 1. Top Header ── */}
      <header className="profile-header">
        <button
          className="profile-back-btn"
          onClick={onBack}
          aria-label="Back to Home"
          title="Back"
        >
          <ChevronLeft size={24} color="#fff" />
        </button>

        <div className="profile-brand-group">
          <img src={heartLogoImg} alt="CONNECT" className="profile-brand-logo" />
          <div className="profile-brand-text">
            <span className="profile-brand-name">CONNECT</span>
            <span className="profile-brand-sub">
              {t('profile_sub', 'My Profile')}
            </span>
          </div>
        </div>

        <div className="profile-header-actions">
          <div className="coin-wallet" onClick={onOpenWallet} title="Buy Coins">
            <span className="coin-wallet-icon">🪙</span>
            <span className="coin-wallet-balance">{coins.toLocaleString()}</span>
            <button
              className="coin-plus-btn"
              aria-label="Add Coins"
              onClick={(e) => {
                e.stopPropagation();
                onOpenWallet?.();
              }}
            >
              <Plus size={14} strokeWidth={3} />
            </button>
          </div>
          <button
            type="button"
            className="notif-btn"
            aria-label="Notifications"
            onClick={() => onToast?.('🔔 No new notifications')}
          >
            <Bell size={22} color="#c9b4d5" />
            <span className="notif-dot" />
          </button>
        </div>
      </header>

      {/* ── Scrollable Body ── */}
      <div className="profile-content">
        {/* ── 1. User Hero Card (Matches Reference Image) ── */}
        <div className="profile-hero-card">
          {/* Top-Right Gold Diamond VIP Header Badge */}
          <div
            className="profile-vip-header-badge"
            onClick={onOpenVip}
            title={activeVip?.active ? `${activeVip.planName} Active • Click for VIP Club` : 'VIP Club Details'}
          >
            <Crown size={14} color="#ffd700" fill="#ffd700" />
            <span>{activeVip?.active ? (activeVip.planName || 'Diamond VIP') : 'Diamond VIP'}</span>
          </div>

          <div
            className="profile-avatar-outer"
            onClick={() => {
              setEditForm({ ...profileData });
              setShowEditModal(true);
            }}
            style={{ cursor: 'pointer' }}
            title="Click to edit profile & photo"
          >
            <div className="profile-avatar-frame">
              <img
                src={profileData.avatar || '/default-avatars/1.png'}
                alt={profileData.name}
                className="profile-main-photo"
                onError={(e) => {
                  e.target.src = '/default-avatars/1.png';
                }}
              />
            </div>
            <button
              className="profile-camera-badge"
              onClick={(e) => {
                e.stopPropagation();
                setEditForm({ ...profileData });
                setShowEditModal(true);
              }}
              aria-label="Change photo"
              title="Change photo / Edit profile"
            >
              <Camera size={13} color="#fff" />
            </button>
          </div>

          <div className="profile-user-info">
            <div className="profile-name-row">
              <h2 className="profile-display-name">{profileData.name || 'CONNECT User'}</h2>
              <CheckCircle2 size={16} fill="#00e5ff" color="#fff" className="verified-badge-icon" />
            </div>
            <span className="profile-username-tag">
              {profileData.username?.startsWith('@') ? profileData.username : `@${profileData.username || 'user_connect'}`}
            </span>
            <div className="profile-dob-tag">
              <span>📅</span>
              <span>{formatDobDisplay(profileData.dob)}</span>
            </div>

            {/* Unique User ID with Copy Button & VIP status */}
            <div
              className={`profile-userid-chip ${activeVip?.active ? 'vip-active-chip' : ''}`}
              onClick={handleCopyId}
              title={activeVip?.active ? `${activeVip.planName} Active • Click to copy ID` : 'Click to copy ID'}
            >
              <span className="userid-label">{t('user_id', 'User ID:')}</span>
              <span className="userid-value">{profileData.userId || 'CN-0V64S1'}</span>
              {activeVip?.active && (
                <span className="userid-vip-tag">
                  <Crown size={9} color="#0a0112" fill="#0a0112" />
                  <span>VIP ACTIVE</span>
                </span>
              )}
              <button
                type="button"
                className="userid-copy-btn"
                aria-label="Copy User ID"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCopyId();
                }}
              >
                {copiedId ? <Check size={13} color="#4ade80" /> : <Copy size={13} color="#c9b4d5" />}
              </button>
            </div>
          </div>
        </div>

        {/* ── 2. VIP Membership Card ── */}
        <div
          className="profile-vip-banner-card"
          onClick={onOpenVip}
          style={{ cursor: 'pointer' }}
          title={activeVip?.active ? `${activeVip.planName} Active • Click to view VIP Membership` : 'Click to view VIP Membership plans'}
        >
          {/* Top-Right Ribbon Badge with 💎 */}
          <div className="vip-ribbon-badge" title="VIP Exclusive">
            <span className="vip-ribbon-icon">💎</span>
          </div>

          {/* Top Header Row: Crown + Plan Name + Status + Expiry */}
          <div className="vip-card-header-row">
            <div className="vip-circle-crown">
              <Crown size={24} color="#fff" />
            </div>
            <div className="vip-header-info">
              <div className="vip-header-title-badge">
                <h3 className="vip-card-title">{activeVip?.planName || 'Diamond VIP'}</h3>
                {activeVip?.active ? (
                  <span className="vip-status-pill activated">ACTIVATED</span>
                ) : (
                  <button
                    type="button"
                    className="vip-status-pill upgrade"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenVip?.();
                    }}
                  >
                    UPGRADE
                  </button>
                )}
              </div>
              <div className="vip-expiry-row">
                <Calendar size={12} color="#00e5ff" style={{ flexShrink: 0 }} />
                <span>Active till <strong>{activeVip?.expiryDate || '10 Dec 2028'}</strong></span>
              </div>
            </div>
          </div>

          {/* VIP Benefits Grid (Clean 2-Column Chips) */}
          <div className="vip-benefits-grid">
            <div className="vip-benefit-chip">
              <span className="vip-benefit-icon">🪙</span>
              <span>+{activeVip?.dailyBonusCoins || 1200} Daily Coins</span>
            </div>
            <div className="vip-benefit-chip">
              <span className="vip-benefit-icon">👑</span>
              <span>VIP Club Access</span>
            </div>
            <div className="vip-benefit-chip">
              <span className="vip-benefit-icon">🎁</span>
              <span>Free Daily Gifts</span>
            </div>
            <div className="vip-benefit-chip">
              <span className="vip-benefit-icon">⚡</span>
              <span>Priority Support</span>
            </div>
          </div>

          {/* Daily VIP Coins Benefit Claim Bar (When active) */}
          {activeVip?.active && (
            <div
              className="vip-claim-today-bar"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="vip-claim-today-left">
                <span className="vip-claim-title">🪙 Daily VIP Coins Benefit</span>
                <span className="vip-claim-sub">+{activeVip.dailyBonusCoins || 1200} Free Coins every day</span>
              </div>
              {isVipBonusClaimedToday ? (
                <span className="vip-claimed-badge">✓ Claimed Today</span>
              ) : (
                <button
                  type="button"
                  className="vip-collect-bonus-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClaimVipBonus();
                  }}
                  disabled={isClaimingVipBonus}
                >
                  {isClaimingVipBonus ? 'Claiming...' : `Collect +${activeVip.dailyBonusCoins || 1200}`}
                </button>
              )}
            </div>
          )}
        </div>

        {/* ── 3. Daily Login Rewards (7-Day Equal Width Grid) ── */}
        <ProfileDailyRewardCalendar
          uid={uid}
          onRewardClaimed={onRewardClaimed}
          onToast={onToast}
        />

        {/* ── 2. Statistics (3 Cards Row) ── */}
        <div className="profile-stats-grid">
          <div className="stat-card" onClick={() => setShowCallHistory(true)}>
            <div className="stat-icon-wrap phone">
              <PhoneCall size={18} />
            </div>
            <div className="stat-value">{totalCallsCount}</div>
            <div className="stat-label">{t('total_calls', 'Total Calls')}</div>
          </div>

          <div className="stat-card" onClick={() => onNavigateTab?.('stars')}>
            <div className="stat-icon-wrap heart">
              <Heart size={18} fill="#ff2a8d" color="#ff2a8d" />
            </div>
            <div className="stat-value">{favCount}</div>
            <div className="stat-label">{t('favorites', 'Favorites')}</div>
          </div>

          <div className="stat-card" onClick={() => setShowCallHistory(true)}>
            <div className="stat-icon-wrap clock">
              <Clock size={18} />
            </div>
            <div className="stat-value">{totalDurationFormatted}</div>
            <div className="stat-label">{t('call_history', 'Call History')}</div>
          </div>
        </div>

        {/* ── 3. Coin Wallet Quick Card ── */}
        <div className="profile-wallet-card" onClick={onOpenWallet}>
          <div className="p-wallet-left">
            <CoinStackGraphic size={58} />
          </div>
          <div className="p-wallet-mid">
            <div className="p-wallet-title">{t('current_balance', 'Current Balance')}</div>
            <div className="p-wallet-coins">
              {coins.toLocaleString()} <span>{t('coins', 'Coins')}</span>
            </div>
          </div>
          <div className="p-wallet-btn-group">
            <button
              type="button"
              className="p-wallet-claim-coins-btn"
              onClick={(e) => {
                e.stopPropagation();
                setShowClaimModal(true);
              }}
              title="Claim 500 Coins with code YASH"
            >
              🎁 Claim 500 Coins
            </button>
            <button
              type="button"
              className="p-wallet-buy-btn"
              onClick={(e) => {
                e.stopPropagation();
                onOpenWallet();
              }}
            >
              {t('buy_coins', 'Buy Coins')}
            </button>
          </div>
        </div>

        {/* ── 4. Profile Menu List ── */}
        <div className="profile-menu-container">
          {/* Claim Coins (Promo Code) Item */}
          <div className="profile-menu-item promo-claim-menu-item" onClick={() => setShowClaimModal(true)}>
            <div className="menu-icon-wrap promo-gift">
              <Gift size={18} color="#FFD700" />
            </div>
            <div className="menu-text-wrap">
              <span className="menu-item-title">Claim Coins (Promo Code)</span>
              <span className="menu-item-sub">Use secret code YASH to claim 500 Free Coins (Unlimited)</span>
            </div>
            <span className="promo-claim-pill">CLAIM 500</span>
            <ChevronRight size={18} className="menu-arrow" />
          </div>

          {/* VIP Membership Item */}
          <div className="profile-menu-item vip-highlight-item" onClick={onOpenVip}>
            <div className="menu-icon-wrap vip">
              <Crown size={18} color="#FFD700" />
            </div>
            <div className="menu-text-wrap">
              <span className="menu-item-title">{t('vip_membership', 'VIP Membership')}</span>
              <span className="menu-item-sub">
                {activeVip?.active
                  ? `👑 ${activeVip.planName} Active (Expires ${activeVip.expiryDate})`
                  : t('vip_membership_sub', 'Silver, Gold & Diamond plans')}
              </span>
            </div>
            <span className={`vip-badge-tag ${activeVip?.active ? 'active-gold' : ''}`}>
              {activeVip?.active ? 'ACTIVE' : 'VIP'}
            </span>
            <ChevronRight size={18} className="menu-arrow" />
          </div>

          {/* Edit Profile */}
          <div className="profile-menu-item" onClick={() => setShowEditModal(true)}>
            <div className="menu-icon-wrap edit">
              <Edit3 size={18} />
            </div>
            <div className="menu-text-wrap">
              <span className="menu-item-title">{t('edit_profile', 'Edit Profile')}</span>
              <span className="menu-item-sub">{t('edit_profile_sub', 'Name, username and details')}</span>
            </div>
            <ChevronRight size={18} className="menu-arrow" />
          </div>

          {/* Transactions */}
          <div className="profile-menu-item" onClick={() => setShowTransactions(true)}>
            <div className="menu-icon-wrap txn">
              <ArrowLeftRight size={18} />
            </div>
            <div className="menu-text-wrap">
              <span className="menu-item-title">{t('transactions', 'Transactions')}</span>
              <span className="menu-item-sub">{t('trans_sub', 'Coin recharge and call spend history')}</span>
            </div>
            <ChevronRight size={18} className="menu-arrow" />
          </div>

          {/* My Favorites */}
          <div className="profile-menu-item" onClick={() => onNavigateTab?.('stars')}>
            <div className="menu-icon-wrap fav">
              <Star size={18} fill="#FFD700" color="#FFD700" />
            </div>
            <div className="menu-text-wrap">
              <span className="menu-item-title">{t('favorites', 'My Favorites')}</span>
              <span className="menu-item-sub">{t('fav_sub', 'Starred hosts & experts')}</span>
            </div>
            <ChevronRight size={18} className="menu-arrow" />
          </div>

          {/* Call History */}
          <div className="profile-menu-item" onClick={() => setShowCallHistory(true)}>
            <div className="menu-icon-wrap hist">
              <Clock size={18} />
            </div>
            <div className="menu-text-wrap">
              <span className="menu-item-title">{t('call_history', 'Call History')}</span>
              <span className="menu-item-sub">{t('history_sub', 'Recent video and voice interactions')}</span>
            </div>
            <ChevronRight size={18} className="menu-arrow" />
          </div>

          {/* Language */}
          <div
            className="profile-menu-item"
            onClick={() => setShowLanguageModal(true)}
          >
            <div className="menu-icon-wrap lang">
              <Globe size={18} />
            </div>
            <div className="menu-text-wrap">
              <span className="menu-item-title">{t('language', 'Language')}</span>
              <span className="menu-item-sub">
                {currentLanguageMeta.flag} {currentLanguageMeta.native} ({currentLanguageMeta.name})
              </span>
            </div>
            <ChevronRight size={18} className="menu-arrow" />
          </div>

          {/* Help & Support */}
          <div className="profile-menu-item" onClick={() => setShowSupportModal(true)}>
            <div className="menu-icon-wrap help">
              <Headphones size={18} />
            </div>
            <div className="menu-text-wrap">
              <span className="menu-item-title">{t('support', 'Help & Support')}</span>
              <span className="menu-item-sub">{t('support_sub', '24/7 customer assistance')}</span>
            </div>
            <ChevronRight size={18} className="menu-arrow" />
          </div>

          {/* About CONNECT */}
          <div className="profile-menu-item" onClick={() => setShowAboutModal(true)}>
            <div className="menu-icon-wrap about">
              <Info size={18} />
            </div>
            <div className="menu-text-wrap">
              <span className="menu-item-title">{t('about', 'About CONNECT')}</span>
              <span className="menu-item-sub">{t('about_sub', 'Terms, privacy policy and version')}</span>
            </div>
            <ChevronRight size={18} className="menu-arrow" />
          </div>
        </div>

        {/* ── 5. Glowing Pink Logout Button ── */}
        <button className="profile-logout-btn" onClick={onLogout}>
          <LogOut size={18} />
          <span>{t('logout', 'Log Out')}</span>
        </button>
      </div>

      {/* ── 6. Bottom Navigation (4 items) ── */}
      <nav className="bottom-nav" aria-label="Bottom Navigation">
        {/* 1. Call */}
        <button className="bottom-nav-item" onClick={() => onNavigateTab?.('call')}>
          <Phone size={22} strokeWidth={1.8} />
          <span className="bottom-nav-label">{t('nav_call', 'Call')}</span>
        </button>

        {/* 2. Stars */}
        <button className="bottom-nav-item" onClick={() => onNavigateTab?.('stars')}>
          <Star size={22} strokeWidth={1.8} />
          <span className="bottom-nav-label">{t('nav_stars', 'Stars')}</span>
        </button>

        {/* 3. Wallet */}
        <button className="bottom-nav-item" onClick={onOpenWallet}>
          <Wallet size={22} strokeWidth={1.8} />
          <span className="bottom-nav-label">{t('nav_wallet', 'Wallet')}</span>
        </button>

        {/* 4. My Profile (Active highlighted pill) */}
        <button className="bottom-nav-item nav-active">
          <div className="bottom-nav-wallet-pill">
            <User size={20} strokeWidth={2} />
          </div>
          <span className="bottom-nav-label">{t('nav_profile', 'My Profile')}</span>
        </button>
      </nav>

      {/* ── Edit Profile Modal ── */}
      {showEditModal && (
        <div className="transactions-modal-overlay" role="dialog" aria-modal="true">
          <div className="transactions-modal-container" style={{ maxHeight: '90vh' }}>
            <div className="transactions-modal-header">
              <h2 className="txn-modal-title">Edit Profile</h2>
              <button
                className="txn-back-btn"
                onClick={() => setShowEditModal(false)}
                aria-label="Close"
              >
                <X size={18} color="#fff" />
              </button>
            </div>

            <form
              onSubmit={handleSaveProfile}
              className="auth-form"
              style={{ marginTop: 10, overflowY: 'auto', maxHeight: 'calc(90vh - 90px)', paddingRight: 4 }}
            >
              {/* Profile Photo / Avatar Picker */}
              <div className="set-profile-avatar-section" style={{ marginBottom: 18 }}>
                <label className="edit-label">Profile Photo</label>
                <div className="set-avatar-center-wrap">
                  <div
                    className="set-avatar-preview-circle"
                    onClick={() => editFileInputRef.current?.click()}
                    title="Click to choose photo from gallery"
                    style={{ cursor: 'pointer' }}
                  >
                    <img
                      src={editForm.avatar || profileData.avatar || '/default-avatars/1.png'}
                      alt="Avatar"
                      className="set-avatar-img"
                      onError={(e) => {
                        e.target.src = '/default-avatars/1.png';
                      }}
                    />
                    <div className="set-avatar-cam-badge">
                      <Camera size={16} color="#fff" />
                    </div>
                  </div>

                  <input
                    type="file"
                    ref={editFileInputRef}
                    onChange={handleAvatarFileChange}
                    accept="image/*"
                    style={{ display: 'none' }}
                  />
                  <button
                    type="button"
                    className="set-upload-gallery-btn"
                    onClick={() => editFileInputRef.current?.click()}
                  >
                    <Upload size={14} />
                    <span>Choose from Gallery</span>
                  </button>
                </div>

                {/* Default Avatars Carousel */}
                <div className="set-default-avatars-wrap" style={{ marginTop: 12 }}>
                  <span className="set-default-avatars-label">Or choose an avatar:</span>
                  <div className="set-default-avatars-scroll">
                    {DEFAULT_AVATARS.map((av) => {
                      const isSelected = (editForm.avatar || profileData.avatar) === av.url;
                      return (
                        <div
                          key={av.id}
                          className={`set-default-avatar-chip ${isSelected ? 'selected' : ''}`}
                          onClick={() => setEditForm((prev) => ({ ...prev, avatar: av.url }))}
                          title={av.label}
                        >
                          <img
                            src={av.url}
                            alt={av.label}
                            className="set-chip-img"
                            onError={(e) => {
                              e.target.src = '/default-avatars/1.png';
                            }}
                          />
                          {isSelected && (
                            <div className="set-chip-check">
                              <Check size={11} color="#fff" strokeWidth={3} />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="edit-field-group">
                <label className="edit-label">Full Name</label>
                <input
                  type="text"
                  value={editForm.name || ''}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="auth-input edit-box"
                  placeholder="Your Name"
                  required
                />
              </div>

              <div className="edit-field-group">
                <label className="edit-label">Username</label>
                <input
                  type="text"
                  value={editForm.username || ''}
                  onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                  className="auth-input edit-box"
                  placeholder="@username"
                  required
                />
              </div>

              <div className="edit-field-group">
                <label className="edit-label">Mobile Number</label>
                <input
                  type="text"
                  value={editForm.phone || ''}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="auth-input edit-box"
                  placeholder="+91..."
                />
                {editForm.phone && (() => {
                  const digits = editForm.phone.replace(/[^0-9]/g, '');
                  if (digits.length >= 7 && digits.length <= 9) {
                    return (
                      <span style={{ fontSize: 11, color: '#ff4d6d', marginTop: 4, display: 'block', fontWeight: 600 }}>
                        ⚠️ Wrong number ({digits.length}/10 digits). Please input 10-digit mobile number.
                      </span>
                    );
                  }
                  return null;
                })()}
              </div>

              <div className="edit-field-group">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <label className="edit-label" style={{ marginBottom: 0 }}>Date of Birth</label>
                  <span style={{ fontSize: 10, fontWeight: 800, color: '#ff2a8d', background: 'rgba(255, 42, 141, 0.15)', padding: '2px 7px', borderRadius: 9999, border: '1px solid rgba(255, 42, 141, 0.4)' }}>
                    18+ ONLY
                  </span>
                </div>
                <input
                  type="date"
                  value={editForm.dob || '2000-01-01'}
                  onChange={(e) => setEditForm({ ...editForm, dob: e.target.value })}
                  className="auth-input edit-box"
                  max={getMaxDobFor18Plus()}
                  required
                />
                {editForm.dob && !isAtLeast18(editForm.dob) ? (
                  <span style={{ fontSize: 11, color: '#ff4d6d', marginTop: 4, display: 'block', fontWeight: 700 }}>
                    ❌ Must be 18+ years old (Current age: {calculateAge(editForm.dob)} years)
                  </span>
                ) : (
                  <span style={{ fontSize: 11, color: '#c9b4d5', marginTop: 4, display: 'block' }}>
                    🔞 Age must be 18 years or older
                  </span>
                )}
              </div>

              <button
                type="submit"
                className="txn-close-btn"
                style={{ marginTop: 14 }}
                disabled={isSavingProfile}
              >
                {isSavingProfile ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Call History Modal ── */}
      {showCallHistory && (
        <div className="transactions-modal-overlay" role="dialog" aria-modal="true">
          <div className="transactions-modal-container">
            <div className="transactions-modal-header">
              <h2 className="txn-modal-title">Recent Call History</h2>
              <button
                className="txn-back-btn"
                onClick={() => setShowCallHistory(false)}
                aria-label="Close"
              >
                <X size={18} color="#fff" />
              </button>
            </div>

            <div className="txn-list" style={{ marginTop: 8 }}>
              {isLoadingCalls ? (
                <div style={{ padding: '32px 16px', textAlign: 'center', color: '#c9b4d5' }}>
                  Loading call history...
                </div>
              ) : callHistory.length === 0 ? (
                <div style={{ padding: '40px 16px', textAlign: 'center', color: '#c9b4d5' }}>
                  <div style={{ fontSize: 15, fontWeight: 500, color: '#f3e8ff', marginBottom: 4 }}>
                    No call history yet.
                  </div>
                  <div style={{ fontSize: 13, opacity: 0.7 }}>
                    Your video and voice calls will appear here.
                  </div>
                </div>
              ) : (
                callHistory.map((call, idx) => (
                  <div key={idx} className="txn-card">
                    <div className="txn-card-left">
                      <div className="txn-icon-wrap debit">
                        <PhoneCall size={16} />
                      </div>
                      <div className="txn-details">
                        <div className="txn-title">
                          {call.name} • {call.type} Call
                        </div>
                        <div className="txn-date">
                          {call.time} ({call.duration})
                        </div>
                      </div>
                    </div>
                    <div className="txn-card-right">
                      <div className="txn-coins debit">-{call.coins} Coins</div>
                      <span className="txn-status-badge">Completed</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <button className="txn-close-btn" onClick={() => setShowCallHistory(false)}>
              Done
            </button>
          </div>
        </div>
      )}

      {/* ── Transactions History Modal ── */}
      {showTransactions && (
        <TransactionsModal uid={uid} coins={coins} onClose={() => setShowTransactions(false)} />
      )}

      {/* ── Help & Support Modal ── */}
      {showSupportModal && (
        <div className="transactions-modal-overlay" role="dialog" aria-modal="true">
          <div className="transactions-modal-container">
            <div className="transactions-modal-header">
              <h2 className="txn-modal-title">Help &amp; Support</h2>
              <button
                className="txn-back-btn"
                onClick={() => setShowSupportModal(false)}
                aria-label="Close"
              >
                <X size={18} color="#fff" />
              </button>
            </div>
            <div style={{ padding: '10px 4px', color: '#eeddf8', fontSize: 13.5, lineHeight: 1.6 }}>
              <p>💬 <strong>24/7 Live Chat Support</strong> is active for all verified and VIP members.</p>
              <p style={{ marginTop: 10 }}>📧 <strong>Email:</strong> support@sanskrutiservice.in</p>
              <p style={{ marginTop: 10 }}>🛡️ All calls and interactions are 100% private, peer-to-peer encrypted, and secure.</p>
            </div>
            <button className="txn-close-btn" style={{ marginTop: 16 }} onClick={() => setShowSupportModal(false)}>
              Close
            </button>
          </div>
        </div>
      )}

      {/* ── About CONNECT Modal ── */}
      {showAboutModal && (
        <div className="transactions-modal-overlay" role="dialog" aria-modal="true">
          <div className="transactions-modal-container">
            <div className="transactions-modal-header">
              <h2 className="txn-modal-title">About CONNECT</h2>
              <button
                className="txn-back-btn"
                onClick={() => setShowAboutModal(false)}
                aria-label="Close"
              >
                <X size={18} color="#fff" />
              </button>
            </div>
            <div style={{ textAlign: 'center', padding: '16px 8px' }}>
              <img src={heartLogoImg} alt="CONNECT" style={{ width: 54, marginBottom: 10 }} />
              <h3 style={{ fontSize: 18, color: '#fff', fontWeight: 800 }}>CONNECT App</h3>
              <p style={{ color: '#ff2a8d', fontSize: 13, marginTop: 4 }}>Live Video &amp; Voice Connection</p>
              <p style={{ color: '#9f8aa8', fontSize: 12, marginTop: 12 }}>Version 2.4.0 (Build 2026.11)</p>
              <p style={{ color: '#c9b4d5', fontSize: 12, marginTop: 8 }}>Domain: connect.sanskrutiservice.in</p>
            </div>
            <button className="txn-close-btn" onClick={() => setShowAboutModal(false)}>
              Got it
            </button>
          </div>
        </div>
      )}

      {/* ── Language Selection Modal ── */}
      {showLanguageModal && (
        <LanguageModal
          onClose={() => setShowLanguageModal(false)}
          onToast={onToast}
        />
      )}

      {/* ── Claim Coins / Redeem Promo Code Modal ── */}
      {showClaimModal && (
        <div className="transactions-modal-overlay" role="dialog" aria-modal="true" onClick={() => setShowClaimModal(false)}>
          <div className="transactions-modal-container claim-coins-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="transactions-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 22 }}>🎁</span>
                <h2 className="txn-modal-title">Claim Free Coins</h2>
              </div>
              <button
                className="txn-back-btn"
                onClick={() => setShowClaimModal(false)}
                aria-label="Close"
              >
                <X size={18} color="#fff" />
              </button>
            </div>

            <div className="claim-coins-modal-body">
              <div className="claim-coins-icon-circle">
                <span className="claim-coins-emoji">🪙</span>
              </div>
              <h3 className="claim-coins-heading">Redeem Bonus Coins</h3>
              <p className="claim-coins-sub">
                Enter your secret promo code below to instantly get free coins added to your wallet!
              </p>

              <div className="claim-input-wrapper">
                <input
                  type="text"
                  className="claim-promo-input"
                  placeholder="Enter Code (e.g. YASH)"
                  value={promoCodeInput}
                  onChange={(e) => setPromoCodeInput(e.target.value.toUpperCase().trim())}
                  maxLength={15}
                  autoFocus
                />
              </div>

              <div className="claim-code-hint">
                <Sparkles size={14} color="#ffd700" />
                <span>Tip: Use secret code <strong>YASH</strong> for 500 Free Coins! (Unlimited)</span>
              </div>

              <button
                type="button"
                className="claim-submit-btn"
                disabled={isRedeeming || !promoCodeInput.trim()}
                onClick={async () => {
                  const code = promoCodeInput.trim().toUpperCase();
                  if (!code) {
                    onToast?.('Please enter a valid code');
                    return;
                  }
                  setIsRedeeming(true);
                  try {
                    if (code === 'YASH') {
                      let finalBal = (typeof coins === 'number' ? coins : 0) + 500;
                      if (uid) {
                        try {
                          const res = await redeemPromoCode(uid, code, coins);
                          if (typeof res?.newBalance === 'number') {
                            finalBal = res.newBalance;
                          }
                        } catch (apiErr) {
                          console.warn('redeem promo server sync warning:', apiErr);
                        }
                      }
                      onRewardClaimed?.(500, finalBal);
                      onToast?.(`🎉 Success! 500 Coins added to your account with code YASH!`);
                      setShowClaimModal(false);
                      setPromoCodeInput('');
                    } else {
                      onToast?.('❌ Invalid code! Please enter correct code.');
                    }
                  } catch (err) {
                    onToast?.(err.message || 'Failed to redeem code.');
                  } finally {
                    setIsRedeeming(false);
                  }
                }}
              >
                {isRedeeming ? 'Claiming 500 Coins...' : 'Claim 500 Coins Now ⚡'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

