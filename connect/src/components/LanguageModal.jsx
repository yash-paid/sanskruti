import React from 'react';
import { X, Check, Globe } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function LanguageModal({ onClose, onToast }) {
  const { currentLang, setLanguage, LANGUAGES, t } = useLanguage();

  const handleSelect = (lang) => {
    setLanguage(lang.code);
    onToast?.(`🌐 Language set to ${lang.native} (${lang.name})`);
    onClose();
  };

  return (
    <div className="language-modal-overlay" onClick={onClose}>
      <div className="language-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="language-modal-header">
          <div className="lang-modal-title-row">
            <div className="lang-header-icon-wrap">
              <Globe size={18} color="#FFD700" />
            </div>
            <div>
              <h3 className="language-modal-title">{t('language', 'Select Language')}</h3>
              <p className="language-modal-sub">Choose your preferred language</p>
            </div>
          </div>
          <button className="language-modal-close" onClick={onClose} aria-label="Close">
            <X size={18} color="#c9b4d5" />
          </button>
        </div>

        {/* List of 8 Languages */}
        <div className="language-items-list">
          {LANGUAGES.map((lang) => {
            const isSelected = currentLang === lang.code;
            return (
              <div
                key={lang.code}
                className={`language-option-row ${isSelected ? 'selected' : ''}`}
                onClick={() => handleSelect(lang)}
              >
                <div className="lang-option-left">
                  <span className="lang-flag">{lang.flag}</span>
                  <div className="lang-names">
                    <span className="lang-native-name">{lang.native}</span>
                    <span className="lang-english-name">{lang.name}</span>
                  </div>
                </div>

                <div className="lang-radio-circle">
                  {isSelected ? (
                    <div className="lang-radio-active">
                      <Check size={12} color="#fff" strokeWidth={3} />
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

