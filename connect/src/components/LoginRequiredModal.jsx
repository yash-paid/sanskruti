import React from 'react';
import { X, Lock, Phone, Wallet, Star, ArrowRight, ShieldCheck } from 'lucide-react';
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
  onGoToAuth,
  onGoogleLogin,
  actionType = 'call', // 'call' | 'recharge'
}) {
  const { t } = useLanguage();

  return (
    <div className="login-req-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="login-req-card" onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button className="login-req-close-btn" onClick={onClose} aria-label="Close">
          <X size={18} color="#fff" strokeWidth={2.4} />
        </button>

        {/* Lock / Alert Illustration */}
        <div className="login-req-icon-wrap">
          <div className="login-req-lock-glow" />
          <div className="login-req-lock-circle">
            <Lock size={30} color="#ff2a8d" strokeWidth={2.2} />
          </div>
          <span className="login-req-badge">!</span>
        </div>

        {/* Title & Subtitle */}
        <h2 className="login-req-title">
          {t('login_required_title', 'Login Required!')}
        </h2>
        <p className="login-req-subtitle">
          {actionType === 'recharge'
            ? t('login_req_sub_recharge', 'Please sign in or create an account to recharge coins & unlock features.')
            : t('login_req_sub_call', 'Please sign in or create an account to make live video calls with experts.')}
        </p>

        {/* Value Highlights */}
        <div className="login-req-features">
          <div className="login-req-feature-item">
            <div className="req-feat-icon call">
              <Phone size={15} color="#00e5ff" />
            </div>
            <span>{t('feat_video_calls', '1-on-1 Private Live Video Calls')}</span>
          </div>
          <div className="login-req-feature-item">
            <div className="req-feat-icon wallet">
              <Wallet size={15} color="#FFD700" />
            </div>
            <span>{t('feat_secure_wallet', 'Secure Wallet & Coin Balance')}</span>
          </div>
          <div className="login-req-feature-item">
            <div className="req-feat-icon star">
              <Star size={15} color="#ff2a8d" />
            </div>
            <span>{t('feat_fav_experts', 'Save & Connect with Top Experts')}</span>
          </div>
        </div>

        {/* Google Sign-In Action */}
        <button
          type="button"
          className="btn-google-auth"
          onClick={() => {
            onGoogleLogin?.();
          }}
        >
          <GoogleIcon size={20} />
          <span>{t('continue_with_google', 'Continue with Google')}</span>
        </button>

        {/* Divider */}
        <div className="login-req-divider">
          <div className="req-div-line" />
          <span className="req-div-text">{t('or_continue_with', 'OR')}</span>
          <div className="req-div-line" />
        </div>

        {/* Main Sign Up Button (Redirects to signup page) */}
        <button
          type="button"
          className="btn-primary-action req-signup-btn"
          onClick={() => onGoToAuth?.('signup')}
        >
          <span>{t('sign_up_action', 'Sign Up with Mobile / Email')}</span>
          <ArrowRight size={19} className="btn-action-arrow" />
        </button>

        {/* Existing User Login Link */}
        <div className="login-req-footer">
          <span>{t('already_have_account', 'Already have an account?')} </span>
          <button
            type="button"
            className="login-req-switch-btn"
            onClick={() => onGoToAuth?.('login')}
          >
            {t('btn_login', 'Log In')}
          </button>
        </div>
      </div>
    </div>
  );
}

