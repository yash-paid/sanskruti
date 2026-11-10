/**
 * CONNECT User Data & Multi-Account Service
 * 
 * Provides isolated data operations for authenticated users via the secure backend.
 * Never shares balances, profiles, transactions, or VIP entitlements between accounts.
 */

import { auth } from './config';

const API_BASE = '/.netlify/functions/connect-user';

/**
 * Retrieves the current user's Firebase ID token
 */
export const getFirebaseIdToken = async () => {
  if (auth?.currentUser) {
    try {
      return await auth.currentUser.getIdToken();
    } catch (e) {
      console.warn('Failed to retrieve Firebase ID token from currentUser:', e);
    }
  }

  if (typeof auth?.authStateReady === 'function') {
    try {
      await auth.authStateReady();
      if (auth.currentUser) {
        return await auth.currentUser.getIdToken();
      }
    } catch (e) {}
  }

  return null;
};

/**
 * Standard fetch helper with verified Firebase ID token Authorization header
 */
const apiCall = async (action, options = {}) => {
  const { uid, method = 'GET', body, query = {} } = options;

  const idToken = await getFirebaseIdToken();

  const queryParams = new URLSearchParams({ action, ...(uid ? { uid } : {}), ...query });
  const url = `${API_BASE}?${queryParams.toString()}`;

  const headers = {
    'Content-Type': 'application/json',
  };

  if (idToken) {
    headers['Authorization'] = `Bearer ${idToken}`;
  }

  const response = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify({ ...(uid ? { uid } : {}), ...body }) : undefined,
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
 * Perform atomic coin transaction (credit or debit) with backend authority & idempotency
 */
export const transactUserCoins = async (uid, { amount, isCredit, type, title, idempotencyKey, metadata = {} }) => {
  if (!uid) throw new Error('Authentication required');
  const res = await apiCall('transact_coins', {
    uid,
    method: 'POST',
    body: {
      amount,
      isCredit: Boolean(isCredit),
      type,
      title,
      idempotencyKey,
      metadata,
    },
  });
  return res;
};

/**
 * Fetch the user's isolated transaction ledger with optional cursor pagination
 */
export const fetchUserTransactions = async (uid, options = {}) => {
  if (!uid) return [];
  const { cursor, limit = 20 } = typeof options === 'object' ? options : {};
  const query = {};
  if (limit) query.limit = limit;
  if (cursor) query.cursor = cursor;
  const res = await apiCall('transactions', { uid, query });
  const list = Array.isArray(res.transactions) ? res.transactions : [];
  list.pagination = res.pagination || { hasMore: false, nextCursor: null, limit };
  return list;
};

/**
 * Fetch user's persistent favourites from Firestore
 */
export const fetchUserFavourites = async (uid) => {
  if (!uid) return [];
  const res = await apiCall('favourites', { uid });
  return res.favourites || [];
};

/**
 * Toggle favourite expert in Firestore
 */
export const toggleUserFavourite = async (uid, expertId) => {
  if (!uid || !expertId) return [];
  const res = await apiCall('toggle_favourite', {
    uid,
    method: 'POST',
    body: { expertId },
  });
  return res;
};

/**
 * Batch update favourites in Firestore
 */
export const saveUserFavourites = async (uid, favourites) => {
  if (!uid) return [];
  const res = await apiCall('update_favourites', {
    uid,
    method: 'POST',
    body: { favourites },
  });
  return res.favourites || [];
};

/**
 * Fetch user's purchased packs from Firestore
 */
export const fetchUserPurchasedPacks = async (uid) => {
  if (!uid) return [];
  const res = await apiCall('purchased_packs', { uid });
  return res.purchasedPacks || [];
};

/**
 * Record a pack purchase in Firestore
 */
export const recordUserPurchasedPack = async (uid, packId) => {
  if (!uid || !packId) return [];
  const res = await apiCall('record_pack_purchase', {
    uid,
    method: 'POST',
    body: { packId },
  });
  return res.purchasedPacks || [];
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
 * Redeem promo code (e.g. YASH -> 500 Coins)
 */
export const redeemPromoCode = async (uid, code, clientBalance) => {
  if (!uid) throw new Error('Authentication required');
  return await apiCall('redeem_code', {
    uid,
    method: 'POST',
    body: { code, clientBalance },
    query: { code },
  });
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

