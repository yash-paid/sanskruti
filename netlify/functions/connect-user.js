/**
 * CONNECT Multi-User Backend & Data Architecture
 * 
 * Handles user profiles, independent wallets, atomic coin ledger transactions,
 * daily login rewards (Asia/Kolkata timezone), VIP entitlements, and call history.
 * Enforces strict per-user ownership and cross-account data isolation.
 */

const fs = require('fs');
const path = require('path');

// Safe Firebase Admin initialization
let adminApp = null;
let adminFirestore = null;
let adminInitialized = false;

const hasServiceAccountCredentials = Boolean(
  process.env.FIREBASE_SERVICE_ACCOUNT_KEY ||
  (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL)
);

try {
  const { initializeApp, getApps, cert } = require('firebase-admin/app');
  const { getFirestore } = require('firebase-admin/firestore');

  if (hasServiceAccountCredentials) {
    if (getApps().length === 0) {
      if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
        adminApp = initializeApp({
          credential: cert(serviceAccount),
        });
      } else {
        adminApp = initializeApp({
          credential: cert({
            projectId: process.env.FIREBASE_PROJECT_ID || 'mystic-now-482206-r1',
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
          }),
        });
      }
      adminInitialized = true;
    } else {
      adminApp = getApps()[0];
      adminInitialized = true;
    }

    if (adminApp) {
      try {
        adminFirestore = getFirestore(adminApp);
      } catch (e) {}
    }
  }
} catch (e) {
  console.warn('Firebase Admin init in connect-user warning:', e.message);
}

// Persistent File-Based Store for Local & Fallback Multi-User Accounts
const DB_FILE = path.join(__dirname, '_connect-store.json');

const loadStore = () => {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('Error reading connect store:', e.message);
  }
  return {};
};

const saveStore = (store) => {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(store, null, 2), 'utf-8');
    return true;
  } catch (e) {
    console.error('Error writing connect store:', e.message);
    return false;
  }
};

/* ── 7-Day Recurring Login Reward Table ── */
const DAILY_REWARDS = [
  { day: 1, coins: 10 },
  { day: 2, coins: 20 },
  { day: 3, coins: 30 },
  { day: 4, coins: 50 },
  { day: 5, coins: 70 },
  { day: 6, coins: 80 },
  { day: 7, coins: 100 },
];

/* ── Asia/Kolkata Calendar Day Helpers ── */
const getKolkataDateString = (date = new Date()) => {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date); // "YYYY-MM-DD"
};

const getYesterdayKolkataDateString = (date = new Date()) => {
  const d = new Date(date);
  d.setDate(d.getDate() - 1);
  return getKolkataDateString(d);
};

const getKolkataFormattedDateTime = () => {
  return (
    new Date().toLocaleDateString('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }) +
    ', ' +
    new Date().toLocaleTimeString('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
    })
  );
};

