import React from 'react';
import { Video, Phone, ShieldCheck } from 'lucide-react';

export default function FeatureBadges({ onSelectFeature }) {
  return (
    <div className="card-bottom-features" role="region" aria-label="Key Features">
      {/* 1. Video Call */}
      <div
        className="feature-col"
        onClick={() => onSelectFeature?.('High-Definition 1-on-1 Video Calling available')}
        title="HD Video Call"
      >
        <div className="feature-icon-wrapper">
          <Video size={24} fill="currentColor" strokeWidth={1.5} />
        </div>
        <span className="feature-label">Video Call</span>
      </div>

      <div className="feature-divider" aria-hidden="true" />

      {/* 2. Voice Call */}
      <div
        className="feature-col"
        onClick={() => onSelectFeature?.('Crystal-clear Voice Calling active')}
        title="Voice Call"
      >
        <div className="feature-icon-wrapper">
          <Phone size={22} fill="currentColor" strokeWidth={1.5} />
        </div>
        <span className="feature-label">Voice Call</span>
      </div>

      <div className="feature-divider" aria-hidden="true" />

      {/* 3. Safe & Private */}
      <div
        className="feature-col"
        onClick={() => onSelectFeature?.('100% End-to-End Encrypted & Safe connection')}
        title="Safe & Private"
      >
        <div className="feature-icon-wrapper">
          <ShieldCheck size={24} strokeWidth={2.2} />
        </div>
        <span className="feature-label">Safe &amp; Private</span>
      </div>
    </div>
  );
}

