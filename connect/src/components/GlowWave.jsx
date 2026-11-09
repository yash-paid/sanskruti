import React from 'react';

export default function GlowWave() {
  return (
    <div className="neon-wave-container" aria-hidden="true">
      <svg
        viewBox="0 0 1000 120"
        fill="none"
        preserveAspectRatio="none"
        className="neon-wave-svg"
      >
        <defs>
          <filter id="neon-glow-deep" x="-20%" y="-40%" width="140%" height="180%">
            <feGaussianBlur stdDeviation="8" result="blur1" />
            <feGaussianBlur stdDeviation="16" result="blur2" />
            <feMerge>
              <feMergeNode in="blur2" />
              <feMergeNode in="blur1" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Ambient Bloom Layer */}
        <path
          d="M -10,48 C 140,15 320,52 520,105 C 720,145 860,65 1010,72"
          stroke="rgba(255, 42, 141, 0.45)"
          strokeWidth="16"
          strokeLinecap="round"
          filter="url(#neon-glow-deep)"
        />

        {/* Mid Radiant Glow Layer */}
        <path
          d="M -10,48 C 140,15 320,52 520,105 C 720,145 860,65 1010,72"
          stroke="#ff2a8d"
          strokeWidth="6"
          strokeLinecap="round"
        />

        {/* High-intensity Core Neon Filament */}
        <path
          d="M -10,48 C 140,15 320,52 520,105 C 720,145 860,65 1010,72"
          stroke="#ff8ac4"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

