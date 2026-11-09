import React from 'react';
import heartLogo from '../../assets/images/heart-logo-transparent.png';
import modelPortrait from '../../assets/images/model-blended.png';
import { useLanguage } from '../context/LanguageContext';

export default function Header() {
  const { t } = useLanguage();

  return (
    <header className="hero-section">
      <div className="hero-branding">
        {/* Pink Heart CONNECT Logo */}
        <div className="hero-logo-wrapper" title="CONNECT Logo">
          <img
            src={heartLogo}
            alt="CONNECT Pink Heart Logo"
            className="hero-logo-img"
          />
        </div>

        {/* CONNECT Bold Heading */}
        <h1 className="hero-title">CONNECT</h1>

        {/* Subtitles */}
        <div className="hero-subtitle-container">
          <span className="hero-subtitle-line1">{t('hero_subtitle_line1', 'Live Video & Voice')}</span>
          <span className="hero-subtitle-line2">{t('hero_subtitle_line2', 'Connection')}</span>
          <div className="hero-accent-bar" aria-hidden="true" />
        </div>
      </div>

      {/* Indian Female Portrait (Top Right) */}
      <div className="hero-portrait-wrapper" aria-label="Portrait">
        <img
          src={modelPortrait}
          alt="Indian female model with traditional jhumka earrings"
          className="hero-portrait-img"
        />
      </div>
    </header>
  );
}
