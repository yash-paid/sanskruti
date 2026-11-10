import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  Crown,
  Check,
  Sparkles,
  Zap,
  ShieldCheck,
  Gift,
  Star,
  Clock,
  Phone,
  Wallet,
  User,
  Heart,
  ArrowRight,
  Plus,
} from 'lucide-react';
import heartLogoImg from '../../assets/images/heart-logo-transparent.png';
import { useLanguage } from '../context/LanguageContext';
import { getKolkataDateString } from '../firebase/rewardService';
import {
  fetchUserVipEntitlement,
  claimUserVipBonus,
  activateUserVip,
} from '../firebase/userService';

const VIP_PLANS = [
  {
    id: 'silver',
    name: 'Silver VIP',
    badge: '🥈 Silver VIP',
    price: 199,
    days: 7,
    durationText: '7 Days',
    tagline: 'Essential VIP Perks for 1 Week',
    accentColor: '#c0c0c0',
    glowColor: 'rgba(192, 192, 192, 0.45)',
    isPopular: false,
    perks: [
      '🪙 200 Free Coins Per Day (Daily Bonus)',
      'Silver VIP Crown Badge on Profile',
      'Priority Profile Visibility in Calls',
      '10% Eligible First-Recharge Bonus',
      'Weekly Exclusive Offers & Discounts',
      'Standard Call Priority',
    ],
  },
  {
    id: 'gold',
    name: 'Gold VIP',
    badge: '👑 Most Popular',
    price: 399,
    days: 15,
    durationText: '15 Days',
    tagline: 'Best Selling VIP Experience',
    accentColor: '#FFD700',
    glowColor: 'rgba(255, 215, 0, 0.55)',
    isPopular: true,
    perks: [
      '🪙 500 Free Coins Per Day (Daily Bonus)',
      'Golden VIP Crown Badge on Profile',
      'High Priority Profile Visibility',
      'Highlighted Call Requests to Experts',
      '10% Bonus on ALL Wallet Recharges',
      'Weekly Exclusive Recharge Deals',
      'Fast-track Customer Support',
    ],
  },
  {
    id: 'diamond',
    name: 'Diamond VIP',
    badge: '💎 Best Value',
    price: 1,
    days: 30,
    durationText: '30 Days (1 Month)',
    tagline: 'Ultimate Elite Privilege & Max Benefits',
    accentColor: '#00e5ff',
    glowColor: 'rgba(0, 229, 255, 0.55)',
    isPopular: false,
    perks: [
      '🪙 1,200 Free Coins Per Day (Daily Bonus)',
      'Diamond VIP Exclusive Glowing Badge',
      'Top-Tier Priority Visibility Everywhere',
      'Highlighted Urgent Call Requests',
      '10% First-Recharge Bonus + Weekly Deals',
      '100 Birthday Bonus Coins',
      'Festival Mega Offers & Double Discounts',
      'Exclusive VIP Only Video Gifts',
    ],
  },
];

const COMPARISON_FEATURES = [
  { name: 'Daily Free Coins Bonus', free: false, silver: '200 / Day', gold: '500 / Day', diamond: '1,200 / Day' },
  { name: 'VIP Profile Crown Badge', free: false, silver: true, gold: true, diamond: true },
  { name: 'Priority Profile Visibility', free: false, silver: 'Standard', gold: 'High', diamond: 'Top Tier' },
  { name: 'Highlighted Call Requests', free: false, silver: false, gold: true, diamond: true },
  { name: '10% First-Recharge Bonus', free: false, silver: true, gold: true, diamond: true },
  { name: 'Weekly Exclusive Offers', free: false, silver: true, gold: true, diamond: true },
  { name: 'Exclusive Recharge Deals', free: false, silver: false, gold: true, diamond: true },
  { name: '100 Birthday Bonus Coins', free: false, silver: false, gold: false, diamond: true },
  { name: 'Festival Mega Offers', free: false, silver: false, gold: true, diamond: true },
];

