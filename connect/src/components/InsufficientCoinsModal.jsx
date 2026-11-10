import React, { useState, useEffect } from 'react';
import { X, Wallet, ArrowRight } from 'lucide-react';
import { CoinStackGraphic } from './CoinGraphic';
import { useLanguage } from '../context/LanguageContext';
import {
  COIN_PACKAGES,
  getPurchasedPackIds,
  markPackAsPurchased,
  ONE_TIME_PURCHASE_PACK_IDS,
} from '../data/packages';
import { fetchUserPurchasedPacks } from '../firebase/userService';

// Graphic matching the reference image: gold coins stack + sparkles + pink exclamation badge
function CoinWarningIllustration() {
  return (
    <div className="insufficient-illustration-wrap">
      <svg
        width="130"
        height="76"
        viewBox="0 0 130 76"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="insufficient-coins-svg"
      >
        <defs>
          <linearGradient id="ic-gold-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFF4B8" />
            <stop offset="30%" stopColor="#FFD54F" />
            <stop offset="70%" stopColor="#FFA000" />
            <stop offset="100%" stopColor="#FF6F00" />
          </linearGradient>
          <linearGradient id="ic-gold-edge" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFA000" />
            <stop offset="100%" stopColor="#C43E00" />
          </linearGradient>
          <linearGradient id="ic-gold-top" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFF9C4" />
            <stop offset="50%" stopColor="#FFD54F" />
            <stop offset="100%" stopColor="#FFB300" />
          </linearGradient>
          <linearGradient id="ic-alert-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ff4099" />
            <stop offset="50%" stopColor="#ff006e" />
            <stop offset="100%" stopColor="#c50050" />
          </linearGradient>
          <filter id="ic-alert-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* ── Left Sparkle ── */}
        <path
          d="M32 16 Q32 23 25 23 Q32 23 32 30 Q32 23 39 23 Q32 23 32 16 Z"
          fill="#FFD700"
          opacity="0.9"
        />

        {/* ── Right Sparkle ── */}
        <path
          d="M98 12 Q98 18 92 18 Q98 18 98 24 Q98 18 104 18 Q98 18 98 12 Z"
          fill="#FFD700"
          opacity="0.9"
        />

        {/* ── Gold Coin Stack ── */}
        {/* Coin 1 Bottom */}
        <ellipse cx="56" cy="58" rx="28" ry="10" fill="url(#ic-gold-edge)" />
        <ellipse cx="56" cy="54" rx="28" ry="10" fill="url(#ic-gold-grad)" />

        {/* Coin 2 Mid */}
        <ellipse cx="56" cy="48" rx="28" ry="10" fill="url(#ic-gold-edge)" />
        <ellipse cx="56" cy="44" rx="28" ry="10" fill="url(#ic-gold-grad)" />

        {/* Coin 3 Top Standing Angle */}
        <g transform="translate(64, 18) rotate(16)">
          <ellipse cx="18" cy="18" rx="19" ry="21" fill="url(#ic-gold-edge)" />
          <ellipse cx="19" cy="17" rx="17" ry="19" fill="url(#ic-gold-top)" stroke="#FFFDE7" strokeWidth="1.2" />
          <path
            d="M19 12 L21 16 L25 17 L22 20 L23 24 L19 21 L15 24 L16 20 L13 17 L17 16 Z"
            fill="#FFA000"
            opacity="0.75"
          />
        </g>

        {/* Coin 4 Front Left */}
        <ellipse cx="50" cy="38" rx="26" ry="9.5" fill="url(#ic-gold-edge)" />
        <ellipse cx="50" cy="34" rx="26" ry="9.5" fill="url(#ic-gold-grad)" stroke="#FFF9C4" strokeWidth="1" />

        {/* ── Exclamation Mark Badge on Front Right ── */}
        <g filter="url(#ic-alert-glow)">
          <circle cx="86" cy="44" r="15" fill="url(#ic-alert-grad)" stroke="#ffffff" strokeWidth="2.5" />
          {/* Exclamation Bar */}
          <line x1="86" y1="35.5" x2="86" y2="43.5" stroke="#ffffff" strokeWidth="3.2" strokeLinecap="round" />
          {/* Exclamation Dot */}
          <circle cx="86" cy="49" r="1.8" fill="#ffffff" />
        </g>
      </svg>
    </div>
  );
}

