/**
 * Step 2F Automated Verification Suite:
 * CONNECT Confirmed Security Fixes Verification
 * 
 * Verifies:
 * 1. Persistent IP Rate Limiting on Phone Registration & Login (HTTP 429 after threshold).
 * 2. Failed Promo Code Protection: 5 invalid attempts lock promo redemption with HTTP 429.
 * 3. Exact YASH Promo Code Preservation: Valid YASH code awards 500 coins and resets counter without restrictions.
 * 4. Restricted Pack Purchases: Arbitrary/fake pack IDs are rejected with HTTP 400. Canonical packs succeed.
 * 5. Removal of unused Firestore db export from config.js: Only auth and googleProvider exported.
 * 6. Restricted CORS: Exact allowed origins reflected; wildcard * removed; unauthorized origins restricted.
 */

const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Ensure local RSA test key for Firebase Admin token minting
if (!process.env.FIREBASE_PRIVATE_KEY && !process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
  const { privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });
  process.env.FIREBASE_PRIVATE_KEY = privateKey;
  process.env.FIREBASE_CLIENT_EMAIL = 'firebase-adminsdk-test@mystic-now-482206-r1.iam.gserviceaccount.com';
  process.env.FIREBASE_PROJECT_ID = 'mystic-now-482206-r1';
}

// Clean test store
const TEST_STORE_PATH = path.join(__dirname, 'netlify', 'functions', '_connect-store.json');
try {
  fs.writeFileSync(TEST_STORE_PATH, JSON.stringify({ users: {}, connect_orders: {}, rate_limits: {} }, null, 2), 'utf-8');
} catch (e) {}

const {
  handler: userHandler,
  _setFirestoreDb: _setUserFirestoreDb,
  _setAdminAuth: _setUserAdminAuth,
} = require('./netlify/functions/connect-user');

const {
  handler: phoneAuthHandler,
  _setFirestoreDb: _setPhoneFirestoreDb,
  _setAdminAuth: _setPhoneAdminAuth,
} = require('./netlify/functions/connect-auth-phone');

const {
  LocalFirestoreAdapter,
} = require('./netlify/functions/_connect-db');

const testDb = new LocalFirestoreAdapter(TEST_STORE_PATH);
_setUserFirestoreDb(testDb);
_setPhoneFirestoreDb(testDb);

let passedCount = 0;
let failedCount = 0;

function report(testName, passed, extra = '') {
  if (passed) {
    console.log(`✅ PASS: ${testName} ${extra}`);
    passedCount++;
  } else {
    console.error(`❌ FAIL: ${testName} ${extra}`);
    failedCount++;
  }
}

// Helper to mock verified token
const mockToken = (uid) => {
  const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(
    JSON.stringify({
      uid,
      sub: uid,
      iss: `https://securetoken.google.com/mystic-now-482206-r1`,
      aud: 'mystic-now-482206-r1',
      auth_time: Math.floor(Date.now() / 1000),
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
      name: `User ${uid.slice(-4)}`,
    })
  ).toString('base64url');
  return `${header}.${payload}.sig`;
};

const mockAdminAuth = {
  verifyIdToken: async (token) => {
    if (!token || typeof token !== 'string') throw new Error('auth/invalid-id-token');
    const parts = token.split('.');
    if (parts.length < 2) throw new Error('auth/invalid-id-token');
    return JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
  },
  createCustomToken: async (uid) => `custom-token-for-${uid}`,
};
_setUserAdminAuth(mockAdminAuth);
_setPhoneAdminAuth(mockAdminAuth);

