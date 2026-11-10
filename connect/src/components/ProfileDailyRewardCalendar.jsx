import React, { useState, useEffect } from 'react';
import { Calendar, Check, Flame, Sparkles, Clock } from 'lucide-react';
import { DAILY_REWARDS, claimDailyReward, getDailyRewardStatus } from '../firebase/rewardService';
import { useLanguage } from '../context/LanguageContext';

export default function ProfileDailyRewardCalendar({
  uid,
  onRewardClaimed,
  onToast,
}) {
  const { t } = useLanguage();
  const [rewardStatus, setRewardStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isClaiming, setIsClaiming] = useState(false);

  useEffect(() => {
    if (uid) {
      loadStatus();
    }

    const handleRewardSync = () => {
      if (uid) {
        loadStatus();
      }
    };

    window.addEventListener('connect_daily_reward_updated', handleRewardSync);
    window.addEventListener('storage', handleRewardSync);
    return () => {
      window.removeEventListener('connect_daily_reward_updated', handleRewardSync);
      window.removeEventListener('storage', handleRewardSync);
    };
  }, [uid]);

  const loadStatus = async () => {
    try {
      const status = await getDailyRewardStatus(uid);
      setRewardStatus(status);
    } catch (e) {
      console.warn('Error loading calendar status:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleCollect = async () => {
    if (isClaiming || rewardStatus?.claimedToday || !uid) return;
    setIsClaiming(true);

    try {
      const result = await claimDailyReward(uid);
      onRewardClaimed?.(result.coinsAwarded, result.newBalance);
      onToast?.(`🎉 Claimed Day ${result.dayNumber} Daily Reward! (+${result.coinsAwarded} Coins)`);
      window.dispatchEvent(new CustomEvent('connect_daily_reward_updated', { detail: result }));
      await loadStatus();
    } catch (err) {
      if (err.message === 'ALREADY_CLAIMED_TODAY') {
        onToast?.("⚠️ Today's reward is already claimed!");
      } else {
        onToast?.('❌ Unable to claim reward. Please try again.');
      }
      await loadStatus();
    } finally {
      setIsClaiming(false);
    }
  };

  const currentStreak = rewardStatus?.currentStreak || 0;
  const claimedToday = rewardStatus?.claimedToday || false;
  const activeDay = rewardStatus?.nextDayNumber || 1;
  const claimedDayNumber = currentStreak > 0 ? ((currentStreak - 1) % 7) + 1 : activeDay;
  const claimedCoins = DAILY_REWARDS.find((r) => r.day === claimedDayNumber)?.coins || 10;

  return (
    <div className="profile-reward-calendar-card">
      {/* Header */}
      <div className="profile-calendar-header">
        <div className="profile-calendar-title-wrap">
          <Calendar size={18} color="#FFD700" />
          <h3 className="profile-calendar-title">Daily Login Rewards</h3>
          {claimedToday && (
            <span className="profile-already-claimed-pill">
              <Check size={11} strokeWidth={3} /> Already Claimed
            </span>
          )}
        </div>

        <div className="profile-calendar-streak-chip">
          <Flame size={13} color="#ff2a8d" fill="#ff2a8d" />
          <span>{currentStreak} Day Streak</span>
        </div>
      </div>

      <p className="profile-calendar-desc">
        Claim free coins every day. Complete all 7 days to earn bonus coins!
      </p>

      {/* 7-Day Horizontal Scroll Strip */}
      <div className="profile-calendar-strip">
        {DAILY_REWARDS.map((item) => {
          const isCompleted = item.day < activeDay || (item.day === activeDay && claimedToday);
          const isToday = item.day === activeDay && !claimedToday;
          const isBig = item.day === 7;

          return (
            <div
              key={item.day}
              className={`calendar-day-chip ${isCompleted ? 'completed' : ''} ${
                isToday ? 'active-today' : ''
              } ${isBig ? 'big-chip' : ''}`}
            >
              <div className="chip-day-label">D{item.day}</div>
              <div className="chip-icon-box">
                {isCompleted ? (
                  <Check size={14} color="#4ade80" strokeWidth={3} />
                ) : (
                  <span>{isBig ? '👑' : '🪙'}</span>
                )}
              </div>
              <div className="chip-coin-val">+{item.coins}</div>
            </div>
          );
        })}
      </div>

      {/* Collect Button & Next Info */}
      <div className="profile-calendar-bottom">
        {claimedToday ? (
          <div className="profile-calendar-already-claimed-card">
            <div className="already-claimed-top-row">
              <div className="already-claimed-check-wrap">
                <Check size={16} color="#4ade80" strokeWidth={3} />
              </div>
              <div className="already-claimed-info">
                <span className="already-claimed-title">Already Claimed Today ✅</span>
                <span className="already-claimed-desc">
                  Day {claimedDayNumber} (+{claimedCoins} Coins) collected • Next reward tomorrow!
                </span>
              </div>
            </div>
            <div className="already-claimed-timer-bar">
              <Clock size={12} color="#ffd700" />
              <span>Next reward unlocks in <strong>{rewardStatus?.timeUntilNextClaim || 'a few hours'}</strong></span>
            </div>
          </div>
        ) : (
          <button
            type="button"
            className="profile-calendar-collect-btn"
            onClick={handleCollect}
            disabled={isClaiming || loading}
          >
            <Sparkles size={16} color="#FFD700" />
            <span>
              {isClaiming
                ? 'Collecting...'
                : `Collect Day ${activeDay} (+${
                    DAILY_REWARDS.find((r) => r.day === activeDay)?.coins || 10
                  } Coins)`}
            </span>
          </button>
        )}
      </div>
    </div>
  );
}

