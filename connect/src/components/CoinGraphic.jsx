import React from 'react';

export function CoinStackGraphic({ size = 44, isLarge = false }) {
  if (isLarge) {
    // Large coin stack for the top Wallet Balance card
    return (
      <svg
        width={size}
        height={size * 0.75}
        viewBox="0 0 160 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="coin-stack-svg"
      >
        <defs>
          <linearGradient id="gold-grad-1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFF2A3" />
            <stop offset="25%" stopColor="#FFD54F" />
            <stop offset="60%" stopColor="#FFA000" />
            <stop offset="100%" stopColor="#FF6F00" />
          </linearGradient>
          <linearGradient id="gold-edge-1" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFA000" />
            <stop offset="100%" stopColor="#E65100" />
          </linearGradient>
          <filter id="gold-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Back coin bottom left */}
        <ellipse cx="45" cy="85" rx="32" ry="12" fill="url(#gold-edge-1)" />
        <ellipse cx="45" cy="80" rx="32" ry="12" fill="url(#gold-grad-1)" />

        {/* Coin mid stack */}
        <ellipse cx="48" cy="72" rx="32" ry="12" fill="url(#gold-edge-1)" />
        <ellipse cx="48" cy="67" rx="32" ry="12" fill="url(#gold-grad-1)" />

        {/* Coin mid stack top */}
        <ellipse cx="52" cy="59" rx="32" ry="12" fill="url(#gold-edge-1)" />
        <ellipse cx="52" cy="54" rx="32" ry="12" fill="url(#gold-grad-1)" />

        {/* Top standing/leaning front coin with Heart */}
        <g transform="translate(75, 20)">
          {/* Shadow */}
          <ellipse cx="42" cy="76" rx="36" ry="10" fill="rgba(0,0,0,0.35)" filter="blur(3px)" />

          {/* 3D Edge */}
          <ellipse cx="38" cy="46" rx="34" ry="38" fill="url(#gold-edge-1)" />
          
          {/* Main Face */}
          <ellipse cx="40" cy="44" rx="32" ry="36" fill="url(#gold-grad-1)" stroke="#FFF9C4" strokeWidth="2.5" />

          {/* Inner ring */}
          <ellipse cx="40" cy="44" rx="26" ry="29" fill="none" stroke="#FF8F00" strokeWidth="1.5" strokeDasharray="3 2" />

          {/* Heart Emblem */}
          <path
            d="M40 52 C32 45 28 40 28 34 C28 30 31 27 35 27 C37.5 27 39.5 28.5 40 30.5 C40.5 28.5 42.5 27 45 27 C49 27 52 30 52 34 C52 40 48 45 40 52 Z"
            fill="#FFF8E1"
            stroke="#FFA000"
            strokeWidth="1.2"
            filter="drop-shadow(0 1px 2px rgba(230, 81, 0, 0.4))"
          />
        </g>
      </svg>
    );
  }

  // Standard package coin stack
  return (
    <svg
      width={size}
      height={size * 0.72}
      viewBox="0 0 70 50"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="coin-pack-svg"
    >
      <defs>
        <linearGradient id="gold-pack-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFF2A3" />
          <stop offset="35%" stopColor="#FFD54F" />
          <stop offset="70%" stopColor="#FFA000" />
          <stop offset="100%" stopColor="#FF6F00" />
        </linearGradient>
        <linearGradient id="gold-pack-edge" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFA000" />
          <stop offset="100%" stopColor="#D84315" />
        </linearGradient>
      </defs>

      {/* Back Stack */}
      <ellipse cx="25" cy="36" rx="16" ry="6" fill="url(#gold-pack-edge)" />
      <ellipse cx="25" cy="33" rx="16" ry="6" fill="url(#gold-pack-grad)" />

      <ellipse cx="27" cy="28" rx="16" ry="6" fill="url(#gold-pack-edge)" />
      <ellipse cx="27" cy="25" rx="16" ry="6" fill="url(#gold-pack-grad)" />

      {/* Front Standing Coin with Heart */}
      <g transform="translate(22, 6)">
        <ellipse cx="20" cy="21" rx="15" ry="17" fill="url(#gold-pack-edge)" />
        <ellipse cx="21" cy="20" rx="14" ry="16" fill="url(#gold-pack-grad)" stroke="#FFF9C4" strokeWidth="1.2" />

        {/* Small Heart */}
        <path
          d="M21 24 C17 20 15 17 15 14 C15 12 16.5 10.5 18.5 10.5 C19.8 10.5 20.7 11.2 21 12 C21.3 11.2 22.2 10.5 23.5 10.5 C25.5 10.5 27 12 27 14 C27 17 25 20 21 24 Z"
          fill="#FFFDE7"
          stroke="#FFA000"
          strokeWidth="0.8"
        />
      </g>
    </svg>
  );
}

