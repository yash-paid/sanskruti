/**
 * CONNECT Real Daily Rewards & VIP Benefits Service
 * 
 * Enforces Asia/Kolkata timezone calendar days, strict 7-day recurring cycles,
 * atomic idempotent database transactions, immutable ledger audit logs,
 * and verified VIP entitlements via the secure backend API.
 */

import {
  fetchUserDailyRewardState,
  claimUserDailyReward,
  claimUserVipBonus,
  fetchUserTransactions,
} from './userService';

/* ── 7-Day Recurring Login Reward Table ── */
export const DAILY_REWARDS = [
  { day: 1, coins: 10, label: 'Day 1' },
  { day: 2, coins: 20, label: 'Day 2' },
  { day: 3, coins: 30, label: 'Day 3' },
  { day: 4, coins: 50, label: 'Day 4' },
  { day: 5, coins: 70, label: 'Day 5' },
  { day: 6, coins: 80, label: 'Day 6' },
  { day: 7, coins: 100, label: 'Day 7' },
];

/* ── Asia/Kolkata Calendar Day Helpers ── */
export const getKolkataDateString = (date = new Date()) => {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date); // Format: "YYYY-MM-DD"
};

export const getYesterdayKolkataDateString = (date = new Date()) => {
  const d = new Date(date);
  d.setDate(d.getDate() - 1);
  return getKolkataDateString(d);
};

export const getKolkataTimeRemainingToday = () => {
  const now = new Date();
  const kolkataNowString = now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
  const kolkataNow = new Date(kolkataNowString);

  const midnight = new Date(kolkataNow);
  midnight.setHours(24, 0, 0, 0);

  const diffMs = midnight.getTime() - kolkataNow.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  return `${diffHours}h ${diffMins}m`;
};

/**
 * Gets the current daily reward status for an authenticated user.
 */
export const getDailyRewardStatus = async (uid) => {
  if (!uid) return null;
  try {
    return await fetchUserDailyRewardState(uid);
  } catch (err) {
    console.warn('getDailyRewardStatus fallback:', err);
    const today = getKolkataDateString();
    return {
      todayDate: today,
      claimedToday: false,
      currentStreak: 1,
      lastClaimDate: null,
      nextDayNumber: 1,
      nextRewardCoins: 10,
      cycleCount: 0,
      timeUntilNextClaim: getKolkataTimeRemainingToday(),
    };
  }
};

/**
 * Atomically claims the daily login reward in the user's isolated account.
 */
export const claimDailyReward = async (uid) => {
  if (!uid) throw new Error('Authentication required');
  return await claimUserDailyReward(uid);
};

/**
 * Checks and claims VIP Daily Bonus.
 */
export const claimVipDailyBonus = async (uid) => {
  if (!uid) throw new Error('Authentication required');
  return await claimUserVipBonus(uid);
};

/**
 * Fetches real transaction history from user ledger.
 */
export const fetchUserLedger = async (uid, options = {}) => {
  if (!uid) return [];
  try {
    return await fetchUserTransactions(uid, options);
  } catch (err) {
    console.warn('fetchUserLedger error:', err);
    return [];
  }
};
