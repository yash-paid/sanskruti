import React, { useState, useEffect } from 'react';
import { User, Lock, Eye, EyeOff, ArrowRight, Zap, AlertCircle } from 'lucide-react';
import FeatureBadges from './FeatureBadges';
import { GoogleIcon } from './LoginRequiredModal';
import { useLanguage } from '../context/LanguageContext';
import { normalizeIndianMobile, isValidIndianMobile } from '../firebase/authService';

export default function AuthCard({
  initialMode = 'login',
  onToast,
  onLoginSuccess,
  onGoogleLogin,
  onGuestLogin,
}) {
  const { t } = useLanguage();
  const [mode, setMode] = useState(initialMode); // 'login' | 'signup'
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [noAccountFound, setNoAccountFound] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    identifier: '',
    password: '',
    confirmPassword: '',
  });

  useEffect(() => {
    setMode(initialMode);
    setNoAccountFound(false);
  }, [initialMode]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (noAccountFound) setNoAccountFound(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const rawId = formData.identifier.trim();
    if (!rawId) {
      onToast('Enter mobile number or email');
      return;
    }

    // Mobile Number vs Email Validation
    if (!rawId.includes('@')) {
      const digits = rawId.replace(/[^0-9]/g, '');
      if (digits.length === 8 || digits.length === 9 || (digits.length > 0 && digits.length < 10)) {
        onToast('❌ Wrong number! Please input correct 10-digit mobile number.');
        return;
      }
      if (digits.length === 10 && !/^[6-9]\d{9}$/.test(digits)) {
        onToast('❌ Wrong number! Please input correct 10-digit mobile number starting with 6, 7, 8, or 9.');
        return;
      }
      const normalized = normalizeIndianMobile(rawId);
      if (!normalized || !isValidIndianMobile(normalized)) {
        onToast('❌ Wrong number! Please input correct 10-digit mobile number.');
        return;
      }
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(rawId)) {
        onToast('❌ Please enter a valid email address.');
        return;
      }
    }

    if (!formData.password) {
      onToast(t('password_placeholder', 'Please enter your password'));
      return;
    }
    if (formData.password.length < 6) {
      onToast('Password must be at least 6 characters long.');
      return;
    }
    if (mode === 'signup') {
      if (!formData.confirmPassword) {
        onToast('Please enter confirm password.');
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        onToast('Passwords do not match. Please verify your confirm password.');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      await onLoginSuccess?.({
        mode,
        identifier: formData.identifier.trim(),
        email: formData.identifier.trim(),
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        name: formData.name.trim(),
      });
    } catch (err) {
      const code = err?.code || '';
      // If customer account is not found in database:
      if (
        code === 'auth/user-not-found' ||
        code === 'auth/invalid-credential' ||
        err?.message?.toLowerCase().includes('user-not-found') ||
        err?.message?.toLowerCase().includes('no account found')
      ) {
        if (mode === 'login') {
          setMode('signup');
          setNoAccountFound(true);
          onToast?.('⚠️ No account found..!! Please sign up to create your account.');
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGuestLogin = () => {
    onGuestLogin?.();
  };

  const handleGoogleClick = async () => {
    setIsGoogleLoading(true);
    try {
      await onGoogleLogin?.();
    } catch (err) {
      // Error handled by parent with toast
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="card-section">
      <div className="glass-card">
        {/* Log In / Sign Up Toggle Pill */}
        <div className="toggle-pill-container" role="tablist">
          <div
            className={`toggle-pill-slider ${mode === 'signup' ? 'slide-right' : ''}`}
            aria-hidden="true"
          />
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'login'}
            className={`toggle-pill-btn ${mode === 'login' ? 'active' : ''}`}
            onClick={() => {
              setMode('login');
              setNoAccountFound(false);
            }}
          >
            {t('login_tab', 'Log In')}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'signup'}
            className={`toggle-pill-btn ${mode === 'signup' ? 'active' : ''}`}
            onClick={() => {
              setMode('signup');
              setNoAccountFound(false);
            }}
          >
            {t('signup_tab', 'Sign Up')}
          </button>
        </div>

        {/* Card Subtitle */}
        <p className="card-subtitle">
          {mode === 'login'
            ? t('auth_sub_login', 'Access your account to start video calling')
            : t('auth_sub_signup', 'Create your account to start video calling')}
        </p>

        {/* Inline No Account Found Notification Banner */}
        {noAccountFound && (
          <div className="auth-alert-banner">
            <AlertCircle size={18} color="#ff4d6d" className="auth-alert-icon" />
            <div className="auth-alert-text">
              <strong>No account found..!!</strong>
              <span>Switched to Sign Up so you can create your account.</span>
            </div>
          </div>
        )}

        {/* Auth Form */}
        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          {/* Sign Up extra field: Username */}
          {mode === 'signup' && (
            <div className="input-group">
              <span className="input-icon-left" aria-hidden="true">
                <User size={19} />
              </span>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter username"
                className="auth-input"
                autoComplete="username"
              />
            </div>
          )}

          {/* Email or Mobile Number */}
          <div className="input-group">
            <span className="input-icon-left" aria-hidden="true">
              <User size={19} />
            </span>
            <input
              type="text"
              name="identifier"
              value={formData.identifier}
              onChange={handleChange}
              placeholder="Enter mobile number or email"
              className="auth-input"
              autoComplete="username"
            />
          </div>
          {/* Helper alert if user types 8 or 9 digits */}
          {formData.identifier &&
            !formData.identifier.includes('@') &&
            (() => {
              const digits = formData.identifier.replace(/[^0-9]/g, '');
              if (digits.length >= 7 && digits.length <= 9) {
                return (
                  <div
                    style={{
                      fontSize: 11.5,
                      color: '#ff4d6d',
                      marginTop: -4,
                      marginBottom: 10,
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <span>⚠️ Wrong number ({digits.length}/10 digits). Please input 10-digit mobile number.</span>
                  </div>
                );
              }
              return null;
            })()}

          {/* Password */}
          <div className="input-group">
            <span className="input-icon-left" aria-hidden="true">
              <Lock size={19} />
            </span>
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder={t('password_label', 'Password')}
              className="auth-input"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            />
            <button
              type="button"
              className="password-toggle-btn"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
            </button>
          </div>

          {/* Confirm Password (Sign Up only) */}
          {mode === 'signup' && (
            <div className="input-group">
              <span className="input-icon-left" aria-hidden="true">
                <Lock size={19} />
              </span>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm password"
                className="auth-input"
                autoComplete="new-password"
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
              >
                {showConfirmPassword ? <EyeOff size={19} /> : <Eye size={19} />}
              </button>
            </div>
          )}

          {/* Primary Action Button */}
          <button
            type="submit"
            className="btn-primary-action"
            disabled={isSubmitting || isGoogleLoading}
          >
            <span>
              {isSubmitting
                ? 'Please wait...'
                : mode === 'login'
                ? t('login_tab', 'Log In')
                : t('signup_tab', 'Sign Up')}
            </span>
            <ArrowRight size={20} className="btn-action-arrow" />
          </button>
        </form>

        {/* Quick Log In Divider */}
        <div className="quick-login-divider">
          <div className="divider-line" />
          <span className="divider-text">
            {mode === 'login' ? t('quick_login', 'Quick Log In') : t('quick_signup', 'Quick Sign Up')}
          </span>
          <div className="divider-line" />
        </div>

        {/* Sign in with Google Button */}
        <button
          type="button"
          className="btn-google-auth"
          onClick={handleGoogleClick}
          disabled={isGoogleLoading || isSubmitting}
        >
          <GoogleIcon size={20} />
          <span>
            {isGoogleLoading
              ? 'Connecting Google...'
              : mode === 'login'
              ? t('google_signin', 'Sign in with Google')
              : t('google_signup', 'Sign up with Google')}
          </span>
        </button>

        {/* Continue as Guest Button */}
        <button
          type="button"
          className="btn-guest-action"
          onClick={handleGuestLogin}
        >
          <Zap size={18} fill="currentColor" className="guest-bolt-icon" />
          <span>{t('continue_guest', 'Continue as Guest')}</span>
        </button>

        {/* Bottom Feature Badges */}
        <FeatureBadges onSelectFeature={onToast} />
      </div>
    </div>
  );
}
