import React, { useState, useRef } from 'react';
import { Camera, Calendar, User, Check, Upload, Sparkles, ArrowRight } from 'lucide-react';
import { DEFAULT_AVATARS } from '../data/defaultAvatars';
import heartLogoImg from '../../assets/images/heart-logo-transparent.png';
import { useLanguage } from '../context/LanguageContext';
import { calculateAge, getMaxDobFor18Plus, isAtLeast18 } from '../utils/dateUtils';

export default function SetProfileScreen({ initialProfile, onConfirm, onToast }) {
  const { t } = useLanguage();
  const [name, setName] = useState(initialProfile?.name || '');
  const [avatar, setAvatar] = useState(initialProfile?.avatar || DEFAULT_AVATARS[0].url);
  const [dob, setDob] = useState(initialProfile?.dob || '2000-01-01');
  const fileInputRef = useRef(null);

  // Handle uploading custom photo from gallery / computer
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      onToast?.('⚠️ Please choose a valid image file');
      return;
    }

    // Limit to 8MB
    if (file.size > 8 * 1024 * 1024) {
      onToast?.('⚠️ Image size should be under 8MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setAvatar(event.target.result);
        onToast?.('📸 Profile photo selected from gallery!');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSelectDefault = (avUrl) => {
    setAvatar(avUrl);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      onToast?.(t('enter_name_placeholder', 'Please enter your Name'));
      return;
    }
    if (!dob) {
      onToast?.(t('please_select_dob', '⚠️ Please select your Date of Birth'));
      return;
    }
    if (!isAtLeast18(dob)) {
      const currentAge = calculateAge(dob);
      onToast?.(t('must_be_18_warning', `⚠️ You must be at least 18 years old to use CONNECT. (Current age: ${currentAge} years)`));
      return;
    }

    const updatedProfile = {
      name: name.trim(),
      avatar: avatar,
      dob: dob,
      userId: initialProfile?.userId || 'CN-' + Math.floor(100000 + Math.random() * 900000),
      username: '@' + name.trim().toLowerCase().replace(/[^a-z0-9]/g, '_'),
      phone: initialProfile?.phone || '',
    };

    onToast?.(`🎉 Profile saved! Welcome, ${name.trim()}!`);
    onConfirm?.(updatedProfile);
  };

  return (
    <div className="set-profile-screen">
      {/* Ambient Glows */}
      <div className="ambient-glow-top" aria-hidden="true" />
      <div className="ambient-glow-mid" aria-hidden="true" />

      {/* Header */}
      <header className="set-profile-header">
        <div className="set-profile-brand">
          <img src={heartLogoImg} alt="CONNECT" className="set-profile-logo" />
          <div className="set-profile-brand-text">
            <span className="set-profile-brand-name">CONNECT</span>
            <span className="set-profile-brand-tagline">{t('brand_sub', 'Live Call • Real Experts')}</span>
          </div>
        </div>
      </header>

      {/* Main Card */}
      <div className="set-profile-body">
        <div className="set-profile-card">
          <div className="set-profile-intro">
            <div className="set-profile-badge">
              <Sparkles size={13} color="#FFD700" />
              <span>{t('step_2_of_2', 'STEP 2 OF 2')}</span>
            </div>
            <h1 className="set-profile-title">{t('setup_profile_title', 'Set Up Your Profile')}</h1>
            <p className="set-profile-desc">
              {t('setup_profile_desc', 'Tell us your name, photo, and birthday to complete your profile.')}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="set-profile-form">
            {/* ── 1. Profile Photo Picker ── */}
            <div className="set-profile-avatar-section">
              <label className="set-profile-label">{t('profile_photo', 'Profile Photo')}</label>
              
              <div className="set-avatar-center-wrap">
                <div
                  className="set-avatar-preview-circle"
                  onClick={() => fileInputRef.current?.click()}
                  title="Click to choose photo from gallery"
                >
                  <img
                    src={avatar}
                    alt="Selected Avatar"
                    className="set-avatar-img"
                    onError={(e) => {
                      e.target.src = '/default-avatars/1.png';
                    }}
                  />
                  <div className="set-avatar-cam-badge">
                    <Camera size={16} color="#fff" />
                  </div>
                </div>

                {/* Upload from Gallery Button */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  style={{ display: 'none' }}
                />
                <button
                  type="button"
                  className="set-upload-gallery-btn"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload size={14} />
                  <span>{t('choose_gallery', 'Choose from Gallery')}</span>
                </button>
              </div>

              {/* Default Avatars Picker Carousel */}
              <div className="set-default-avatars-wrap">
                <span className="set-default-avatars-label">{t('or_choose_default', 'Or choose a default avatar:')}</span>
                <div className="set-default-avatars-scroll">
                  {DEFAULT_AVATARS.map((av) => {
                    const isSelected = avatar === av.url;
                    return (
                      <div
                        key={av.id}
                        className={`set-default-avatar-chip ${isSelected ? 'selected' : ''}`}
                        onClick={() => handleSelectDefault(av.url)}
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

            {/* ── 2. Full Name Input ── */}
            <div className="set-profile-field">
              <label className="set-profile-label" htmlFor="user-fullname">
                {t('your_name', 'Your Name')}
              </label>
              <div className="set-input-box">
                <User size={18} className="set-input-icon" />
                <input
                  id="user-fullname"
                  type="text"
                  className="set-text-input"
                  placeholder={t('enter_name_placeholder', 'Enter your name (e.g. Rahul Sharma)')}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={40}
                  autoFocus
                  required
                />
              </div>
            </div>

            {/* ── 3. Date of Birth Input (Strict 18+ Mandatory) ── */}
            <div className="set-profile-field">
              <div className="set-profile-label-row">
                <label className="set-profile-label" htmlFor="user-dob">
                  {t('date_of_birth', 'Date of Birth')}
                </label>
                <span className="set-profile-18-badge">18+ ONLY</span>
              </div>
              <div className="set-input-box">
                <Calendar size={18} className="set-input-icon" />
                <input
                  id="user-dob"
                  type="date"
                  className="set-date-input"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  max={getMaxDobFor18Plus()}
                  required
                />
              </div>
              {dob && !isAtLeast18(dob) ? (
                <span className="set-dob-warning">
                  ❌ Must be 18+ years old (Current age: {calculateAge(dob)} years)
                </span>
              ) : (
                <span className="set-dob-hint">
                  🔞 {t('dob_18_mandatory_hint', 'Age must be 18 years or older to register')}
                </span>
              )}
            </div>

            {/* ── Confirm Button ── */}
            <button type="submit" className="set-profile-confirm-btn">
              <span>{t('confirm_continue', 'Confirm & Continue')}</span>
              <ArrowRight size={18} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

