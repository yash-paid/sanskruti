import React from 'react';
import { X, Lock, Phone, Wallet, Crown, ShieldCheck, Zap, ArrowRight } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export function GoogleIcon({ size = 20 }) {
  return (
    <svg className="google-icon" viewBox="0 0 24 24" width={size} height={size}>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}

export default function LoginRequiredModal({
  onClose,
  onSkip,
  onGoToAuth,
  onGoogleLogin,
  expert = null,
  actionType = 'call', // 'call' | 'recharge' | 'vip'
}) {
  const { t } = useLanguage();

  const isRecharge = actionType === 'recharge';
  const isVip = actionType === 'vip';

  return (
    <div className="login-req-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="login-req-card" onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button className="login-req-close-btn" onClick={onClose} aria-label="Close">
          <X size={18} color="#fff" strokeWidth={2.4} />
        </button>

        {/* Expert Call Header or Generic Lock / Recharge Header */}
        {expert ? (
          <div className="login-req-expert-header">
            <div className="login-req-expert-avatar-wrap">
              <img
                src={expert.photo}
                alt={expert.name}
                className="login-req-expert-avatar"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
              <span className="login-req-expert-badge">📹</span>
            </div>
            <h2 className="login-req-title">
              {t('call_with_expert', 'Call with {name}').replace('{name}', expert.name)}
            </h2>
            <p className="login-req-subtitle">
              {t('login_req_call_subtitle', 'Log in to save your coins & private session, or Skip to call directly as Guest.')}
            </p>
          </div>
        ) : isRecharge ? (
          <div className="login-req-generic-header">
            <div className="login-req-icon-wrap">
              <div className="login-req-lock-glow" />
              <div className="login-req-lock-circle">
                <Wallet size={30} color="#FFD700" strokeWidth={2.2} />
              </div>
              <span className="login-req-badge">🪙</span>
            </div>
            <h2 className="login-req-title">
              {t('login_req_recharge_title', 'Recharge & Payment')}
            </h2>
            <p className="login-req-subtitle">
              {t('login_req_recharge_sub', 'Log in to link these coins permanently, or Skip to pay directly as Guest.')}
            </p>
          </div>
        ) : isVip ? (
          <div className="login-req-generic-header">
            <div className="login-req-icon-wrap">
              <div className="login-req-lock-glow" />
              <div className="login-req-lock-circle">
                <Crown size={30} color="#FFD700" strokeWidth={2.2} />
              </div>
              <span className="login-req-badge">👑</span>
            </div>
            <h2 className="login-req-title">
              {t('login_req_vip_title', 'Upgrade to VIP')}
            </h2>
            <p className="login-req-subtitle">
              {t('login_req_vip_sub', 'Log in to sync your VIP benefits, or Skip to pay directly as Guest.')}
            </p>
          </div>
        ) : (
          <div className="login-req-generic-header">
            <div className="login-req-icon-wrap">
              <div className="login-req-lock-glow" />
              <div className="login-req-lock-circle">
                <Lock size={30} color="#ff2a8d" strokeWidth={2.2} />
              </div>
              <span className="login-req-badge">!</span>
            </div>
            <h2 className="login-req-title">
              {t('login_req_title', 'Log In Required')}
            </h2>
            <p className="login-req-subtitle">
              {t('login_req_subtitle', 'Log in or create an account to save coins, or Skip to continue as Guest.')}
            </p>
          </div>
        )}

        {/* Value Highlights */}
        <div className="login-req-features">
          {expert ? (
            <>
              <div className="login-req-feature-item">
                <div className="req-feat-icon call">
                  <Phone size={15} color="#00e5ff" />
                </div>
                <span>{t('login_req_f1', 'HD 1-on-1 Video & Voice Calling')}</span>
              </div>
              <div className="login-req-feature-item">
                <div className="req-feat-icon wallet">
                  <ShieldCheck size={15} color="#FFD700" />
                </div>
                <span>{t('login_req_f2', '100% Private & End-to-End Encrypted')}</span>
              </div>
            </>
          ) : isVip ? (
            <>
              <div className="login-req-feature-item">
                <div className="req-feat-icon call">
                  <Crown size={15} color="#FFD700" />
                </div>
                <span>{t('login_req_vip_f1', 'Daily Free Bonus Coins & Crown Badge')}</span>
              </div>
              <div className="login-req-feature-item">
                <div className="req-feat-icon wallet">
                  <ShieldCheck size={15} color="#00e5ff" />
                </div>
                <span>{t('login_req_secure', '100% Safe & Secure PayU Checkout')}</span>
              </div>
            </>
          ) : (
            <>
              <div className="login-req-feature-item">
                <div className="req-feat-icon wallet">
                  <Zap size={15} color="#00e5ff" />
                </div>
                <span>{t('login_req_instant_credit', 'Instant Coin Credit to Balance')}</span>
              </div>
              <div className="login-req-feature-item">
                <div className="req-feat-icon call">
                  <ShieldCheck size={15} color="#FFD700" />
                </div>
                <span>{t('login_req_secure', '100% Safe & Secure PayU Checkout')}</span>
              </div>
            </>
          )}
        </div>

        {/* ════ OPTION 1: LOG IN / CREATE ACCOUNT ════ */}
        <div className="login-req-action-block">
          <button
            type="button"
            className="btn-primary-action req-signup-btn req-option-login-btn"
            onClick={() => onGoToAuth?.('login')}
          >
            <span>🔐 {t('login_or_create', 'Log In / Create Account')}</span>
            <ArrowRight size={18} className="btn-action-arrow" />
          </button>

          <button
            type="button"
            className="btn-google-auth req-google-btn"
            onClick={() => {
              onGoogleLogin?.();
            }}
          >
            <GoogleIcon size={19} />
            <span>{t('continue_google', 'Continue with Google')}</span>
          </button>
        </div>

        {/* ════ DIVIDER: OR ════ */}
        <div className="login-req-divider">
          <div className="req-div-line" />
          <span className="req-div-text">{t('or_label', 'OR')}</span>
          <div className="req-div-line" />
        </div>

        {/* ════ OPTION 2: SKIP TO PROCEED AS GUEST ════ */}
        <button
          type="button"
          className="btn-skip-guest-action"
          onClick={() => {
            if (onSkip) {
              onSkip();
            } else {
              onClose?.();
            }
          }}
        >
          <span className="skip-btn-badge">⚡</span>
          <div className="skip-btn-text">
            <span className="skip-btn-title">
              {expert
                ? t('skip_and_call', 'Skip & Call as Guest')
                : isRecharge || isVip
                ? t('skip_and_pay', 'Skip & Pay as Guest')
                : t('skip_and_continue', 'Skip & Continue as Guest')}
            </span>
            <span className="skip-btn-sub">
              {expert
                ? t('skip_btn_sub_call', 'Proceed directly to call without login')
                : t('skip_btn_sub_pay', 'Proceed directly to payment without login')}
            </span>
          </div>
          <ArrowRight size={18} className="skip-btn-arrow" />
        </button>

        {/* Bottom subtle note */}
        <div className="login-req-footer">
          <span>{t('guest_can_login_anytime', 'You can log in anytime from the menu.')}</span>
        </div>
      </div>
    </div>
  );
}
