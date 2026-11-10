/**
 * Step 2C Automated Verification Suite:
 * VIP Security, Payment Verification, and Automatic Fulfilment
 * 
 * Verifies:
 * 1. Guest cannot activate VIP without payment (403 VIP_PAYMENT_REQUIRED).
 * 2. Authenticated user cannot directly activate Diamond VIP (403 VIP_PAYMENT_REQUIRED).
 * 3. Client cannot forge plan, price, UID, or duration on initiation.
 * 4. Unauthenticated VIP initiation is rejected with 401.
 * 5. Valid authenticated VIP initiation creates pending order in connect_orders with canonical plan values.
 * 6. Tampered PayU hash never activates VIP.
 * 7. Payment amount mismatch never activates VIP.
 * 8. Cancelled / failed PayU callback updates order to cancelled/failed and never activates VIP.
 * 9. Valid PayU callback atomically activates VIP entitlement, sets expiryDateMs, and records ledger entry.
 * 10. Duplicate PayU callback delivery is idempotent and does not double-activate or duplicate ledger entries.
 * 11. Active VIP can claim daily bonus once per day (500 coins for Gold VIP).
 * 12. Active VIP cannot claim daily bonus twice on the same day (VIP_BONUS_ALREADY_CLAIMED_TODAY).
 * 13. Expired VIP is rejected from claiming daily bonus (VIP_MEMBERSHIP_EXPIRED) and marked expired.
 * 14. Non-VIP user calling claim_vip_bonus is rejected (NO_ACTIVE_VIP).
 * 15. YASH promo code behavior remains intact.
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

const TEST_STORE_PATH = path.join(__dirname, 'netlify', 'functions', '_connect-store.json');
try {
  fs.writeFileSync(TEST_STORE_PATH, JSON.stringify({ users: {}, connect_orders: {} }, null, 2), 'utf-8');
} catch (e) {}

const { handler: userHandler } = require('./netlify/functions/connect-user');
const { handler: initiateHandler } = require('./netlify/functions/connect-payu-initiate');
const { handler: responseHandler } = require('./netlify/functions/payu-response');
const {
  getDb,
  _setFirestoreDb,
  _setAdminAuth,
  LocalFirestoreAdapter,
} = require('./netlify/functions/_connect-db');
const {
  _setFirestoreDb: _setUserFirestoreDb,
  _setAdminAuth: _setUserAdminAuth,
} = require('./netlify/functions/connect-user');
const { getPayUConfig } = require('./netlify/functions/_payu-config');

const testDb = new LocalFirestoreAdapter(TEST_STORE_PATH);
_setFirestoreDb(testDb);
_setUserFirestoreDb(testDb);

const mockUsers = new Map();
const createMockToken = (uid, customClaims = {}) => {
  const token = `test_token_${uid}_${crypto.randomBytes(8).toString('hex')}`;
  mockUsers.set(token, {
    uid,
    email: `${uid}@example.com`,
    name: `User ${uid}`,
    phone_number: '+919876500000',
    ...customClaims,
  });
  return token;
};

const mockAdminAuth = {
  verifyIdToken: async (token) => {
    if (!token || typeof token !== 'string') {
      const err = new Error('Decoding Firebase ID token failed.');
      err.code = 'auth/argument-error';
      throw err;
    }
    const user = mockUsers.get(token);
    if (!user) {
      const err = new Error('Firebase ID token has expired or is invalid.');
      err.code = 'auth/id-token-expired';
      throw err;
    }
    return user;
  },
};
_setAdminAuth(mockAdminAuth);
_setUserAdminAuth(mockAdminAuth);

function computeReverseHash(params, salt) {
  const {
    key = '',
    txnid = '',
    amount = '',
    productinfo = '',
    firstname = '',
    email = '',
    udf1 = '',
    udf2 = '',
    udf3 = '',
    udf4 = '',
    udf5 = '',
    status = '',
  } = params;

  const hashString = [
    salt,
    status,
    '', '', '', '', '',
    udf5,
    udf4,
    udf3,
    udf2,
    udf1,
    email,
    firstname,
    productinfo,
    amount,
    txnid,
    key,
  ].join('|');

  return crypto.createHash('sha512').update(hashString, 'utf-8').digest('hex');
}

let passed = 0;
let failed = 0;

function report(name, isPass, detail = '') {
  if (isPass) {
    console.log(`✅ PASS: ${name}`);
    passed++;
  } else {
    console.error(`❌ FAIL: ${name} - ${detail}`);
    failed++;
  }
}

async function runTests() {
  console.log('\n====================================================');
  console.log(' STEP 2C: VIP SECURITY & PAYMENT VERIFICATION TESTS ');
  console.log('====================================================\n');

  const config = getPayUConfig();
  const guestUid = 'guest_user_111';
  const authUserUid = 'vip_user_alpha_222';
  const expiredVipUid = 'vip_user_expired_333';

  const guestToken = createMockToken(guestUid, { is_anonymous: true });
  const authToken = createMockToken(authUserUid);
  const expiredToken = createMockToken(expiredVipUid);

  // Initialize accounts in test database
  await testDb.collection('users').doc(guestUid).set({
    profile: { uid: guestUid, name: 'Guest User' },
    wallet: { coins: 0, updatedAt: new Date().toISOString() },
    vip: { entitlement: { active: false, status: 'none' } },
    ledger: [],
  });

  await testDb.collection('users').doc(authUserUid).set({
    profile: { uid: authUserUid, name: 'VIP Alpha' },
    wallet: { coins: 0, updatedAt: new Date().toISOString() },
    vip: { entitlement: { active: false, status: 'none' } },
    ledger: [],
  });

  // TEST 1: Guest cannot directly call activate_vip
  {
    const res = await userHandler({
      httpMethod: 'POST',
      queryStringParameters: { action: 'activate_vip' },
      headers: { Authorization: `Bearer ${guestToken}` },
      body: JSON.stringify({ planId: 'diamond' }),
    });

    const isOk =
      res.statusCode === 403 &&
      JSON.parse(res.body).code === 'VIP_PAYMENT_REQUIRED';
    report('Guest cannot activate VIP directly (returns 403 VIP_PAYMENT_REQUIRED)', isOk);
  }

  // TEST 2: Authenticated user cannot directly activate Diamond VIP
  {
    const res = await userHandler({
      httpMethod: 'POST',
      queryStringParameters: { action: 'activate_vip' },
      headers: { Authorization: `Bearer ${authToken}` },
      body: JSON.stringify({ planId: 'diamond' }),
    });

    const isOk =
      res.statusCode === 403 &&
      JSON.parse(res.body).code === 'VIP_PAYMENT_REQUIRED';
    report('Authenticated user cannot directly activate Diamond VIP (returns 403 VIP_PAYMENT_REQUIRED)', isOk);
  }

  // TEST 3: Unauthenticated VIP initiation is rejected
  {
    const res = await initiateHandler({
      httpMethod: 'POST',
      headers: {},
      body: JSON.stringify({ planId: 'gold' }),
    });

    const isOk = res.statusCode === 401;
    report('Unauthenticated VIP initiation is rejected with 401', isOk);
  }

  // TEST 4: Client cannot forge plan or price on initiation
  {
    const res = await initiateHandler({
      httpMethod: 'POST',
      headers: { Authorization: `Bearer ${authToken}` },
      body: JSON.stringify({ planId: 'fake_free_tier', price: 0 }),
    });

    const isOk =
      res.statusCode === 400 &&
      JSON.parse(res.body).code === 'order/invalid-item';
    report('Forged / unrecognized VIP plan is rejected with 400 Bad Request', isOk);
  }

  // TEST 5: Valid authenticated initiation creates pending order with canonical values
  let initiatedTxnId = '';
  let initiatedParams = {};
  {
    const res = await initiateHandler({
      httpMethod: 'POST',
      headers: { Authorization: `Bearer ${authToken}` },
      body: JSON.stringify({
        planId: 'gold',
        price: 1, // Attempted price override by client (must be ignored)
        durationDays: 365, // Attempted duration override (must be ignored)
      }),
    });

    const body = JSON.parse(res.body);
    initiatedTxnId = body.params?.txnid;
    initiatedParams = body.params;

    const orderDoc = await testDb.collection('connect_orders').doc(initiatedTxnId).get();
    const orderData = orderDoc.data();

    const isOk =
      res.statusCode === 200 &&
      body.success === true &&
      body.params?.amount === '399.00' && // Canonical gold price ₹399
      body.params?.udf1 === authUserUid && // Verified UID
      body.params?.udf2 === 'connect-vip-gold' &&
      body.params?.udf3 === 'connect_vip_subscription' &&
      body.params?.udf4 === '15' && // Canonical 15 days
      orderDoc.exists &&
      orderData.uid === authUserUid &&
      orderData.orderType === 'vip' &&
      orderData.planId === 'gold' &&
      orderData.expectedAmount === 399 &&
      orderData.durationDays === 15 &&
      orderData.dailyBonusCoins === 500 &&
      orderData.status === 'pending' &&
      orderData.fulfilled === false;

    report('Valid VIP initiation creates pending order with server-enforced canonical price and duration', isOk);
  }

  // TEST 6: Tampered PayU hash never activates VIP
  {
    const tamperedParams = {
      key: config.key,
      txnid: initiatedTxnId,
      amount: '399.00',
      productinfo: initiatedParams.productinfo,
      firstname: initiatedParams.firstname,
      email: initiatedParams.email,
      udf1: initiatedParams.udf1,
      udf2: initiatedParams.udf2,
      udf3: initiatedParams.udf3,
      udf4: initiatedParams.udf4,
      udf5: initiatedParams.udf5,
      status: 'success',
      hash: 'tampered_fake_sha512_hash',
      mihpayid: 'payu_vip_fake_mih',
    };

    const res = await responseHandler({
      httpMethod: 'POST',
      body: new URLSearchParams(tamperedParams).toString(),
    });

    const userDoc = await testDb.collection('users').doc(authUserUid).get();
    const orderDoc = await testDb.collection('connect_orders').doc(initiatedTxnId).get();

    const isOk =
      res.statusCode === 303 &&
      res.headers.Location.includes('status=tampered') &&
      orderDoc.data().status === 'tampered' &&
      userDoc.data().vip?.entitlement?.active !== true;

    report('Tampered PayU response hash never activates VIP entitlement', isOk);
  }

  // TEST 7: Payment amount mismatch never activates VIP
  let mismatchTxnId = '';
  {
    const initRes = await initiateHandler({
      httpMethod: 'POST',
      headers: { Authorization: `Bearer ${authToken}` },
      body: JSON.stringify({ planId: 'gold' }),
    });
    mismatchTxnId = JSON.parse(initRes.body).params.txnid;

    const mismatchParams = {
      key: config.key,
      txnid: mismatchTxnId,
      amount: '199.00', // Received silver price instead of gold 399!
      productinfo: 'CONNECT Gold VIP (15 Days)',
      firstname: 'User Alpha',
      email: `${authUserUid}@connect.local`,
      udf1: authUserUid,
      udf2: 'connect-vip-gold',
      udf3: 'connect_vip_subscription',
      udf4: '15',
      udf5: 'connect',
      status: 'success',
      mihpayid: 'payu_mismatch_mih_1',
    };
    mismatchParams.hash = computeReverseHash(mismatchParams, config.salt);

    const res = await responseHandler({
      httpMethod: 'POST',
      body: new URLSearchParams(mismatchParams).toString(),
    });

    const userDoc = await testDb.collection('users').doc(authUserUid).get();
    const orderDoc = await testDb.collection('connect_orders').doc(mismatchTxnId).get();

    const isOk =
      res.statusCode === 303 &&
      res.headers.Location.includes('status=failed') &&
      orderDoc.data().status === 'amount_mismatch' &&
      userDoc.data().vip?.entitlement?.active !== true;

    report('Payment amount mismatch never activates VIP', isOk);
  }

  // TEST 8: Cancelled payment updates order to cancelled and never activates VIP
  {
    const initRes = await initiateHandler({
      httpMethod: 'POST',
      headers: { Authorization: `Bearer ${authToken}` },
      body: JSON.stringify({ planId: 'diamond' }),
    });
    const cancelTxnId = JSON.parse(initRes.body).params.txnid;

    const cancelParams = {
      key: config.key,
      txnid: cancelTxnId,
      amount: '799.00',
      productinfo: 'CONNECT Diamond VIP (30 Days)',
      firstname: 'User Alpha',
      email: `${authUserUid}@connect.local`,
      udf1: authUserUid,
      udf2: 'connect-vip-diamond',
      udf3: 'connect_vip_subscription',
      udf4: '30',
      udf5: 'connect',
      status: 'cancel',
      error_Message: 'User cancelled on PayU checkout',
      mihpayid: 'payu_cancel_mih_2',
    };
    cancelParams.hash = computeReverseHash(cancelParams, config.salt);

    const res = await responseHandler({
      httpMethod: 'POST',
      body: new URLSearchParams(cancelParams).toString(),
    });

    const userDoc = await testDb.collection('users').doc(authUserUid).get();
    const orderDoc = await testDb.collection('connect_orders').doc(cancelTxnId).get();

    const isOk =
      res.statusCode === 303 &&
      res.headers.Location.includes('status=cancelled') &&
      orderDoc.data().status === 'cancelled' &&
      userDoc.data().vip?.entitlement?.active !== true;

    report('Cancelled payment updates order to cancelled and never activates VIP', isOk);
  }

  // TEST 9: Valid PayU callback atomically activates VIP, sets expiryDateMs, and records ledger
  let successfulVipTxnId = '';
  {
    const initRes = await initiateHandler({
      httpMethod: 'POST',
      headers: { Authorization: `Bearer ${authToken}` },
      body: JSON.stringify({ planId: 'gold' }), // ₹399, 15 days, 500 bonus coins/day
    });
    successfulVipTxnId = JSON.parse(initRes.body).params.txnid;

    const successParams = {
      key: config.key,
      txnid: successfulVipTxnId,
      amount: '399.00',
      productinfo: 'CONNECT Gold VIP (15 Days)',
      firstname: 'User Alpha',
      email: `${authUserUid}@connect.local`,
      udf1: authUserUid,
      udf2: 'connect-vip-gold',
      udf3: 'connect_vip_subscription',
      udf4: '15',
      udf5: 'connect',
      status: 'success',
      mihpayid: 'payu_vip_success_mih_999',
      bank_ref_num: 'BANK_VIP_8888',
    };
    successParams.hash = computeReverseHash(successParams, config.salt);

    const res = await responseHandler({
      httpMethod: 'POST',
      body: new URLSearchParams(successParams).toString(),
    });

    const userDoc = await testDb.collection('users').doc(authUserUid).get();
    const orderDoc = await testDb.collection('connect_orders').doc(successfulVipTxnId).get();
    const userData = userDoc.data();
    const orderData = orderDoc.data();
    const vip = userData.vip?.entitlement;
    const ledger = userData.ledger || [];

    const isOk =
      res.statusCode === 303 &&
      res.headers.Location.includes('status=success') &&
      res.headers.Location.includes('type=vip') &&
      orderData.status === 'success' &&
      orderData.fulfilled === true &&
      vip &&
      vip.active === true &&
      vip.status === 'active' &&
      vip.planId === 'gold' &&
      vip.planName === 'Gold VIP' &&
      vip.dailyBonusCoins === 500 &&
      typeof vip.expiryDateMs === 'number' &&
      vip.expiryDateMs > Date.now() &&
      userData.profile?.isVip === true &&
      userData.profile?.vipPlan === 'Gold VIP' &&
      ledger.length === 1 &&
      ledger[0].id === `TXN-VIP-${successfulVipTxnId}` &&
      ledger[0].type === 'vip_purchase';

    report('Valid PayU callback atomically activates VIP entitlement with expiryDateMs and ledger entry', isOk);
  }

  // TEST 10: Duplicate PayU callback delivery is idempotent
  {
    const successParams = {
      key: config.key,
      txnid: successfulVipTxnId,
      amount: '399.00',
      productinfo: 'CONNECT Gold VIP (15 Days)',
      firstname: 'User Alpha',
      email: `${authUserUid}@connect.local`,
      udf1: authUserUid,
      udf2: 'connect-vip-gold',
      udf3: 'connect_vip_subscription',
      udf4: '15',
      udf5: 'connect',
      status: 'success',
      mihpayid: 'payu_vip_success_mih_999',
      bank_ref_num: 'BANK_VIP_8888',
    };
    successParams.hash = computeReverseHash(successParams, config.salt);

    const res = await responseHandler({
      httpMethod: 'POST',
      body: new URLSearchParams(successParams).toString(),
    });

    const userDoc = await testDb.collection('users').doc(authUserUid).get();
    const userData = userDoc.data();
    const ledger = userData.ledger || [];

    const isOk =
      res.statusCode === 303 &&
      ledger.length === 1; // Strict idempotency: exactly 1 purchase ledger entry

    report('Duplicate callback does not double-activate VIP or duplicate ledger entries', isOk);
  }

  // TEST 11: Active VIP can claim daily bonus once
  {
    const res = await userHandler({
      httpMethod: 'POST',
      queryStringParameters: { action: 'claim_vip_bonus' },
      headers: { Authorization: `Bearer ${authToken}` },
    });

    const body = JSON.parse(res.body);
    const userDoc = await testDb.collection('users').doc(authUserUid).get();
    const userData = userDoc.data();

    const isOk =
      res.statusCode === 200 &&
      body.success === true &&
      body.bonusAmount === 500 &&
      userData.wallet.coins === 500 &&
      userData.ledger.length === 2 && // 1 vip_purchase + 1 vip_bonus
      userData.ledger[0].type === 'vip_bonus' &&
      userData.ledger[0].amount === 500;

    report('Active Gold VIP successfully claims 500 coins daily bonus', isOk);
  }

  // TEST 12: Active VIP cannot claim daily bonus twice on same day
  {
    const res = await userHandler({
      httpMethod: 'POST',
      queryStringParameters: { action: 'claim_vip_bonus' },
      headers: { Authorization: `Bearer ${authToken}` },
    });

    const body = JSON.parse(res.body);
    const userDoc = await testDb.collection('users').doc(authUserUid).get();

    const isOk =
      res.statusCode === 400 &&
      body.code === 'VIP_BONUS_ALREADY_CLAIMED_TODAY' &&
      userDoc.data().wallet.coins === 500; // Remains 500!

    report('Second bonus claim on same day is rejected with VIP_BONUS_ALREADY_CLAIMED_TODAY', isOk);
  }

  // TEST 13: Expired VIP cannot claim daily bonus and is marked expired
  {
    // Setup expired VIP user in Firestore
    const expiredPastMs = Date.now() - (24 * 60 * 60 * 1000); // Expired yesterday
    await testDb.collection('users').doc(expiredVipUid).set({
      profile: { uid: expiredVipUid, name: 'Expired VIP', isVip: true },
      wallet: { coins: 0, updatedAt: new Date().toISOString() },
      vip: {
        entitlement: {
          active: true, // Currently marked active
          status: 'active',
          planId: 'diamond',
          dailyBonusCoins: 1200,
          expiryDateMs: expiredPastMs,
          expiryDate: new Date(expiredPastMs).toLocaleDateString('en-IN'),
        },
      },
      ledger: [],
    });

    const res = await userHandler({
      httpMethod: 'POST',
      queryStringParameters: { action: 'claim_vip_bonus' },
      headers: { Authorization: `Bearer ${expiredToken}` },
    });

    const body = JSON.parse(res.body);
    const userDoc = await testDb.collection('users').doc(expiredVipUid).get();
    const userData = userDoc.data();

    const isOk =
      res.statusCode === 400 &&
      body.code === 'VIP_MEMBERSHIP_EXPIRED' &&
      userData.wallet.coins === 0 && // No coins credited
      userData.vip.entitlement.active === false && // Marked inactive
      userData.vip.entitlement.status === 'expired' &&
      userData.profile.isVip === false;

    report('Expired VIP is rejected with VIP_MEMBERSHIP_EXPIRED and atomically marked expired', isOk);
  }

  // TEST 14: Non-VIP user calling claim_vip_bonus is rejected
  {
    const res = await userHandler({
      httpMethod: 'POST',
      queryStringParameters: { action: 'claim_vip_bonus' },
      headers: { Authorization: `Bearer ${guestToken}` },
    });

    const isOk =
      res.statusCode === 400 &&
      JSON.parse(res.body).code === 'NO_ACTIVE_VIP';
    report('Non-VIP user calling claim_vip_bonus is rejected with NO_ACTIVE_VIP', isOk);
  }

  // TEST 15: YASH promo code behavior remains preserved
  {
    const promoUserUid = 'promo_test_user_777';
    const promoToken = createMockToken(promoUserUid);
    await testDb.collection('users').doc(promoUserUid).set({
      profile: { uid: promoUserUid, name: 'Promo User' },
      wallet: { coins: 0, updatedAt: new Date().toISOString() },
      ledger: [],
    });

    const res = await userHandler({
      httpMethod: 'POST',
      queryStringParameters: { action: 'redeem_code' },
      headers: { Authorization: `Bearer ${promoToken}` },
      body: JSON.stringify({ code: 'YASH' }),
    });

    const userDoc = await testDb.collection('users').doc(promoUserUid).get();
    const isOk =
      res.statusCode === 200 &&
      JSON.parse(res.body).coinsAwarded === 500 &&
      userDoc.data().wallet.coins === 500;

    report('YASH promo code behavior remains strictly preserved for testing', isOk);
  }

  console.log('\n====================================================');
  console.log(`RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});

