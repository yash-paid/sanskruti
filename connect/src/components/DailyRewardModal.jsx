import React, { useState, useEffect } from 'react';
import { X, Sparkles, Check, Gift, Flame, Clock } from 'lucide-react';
import { DAILY_REWARDS, claimDailyReward, getDailyRewardStatus } from '../firebase/rewardService';
import { useLanguage } from '../context/LanguageContext';

export default function DailyRewardModal({
  isOpen,
  uid,
  onClose,
  onRewardClaimed,
  onToast,
}) {
  const { t } = useLanguage();
  const [rewardStatus, setRewardStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isClaiming, setIsClaiming] = useState(false);
  const [showCoinBurst, setShowCoinBurst] = useState(false);
  const [claimedReward, setClaimedReward] = useState(null);

  useEffect(() => {
    if (isOpen && uid) {
      loadStatus();
    }
  }, [isOpen, uid]);

  const loadStatus = async () => {
    setLoading(true);
    try {
      const status = await getDailyRewardStatus(uid);
      setRewardStatus(status);
    } catch (e) {
      console.warn('Error loading reward status:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleClaim = async () => {
    if (isClaiming || rewardStatus?.claimedToday) return;
    setIsClaiming(true);

    try {
      const result = await claimDailyReward(uid);
      setClaimedReward(result);
      setShowCoinBurst(true);

      // Notify parent to update wallet balance in app
      onRewardClaimed?.(result.coinsAwarded, result.newBalance);
      onToast?.(`🎉 Claimed Day ${result.dayNumber} Daily Reward! (+${result.coinsAwarded} Coins)`);

      // Refresh status to reflect claimed state
      await loadStatus();

      // Dispatch global event so profile calendar and home screen sync instantly
      window.dispatchEvent(new CustomEvent('connect_daily_reward_updated', { detail: result }));

      // Automatically dismiss the popup after showing celebration
      setTimeout(() => {
        setShowCoinBurst(false);
        onClose?.();
      }, 1500);
    } catch (err) {
      console.warn('Claim error:', err);
      if (err.message === 'ALREADY_CLAIMED_TODAY') {
        onToast?.('⚠️ You have already claimed your daily reward for today!');
      } else {
        onToast?.('❌ Could not claim reward. Please check your connection.');
      }
      await loadStatus();
    } finally {
      setIsClaiming(false);
    }
  };

  if (!isOpen) return null;

  const currentStreak = rewardStatus?.currentStreak || 0;
  const claimedToday = rewardStatus?.claimedToday || false;
  const activeDay = rewardStatus?.nextDayNumber || 1;

  return (
    <div className="daily-reward-overlay" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="daily-reward-modal" onClick={(e) => e.stopPropagation()}>
        {/* Ambient Top Glow */}
        <div className="daily-reward-glow" aria-hidden="true" />

        {/* Close Button */}
        <button
          type="button"
          className="daily-reward-close-btn"
          onClick={onClose}
          aria-label="Close"
        >
          <X size={18} color="#fff" />
        </button>

        {/* Modal Header */}
        <div className="daily-reward-header">
          <div className="daily-reward-streak-badge">
            <Flame size={14} color="#FFD700" fill="#FFD700" />
            <span>
              {currentStreak > 0 ? `${currentStreak} Day Streak 🔥` : 'Start Your Streak!'}
            </span>
          </div>

          <h2 className="daily-reward-title">Daily Login Rewards</h2>
          <p className="daily-reward-subtitle">
            Log in daily to claim bigger coin rewards. Miss a day and streak resets to Day 1!
          </p>
        </div>

        {/* 7-Day Rewards Grid */}
        <div className="daily-reward-grid">
          {DAILY_REWARDS.map((item) => {
            const isCompleted = item.day < activeDay || (item.day === activeDay && claimedToday);
            const isToday = item.day === activeDay && !claimedToday;
            const isBigDay = item.day === 7;

            return (
              <div
                key={item.day}
                className={`daily-reward-card ${isCompleted ? 'completed' : ''} ${
                  isToday ? 'active-today' : ''
                } ${isBigDay ? 'big-reward' : ''}`}
              >
                <div className="reward-day-pill">Day {item.day}</div>

                <div className="reward-icon-wrap">
                  {isCompleted ? (
                    <div className="reward-check-circle">
                      <Check size={18} color="#fff" strokeWidth={3} />
                    </div>
                  ) : (
                    <span className="reward-coin-icon">{isBigDay ? '👑' : '🪙'}</span>
                  )}
                </div>

                <div className="reward-coin-val">+{item.coins}</div>
                <div className="reward-coin-lbl">Coins</div>

                {isToday && <div className="today-badge">TODAY</div>}
              </div>
            );
          })}
        </div>

        {/* Coin Burst Animation Overlay */}
        {showCoinBurst && (
          <div className="coin-burst-stage" aria-hidden="true">
            <div className="coin-burst-center">
              <span className="burst-emoji">🪙</span>
              <span className="burst-amount">+{claimedReward?.coinsAwarded} Coins!</span>
            </div>
            {[...Array(14)].map((_, i) => (
              <span
                key={i}
                className="burst-particle"
                style={{
                  left: `${15 + i * 5.5}%`,
                  animationDelay: `${(i % 5) * 0.12}s`,
                }}
              >
                ✨
              </span>
            ))}
          </div>
        )}

        {/* Footer Actions */}
        <div className="daily-reward-footer">
          {claimedToday ? (
            <div className="daily-reward-claimed-box">
              <div className="claimed-status-row">
                <Check size={16} color="#4ade80" strokeWidth={3} />
                <span>Today's Reward Already Claimed!</span>
              </div>
              <div className="claimed-next-hint">
                <Clock size={13} />
                <span>Next reward opens in {rewardStatus?.timeUntilNextClaim || 'a few hours'}</span>
              </div>
              <button
                type="button"
                className="daily-reward-already-claimed-btn"
                onClick={onClose}
              >
                Already Claimed Today • Close
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="daily-reward-claim-btn"
              onClick={handleClaim}
              disabled={isClaiming || loading}
            >
              <Sparkles size={18} color="#FFD700" />
              <span>
                {isClaiming
                  ? 'Claiming Coins...'
                  : `Collect Day ${activeDay} (+${
                      DAILY_REWARDS.find((r) => r.day === activeDay)?.coins || 10
                    } Coins)`}
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

