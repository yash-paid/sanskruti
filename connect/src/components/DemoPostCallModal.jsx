import React from 'react';
import { Video, CheckCircle2, X } from 'lucide-react';

/**
 * CONNECT Post-Call Modal
 * Shown after incoming call ends.
 * Displays the user's actual wallet balance and provides a direct pathway
 * to call back or recharge if coins are insufficient.
 */
export default function DemoPostCallModal({
  caller,
  coins,
  onStartRealCall,
  onClose,
}) {
  if (!caller) return null;

  const userCoins = Number(coins) || 0;
  const callRate = caller.price || 65;
  const hasSufficientCoins = userCoins >= callRate;

  return (
    <div className="demo-postcall-overlay" role="dialog" aria-modal="true" aria-label="Call Ended">
      <div className="demo-postcall-card">
        {/* Close Button */}
        <button
          type="button"
          className="demo-postcall-close-btn"
          onClick={onClose}
          aria-label="Close"
        >
          <X size={20} color="#c9b4d5" />
        </button>

        {/* ── Caller Avatar Stage ── */}
        <div className="demo-postcall-avatar-wrap">
          <div className="demo-postcall-avatar-ring">
            <img
              src={caller.photo}
              alt={caller.name}
              className="demo-postcall-photo"
              onError={(e) => {
                e.target.src = '/default-avatars/1.png';
              }}
            />
          </div>
        </div>

        {/* ── Heading ── */}
        <div className="demo-postcall-name-row">
          <h3 className="demo-postcall-title">{caller.name}</h3>
          {caller.verified !== false && (
            <CheckCircle2 size={18} fill="#ff2a8d" color="#ffffff" />
          )}
        </div>
        <p className="demo-postcall-sub">Video Call Ended • Duration: 00:10</p>

        {/* ── Real Wallet Balance Display ── */}
        <div className="demo-postcall-wallet-box">
          <span className="demo-wallet-label">Your Coin Balance</span>
          <div className="demo-wallet-amount">
            <span className="demo-wallet-coin-icon">🪙</span>
            <span className="demo-wallet-num">{userCoins.toLocaleString()}</span>
            <span className="demo-wallet-unit">Coins</span>
          </div>
          {!hasSufficientCoins && (
            <span className="demo-wallet-hint">
              Video call with {caller.name} requires {callRate} Coins/Min.
            </span>
          )}
        </div>

        {/* ── Action Buttons ── */}
        <div className="demo-postcall-actions">
          {/* Call Back Button */}
          <button
            type="button"
            className="demo-postcall-primary-btn"
            onClick={() => {
              onClose?.();
              onStartRealCall?.(caller);
            }}
          >
            <Video size={18} color="#ffffff" />
            <span>Call Back</span>
            <span className="demo-btn-rate-tag">🪙 {callRate} / min</span>
          </button>

          {/* Back to Home Button */}
          <button
            type="button"
            className="demo-postcall-secondary-btn"
            onClick={onClose}
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}
