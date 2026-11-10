import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Bell,
  Plus,
  ArrowLeftRight,
  Phone,
  Star,
  Wallet,
  User,
  Check,
  Crown,
} from 'lucide-react';
import {
  COIN_PACKAGES,
  getPurchasedPackIds,
  markPackAsPurchased,
} from '../data/packages';
import { CoinStackGraphic } from './CoinGraphic';
import TransactionsModal from './TransactionsModal';
import LoginRequiredModal from './LoginRequiredModal';
import heartLogoImg from '../../assets/images/heart-logo-transparent.png';
import { useLanguage } from '../context/LanguageContext';

export default function WalletScreen({
  coins = 0,
  userProfile,
  uid,
  isGuest = false,
  onBack,
  onNavigateTab,
  onOpenVip,
  onAddCoins,
  onInitiateRecharge,
  onRequireLogin,
  onGoogleLogin,
  onToast,
}) {
  const { t } = useLanguage();
  const [purchasedPackIds, setPurchasedPackIds] = useState(getPurchasedPackIds);

  useEffect(() => {
    const handleSync = () => {
      setPurchasedPackIds(getPurchasedPackIds());
    };
    window.addEventListener('connect_purchased_packs_updated', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('connect_purchased_packs_updated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  const availablePacks = COIN_PACKAGES.filter(
    (p) => !purchasedPackIds.includes(p.id)
  );

  const [selectedPackId, setSelectedPackId] = useState(() => {
    return availablePacks.find((p) => p.isPopular)?.id || availablePacks[0]?.id || 'pack-99';
  });
  const [showTransactions, setShowTransactions] = useState(false);
  const [showLoginRequired, setShowLoginRequired] = useState(false);

  // Sync selected pack if the selected one gets purchased
  useEffect(() => {
    if (availablePacks.length > 0 && !availablePacks.some((p) => p.id === selectedPackId)) {
      const nextPack = availablePacks.find((p) => p.isPopular) || availablePacks[0];
      setSelectedPackId(nextPack?.id || '');
    }
  }, [availablePacks, selectedPackId]);

  const handleSelectPack = (pkg) => {
    setSelectedPackId(pkg.id);
    onToast?.(`Selected ${pkg.coins} Coins Pack for ₹${pkg.price}`);
  };

  const handleBuyPack = async (e, pkg) => {
    e?.stopPropagation?.();
    if (isGuest) {
      setShowLoginRequired(true);
      return;
    }
    setSelectedPackId(pkg.id);
    if (onInitiateRecharge) {
      try {
        await onInitiateRecharge(pkg);
      } catch (err) {
        onToast?.(err.message || 'Payment initiation failed.');
      }
    } else {
      markPackAsPurchased(pkg.id);
      setPurchasedPackIds(getPurchasedPackIds());
      onAddCoins?.(pkg.coins);
      onToast?.(`🎉 Success! Added ${pkg.coins} Coins to your balance.`);
    }
  };

  return (
    <div className="wallet-screen">
      {/* ── 1. Top Header ── */}
      <header className="wallet-header">
        <button
          className="wallet-back-btn"
          onClick={onBack}
          aria-label="Back to Home"
          title="Back"
        >
          <ChevronLeft size={24} color="#fff" />
        </button>

        <div className="wallet-brand-group">
          <img src={heartLogoImg} alt="CONNECT" className="wallet-brand-logo" />
          <div className="wallet-brand-text">
            <span className="wallet-brand-name">CONNECT</span>
            <span className="wallet-brand-sub">
              {t('wallet_sub', 'Wallet • Buy Coins')}
            </span>
          </div>
        </div>

        <div className="wallet-header-actions">
          <div
            className="coin-wallet"
            onClick={() => {
              const el = document.querySelector('.coin-packages-grid');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
            title="Coin Balance"
          >
            <span className="coin-wallet-icon">🪙</span>
            <span className="coin-wallet-balance">{coins.toLocaleString()}</span>
            <button
              className="coin-plus-btn"
              aria-label="View Packages"
              onClick={(e) => {
                e.stopPropagation();
                const el = document.querySelector('.coin-packages-grid');
                el?.scrollIntoView({ behavior: 'smooth' });
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
      <div className="wallet-content">
        {/* ── Subheader Action Row: Transactions Button & User Avatar ── */}
        <div className="wallet-sub-row">
          <button
            className="btn-transactions-pill"
            onClick={() => setShowTransactions(true)}
          >
            <ArrowLeftRight size={17} className="txn-arrow-icon" />
            <span>{t('transactions', 'Transactions')}</span>
          </button>

          <div
            className="wallet-user-avatar-wrap"
            title="User Profile"
            onClick={() => onNavigateTab?.('profile')}
          >
            <img
              src={userProfile?.avatar || '/default-avatars/1.png'}
              alt={userProfile?.name || 'User Avatar'}
              className="wallet-user-avatar"
              onError={(e) => {
                e.target.src = '/default-avatars/1.png';
              }}
            />
            <div className="wallet-avatar-badge" aria-hidden="true">
              <span className="mini-bars">≡</span>
            </div>
          </div>
        </div>

        {/* ── 2. Wallet Balance Card ── */}
        <div className="wallet-balance-card">
          <div className="wallet-balance-left">
            <CoinStackGraphic size={96} isLarge={true} />
          </div>
          <div className="wallet-balance-right">
            <div className="wallet-balance-title">{t('your_balance', 'Your Coin Balance')}</div>
            <div className="wallet-balance-amount">
              {coins.toLocaleString()} <span>{t('coins', 'Coins')}</span>
            </div>
          </div>
          <div className="balance-card-glow" aria-hidden="true" />
        </div>

        {/* ── VIP Membership Shortcut Card ── */}
        <div
          className="wallet-vip-shortcut-card"
          onClick={() => {
            if (isGuest) {
              setShowLoginRequired(true);
              return;
            }
            onOpenVip?.();
          }}
        >
          <div className="w-vip-left">
            <div className="w-vip-crown-badge">
              <Crown size={22} color="#FFD700" />
            </div>
            <div className="w-vip-text">
              <div className="w-vip-title-row">
                <span className="w-vip-title">{t('vip_shortcut_title', 'VIP Membership')}</span>
                <span className="w-vip-badge-pill">{t('vip_shortcut_pill', 'UP TO 1,200 COINS/DAY')}</span>
              </div>
              <p className="w-vip-sub">
                {t('vip_shortcut_sub', 'Get up to 1,200 free daily coins + 10% bonus on all recharges')}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="w-vip-view-btn"
            onClick={(e) => {
              e.stopPropagation();
              if (isGuest) {
                setShowLoginRequired(true);
                return;
              }
              onOpenVip?.();
            }}
          >
            <span>{t('upgrade_btn', 'Upgrade')}</span>
            <ChevronRight size={16} />
          </button>
        </div>

        {/* ── 3. Coin Packages Grid (3 columns) ── */}
        <div className="coin-packages-grid">
          {availablePacks.length === 0 ? (
            <div
              className="no-packs-msg"
              style={{
                gridColumn: '1 / -1',
                textAlign: 'center',
                padding: '40px 16px',
                color: '#c9b4d5',
                fontSize: '14px',
              }}
            >
              {t(
                'all_packs_purchased',
                'All special one-time coin packs have been purchased!'
              )}
            </div>
          ) : (
            availablePacks.map((pkg) => {
              const isSelected = selectedPackId === pkg.id;
              const isPopular = pkg.isPopular;

              return (
                <div
                  key={pkg.id}
                  className={`coin-pack-card ${isSelected ? 'selected' : ''} ${pkg.badgeType ? `has-badge ${pkg.badgeType}` : ''
                    }`}
                  onClick={() => handleSelectPack(pkg)}
                >
                  {/* Floating Badge (e.g. Most Popular / Value Pack) */}
                  {pkg.badge && (
                    <div className={`floating-pack-badge ${pkg.badgeType}`}>
                      {pkg.badge === 'Most Popular'
                        ? t('most_popular_badge', 'Most Popular')
                        : pkg.badge}
                    </div>
                  )}

                  {/* Lavender / Pink Extra Coins Header Banner */}
                  {pkg.extraText ? (
                    <div className="pack-header-banner">
                      {pkg.extraText.replace(
                        'Extra Coins',
                        t('extra_coins', 'Extra Coins')
                      )}
                    </div>
                  ) : (
                    <div className="pack-header-banner empty" />
                  )}

                  {/* Center Coin Stack */}
                  <div className="pack-coin-visual">
                    <CoinStackGraphic size={48} />
                  </div>

                  {/* Coins Display */}
                  <div className="pack-coins-row">
                    {pkg.originalCoins ? (
                      <>
                        <span className="pack-orig-coins">{pkg.originalCoins}</span>
                        <span className="pack-current-coins">{pkg.coins}</span>
                      </>
                    ) : (
                      <span className="pack-single-coins">
                        {pkg.coins} {t('coins', 'Coins')}
                      </span>
                    )}
                  </div>

                  {/* Price Button / Pill */}
                  <button
                    type="button"
                    className={`pack-price-btn ${isPopular ? 'popular-pill' : ''
                      } ${isSelected ? 'active-buy' : ''}`}
                    onClick={(e) => handleBuyPack(e, pkg)}
                    title={`Buy for ₹${pkg.price}`}
                  >
                    ₹{pkg.price.toLocaleString()}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── 5. Bottom Navigation (4 items: Call, Stars, Wallet, My Profile) ── */}
      <nav className="bottom-nav" aria-label="Bottom Navigation">
        {/* 1. Call */}
        <button
          className="bottom-nav-item"
          onClick={() => onNavigateTab?.('call')}
        >
          <Phone size={22} strokeWidth={1.8} />
          <span className="bottom-nav-label">{t('nav_call', 'Call')}</span>
        </button>

        {/* 2. Stars */}
        <button
          className="bottom-nav-item"
          onClick={() => onNavigateTab?.('stars')}
        >
          <Star size={22} strokeWidth={1.8} />
          <span className="bottom-nav-label">{t('nav_stars', 'Stars')}</span>
        </button>

        {/* 3. Wallet (Active highlighted pill) */}
        <button className="bottom-nav-item nav-active">
          <div className="bottom-nav-wallet-pill">
            <Wallet size={20} strokeWidth={2} />
          </div>
          <span className="bottom-nav-label">{t('nav_wallet', 'Wallet')}</span>
        </button>

        {/* 4. My Profile */}
        <button
          className="bottom-nav-item"
          onClick={() => onNavigateTab?.('profile')}
        >
          <User size={22} strokeWidth={1.8} />
          <span className="bottom-nav-label">{t('nav_profile', 'My Profile')}</span>
        </button>
      </nav>

      {/* ── 4. Transactions Modal Screen ── */}
      {showTransactions && (
        <TransactionsModal uid={uid} coins={coins} onClose={() => setShowTransactions(false)} />
      )}

      {/* ── Login Required Modal for Guests ── */}
      {showLoginRequired && (
        <LoginRequiredModal
          actionType="recharge"
          onClose={() => setShowLoginRequired(false)}
          onGoToAuth={(mode) => {
            setShowLoginRequired(false);
            onRequireLogin?.(mode);
          }}
          onGoogleLogin={() => {
            setShowLoginRequired(false);
            onGoogleLogin?.();
          }}
        />
      )}
    </div>
  );
}