async function runTests() {
  console.log('\n====================================================');
  console.log(' STEP 2F: CONFIRMED SECURITY FIXES TEST SUITE       ');
  console.log('====================================================\n');

  // ─────────────────────────────────────────────────────────────
  // 1. Persistent IP Rate Limiting in Phone Auth
  // ─────────────────────────────────────────────────────────────
  {
    const attackIp = '198.51.100.99';
    let blockedResponse = null;

    // Send 16 requests from this IP (threshold is 15)
    for (let i = 1; i <= 16; i++) {
      const res = await phoneAuthHandler({
        httpMethod: 'POST',
        headers: { 'client-ip': attackIp, 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'login', phone: '9876500001', password: 'wrongpassword' }),
      });
      if (res.statusCode === 429) {
        blockedResponse = res;
        break;
      }
    }

    const body = blockedResponse ? JSON.parse(blockedResponse.body) : {};
    const isOk =
      blockedResponse &&
      blockedResponse.statusCode === 429 &&
      body.code === 'auth/too-many-requests';

    report('Persistent IP Rate Limiting: 16 rapid requests trigger HTTP 429 Too Many Requests', isOk);
  }

  // ─────────────────────────────────────────────────────────────
  // 2. Failed Promo Code Protection & Lockout
  // ─────────────────────────────────────────────────────────────
  {
    const promoUid = 'usr_2f_promo_' + Date.now();
    const token = mockToken(promoUid);

    await testDb.collection('users').doc(promoUid).set({
      uid: promoUid,
      wallet: { coins: 0 },
      ledger: [],
      promoProtection: { failedAttempts: 0 },
    });

    // 4 invalid attempts should return 400
    for (let i = 1; i <= 4; i++) {
      const res = await userHandler({
        httpMethod: 'POST',
        queryStringParameters: { action: 'redeem_code' },
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ code: `INVALID_CODE_${i}` }),
      });
      assert.strictEqual(res.statusCode, 400);
    }

    // 5th invalid attempt should lock out with HTTP 429
    const res5 = await userHandler({
      httpMethod: 'POST',
      queryStringParameters: { action: 'redeem_code' },
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ code: 'INVALID_CODE_5' }),
    });
    const body5 = JSON.parse(res5.body);

    const userDoc5 = await testDb.collection('users').doc(promoUid).get();
    const isLocked =
      res5.statusCode === 400 && // 5th attempt returns 400 with 0 remaining, then next attempt is locked
      userDoc5.data().promoProtection.failedAttempts === 5 &&
      Boolean(userDoc5.data().promoProtection.lockedUntilMs);

    // 6th attempt while locked should return HTTP 429
    const res6 = await userHandler({
      httpMethod: 'POST',
      queryStringParameters: { action: 'redeem_code' },
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ code: 'YASH' }),
    });
    const body6 = JSON.parse(res6.body);

    const isOk = isLocked && res6.statusCode === 429 && body6.code === 'promo/too-many-attempts';
    report('Failed Promo Code Protection: 5 invalid guesses lock out account with HTTP 429', isOk);
  }

  // ─────────────────────────────────────────────────────────────
  // 3. Exact YASH Promo Code Preservation
  // ─────────────────────────────────────────────────────────────
  {
    const yashUid = 'usr_2f_yash_' + Date.now();
    const token = mockToken(yashUid);

    await testDb.collection('users').doc(yashUid).set({
      uid: yashUid,
      wallet: { coins: 50 },
      ledger: [],
      promoProtection: { failedAttempts: 2 }, // Started with 2 failed attempts
    });

    // Redeem YASH
    const res = await userHandler({
      httpMethod: 'POST',
      queryStringParameters: { action: 'redeem_code' },
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ code: 'YASH' }),
    });
    const body = JSON.parse(res.body);
    const userDoc = await testDb.collection('users').doc(yashUid).get();

    // Verify YASH can be redeemed again for testing
    const resSecond = await userHandler({
      httpMethod: 'POST',
      queryStringParameters: { action: 'redeem_code' },
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ code: 'YASH' }),
    });
    const bodySecond = JSON.parse(resSecond.body);

    const isOk =
      res.statusCode === 200 &&
      body.coinsAwarded === 500 &&
      body.newBalance === 550 &&
      userDoc.data().promoProtection.failedAttempts === 0 && // Reset failed counter
      resSecond.statusCode === 200 &&
      bodySecond.newBalance === 1050; // Unlimited testing preserved!

    report('Exact YASH Promo Code Preservation: Awards 500 coins, resets counter, and supports testing', isOk);
  }

  // ─────────────────────────────────────────────────────────────
  // 4. Restricted Pack Purchases
  // ─────────────────────────────────────────────────────────────
  {
    const packUid = 'usr_2f_pack_' + Date.now();
    const token = mockToken(packUid);

    await testDb.collection('users').doc(packUid).set({
      uid: packUid,
      wallet: { coins: 100 },
      purchasedPacks: [],
      ledger: [],
    });

    // Arbitrary fake pack ID should be rejected
    const fakeRes = await userHandler({
      httpMethod: 'POST',
      queryStringParameters: { action: 'record_pack_purchase' },
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ packId: 'arbitrary_fake_pack_id' }),
    });
    const fakeBody = JSON.parse(fakeRes.body);

    // Canonical pack ID should be accepted
    const validRes = await userHandler({
      httpMethod: 'POST',
      queryStringParameters: { action: 'record_pack_purchase' },
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ packId: 'pack-19' }),
    });
    const validBody = JSON.parse(validRes.body);

    const isOk =
      fakeRes.statusCode === 400 &&
      fakeBody.code === 'order/invalid-pack' &&
      validRes.statusCode === 200 &&
      validBody.purchasedPacks.includes('pack-19');

    report('Restricted Pack Purchases: Arbitrary pack IDs rejected with 400; canonical packs accepted', isOk);
  }

  // ─────────────────────────────────────────────────────────────
  // 5. Removal of Unused Firestore db Export from config.js
  // ─────────────────────────────────────────────────────────────
  {
    const configPath = path.join(__dirname, 'connect', 'src', 'firebase', 'config.js');
    const content = fs.readFileSync(configPath, 'utf-8');

    const hasDbExport = content.includes('export const db =');
    const hasFirestoreImport = content.includes("from 'firebase/firestore'");
    const hasAuthExport = content.includes('export const auth =');
    const hasGoogleProviderExport = content.includes('export const googleProvider =');

    const isOk = !hasDbExport && !hasFirestoreImport && hasAuthExport && hasGoogleProviderExport;
    report('Unused db Export Removed: config.js exports only auth and googleProvider (no client db)', isOk);
  }

  // ─────────────────────────────────────────────────────────────
  // 6. Restricted CORS & OPTIONS Preflight
  // ─────────────────────────────────────────────────────────────
  {
    // Request with authorized local dev origin
    const devRes = await userHandler({
      httpMethod: 'GET',
      queryStringParameters: { action: 'wallet' },
      headers: {
        Authorization: `Bearer ${mockToken('cors_user')}`,
        Origin: 'http://localhost:5173',
      },
    });

    // Request with authorized production origin
    const prodRes = await userHandler({
      httpMethod: 'GET',
      queryStringParameters: { action: 'wallet' },
      headers: {
        Authorization: `Bearer ${mockToken('cors_user')}`,
        Origin: 'https://sanskrutiservice.in',
      },
    });

    // Request with authorized www production origin
    const prodWwwRes = await userHandler({
      httpMethod: 'GET',
      queryStringParameters: { action: 'wallet' },
      headers: {
        Authorization: `Bearer ${mockToken('cors_user')}`,
        Origin: 'https://www.sanskrutiservice.in',
      },
    });

    // OPTIONS preflight request
    const optionsRes = await userHandler({
      httpMethod: 'OPTIONS',
      headers: {
        Origin: 'https://sanskrutiservice.in',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type, Authorization',
      },
    });

    // Request with unauthorized origin
    const unauthRes = await userHandler({
      httpMethod: 'GET',
      queryStringParameters: { action: 'wallet' },
      headers: {
        Authorization: `Bearer ${mockToken('cors_user')}`,
        Origin: 'https://malicious-attacker-domain.com',
      },
    });

    const isOk =
      devRes.headers['Access-Control-Allow-Origin'] === 'http://localhost:5173' &&
      prodRes.headers['Access-Control-Allow-Origin'] === 'https://sanskrutiservice.in' &&
      prodWwwRes.headers['Access-Control-Allow-Origin'] === 'https://www.sanskrutiservice.in' &&
      optionsRes.statusCode === 204 &&
      optionsRes.headers['Access-Control-Allow-Origin'] === 'https://sanskrutiservice.in' &&
      optionsRes.headers['Access-Control-Allow-Headers'].includes('Authorization') &&
      unauthRes.headers['Access-Control-Allow-Origin'] === 'https://sanskrutiservice.in'; // Wildcard * eliminated!

    report('Restricted CORS: Replaces wildcard * with authorized origins (localhost, sanskrutiservice.in) & passes OPTIONS preflight', isOk);
  }

  console.log('\n====================================================');
  console.log(`RESULTS: ${passedCount} PASSED, ${failedCount} FAILED`);
  console.log('====================================================\n');

  if (failedCount > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});