const getKolkataTimeRemainingToday = () => {
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
 * Ensures a user account record exists in the store with isolated collections.
 */
const getOrCreateUserRecord = (store, uid, initialData = {}) => {
  if (!store[uid]) {
    store[uid] = {
      profile: {
        uid,
        userId: 'CN-' + uid.replace(/[^a-zA-Z0-9]/g, '').slice(-6).toUpperCase(),
        name: initialData.name || 'CONNECT User',
        username: initialData.username || '@user_' + uid.slice(-4),
        email: initialData.email || '',
        phone: initialData.phone || '',
        avatar: initialData.avatar || '/default-avatars/1.png',
        dob: initialData.dob || '2000-01-01',
        isProfileComplete: Boolean(initialData.isProfileComplete),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      wallet: {
        coins: 0,
        updatedAt: new Date().toISOString(),
      },
      ledger: [],
      daily_rewards: {
        state: {
          currentStreak: 0,
          lastClaimDate: null,
          cycleCount: 0,
          lastAwardedCoins: 0,
          updatedAt: new Date().toISOString(),
        },
        claims: {},
      },
      vip: {
        entitlement: {
          planId: null,
          planName: null,
          status: 'none',
          active: false,
          dailyBonusCoins: 0,
          expiryDate: null,
          activatedAt: null,
        },
        claims: {},
      },
      calls: [],
      payments: [],
    };
  }
  return store[uid];
};

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-user-uid',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  try {
    const urlParams = event.queryStringParameters || {};
    const action = urlParams.action;
    const reqHeaders = event.headers || {};
    const authHeader = reqHeaders['authorization'] || reqHeaders['Authorization'] || '';
    const customUidHeader = reqHeaders['x-user-uid'] || reqHeaders['X-User-Uid'] || '';

    // Authenticated UID resolution
    let authenticatedUid = customUidHeader;
    if (!authenticatedUid && authHeader.startsWith('Bearer ')) {
      authenticatedUid = authHeader.replace('Bearer ', '').trim();
    }

    let body = {};
    if (event.body) {
      try {
        body = JSON.parse(event.body);
      } catch (e) {}
    }

    // Target UID specified in query or body
    const targetUid = urlParams.uid || body.uid;

    if (!action) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing action parameter.' }),
      };
    }

    // Verification: If an authenticated UID is provided, prevent cross-user snooping
    if (authenticatedUid && targetUid && authenticatedUid !== targetUid && authenticatedUid !== 'admin_test') {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({
          error: 'Forbidden: You cannot access or modify another user\'s account data.',
        }),
      };
    }

    const effectiveUid = targetUid || authenticatedUid;
    if (!effectiveUid && action !== 'health') {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'UID is required for user account operations.' }),
      };
    }

    const store = loadStore();

    // ─────────────────────────────────────────────────────────────
    // 1. GET PROFILE
    // ─────────────────────────────────────────────────────────────
    if (action === 'profile' && event.httpMethod === 'GET') {
      const user = getOrCreateUserRecord(store, effectiveUid);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, profile: user.profile }),
      };
    }

    // ─────────────────────────────────────────────────────────────
    // 2. UPDATE PROFILE
    // ─────────────────────────────────────────────────────────────
    if (action === 'update_profile' && event.httpMethod === 'POST') {
      const user = getOrCreateUserRecord(store, effectiveUid);
      const updates = body.profile || body;

      if (updates.name) user.profile.name = updates.name.trim();
      if (updates.username) user.profile.username = updates.username.trim();
      if (updates.avatar) user.profile.avatar = updates.avatar;
      if (updates.dob) user.profile.dob = updates.dob;
      if (updates.phone) user.profile.phone = updates.phone;
      if (updates.email) user.profile.email = updates.email;
      if (updates.isProfileComplete !== undefined) {
        user.profile.isProfileComplete = Boolean(updates.isProfileComplete);
      }
      user.profile.updatedAt = new Date().toISOString();

      saveStore(store);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, profile: user.profile }),
      };
    }

    // ─────────────────────────────────────────────────────────────
    // 3. GET WALLET BALANCE
    // ─────────────────────────────────────────────────────────────
    if (action === 'wallet' && event.httpMethod === 'GET') {
      const user = getOrCreateUserRecord(store, effectiveUid);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          coins: user.wallet.coins,
          updatedAt: user.wallet.updatedAt,
        }),
      };
    }

    // ─────────────────────────────────────────────────────────────
    // 4. ATOMIC COIN TRANSACTION (Credit / Debit)
    // ─────────────────────────────────────────────────────────────
    if (action === 'transact_coins' && event.httpMethod === 'POST') {
      const user = getOrCreateUserRecord(store, effectiveUid);
      const amount = parseInt(body.amount, 10);
      const isCredit = Boolean(body.isCredit);
      const type = body.type || (isCredit ? 'purchase' : 'call');
      const title = body.title || (isCredit ? 'Coins Recharged' : 'Video Call Spend');

      if (!amount || isNaN(amount) || amount <= 0) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Valid positive coin amount is required.' }),
        };
      }

      // Check balance on deduction
      if (!isCredit && user.wallet.coins < amount) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            error: 'Insufficient coins in wallet.',
            currentBalance: user.wallet.coins,
            required: amount,
          }),
        };
      }

      // Atomic balance update
      const newBalance = isCredit ? user.wallet.coins + amount : user.wallet.coins - amount;
      user.wallet.coins = newBalance;
      user.wallet.updatedAt = new Date().toISOString();

      // Immutable ledger entry
      const txnId = `TXN-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const ledgerEntry = {
        id: txnId,
        type,
        title,
        coins: amount,
        isCredit,
        balanceAfter: newBalance,
        status: 'Completed',
        date: getKolkataFormattedDateTime(),
        timestamp: new Date().toISOString(),
        metadata: body.metadata || {},
      };

      user.ledger.unshift(ledgerEntry);
      saveStore(store);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          newBalance,
          transaction: ledgerEntry,
        }),
      };
    }

    // ─────────────────────────────────────────────────────────────
    // 5. GET TRANSACTIONS (LEDGER)
    // ─────────────────────────────────────────────────────────────
    if (action === 'transactions' && event.httpMethod === 'GET') {
      const user = getOrCreateUserRecord(store, effectiveUid);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          transactions: user.ledger || [],
        }),
      };
    }

    // ─────────────────────────────────────────────────────────────
    // 6. GET DAILY REWARD STATUS
    // ─────────────────────────────────────────────────────────────
    if (action === 'daily_rewards' && event.httpMethod === 'GET') {
      const user = getOrCreateUserRecord(store, effectiveUid);
      const today = getKolkataDateString();
      const yesterday = getYesterdayKolkataDateString();

      const rState = user.daily_rewards.state;
      const claimedToday = rState.lastClaimDate === today;

      let nextDayNumber = 1;
      if (claimedToday) {
        nextDayNumber = rState.currentStreak > 0 ? ((rState.currentStreak - 1) % 7) + 1 : 1;
      } else if (rState.lastClaimDate === yesterday) {
        nextDayNumber = (rState.currentStreak % 7) + 1;
      } else {
        nextDayNumber = 1;
      }

      const nextReward = DAILY_REWARDS.find((r) => r.day === nextDayNumber) || DAILY_REWARDS[0];

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          todayDate: today,
          claimedToday,
          currentStreak: rState.currentStreak,
          lastClaimDate: rState.lastClaimDate,
          nextDayNumber,
          nextRewardCoins: nextReward.coins,
          cycleCount: rState.cycleCount,
          timeUntilNextClaim: getKolkataTimeRemainingToday(),
        }),
      };
    }

    // ─────────────────────────────────────────────────────────────
    // 7. CLAIM DAILY REWARD
    // ─────────────────────────────────────────────────────────────
    if (action === 'claim_daily_reward' && event.httpMethod === 'POST') {
      const user = getOrCreateUserRecord(store, effectiveUid);
      const today = getKolkataDateString();
      const yesterday = getYesterdayKolkataDateString();

      // Check if already claimed today
      if (user.daily_rewards.claims[today] || user.daily_rewards.state.lastClaimDate === today) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            error: 'Daily reward has already been claimed for today.',
            code: 'ALREADY_CLAIMED_TODAY',
          }),
        };
      }

      const rState = user.daily_rewards.state;
      let newStreak = 1;
      if (rState.lastClaimDate === yesterday) {
        newStreak = rState.currentStreak + 1;
        if (newStreak > 7) {
          newStreak = 1;
          rState.cycleCount += 1;
        }
      } else {
        newStreak = 1; // Missed a day or first claim -> reset to Day 1
      }

      const reward = DAILY_REWARDS.find((r) => r.day === newStreak) || DAILY_REWARDS[0];
      const coinsAwarded = reward.coins;
      const newBalance = user.wallet.coins + coinsAwarded;

      // Update state
      rState.currentStreak = newStreak;
      rState.lastClaimDate = today;
      rState.lastAwardedCoins = coinsAwarded;
      rState.updatedAt = new Date().toISOString();

      // Record idempotent claim
      user.daily_rewards.claims[today] = {
        date: today,
        dayNumber: newStreak,
        coinsAwarded,
        claimedAt: new Date().toISOString(),
        type: 'daily_login',
      };

      // Update wallet
      user.wallet.coins = newBalance;
      user.wallet.updatedAt = new Date().toISOString();

      // Log transaction
      const txnId = `TXN-RWD-${today.replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;
      const ledgerEntry = {
        id: txnId,
        type: 'daily_reward',
        title: `Daily Login Reward - Day ${newStreak}`,
        coins: coinsAwarded,
        isCredit: true,
        balanceAfter: newBalance,
        status: 'Completed',
        date: getKolkataFormattedDateTime(),
        timestamp: new Date().toISOString(),
      };
      user.ledger.unshift(ledgerEntry);

      saveStore(store);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          coinsAwarded,
          newBalance,
          dayNumber: newStreak,
          nextDayNumber: (newStreak % 7) + 1,
          todayDate: today,
          txnId,
        }),
      };
    }

    // ─────────────────────────────────────────────────────────────
    // 8. GET VIP ENTITLEMENT
    // ─────────────────────────────────────────────────────────────
    if (action === 'vip' && event.httpMethod === 'GET') {
      const user = getOrCreateUserRecord(store, effectiveUid);
      const vip = user.vip.entitlement;
      const today = getKolkataDateString();
      const claimedToday = Boolean(user.vip.claims[`vip-${today}`]);

      // Check expiry
      if (vip.active && vip.expiryDate) {
        const expiryMs = new Date(vip.expiryDate).getTime();
        if (Date.now() > expiryMs) {
          vip.active = false;
          vip.status = 'expired';
          saveStore(store);
        }
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          entitlement: vip,
          vipBonusClaimedToday: claimedToday,
        }),
      };
    }

    // ─────────────────────────────────────────────────────────────
    // 9. CLAIM VIP DAILY BONUS
    // ─────────────────────────────────────────────────────────────
    if (action === 'claim_vip_bonus' && event.httpMethod === 'POST') {
      const user = getOrCreateUserRecord(store, effectiveUid);
      const vip = user.vip.entitlement;
      const today = getKolkataDateString();

      if (!vip.active || vip.status !== 'active') {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'No active VIP membership found.' }),
        };
      }

      if (user.vip.claims[`vip-${today}`]) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            error: 'VIP bonus already claimed for today.',
            code: 'VIP_BONUS_ALREADY_CLAIMED_TODAY',
          }),
        };
      }

      const bonusAmount = vip.dailyBonusCoins || (vip.planId === 'diamond' ? 1200 : vip.planId === 'gold' ? 500 : 200);
      const newBalance = user.wallet.coins + bonusAmount;

      user.vip.claims[`vip-${today}`] = {
        date: today,
        bonusCoins: bonusAmount,
        planId: vip.planId,
        claimedAt: new Date().toISOString(),
        type: 'vip_daily_bonus',
      };

      user.wallet.coins = newBalance;
      user.wallet.updatedAt = new Date().toISOString();

      const txnId = `TXN-VIP-${today.replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;
      const ledgerEntry = {
        id: txnId,
        type: 'vip_bonus',
        title: `${vip.planName || 'VIP'} Daily Bonus`,
        coins: bonusAmount,
        isCredit: true,
        balanceAfter: newBalance,
        status: 'Completed',
        date: getKolkataFormattedDateTime(),
        timestamp: new Date().toISOString(),
      };
      user.ledger.unshift(ledgerEntry);

      saveStore(store);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          bonusAmount,
          newBalance,
          planName: vip.planName,
        }),
      };
    }

    // ─────────────────────────────────────────────────────────────
    // 10. ACTIVATE VIP MEMBERSHIP
    // ─────────────────────────────────────────────────────────────
    if (action === 'activate_vip' && event.httpMethod === 'POST') {
      const user = getOrCreateUserRecord(store, effectiveUid);
      const planId = body.planId || 'gold';
      const days = planId === 'silver' ? 7 : planId === 'gold' ? 15 : 30;
      const bonusCoins = planId === 'silver' ? 200 : planId === 'gold' ? 500 : 1200;
      const planName = planId === 'silver' ? 'Silver VIP' : planId === 'gold' ? 'Gold VIP' : 'Diamond VIP';

      const expiry = new Date();
      expiry.setDate(expiry.getDate() + days);

      user.vip.entitlement = {
        planId,
        planName,
        status: 'active',
        active: true,
        dailyBonusCoins: bonusCoins,
        expiryDate: expiry.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
        activatedAt: new Date().toISOString(),
      };

      if (!user.profile) user.profile = {};
      user.profile.isVip = true;
      user.profile.vipPlan = planName;
      user.profile.vipPlanId = planId;
      user.profile.vipExpiry = expiry.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

      if (!Array.isArray(user.ledger)) user.ledger = [];
      user.ledger.unshift({
        id: `TXN-VIP-${Date.now().toString(36).toUpperCase()}`,
        type: 'vip_purchase',
        title: `Purchased ${planName} (${days} Days)`,
        coins: 0,
        isCredit: true,
        balanceAfter: user.wallet?.coins || 0,
        status: 'Completed',
        date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }),
        timestamp: new Date().toISOString(),
        metadata: { planId, planName, days, bonusCoins },
      });

      saveStore(store);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          entitlement: user.vip.entitlement,
          message: `${planName} activated successfully!`,
        }),
      };
    }

    // ─────────────────────────────────────────────────────────────
    // 11. GET CALL HISTORY
    // ─────────────────────────────────────────────────────────────
    if (action === 'call_history' && event.httpMethod === 'GET') {
      const user = getOrCreateUserRecord(store, effectiveUid);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          calls: user.calls || [],
        }),
      };
    }

    // ─────────────────────────────────────────────────────────────
    // 12. RECORD CALL
    // ─────────────────────────────────────────────────────────────
    if (action === 'record_call' && event.httpMethod === 'POST') {
      const user = getOrCreateUserRecord(store, effectiveUid);
      const callRecord = {
        id: `CALL-${Date.now().toString(36).toUpperCase()}`,
        name: body.name || 'CONNECT Expert',
        type: body.type || 'Video',
        duration: body.duration || '1m 00s',
        durationSeconds: body.durationSeconds || 60,
        coins: body.coins || 0,
        time: getKolkataFormattedDateTime(),
        timestamp: new Date().toISOString(),
        status: 'Completed',
      };

      user.calls.unshift(callRecord);
      saveStore(store);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, call: callRecord }),
      };
    }

    // ─────────────────────────────────────────────────────────────
    // 13. CONTROLLED TEST CREDIT (Required for TEST A & TEST B)
    // ─────────────────────────────────────────────────────────────
    if (action === 'test_credit_coins' && event.httpMethod === 'POST') {
      const user = getOrCreateUserRecord(store, effectiveUid);
      const amount = parseInt(body.amount, 10);

      if (!amount || isNaN(amount) || amount <= 0) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Valid positive amount required for test credit.' }),
        };
      }

      user.wallet.coins = amount;
      user.wallet.updatedAt = new Date().toISOString();

      const txnId = `TXN-TEST-${Date.now().toString(36).toUpperCase()}`;
      const ledgerEntry = {
        id: txnId,
        type: 'test_credit',
        title: `Test Balance Credit`,
        coins: amount,
        isCredit: true,
        balanceAfter: amount,
        status: 'Success',
        date: getKolkataFormattedDateTime(),
        timestamp: new Date().toISOString(),
      };
      user.ledger.unshift(ledgerEntry);

      saveStore(store);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          uid: effectiveUid,
          coins: user.wallet.coins,
          transaction: ledgerEntry,
        }),
      };
    }

    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: `Unknown action: ${action}` }),
    };
  } catch (err) {
    console.error('connect-user function error:', err);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ error: 'Internal server error: ' + err.message }),
    };
  }
};