export default function InsufficientCoinsModal({
  coins = 0,
  expert,
  userProfile,
  onClose,
  onProceedPay,
  onToast,
}) {
  const { t } = useLanguage();

  // Track purchased pack IDs
  const [purchasedPackIds, setPurchasedPackIds] = useState(getPurchasedPackIds);

  const activeUid = userProfile?.uid || null;

  useEffect(() => {
    let isMounted = true;
    if (activeUid) {
      fetchUserPurchasedPacks(activeUid)
        .then((packs) => {
          if (isMounted && Array.isArray(packs) && packs.length > 0) {
            setPurchasedPackIds(packs);
          }
        })
        .catch(() => {});
    }

    const handleSync = (e) => {
      if (e?.detail?.all) {
        setPurchasedPackIds(e.detail.all);
      } else {
        setPurchasedPackIds(getPurchasedPackIds());
      }
    };
    window.addEventListener('connect_purchased_packs_updated', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      isMounted = false;
      window.removeEventListener('connect_purchased_packs_updated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, [activeUid]);

  // Filter out any packs that have already been purchased and take the next 3 available packs
  // Strictly: only 19, 49, 99 disappear after purchase. All other packs (149, 199, 499, 999...) remain permanently visible.
  let availablePacks = COIN_PACKAGES.filter(
    (p) => !purchasedPackIds.includes(p.id)
  ).slice(0, 3);

  // Fallback safeguard: If all 3 one-time packs were purchased or availablePacks is empty,
  // show the recurring recharge packs (₹149, ₹199, ₹499, etc.)
  if (availablePacks.length === 0) {
    availablePacks = COIN_PACKAGES.filter(
      (p) => !ONE_TIME_PURCHASE_PACK_IDS.includes(p.id)
    ).slice(0, 3);
  }

  // Safety fallback: NEVER show an empty list
  if (availablePacks.length === 0) {
    availablePacks = COIN_PACKAGES.slice(0, 3);
  }

  // Compute default selection: popular pack if available, or first pack
  const defaultPackId =
    availablePacks.find((p) => p.isPopular)?.id ||
    availablePacks[0]?.id ||
    '';

  const [selectedPackId, setSelectedPackId] = useState(defaultPackId);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Keep selected pack valid if available packs change
  useEffect(() => {
    if (
      availablePacks.length > 0 &&
      !availablePacks.some((p) => p.id === selectedPackId)
    ) {
      setSelectedPackId(defaultPackId);
    }
  }, [availablePacks, selectedPackId, defaultPackId]);

  const selectedPack =
    availablePacks.find((p) => p.id === selectedPackId) || availablePacks[0];

  const handleSelect = (pkg) => {
    setSelectedPackId(pkg.id);
  };

  const getBadgeText = (pkg) => {
    if (pkg.badgeType === 'starter') return t('starter_badge', '⚡ Starter');
    if (pkg.badgeType === 'popular') return t('most_popular_badge', '👑 Most Popular');
    if (pkg.badgeType === 'hot') return t('hot_deal_badge', '🔥 Hot Deal');
    if (pkg.badgeType === 'value') return t('value_pack_badge', '⭐ Value Pack');
    return pkg.badge;
  };

  const handleCheckout = async () => {
    if (!selectedPack) return;
    setIsSubmitting(true);
    try {
      markPackAsPurchased(selectedPack.id);
      await onProceedPay?.(selectedPack);
      onClose?.();
    } catch (err) {
      onToast?.(err.message || 'Payment initiation failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="insufficient-coins-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="insufficient-coins-sheet" onClick={(e) => e.stopPropagation()}>
        {/* Drag Pill Handle */}
        <div className="sheet-drag-pill" aria-hidden="true" />

        {/* Close (X) Button */}
        <button className="sheet-close-btn" onClick={onClose} aria-label="Close">
          <X size={18} color="#ffffff" strokeWidth={2.4} />
        </button>

        {/* ── Coin Warning Illustration ── */}
        <CoinWarningIllustration />

        {/* ── Heading & Subtitle ── */}
        <h2 className="insufficient-title">
          {Number(coins) < (expert?.price || 30) ? (
            <>
              {t('insufficient_title_prefix', "You don't have enough")}{' '}
              <span className="pink-highlight">{t('insufficient_title_coins', 'Coins')}</span>!
            </>
          ) : (
            <>
              {t('recharge_coins_title', 'Recharge More')}{' '}
              <span className="pink-highlight">{t('insufficient_title_coins', 'Coins')}</span>
            </>
          )}
        </h2>
        <p className="insufficient-subtitle">
          {Number(coins) < (expert?.price || 30)
            ? t('insufficient_subtitle', 'Recharge your wallet to make a call.')
            : t('recharge_subtitle_active', 'Top up your wallet to continue calls & send gifts.')}
        </p>

        {/* ── Dynamic Balance Pill ── */}
        <div className="insufficient-balance-pill">
          <span className="balance-coin-emoji">🪙</span>
          <span className="balance-text">
            {t('your_balance_label', 'Your Balance:')}{' '}
            <strong className="balance-val">{coins} {t('coins', 'Coins')}</strong>
          </span>
        </div>

        {/* ── Section Title Divider ── */}
        <div className="sheet-section-divider">
          <div className="divider-line left" />
          <div className="divider-label">
            <span className="divider-icon">⚡</span>
            <span>{t('choose_recharge_pack', 'Choose a Recharge Pack')}</span>
          </div>
          <div className="divider-line right" />
        </div>

        {/* ── Progressive Recharge Packages (3 Available Packs) ── */}
        {availablePacks.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px 12px', color: '#c9b4d5', fontSize: '13px' }}>
            {t('all_packs_purchased', 'All special one-time coin packs have been purchased!')}
          </div>
        ) : (
          <div className="sheet-packs-grid">
            {availablePacks.map((pkg) => {
              const isSelected = selectedPackId === pkg.id;
              const badgeText = getBadgeText(pkg);
              const badgeClass = pkg.badgeType || pkg.badgeClass || '';
              const extraBannerText = pkg.extraText
                ? pkg.extraText.replace('Extra Coins', t('extra_coins', 'Extra Coins'))
                : null;

              return (
                <div
                  key={pkg.id}
                  className={`sheet-pack-card ${isSelected ? 'pack-selected' : ''}`}
                  onClick={() => handleSelect(pkg)}
                >
                  {/* Floating Top Badge */}
                  {badgeText && (
                    <div className={`sheet-floating-badge ${badgeClass}`}>
                      {badgeText}
                    </div>
                  )}

                  {/* Extra Coins Banner (Lavender/Pink) */}
                  {extraBannerText ? (
                    <div className="sheet-pack-extra-banner">{extraBannerText}</div>
                  ) : (
                    <div className="sheet-pack-extra-banner empty" />
                  )}

                  {/* Coin Visual */}
                  <div className="sheet-pack-coin-wrap">
                    <CoinStackGraphic size={42} />
                  </div>

                  {/* Coins Display */}
                  <div className="sheet-pack-coins">
                    {pkg.originalCoins ? (
                      <div className="sheet-coins-dual">
                        <span className="sheet-coins-orig">{pkg.originalCoins}</span>
                        <span className="sheet-coins-current">{pkg.coins}</span>
                      </div>
                    ) : (
                      <span className="sheet-coins-single">
                        {pkg.coins} {t('coins', 'Coins')}
                      </span>
                    )}
                  </div>

                  {/* Price Pill */}
                  <button
                    type="button"
                    className={`sheet-price-pill ${isSelected ? 'pill-active' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelect(pkg);
                    }}
                  >
                    ₹{pkg.price}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Main CTA: Recharge & Proceed to Pay ── */}
        <button
          type="button"
          className="sheet-cta-btn"
          onClick={handleCheckout}
          disabled={isSubmitting}
        >
          <div className="cta-wallet-icon-wrap">
            <Wallet size={19} color="#fff" strokeWidth={2.2} />
          </div>
          <span className="cta-btn-text">
            {isSubmitting ? 'Connecting Payment...' : t('recharge_proceed_pay', 'Recharge & Proceed to Pay')}
          </span>
          <ArrowRight size={19} color="#fff" strokeWidth={2.4} className="cta-arrow" />
        </button>
      </div>
    </div>
  );
}