export default function VipScreen({
  coins = 0,
  uid,
  userProfile,
  onBack,
  onNavigateTab,
  onOpenWallet,
  onAddCoins,
  onRewardClaimed,
  onInitiateVipPayment,
  onToast,
}) {
  const { t } = useLanguage();
  const [selectedPlanId, setSelectedPlanId] = useState('gold');
  const [claimingVipBonus, setClaimingVipBonus] = useState(false);
  const [vipBonusClaimedToday, setVipBonusClaimedToday] = useState(false);

  const [activeVip, setActiveVip] = useState(null);
  const [isLoadingVip, setIsLoadingVip] = useState(true);

  useEffect(() => {
    let isMounted = true;
    if (uid) {
      setIsLoadingVip(true);
      fetchUserVipEntitlement(uid)
        .then((res) => {
          if (isMounted) {
            if (res?.entitlement && res.entitlement.active) {
              setActiveVip(res.entitlement);
            } else {
              setActiveVip(null);
            }
            setVipBonusClaimedToday(Boolean(res?.vipBonusClaimedToday));
            setIsLoadingVip(false);
          }
        })
        .catch((err) => {
          console.warn('Error fetching user VIP entitlement:', err);
          if (isMounted) {
            setActiveVip(null);
            setIsLoadingVip(false);
          }
        });
    } else {
      setActiveVip(null);
      setIsLoadingVip(false);
    }
    return () => {
      isMounted = false;
    };
  }, [uid]);

  const selectedPlan = VIP_PLANS.find((p) => p.id === selectedPlanId) || VIP_PLANS[1];

  const handleSelectPlan = (plan) => {
    setSelectedPlanId(plan.id);
    onToast?.(`Selected ${plan.name} (₹${plan.price} / ${plan.durationText})`);
  };

  const handleSubscribe = async () => {
    if (!uid) {
      onToast?.('Please log in to upgrade to VIP.');
      return;
    }
    if (onInitiateVipPayment) {
      onInitiateVipPayment(selectedPlan);
      return;
    }
    onToast?.('VIP checkout service is currently unavailable. Please try again.');
  };

  const handleClaimVipBonus = async () => {
    if (!activeVip || vipBonusClaimedToday || claimingVipBonus) return;
    if (!uid) return;

    setClaimingVipBonus(true);
    try {
      const res = await claimUserVipBonus(uid);
      if (typeof res?.newBalance === 'number' && onRewardClaimed) {
        // Server already added bonus coins to wallet. Sync new balance without calling onAddCoins!
        onRewardClaimed(res.bonusAmount, res.newBalance);
      } else if (typeof res?.newBalance !== 'number') {
        onAddCoins?.(res.bonusAmount);
      }
      setVipBonusClaimedToday(true);
      onToast?.(`👑 Claimed ${activeVip.planName} Daily Bonus: +${res.bonusAmount} Coins!`);
    } catch (serverErr) {
      if (serverErr.code === 'VIP_BONUS_ALREADY_CLAIMED_TODAY' || serverErr.message?.includes('already claimed')) {
        setVipBonusClaimedToday(true);
        onToast?.("⚠️ Today's VIP daily bonus already claimed!");
      } else {
        onToast?.(`❌ ${serverErr.message || 'Failed to claim bonus.'}`);
      }
    } finally {
      setClaimingVipBonus(false);
    }
  };

  return (
    <div className="vip-screen">
      {/* ── 1. Top Header ── */}
      <header className="vip-header">
        <button
          className="vip-back-btn"
          onClick={onBack}
          aria-label="Back to Profile"
          title="Back"
        >
          <ChevronLeft size={24} color="#fff" />
        </button>

        <div className="vip-brand-group">
          <img src={heartLogoImg} alt="CONNECT" className="vip-brand-logo" />
          <div className="vip-brand-text">
            <span className="vip-brand-name">CONNECT</span>
            <span className="vip-brand-sub">
              {t('vip_sub', 'VIP Membership')}
            </span>
          </div>
        </div>

        <div className="vip-header-actions">
          <div
            className="coin-wallet"
            onClick={onOpenWallet}
            title="Open Wallet"
          >
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
        </div>
      </header>

      {/* ── Scrollable Body ── */}
      <div className="vip-content">
        {/* ── 2. Hero Status Card ── */}
        <div className={`vip-hero-card ${activeVip ? 'active-vip-hero' : ''}`}>
          <div className="vip-hero-sparkle" />
          <div className="vip-hero-crown-circle">
            <Crown size={36} color="#FFD700" />
          </div>

          <div className="vip-hero-meta">
            <div className="vip-hero-badge-pill">
              <Sparkles size={13} color="#FFD700" />
              <span>{activeVip ? activeVip.planName : 'VIP PRIVILEGE CLUB'}</span>
            </div>
            <h1 className="vip-hero-title">
              {activeVip ? 'Active VIP Membership' : t('vip_hero_title', 'Upgrade to CONNECT VIP')}
            </h1>
            <p className="vip-hero-desc">
              {activeVip
                ? `Valid until ${activeVip.expiryDate} • Priority Visibility & Bonus Coins Active`
                : t('vip_hero_desc', 'Get highlighted call requests, 10% bonus coins, exclusive recharge deals & weekly VIP gifts.')}
            </p>

            {activeVip && (
              <div className="vip-daily-bonus-action-row" style={{ marginTop: 12 }}>
                {vipBonusClaimedToday ? (
                  <div className="vip-bonus-claimed-pill">
                    <Check size={14} color="#4ade80" />
                    <span>Today's VIP Bonus (+{activeVip.dailyBonusCoins || 500} Coins) Claimed</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="vip-collect-daily-bonus-btn"
                    onClick={handleClaimVipBonus}
                    disabled={claimingVipBonus}
                  >
                    <Sparkles size={16} color="#FFD700" />
                    <span>
                      {claimingVipBonus
                        ? 'Claiming...'
                        : `Collect VIP Daily Bonus (+${activeVip.dailyBonusCoins || 500} Coins)`}
                    </span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── 3. Plan Selector Cards (Silver, Gold, Diamond) ── */}
        <div className="vip-plans-header-row">
          <h2 className="vip-section-heading">{t('choose_plan', 'Choose Your Membership Plan')}</h2>
          <span className="vip-plans-subtext">{t('cancel_anytime', 'Cancel anytime • Instant activation')}</span>
        </div>

        <div className="vip-plans-container">
          {VIP_PLANS.map((plan) => {
            const isSelected = selectedPlanId === plan.id;
            return (
              <div
                key={plan.id}
                className={`vip-plan-card ${isSelected ? 'selected' : ''} ${
                  plan.isPopular ? 'popular-card' : ''
                }`}
                onClick={() => handleSelectPlan(plan)}
                style={{
                  '--accent': plan.accentColor,
                  '--glow': plan.glowColor,
                }}
              >
                {/* Floating Top Badge */}
                {plan.badge && (
                  <div className={`vip-plan-floating-badge ${plan.id}`}>
                    {plan.badge}
                  </div>
                )}

                <div className="vip-plan-head">
                  <div>
                    <h3 className="vip-plan-name">{plan.name}</h3>
                    <span className="vip-plan-tagline">{plan.tagline}</span>
                  </div>
                  <div className="vip-radio-circle">
                    {isSelected && <div className="vip-radio-dot" />}
                  </div>
                </div>

                <div className="vip-plan-price-row">
                  <div className="vip-price-wrap">
                    <span className="vip-currency">₹</span>
                    <span className="vip-price-val">{plan.price}</span>
                  </div>
                  <span className="vip-duration-tag">/ {plan.durationText}</span>
                </div>

                <div className="vip-perks-list">
                  {plan.perks.map((perk, idx) => (
                    <div key={idx} className="vip-perk-item">
                      <div className="vip-perk-check">
                        <Check size={13} color="#fff" strokeWidth={3} />
                      </div>
                      <span className="vip-perk-text">{perk}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* ── 4. Prominent Subscribe / Upgrade CTA Button ── */}
        <div className="vip-cta-card">
          <div className="vip-cta-info">
            <span className="vip-cta-plan-name">{selectedPlan.name}</span>
            <span className="vip-cta-plan-price">₹{selectedPlan.price} for {selectedPlan.durationText}</span>
          </div>
          <button
            type="button"
            className="vip-activate-btn"
            onClick={handleSubscribe}
          >
            <span>Pay ₹{selectedPlan.price} • Activate VIP (PayU)</span>
            <ArrowRight size={18} />
          </button>
          <div style={{ textAlign: 'center', fontSize: 11, color: '#c9b4d5', marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <span>🔒 100% Secure Checkout via PayU (UPI, Cards, NetBanking)</span>
          </div>
        </div>

        {/* ── 5. Key VIP Benefits Grid ── */}
        <div className="vip-benefits-section">
          <h2 className="vip-section-heading">{t('all_benefits', 'All Exclusive VIP Benefits')}</h2>
          <div className="vip-benefits-grid">
            <div className="vip-benefit-card">
              <div className="v-benefit-icon crown-bg">
                <Crown size={20} color="#FFD700" />
              </div>
              <h4 className="v-benefit-title">VIP Badge & Exclusive Label</h4>
              <p className="v-benefit-desc">Distinct glowing crown icon next to your name and profile card.</p>
            </div>

            <div className="vip-benefit-card">
              <div className="v-benefit-icon star-bg">
                <Star size={20} color="#ff2a8d" />
              </div>
              <h4 className="v-benefit-title">Priority Profile Visibility</h4>
              <p className="v-benefit-desc">Stay visible on top for experts during browsing and calling queues.</p>
            </div>

            <div className="vip-benefit-card">
              <div className="v-benefit-icon zap-bg">
                <Zap size={20} color="#00e5ff" />
              </div>
              <h4 className="v-benefit-title">Highlighted Call Requests</h4>
              <p className="v-benefit-desc">Experts receive your incoming calls with high-priority pulse alert.</p>
            </div>

            <div className="vip-benefit-card">
              <div className="v-benefit-icon coin-bg">
                <Gift size={20} color="#eab308" />
              </div>
              <h4 className="v-benefit-title">{t('benefit_1_title', '10% First-Recharge Bonus')}</h4>
              <p className="v-benefit-desc">{t('benefit_1_desc', 'Extra 10% bonus coins automatically added on every eligible recharge.')}</p>
            </div>

            <div className="vip-benefit-card">
              <div className="v-benefit-icon tag-bg">
                <Clock size={20} color="#a855f7" />
              </div>
              <h4 className="v-benefit-title">{t('benefit_2_title', 'Weekly Offers & Deals')}</h4>
              <p className="v-benefit-desc">{t('benefit_2_desc', 'Exclusive discounted coin packages refreshed every Monday.')}</p>
            </div>

            <div className="vip-benefit-card">
              <div className="v-benefit-icon shield-bg">
                <ShieldCheck size={20} color="#22c55e" />
              </div>
              <h4 className="v-benefit-title">{t('benefit_3_title', '100 Birthday Bonus Coins')}</h4>
              <p className="v-benefit-desc">{t('benefit_3_desc', 'Free 100 coin celebration gift plus special festival mega perks.')}</p>
            </div>
          </div>
        </div>

        {/* ── 6. Membership Comparison Table ── */}
        <div className="vip-comparison-section">
          <h2 className="vip-section-heading">{t('plan_comparison', 'Plan Comparison')}</h2>
          <div className="vip-table-wrapper">
            <table className="vip-compare-table">
              <thead>
                <tr>
                  <th>{t('comp_col_feature', 'Feature')}</th>
                  <th>{t('comp_col_free', 'Free')}</th>
                  <th>{t('plan_silver', 'Silver')}</th>
                  <th>{t('plan_gold', 'Gold')}</th>
                  <th>{t('plan_diamond', 'Diamond')}</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON_FEATURES.map((feat, idx) => (
                  <tr key={idx}>
                    <td className="feat-name">{feat.name}</td>
                    <td>
                      {feat.free === false ? (
                        <span className="cross-sym">—</span>
                      ) : (
                        <Check size={14} color="#22c55e" />
                      )}
                    </td>
                    <td>
                      {typeof feat.silver === 'string' ? (
                        <span className="tier-tag">{feat.silver}</span>
                      ) : feat.silver ? (
                        <Check size={14} color="#c0c0c0" strokeWidth={3} />
                      ) : (
                        <span className="cross-sym">—</span>
                      )}
                    </td>
                    <td>
                      {typeof feat.gold === 'string' ? (
                        <span className="tier-tag gold">{feat.gold}</span>
                      ) : feat.gold ? (
                        <Check size={14} color="#FFD700" strokeWidth={3} />
                      ) : (
                        <span className="cross-sym">—</span>
                      )}
                    </td>
                    <td>
                      {typeof feat.diamond === 'string' ? (
                        <span className="tier-tag diamond">{feat.diamond}</span>
                      ) : feat.diamond ? (
                        <Check size={14} color="#00e5ff" strokeWidth={3} />
                      ) : (
                        <span className="cross-sym">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── 7. Fixed Bottom Navigation Bar ── */}
      <nav className="bottom-nav" aria-label="Bottom Navigation">
        {/* 1. Call (Home) */}
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

        {/* 3. Wallet */}
        <button className="bottom-nav-item" onClick={onOpenWallet}>
          <Wallet size={22} strokeWidth={1.8} />
          <span className="bottom-nav-label">{t('nav_wallet', 'Wallet')}</span>
        </button>

        {/* 4. My Profile */}
        <button
          className="bottom-nav-item nav-active"
          onClick={onBack}
        >
          <div className="bottom-nav-wallet-pill">
            <User size={20} strokeWidth={2} />
          </div>
          <span className="bottom-nav-label">{t('nav_profile', 'My Profile')}</span>
        </button>
      </nav>
    </div>
  );
}

