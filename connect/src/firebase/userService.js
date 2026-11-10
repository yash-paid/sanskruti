/**
 * CONNECT User Data & Multi-Account Service
 * 
 * Provides isolated data operations for authenticated users via the secure backend.
 * Never shares balances, profiles, transactions, or VIP entitlements between accounts.
 */

const API_BASE = '/.netlify/functions/connect-user';

/**
 * Standard fetch helper with auth headers
 */
const apiCall = async (action, options = {}) => {
  const { uid, method = 'GET', body, query = {} } = options;
  if (!uid) {
    throw new Error('Authentication required: Missing UID.');
  }

  const queryParams = new URLSearchParams({ action, uid, ...query });
  const url = `${API_BASE}?${queryParams.toString()}`;

  const headers = {
    'Content-Type': 'application/json',
    'x-user-uid': uid,
  };

  const response = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify({ uid, ...body }) : undefined,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.error || `Request failed with status ${response.status}`);
    error.status = response.status;
    error.code = data.code;
    throw error;
  }

  return data;
};

/**
 * Fetch a user's isolated profile
 */
export const fetchUserProfile = async (uid) => {
  if (!uid) return null;
  const res = await apiCall('profile', { uid });
  return res.profile;
};

/**
 * Update a user's isolated profile
 */
export const saveUserProfile = async (uid, profileData) => {
  if (!uid) throw new Error('Missing UID');
  const res = await apiCall('update_profile', {
    uid,
    method: 'POST',
    body: { profile: profileData },
  });
  return res.profile;
};

/**
 * Fetch confirmed live wallet coin balance
 */
export const fetchUserWallet = async (uid) => {
  if (!uid) return 0;
  const res = await apiCall('wallet', { uid });
  return typeof res.coins === 'number' ? res.coins : 0;
};

/**
 * Perform atomic coin transaction (credit or debit) with server validation
 */
export const transactUserCoins = async (uid, { amount, isCredit, type, title, metadata = {} }) => {
  if (!uid) throw new Error('Authentication required');
  const res = await apiCall('transact_coins', {
    uid,
    method: 'POST',
    body: {
      amount,
      isCredit: Boolean(isCredit),
      type,
      title,
      metadata,
    },
  });
  return res;
};

/**
 * Fetch the user's isolated transaction ledger
 */
export const fetchUserTransactions = async (uid) => {
  if (!uid) return [];
  const res = await apiCall('transactions', { uid });
  return res.transactions || [];
};

/**
 * Fetch daily reward streak status
 */
export const fetchUserDailyRewardState = async (uid) => {
  if (!uid) return null;
  return await apiCall('daily_rewards', { uid });
};

/**
 * Claim daily login reward
 */
export const claimUserDailyReward = async (uid) => {
  if (!uid) throw new Error('Authentication required');
  return await apiCall('claim_daily_reward', {
    uid,
    method: 'POST',
  });
};

/**
 * Fetch VIP entitlement status
 */
export const fetchUserVipEntitlement = async (uid) => {
  if (!uid) return { entitlement: null, vipBonusClaimedToday: false };
  return await apiCall('vip', { uid });
};

/**
 * Claim VIP Daily Bonus
 */
export const claimUserVipBonus = async (uid) => {
  if (!uid) throw new Error('Authentication required');
  return await apiCall('claim_vip_bonus', {
    uid,
    method: 'POST',
  });
};

/**
 * Activate VIP Membership for a user
 */
export const activateUserVip = async (uid, planId) => {
  if (!uid) throw new Error('Authentication required');
  return await apiCall('activate_vip', {
    uid,
    method: 'POST',
    body: { planId },
  });
};

/**
 * Fetch call history
 */
export const fetchUserCallHistory = async (uid) => {
  if (!uid) return [];
  const res = await apiCall('call_history', { uid });
  return res.calls || [];
};

/**
 * Record a completed call
 */
export const recordUserCall = async (uid, callData) => {
  if (!uid) return null;
  const res = await apiCall('record_call', {
    uid,
    method: 'POST',
    body: callData,
  });
  return res.call;
};

/**
 * Controlled test credit operation for verification
 */
export const testCreditCoins = async (uid, amount) => {
  const res = await apiCall('test_credit_coins', {
    uid,
    method: 'POST',
    body: { amount },
  });
  return res;
};

