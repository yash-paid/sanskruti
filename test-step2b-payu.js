/**
 * Step 2B Automated Verification Suite:
 * CONNECT PayU Verified Server-Side Wallet Recharge Integration
 * 
 * Verifies:
 * 1. Missing Authorization header on initiation returns 401 Unauthorized.
 * 2. Malformed / invalid Firebase ID token returns 401 Unauthorized.
 * 3. Invalid/unknown coin package ID returns 400 Bad Request.
 * 4. Valid initiation creates pending order in Firestore connect_orders and returns PayU params + SHA-512 hash.
 * 5. PayU callback with tampered reverse hash is rejected and does NOT credit coins.
 * 6. PayU callback with amount mismatch is rejected and does NOT credit coins.
 * 7. PayU callback with valid reverse hash atomically credits wallet, writes ledger entry, and marks order fulfilled.
 * 8. Duplicate / replay PayU callback is idempotent and does NOT credit coins twice.
 * 9. Cancelled / failed PayU callback updates order status to cancelled/failed and does NOT credit coins.
 * 10. Cross-user isolation: User A's payment credits User A and never touches User B's wallet.
 * 11. Preserves existing eBook checkout flow compatibility.
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
  fs.writeFileSync(TEST_STORE_PATH, JSON.stringify({ users: {}, connect_orders: {} }, null, 2), 'utf-8');
} catch (e) {}

const { handler: initiateHandler } = require('./netlify/functions/connect-payu-initiate');
const { handler: responseHandler } = require('./netlify/functions/payu-response');
const {
  getDb,
  _setFirestoreDb,
  _setAdminAuth,
  LocalFirestoreAdapter,
} = require('./netlify/functions/_connect-db');
const { getPayUConfig } = require('./netlify/functions/_payu-config');

// Setup in-memory local adapter
const testDb = new LocalFirestoreAdapter(TEST_STORE_PATH);
_setFirestoreDb(testDb);

// Mock Firebase Admin Auth for token minting and verification
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

/**
 * Helper to compute PayU valid reverse hash for testing
 * sha512(SALT|status||||||udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key)
 */
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
    '', '', '', '', '', // 6 structural pipes between status and udf5
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
  console.log(' STEP 2B: CONNECT PAYU SECURE WALLET RECHARGE TESTS  ');
  console.log('====================================================\n');

  const config = getPayUConfig();
  const userA_Uid = 'user_payu_alpha_123';
  const userB_Uid = 'user_payu_bravo_456';
  const tokenA = createMockToken(userA_Uid);
  const tokenB = createMockToken(userB_Uid);

  // Initialize User A and User B in database
  await testDb.collection('users').doc(userA_Uid).set({
    profile: { uid: userA_Uid, name: 'User A' },
    wallet: { coins: 0, updatedAt: new Date().toISOString() },
    ledger: [],
    purchasedPacks: [],
  });

  await testDb.collection('users').doc(userB_Uid).set({
    profile: { uid: userB_Uid, name: 'User B' },
    wallet: { coins: 0, updatedAt: new Date().toISOString() },
    ledger: [],
    purchasedPacks: [],
  });

  // TEST 1: Missing Authorization Header
  {
    const res = await initiateHandler({
      httpMethod: 'POST',
      headers: {},
      body: JSON.stringify({ packageId: 'pack-19' }),
    });
    report(
      'Missing Authorization header on initiation returns 401 Unauthorized',
      res.statusCode === 401 && JSON.parse(res.body).code === 'auth/missing-token'
    );
  }

  // TEST 2: Invalid / Expired Token
  {
    const res = await initiateHandler({
      httpMethod: 'POST',
      headers: { Authorization: 'Bearer invalid_fake_token' },
      body: JSON.stringify({ packageId: 'pack-19' }),
    });
    report(
      'Invalid Firebase ID token returns 401 Unauthorized',
      res.statusCode === 401
    );
  }

  // TEST 3: Invalid Coin Package ID
  {
    const res = await initiateHandler({
      httpMethod: 'POST',
      headers: { Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ packageId: 'non-existent-pack-99999' }),
    });
    report(
      'Invalid package ID returns 400 Bad Request',
      res.statusCode === 400 && JSON.parse(res.body).code === 'order/invalid-package'
    );
  }

  // TEST 4: Valid Initiation (User A, pack-19)
  let initiatedTxnId = '';
  let initiatedParams = {};
  {
    const res = await initiateHandler({
      httpMethod: 'POST',
      headers: { Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({
        packageId: 'pack-19',
        name: 'User Alpha',
        phone: '9876543210',
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
      initiatedTxnId.startsWith('CN_') &&
      body.params?.amount === '19.00' &&
      body.params?.udf1 === userA_Uid && // Identity strictly bound to token UID
      body.params?.udf5 === 'connect' &&
      orderDoc.exists &&
      orderData.uid === userA_Uid &&
      orderData.expectedAmount === 19 &&
      orderData.expectedCoins === 50 &&
      orderData.status === 'pending' &&
      orderData.fulfilled === false;

    report('Valid initiation creates pending order in Firestore with canonical values', isOk);
  }

  // TEST 5: PayU Callback with Tampered Reverse Hash
  {
    const tamperedParams = {
      key: config.key,
      txnid: initiatedTxnId,
      amount: '19.00',
      productinfo: initiatedParams.productinfo,
      firstname: initiatedParams.firstname,
      email: initiatedParams.email,
      udf1: initiatedParams.udf1,
      udf2: initiatedParams.udf2,
      udf3: initiatedParams.udf3,
      udf4: initiatedParams.udf4,
      udf5: initiatedParams.udf5,
      status: 'success',
      hash: 'tampered_fake_sha512_hash_value',
      mihpayid: 'payu_fake_mihpayid_101',
    };

    const res = await responseHandler({
      httpMethod: 'POST',
      body: new URLSearchParams(tamperedParams).toString(),
    });

    const orderDoc = await testDb.collection('connect_orders').doc(initiatedTxnId).get();
    const userDoc = await testDb.collection('users').doc(userA_Uid).get();

    const isOk =
      res.statusCode === 303 &&
      res.headers.Location.includes('status=tampered') &&
      orderDoc.data().status === 'tampered' &&
      userDoc.data().wallet.coins === 0; // Balance remains 0!

    report('Tampered reverse hash is rejected and does NOT credit coins', isOk);
  }

  // TEST 6: PayU Callback with Amount Mismatch
  let mismatchTxnId = '';
  {
    // Initiate another order for 19.00
    const initRes = await initiateHandler({
      httpMethod: 'POST',
      headers: { Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ packageId: 'pack-19' }),
    });
    mismatchTxnId = JSON.parse(initRes.body).params.txnid;

    // Callback reports only 10.00
    const mismatchParams = {
      key: config.key,
      txnid: mismatchTxnId,
      amount: '10.00', // Mismatch!
      productinfo: 'CONNECT 50 Coins Starter Pack',
      firstname: 'User Alpha',
      email: `${userA_Uid}@connect.local`,
      udf1: userA_Uid,
      udf2: 'pack-19',
      udf3: 'connect_wallet_recharge',
      udf4: '50',
      udf5: 'connect',
      status: 'success',
      mihpayid: 'payu_mih_102',
    };
    mismatchParams.hash = computeReverseHash(mismatchParams, config.salt);

    const res = await responseHandler({
      httpMethod: 'POST',
      body: new URLSearchParams(mismatchParams).toString(),
    });

    const orderDoc = await testDb.collection('connect_orders').doc(mismatchTxnId).get();
    const userDoc = await testDb.collection('users').doc(userA_Uid).get();

    const isOk =
      res.statusCode === 303 &&
      res.headers.Location.includes('status=failed') &&
      orderDoc.data().status === 'amount_mismatch' &&
      userDoc.data().wallet.coins === 0;

    report('Payment amount mismatch is rejected and does NOT credit coins', isOk);
  }

  // TEST 7: Successful PayU Payment -> Atomic Fulfilment
  let successfulTxnId = '';
  {
    // Initiate clean order for pack-19 (₹19 -> 50 coins)
    const initRes = await initiateHandler({
      httpMethod: 'POST',
      headers: { Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ packageId: 'pack-19' }),
    });
    successfulTxnId = JSON.parse(initRes.body).params.txnid;

    const successParams = {
      key: config.key,
      txnid: successfulTxnId,
      amount: '19.00',
      productinfo: 'CONNECT 50 Coins Starter Pack',
      firstname: 'User Alpha',
      email: `${userA_Uid}@connect.local`,
      udf1: userA_Uid,
      udf2: 'pack-19',
      udf3: 'connect_wallet_recharge',
      udf4: '50',
      udf5: 'connect',
      status: 'success',
      mihpayid: 'payu_mih_success_999',
      bank_ref_num: 'BANK_REF_12345',
    };
    successParams.hash = computeReverseHash(successParams, config.salt);

    const res = await responseHandler({
      httpMethod: 'POST',
      body: new URLSearchParams(successParams).toString(),
    });

    const orderDoc = await testDb.collection('connect_orders').doc(successfulTxnId).get();
    const userDoc = await testDb.collection('users').doc(userA_Uid).get();
    const orderData = orderDoc.data();
    const userData = userDoc.data();

    const ledger = userData.ledger || [];
    const latestTxn = ledger[0];

    const isOk =
      res.statusCode === 303 &&
      res.headers.Location.includes('status=success') &&
      orderData.status === 'success' &&
      orderData.fulfilled === true &&
      orderData.coinsCredited === 50 &&
      userData.wallet.coins === 50 && // 50 coins credited
      ledger.length === 1 &&
      latestTxn.id === `TXN-PAYU-${successfulTxnId}` &&
      latestTxn.amount === 50 &&
      latestTxn.isCredit === true &&
      latestTxn.balanceAfter === 50 &&
      userData.purchasedPacks.includes('pack-19');

    report('Valid PayU callback atomically credits wallet, writes ledger, and fulfills order', isOk);
  }

  // TEST 8: Strict Idempotency / Duplicate Webhook Protection
  {
    // Replay the exact same successful payment notification
    const successParams = {
      key: config.key,
      txnid: successfulTxnId,
      amount: '19.00',
      productinfo: 'CONNECT 50 Coins Starter Pack',
      firstname: 'User Alpha',
      email: `${userA_Uid}@connect.local`,
      udf1: userA_Uid,
      udf2: 'pack-19',
      udf3: 'connect_wallet_recharge',
      udf4: '50',
      udf5: 'connect',
      status: 'success',
      mihpayid: 'payu_mih_success_999',
      bank_ref_num: 'BANK_REF_12345',
    };
    successParams.hash = computeReverseHash(successParams, config.salt);

    const res = await responseHandler({
      httpMethod: 'POST',
      body: new URLSearchParams(successParams).toString(),
    });

    const userDoc = await testDb.collection('users').doc(userA_Uid).get();
    const userData = userDoc.data();
    const ledger = userData.ledger || [];

    const isOk =
      res.statusCode === 303 &&
      userData.wallet.coins === 50 && // Remains 50! NEVER 100!
      ledger.length === 1; // Exactly 1 entry!

    report('Duplicate PayU callback is idempotent and does NOT double-credit coins', isOk);
  }

  // TEST 9: Cancelled Payment Updates Order and Never Credits
  {
    const initRes = await initiateHandler({
      httpMethod: 'POST',
      headers: { Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ packageId: 'pack-49' }), // ₹49 pack
    });
    const cancelledTxnId = JSON.parse(initRes.body).params.txnid;

    const cancelParams = {
      key: config.key,
      txnid: cancelledTxnId,
      amount: '49.00',
      productinfo: 'CONNECT 160 Coins Pack',
      firstname: 'User Alpha',
      email: `${userA_Uid}@connect.local`,
      udf1: userA_Uid,
      udf2: 'pack-49',
      udf3: 'connect_wallet_recharge',
      udf4: '160',
      udf5: 'connect',
      status: 'cancel',
      error_Message: 'User cancelled payment on bank page',
      mihpayid: 'payu_mih_cancel_333',
    };
    cancelParams.hash = computeReverseHash(cancelParams, config.salt);

    const res = await responseHandler({
      httpMethod: 'POST',
      body: new URLSearchParams(cancelParams).toString(),
    });

    const orderDoc = await testDb.collection('connect_orders').doc(cancelledTxnId).get();
    const userDoc = await testDb.collection('users').doc(userA_Uid).get();

    const isOk =
      res.statusCode === 303 &&
      res.headers.Location.includes('status=cancelled') &&
      orderDoc.data().status === 'cancelled' &&
      userDoc.data().wallet.coins === 50; // Untouched balance!

    report('Cancelled PayU payment updates order to cancelled and does NOT credit coins', isOk);
  }

  // TEST 10: Cross-User Isolation (User A payment cannot credit User B)
  {
    const userB_Doc = await testDb.collection('users').doc(userB_Uid).get();
    report(
      'User A payment had ZERO effect on User B wallet (balance remains 0, ledger empty)',
      userB_Doc.data().wallet.coins === 0 && (userB_Doc.data().ledger || []).length === 0
    );
  }

  // TEST 11: Non-Regression on Sanskruti eBook Orders
  {
    // A regular ebook payment callback with standard non-connect txnid
    const ebookTxnid = `SKT_EBOOK_${Date.now()}`;
    const ebookParams = {
      key: config.key,
      txnid: ebookTxnid,
      amount: '99.00',
      productinfo: 'The Unstoppable Mind',
      firstname: 'eBook Reader',
      email: 'reader@example.com',
      udf1: 'single:mind-1',
      udf2: '9876543210',
      udf3: 'NO_COUPON',
      udf4: '1_items',
      udf5: 'sanskruti-web',
      status: 'success',
      mihpayid: 'payu_ebook_mih_555',
    };
    ebookParams.hash = computeReverseHash(ebookParams, config.salt);

    const res = await responseHandler({
      httpMethod: 'POST',
      body: new URLSearchParams(ebookParams).toString(),
    });

    report(
      'eBook payment callback functions normally and redirects to eBook payment status page',
      res.statusCode === 303 && res.headers.Location.includes('/payment-status.html?status=success')
    );
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

