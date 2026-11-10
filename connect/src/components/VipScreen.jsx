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
  Lock,
} from 'lucide-react';
import heartLogoImg from '../../assets/images/heart-logo-transparent.png';
import { useLanguage } from '../context/LanguageContext';
import { getKolkataDateString, getStoredVipEntitlement } from '../firebase/rewardService';
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
    price: 299,
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
    price: 399,
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
  vipEntitlement: propVipEntitlement,
  onBack,
  onNavigateTab,
  onOpenWallet,
  onAddCoins,
  onRewardClaimed,
  onInitiateVipPayment,
  onToast,
}) {
  const { t } = useLanguage();
  const [activeVip, setActiveVip] = useState(() => {
    return propVipEntitlement || getStoredVipEntitlement(uid);
  });
  const [isLoadingVip, setIsLoadingVip] = useState(false);

  const isVipExpired = (vip) => {
    if (!vip) return true;
    if (!vip.active && vip.status !== 'active') return true;
    if (vip.expiryDate) {
      try {
        const expDate = new Date(vip.expiryDate);
        if (!isNaN(expDate.getTime()) && expDate < new Date()) {
          return true;
        }
      } catch (e) {}
    }
    return false;
  };

  const isCurrentActivePlan = (planId) => {
    if (!activeVip || isVipExpired(activeVip)) return false;
    const currentId = String(activeVip.planId || '').toLowerCase();
    const currentName = String(activeVip.planName || '').toLowerCase();
    const targetId = String(planId || '').toLowerCase();
    return currentId === targetId || currentName.includes(targetId);
  };

  const [selectedPlanId, setSelectedPlanId] = useState(() => {
    const currentActive = propVipEntitlement || getStoredVipEntitlement(uid);
    if (currentActive && (currentActive.active || currentActive.status === 'active')) {
      return currentActive.planId || 'diamond';
    }
    return 'gold';
  });

  const [claimingVipBonus, setClaimingVipBonus] = useState(false);
  const today = getKolkataDateString();
  const [vipBonusClaimedToday, setVipBonusClaimedToday] = useState(() => {
    try {
      return localStorage.getItem(`connect_vip_claimed_${today}_${uid}`) === 'true';
    } catch (e) {
      return false;
    }
  });

  useEffect(() => {
    if (propVipEntitlement && propVipEntitlement.active) {
      setActiveVip(propVipEntitlement);
    }
  }, [propVipEntitlement]);

  useEffect(() => {
    let isMounted = true;
    const handleVipUpdate = (e) => {
      if (e?.detail) setActiveVip(e.detail);
      else if (uid) setActiveVip(getStoredVipEntitlement(uid));
    };
    window.addEventListener('connect_vip_updated', handleVipUpdate);

    if (uid) {
      fetchUserVipEntitlement(uid)
        .then((res) => {
          if (isMounted) {
            const serverEnt = res?.entitlement && res.entitlement.active ? res.entitlement : null;
            const localEnt = getStoredVipEntitlement(uid);
            setActiveVip(serverEnt || localEnt || null);
            if (res?.vipBonusClaimedToday) {
              setVipBonusClaimedToday(true);
            }
          }
        })
        .catch(() => {
          if (isMounted && uid) {
            setActiveVip(getStoredVipEntitlement(uid));
          }
        });
    }

    return () => {
      isMounted = false;
      window.removeEventListener('connect_vip_updated', handleVipUpdate);
    };
  }, [uid]);

  const selectedPlan = VIP_PLANS.find((p) => p.id === selectedPlanId) || VIP_PLANS[1];

  const handleSelectPlan = (plan) => {
    setSelectedPlanId(plan.id);
    if (isCurrentActivePlan(plan.id)) {
      onToast?.(`🔒 ${plan.name} is already purchased & active till ${activeVip?.expiryDate || '30 Days'}`);
    } else {
      onToast?.(`Selected ${plan.name} (₹${plan.price} / ${plan.durationText})`);
    }
  };

  const handleSubscribe = async () => {
    if (!uid) {
      onToast?.('Please log in to upgrade to VIP.');
      return;
    }
    if (isCurrentActivePlan(selectedPlan.id)) {
      onToast?.(`⚠️ You already have an active ${selectedPlan.name} membership valid till ${activeVip?.expiryDate}. It cannot be repurchased until expired.`);
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
        onRewardClaimed(res.bonusAmount, res.newBalance);
      } else if (typeof res?.newBalance !== 'number') {
        onAddCoins?.(res.bonusAmount);
      }
      setVipBonusClaimedToday(true);
      try {
        localStorage.setItem(`connect_vip_claimed_${today}_${uid}`, 'true');
      } catch (e) {}
      onToast?.(`👑 Claimed ${activeVip.planName} Daily Bonus: +${res.bonusAmount || 1200} Coins!`);
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
        <div className={`vip-hero-card ${activeVip && (activeVip.active || activeVip.status === 'active') ? 'active-vip-hero' : ''}`}>
          <div className="vip-hero-sparkle" />
          <div className="vip-hero-crown-circle">
            <Crown size={36} color={activeVip && (activeVip.active || activeVip.status === 'active') ? '#00e5ff' : '#FFD700'} />
          </div>

          <div className="vip-hero-meta">
            <div
              className="vip-hero-badge-pill"
              style={
                activeVip && (activeVip.active || activeVip.status === 'active')
                  ? { background: '#00e5ff', color: '#05010a', fontWeight: 900 }
                  : {}
              }
            >
              <Sparkles size={13} color={activeVip && (activeVip.active || activeVip.status === 'active') ? '#05010a' : '#FFD700'} />
              <span>
                {activeVip && (activeVip.active || activeVip.status === 'active')
                  ? `${activeVip.planName || 'Diamond VIP'} ACTIVATED`
                  : 'VIP PRIVILEGE CLUB'}
              </span>
            </div>
            <h1 className="vip-hero-title">
              {activeVip && (activeVip.active || activeVip.status === 'active')
                ? 'Active VIP Membership'
                : t('vip_hero_title', 'Upgrade to CONNECT VIP')}
            </h1>

            {activeVip && (activeVip.active || activeVip.status === 'active') && (
              <div className="vip-active-till-banner">
                <span style={{ fontSize: '14px' }}>🟢</span>
                <span>
                  Active till: <strong>{activeVip.expiryDate || '30 Days'}</strong>
                </span>
              </div>
            )}

            <p className="vip-hero-desc">
              {activeVip && (activeVip.active || activeVip.status === 'active')
                ? `Valid until ${activeVip.expiryDate} • Priority Visibility & Bonus Coins Active`
                : t('vip_hero_desc', 'Get highlighted call requests, 10% bonus coins, exclusive recharge deals & weekly VIP gifts.')}
            </p>

            {activeVip && (activeVip.active || activeVip.status === 'active') && (
              <div className="vip-daily-bonus-action-row" style={{ marginTop: 12 }}>
                {vipBonusClaimedToday ? (
                  <div className="vip-bonus-claimed-pill">
                    <Check size={14} color="#4ade80" />
                    <span>Today's VIP Bonus (+{activeVip.dailyBonusCoins || 1200} Coins) Claimed</span>
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
                        : `Collect VIP Daily Bonus (+${activeVip.dailyBonusCoins || 1200} Coins)`}
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
            const isPlanActive = isCurrentActivePlan(plan.id);

            return (
              <div
                key={plan.id}
                className={`vip-plan-card ${isSelected ? 'selected' : ''} ${
                  plan.isPopular ? 'popular-card' : ''
                } ${isPlanActive ? 'plan-already-purchased-locked' : ''}`}
                onClick={() => handleSelectPlan(plan)}
                style={{
                  '--accent': isPlanActive ? '#00e5ff' : plan.accentColor,
                  '--glow': isPlanActive ? 'rgba(0, 229, 255, 0.45)' : plan.glowColor,
                }}
              >
                {/* Floating Top Badge */}
                {isPlanActive ? (
                  <div className="vip-plan-floating-badge active-purchased-badge">
                    🔒 ALREADY PURCHASED • ACTIVE TILL {activeVip.expiryDate || '30 Days'}
                  </div>
                ) : plan.badge ? (
                  <div className={`vip-plan-floating-badge ${plan.id}`}>
                    {plan.badge}
                  </div>
                ) : null}

                <div className="vip-plan-head">
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <h3 className="vip-plan-name">{plan.name}</h3>
                      {isPlanActive && (
                        <span className="vip-active-lock-pill">
                          🔒 ACTIVE
                        </span>
                      )}
                    </div>
                    <span className="vip-plan-tagline">
                      {isPlanActive ? `Valid & active till ${activeVip.expiryDate || '30 Days'}` : plan.tagline}
                    </span>
                  </div>
                  <div className="vip-radio-circle">
                    {isPlanActive ? (
                      <span style={{ fontSize: '12px' }}>🔒</span>
                    ) : isSelected ? (
                      <div className="vip-radio-dot" />
                    ) : null}
                  </div>
                </div>

                <div className="vip-plan-price-row">
                  <div className="vip-price-wrap">
                    <span className="vip-currency">₹</span>
                    <span className="vip-price-val">{plan.price}</span>
                  </div>
                  <span className="vip-duration-tag">/ {plan.durationText}</span>
                  {isPlanActive && (
                    <span className="vip-locked-tag">
                      ✓ Current Active Plan
                    </span>
                  )}
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

        {/* ── 4. Prominent Subscribe / Upgrade CTA Section ── */}
        <div
          className={`vip-cta-card ${isCurrentActivePlan(selectedPlan.id) ? 'locked-cta-card' : ''}`}
          style={{
            '--plan-accent': isCurrentActivePlan(selectedPlan.id) ? '#00e5ff' : selectedPlan.accentColor || '#ff2a8d',
            '--plan-glow': isCurrentActivePlan(selectedPlan.id) ? 'rgba(0, 229, 255, 0.45)' : selectedPlan.glowColor || 'rgba(255, 42, 141, 0.4)',
          }}
        >
          <div className="vip-cta-card-header">
            <div className="vip-cta-header-left">
              <span className="vip-cta-badge-pill">
                {isCurrentActivePlan(selectedPlan.id) ? 'CURRENT ACTIVE PLAN' : selectedPlan.badge || 'SELECTED PLAN'}
              </span>
              <h3 className="vip-cta-plan-title">{selectedPlan.name}</h3>
            </div>
            <div className="vip-cta-header-right">
              <div className="vip-cta-price-stack">
                <span className="vip-cta-price-amount">₹{selectedPlan.price}</span>
                <span className="vip-cta-price-sub">/ {selectedPlan.durationText}</span>
              </div>
            </div>
          </div>

          <div className="vip-cta-action-wrap">
            {isCurrentActivePlan(selectedPlan.id) ? (
              <button
                type="button"
                className="vip-activate-btn locked-plan-btn"
                disabled
                title="This membership is already active and locked. It cannot be repurchased until it expires."
              >
                <Lock size={17} />
                <span>Already Active • Valid till {activeVip.expiryDate}</span>
              </button>
            ) : (
              <button
                type="button"
                className="vip-activate-btn action-glow-btn"
                onClick={handleSubscribe}
              >
                <span>
                  {activeVip && (activeVip.active || activeVip.status === 'active')
                    ? `Upgrade to ${selectedPlan.name}`
                    : `Get ${selectedPlan.name}`} • ₹{selectedPlan.price}
                </span>
                <ArrowRight size={18} />
              </button>
            )}
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

