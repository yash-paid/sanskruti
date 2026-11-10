import React, { useState, useEffect } from 'react';
import { Calendar, Check, Flame, Sparkles, Clock, Crown } from 'lucide-react';
import {
  DAILY_REWARDS,
  claimDailyReward,
  getDailyRewardStatus,
  getKolkataTimeRemainingToday,
} from '../firebase/rewardService';
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

  const currentStreak = rewardStatus?.currentStreak || 1;
  const claimedToday = rewardStatus?.claimedToday || false;
  const activeDay = rewardStatus?.nextDayNumber || 1;
  const claimedDayNumber = currentStreak > 0 ? ((currentStreak - 1) % 7) + 1 : activeDay;
  const claimedCoins = DAILY_REWARDS.find((r) => r.day === claimedDayNumber)?.coins || 10;
  const nextUnlockTime = rewardStatus?.timeUntilNextClaim || getKolkataTimeRemainingToday();

  return (
    <div className="profile-reward-calendar-card">
      {/* ── Header Row ── */}
      <div className="profile-calendar-header">
        <div className="profile-calendar-title-wrap">
          <Calendar size={22} color="#ffd700" className="profile-calendar-icon" />
          <h3 className="profile-calendar-title">
            Daily Login<br />Rewards
          </h3>
        </div>

        <div className="profile-calendar-header-pills">
          {claimedToday ? (
            <span className="profile-status-pill claimed">
              <Check size={11} strokeWidth={3.5} /> ALREADY CLAIMED
            </span>
          ) : (
            <button
              type="button"
              className="profile-status-pill claim-now"
              onClick={handleCollect}
              disabled={isClaiming || loading}
            >
              {isClaiming ? 'CLAIMING...' : 'CLAIM REWARD'}
            </button>
          )}

          <div className="profile-streak-pill">
            <Flame size={12} color="#fff" fill="#ff2a8d" />
            <span>
              {currentStreak} Day<br />Streak
            </span>
          </div>
        </div>
      </div>

      {/* ── Subtitle ── */}
      <p className="profile-calendar-desc">
        Claim free coins every day. Complete all 7 days to earn bonus coins!
      </p>

      {/* ── 7 Equal Day Cards Grid ── */}
      <div className="profile-calendar-grid">
        {DAILY_REWARDS.map((item) => {
          const isCompleted = item.day < activeDay || (item.day === activeDay && claimedToday);
          const isToday = item.day === activeDay && !claimedToday;
          const isDay7 = item.day === 7;

          return (
            <div
              key={item.day}
              className={`calendar-day-box ${isCompleted ? 'completed' : ''} ${
                isToday ? 'active-today' : ''
              } ${isDay7 ? 'day-7-crown' : ''}`}
              onClick={isToday ? handleCollect : undefined}
            >
              <div className="day-box-label">D{item.day}</div>
              <div className="day-box-icon">
                {isCompleted ? (
                  <Check size={15} color="#00e676" strokeWidth={3.5} />
                ) : isDay7 ? (
                  <Crown size={16} color="#ffd700" fill="#ffd700" />
                ) : (
                  <span className="day-coin-stack">🪙</span>
                )}
              </div>
              <div className="day-box-coins">+{item.coins}</div>
            </div>
          );
        })}
      </div>

      {/* ── Bottom Status / Collect Box ── */}
      <div className="profile-calendar-bottom">
        {claimedToday ? (
          <div className="profile-claimed-box">
            <div className="claimed-box-top">
              <div className="claimed-check-circle">
                <Check size={14} color="#00e676" strokeWidth={3.5} />
              </div>
              <div className="claimed-text-group">
                <span className="claimed-title">Already Claimed Today ✔</span>
                <span className="claimed-subtitle">
                  Day {claimedDayNumber} (+{claimedCoins} Coins) collected • Next reward tomorrow!
                </span>
              </div>
            </div>
            <div className="claimed-countdown-bar">
              <Clock size={13} color="#ffd700" />
              <span>
                Next reward unlocks in <strong>{nextUnlockTime}</strong>
              </span>
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
                : `Claim Day ${activeDay} Reward (+${
                    DAILY_REWARDS.find((r) => r.day === activeDay)?.coins || 10
                  } Coins)`}
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
