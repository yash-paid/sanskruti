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

  return (
    <div className="profile-reward-calendar-card">
      {/* Header */}
      <div className="profile-calendar-header">
        <div className="profile-calendar-title-wrap">
          <Calendar size={18} color="#FFD700" />
          <h3 className="profile-calendar-title">Daily Login Rewards</h3>
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
          <div className="profile-calendar-status-box">
            <span className="status-badge-claimed">
              <Check size={14} /> Claimed Today
            </span>
            <span className="status-next-timer">
              <Clock size={12} /> Next claim in {rewardStatus?.timeUntilNextClaim || 'a few hours'}
            </span>
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

