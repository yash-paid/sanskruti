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
} from 'lucide-react';
import { CoinStackGraphic } from './CoinGraphic';
import TransactionsModal from './TransactionsModal';
import LanguageModal from './LanguageModal';
import ProfileDailyRewardCalendar from './ProfileDailyRewardCalendar';
import { calculateAge, getMaxDobFor18Plus, isAtLeast18 } from '../utils/dateUtils';
import { useLanguage } from '../context/LanguageContext';
import heartLogoImg from '../../assets/images/heart-logo-transparent.png';
import { DEFAULT_AVATARS } from '../data/defaultAvatars';
import { fetchUserCallHistory, fetchUserVipEntitlement, saveUserProfile } from '../firebase/userService';

export default function ProfileScreen({
  coins = 0,
  userProfile,
  uid,
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

  const [callHistory, setCallHistory] = useState([]);
  const [isLoadingCalls, setIsLoadingCalls] = useState(false);
  const [activeVip, setActiveVip] = useState(null);

  React.useEffect(() => {
    let isMounted = true;
    if (uid) {
      setIsLoadingCalls(true);
      fetchUserCallHistory(uid)
        .then((calls) => {
          if (isMounted) {
            setCallHistory(calls || []);
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
          } else if (isMounted) {
            setActiveVip(null);
          }
        })
        .catch(() => {});
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

  const favCount = (() => {
    try {
      const favs = JSON.parse(localStorage.getItem('connect_favourites') || '[]');
      return Array.isArray(favs) ? favs.length : 0;
    } catch (e) {
      return 0;
    }
  })();

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

  const handleAvatarFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      onToast?.('⚠️ Please choose a valid image file');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      onToast?.('⚠️ Image size should be under 8MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setEditForm((prev) => ({ ...prev, avatar: event.target.result }));
        onToast?.('📸 Profile photo selected!');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!editForm.name?.trim()) {
      onToast?.('⚠️ Name cannot be empty');
      return;
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
              <em>{t('profile_sub', 'My Profile')}</em>
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
        {/* ── 1. User Hero Card ── */}
        <div className="profile-hero-card">
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
              <Camera size={14} color="#fff" />
            </button>
          </div>

          <div className="profile-user-info">
            <div className="profile-name-row">
              <h2 className="profile-display-name">{profileData.name}</h2>
              <CheckCircle2 size={16} fill="#2196f3" color="#fff" className="verified-badge-icon" />
            </div>
            <span className="profile-username-tag">{profileData.username}</span>
            {profileData.dob && (
              <span className="profile-dob-tag">
                🎂 {new Date(profileData.dob).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            )}


            {/* Unique User ID with Copy Button */}
            <div className="profile-userid-chip" onClick={handleCopyId} title="Click to copy ID">
              <span className="userid-label">{t('user_id', 'User ID:')}</span>
              <span className="userid-value">{profileData.userId}</span>
              <button
                type="button"
                className="userid-copy-btn"
                aria-label="Copy User ID"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCopyId();
                }}
              >
                {copiedId ? <Check size={14} color="#4ade80" /> : <Copy size={14} color="#c9b4d5" />}
              </button>
            </div>
          </div>
        </div>

        {/* ── Prominent VIP Membership Banner / Button ── */}
        <div className="profile-vip-banner-card" onClick={onOpenVip}>
          <div className="vip-banner-left">
            <div className="vip-crown-icon-wrap">
              <Crown size={22} color="#FFD700" />
            </div>
            <div className="vip-banner-text">
              <div className="vip-banner-title-row">
                <span className="vip-banner-title">{activeVip ? activeVip.planName : t('vip_membership', 'VIP Membership')}</span>
                <span className="vip-exclusive-pill">{activeVip ? 'ACTIVE' : 'EXCLUSIVE'}</span>
              </div>
              <p className="vip-banner-subtitle">
                {activeVip
                  ? `Valid until ${activeVip.expiryDate} • Priority Visibility & Daily Bonus Active`
                  : 'No active membership • Priority calls, 10% bonus coins & weekly deals'}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="vip-view-btn"
            onClick={(e) => {
              e.stopPropagation();
              onOpenVip?.();
            }}
          >
            <span>{activeVip ? 'View Plan' : t('upgrade_btn', 'Upgrade')}</span>
            <ChevronRight size={16} />
          </button>
        </div>

        {/* ── 1.5 7-Day Daily Login Reward Calendar (PART 2) ── */}
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

        {/* ── 4. Profile Menu List ── */}
        <div className="profile-menu-container">
          {/* VIP Membership Item */}
          <div className="profile-menu-item vip-highlight-item" onClick={onOpenVip}>
            <div className="menu-icon-wrap vip">
              <Crown size={18} color="#FFD700" />
            </div>
            <div className="menu-text-wrap">
              <span className="menu-item-title">{t('vip_membership', 'VIP Membership')}</span>
              <span className="menu-item-sub">{t('vip_membership_sub', 'Silver, Gold & Diamond plans')}</span>
            </div>
            <span className="vip-badge-tag">VIP</span>
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
        <TransactionsModal uid={uid} onClose={() => setShowTransactions(false)} />
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
    </div>
  );
}

