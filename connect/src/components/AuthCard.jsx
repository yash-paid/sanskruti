import React, { useState, useEffect } from 'react';
import { User, Lock, Eye, EyeOff, ArrowRight, Zap } from 'lucide-react';
import FeatureBadges from './FeatureBadges';
import { GoogleIcon } from './LoginRequiredModal';

export default function AuthCard({
  initialMode = 'login',
  onToast,
  onLoginSuccess,
  onGoogleLogin,
  onGuestLogin,
}) {
  const [mode, setMode] = useState(initialMode); // 'login' | 'signup'
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    identifier: '',
    password: '',
  });

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.identifier.trim()) {
      onToast('Please enter your Email or Mobile Number');
      return;
    }
    if (!formData.password) {
      onToast('Please enter your password');
      return;
    }
    // Demo: immediately proceed
    onToast(mode === 'login' ? `Welcome back! Logging in...` : `Account created! Welcome to CONNECT.`);
    setTimeout(() => onLoginSuccess?.(formData), 800);
  };

  const handleGuestLogin = () => {
    onGuestLogin?.();
  };

  const handleGoogleClick = () => {
    onToast?.('✨ Connecting Google Account...');
    setTimeout(() => onGoogleLogin?.(), 700);
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
            onClick={() => setMode('login')}
          >
            Log In
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'signup'}
            className={`toggle-pill-btn ${mode === 'signup' ? 'active' : ''}`}
            onClick={() => setMode('signup')}
          >
            Sign Up
          </button>
        </div>

        {/* Card Subtitle */}
        <p className="card-subtitle">
          {mode === 'login'
            ? 'Acess your acount and start connecting'
            : 'Create your account and start connecting'}
        </p>

        {/* Auth Form */}
        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          {/* Sign Up extra field: Name */}
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
                placeholder="Full Name"
                className="auth-input"
                autoComplete="name"
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
              placeholder="Email or Mobile Number"
              className="auth-input"
              autoComplete="username"
            />
          </div>

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
              placeholder="Password"
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

          {/* Primary Action Button */}
          <button type="submit" className="btn-primary-action">
            <span>{mode === 'login' ? 'Log In' : 'Sign Up'}</span>
            <ArrowRight size={20} className="btn-action-arrow" />
          </button>
        </form>

        {/* Quick Log In Divider */}
        <div className="quick-login-divider">
          <div className="divider-line" />
          <span className="divider-text">Quick Log In</span>
          <div className="divider-line" />
        </div>

        {/* Sign in with Google Button */}
        <button
          type="button"
          className="btn-google-auth"
          onClick={handleGoogleClick}
        >
          <GoogleIcon size={20} />
          <span>{mode === 'login' ? 'Sign in with Google' : 'Sign up with Google'}</span>
        </button>

        {/* Continue as Guest Button */}
        <button
          type="button"
          className="btn-guest-action"
          onClick={handleGuestLogin}
        >
          <Zap size={18} fill="currentColor" className="guest-bolt-icon" />
          <span>Continue as Guest</span>
        </button>

        {/* Bottom Feature Badges */}
        <FeatureBadges onSelectFeature={onToast} />
      </div>
    </div>
  );
}
