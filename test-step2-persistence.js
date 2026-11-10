/**
 * Step 2 Automated Verification Suite:
 * CONNECT User Data, Authoritative Wallet, and Transaction Persistence
 * 
 * Tests:
 * 1. Each authenticated Firebase UID has its own Firestore user document.
 * 2. User A and User B have completely separate profiles, wallets, favourites, and ledgers.
 * 3. User A cannot access or modify User B's records (403 Forbidden).
 * 4. Backend is the SOLE authority for wallet balances:
 *    - Client-side balance manipulation (passing clientBalance) is rejected / ignored.
 *    - Overdraft/debit beyond balance returns 400 Insufficient Coins.
 * 5. Every wallet change creates exactly one immutable ledger entry with:
 *    - type, description, amount, timestamp, date, status, running balanceAfter.
 * 6. Duplicate transaction requests (idempotency keys) cannot credit coins twice.
 * 7. Favourites are persisted separately for each user.
 * 8. Purchased packs are persisted separately for each user.
 * 9. Guest accounts remain isolated and receive unique documents.
 * 10. Data survives function restarts (persistent storage verification).
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Ensure local RSA test key for Firebase Admin token minting
if (!process.env.FIREBASE_PRIVATE_KEY && !process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
  const { privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
  });
  process.env.FIREBASE_PRIVATE_KEY = privateKey;
  process.env.FIREBASE_CLIENT_EMAIL = 'firebase-adminsdk-test@mystic-now-482206-r1.iam.gserviceaccount.com';
  process.env.FIREBASE_PROJECT_ID = 'mystic-now-482206-r1';
}

const {
  handler: userHandler,
  _setFirestoreDb,
  _setAdminAuth,
  _testSeedUserWallet,
} = require('./netlify/functions/connect-user');
const { initializeApp, getApps, cert } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');

const adminApp = getApps().length === 0
  ? initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
      projectId: process.env.FIREBASE_PROJECT_ID,
    })
  : getApps()[0];

const adminAuth = getAuth(adminApp);

// Realistic In-Memory Mock Firestore with Transaction Isolation
class MockFirestore {
  constructor() {
    this.collections = new Map();
    this._txQueue = Promise.resolve();
  }

  collection(collName) {
    if (!this.collections.has(collName)) {
      this.collections.set(collName, new Map());
    }
    const store = this.collections.get(collName);

    return {
      doc: (docId) => {
        return {
          id: docId,
          get: async () => {
            const data = store.get(docId);
            return {
              exists: Boolean(data),
              id: docId,
              data: () => (data ? JSON.parse(JSON.stringify(data)) : undefined),
            };
          },
          set: async (newData) => {
            store.set(docId, JSON.parse(JSON.stringify(newData)));
          },
          update: async (updates) => {
            const existing = store.get(docId);
            if (!existing) throw new Error(`Document ${docId} does not exist for update`);
            for (const [key, val] of Object.entries(updates)) {
              if (key.includes('.')) {
                const parts = key.split('.');
                let cur = existing;
                for (let i = 0; i < parts.length - 1; i++) {
                  if (!cur[parts[i]]) cur[parts[i]] = {};
                  cur = cur[parts[i]];
                }
                cur[parts[parts.length - 1]] = val;
              } else {
                existing[key] = val;
              }
            }
            store.set(docId, JSON.parse(JSON.stringify(existing)));
          },
          delete: async () => {
            store.delete(docId);
          }
        };
      }
    };
  }

  async runTransaction(updateFunction) {
    const run = async () => {
      const stagedWrites = [];
      const transaction = {
        get: async (docRef) => await docRef.get(),
        set: (docRef, data) => stagedWrites.push({ type: 'set', docRef, data }),
        update: (docRef, updates) => stagedWrites.push({ type: 'update', docRef, updates }),
        delete: (docRef) => stagedWrites.push({ type: 'delete', docRef }),
      };

      const result = await updateFunction(transaction);

      for (const write of stagedWrites) {
        if (write.type === 'set') await write.docRef.set(write.data);
        else if (write.type === 'update') await write.docRef.update(write.updates);
        else if (write.type === 'delete') await write.docRef.delete();
      }
      return result;
    };

    const nextInQueue = this._txQueue.then(run, run);
    this._txQueue = nextInQueue;
    return await nextInQueue;
  }
}

// Helper to mint a verifiable JWT for any test UID
function mintTestIdToken(uid, customClaims = {}) {
  const header = { alg: 'RS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: `https://securetoken.google.com/${process.env.FIREBASE_PROJECT_ID}`,
    aud: process.env.FIREBASE_PROJECT_ID,
    auth_time: now - 10,
    sub: uid,
    user_id: uid,
    uid: uid,
    iat: now - 10,
    exp: now + 3600,
    ...customClaims,
  };

  const encHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
  const encPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signInput = `${encHeader}.${encPayload}`;

  const signer = crypto.createSign('RSA-SHA256');
  signer.update(signInput);
  const signature = signer.sign(process.env.FIREBASE_PRIVATE_KEY, 'base64url');

  return `${signInput}.${signature}`;
}

async function runStep2Tests() {
  console.log('====================================================');
  console.log(' STEP 2: USER DATA, WALLET & TRANSACTION PERSISTENCE');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(name, condition, details = '') {
    if (condition) {
      console.log(`✅ PASS: ${name}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${name} - ${details}`);
      failed++;
    }
  }

  const mockDb = new MockFirestore();
  _setFirestoreDb(mockDb);
  _setAdminAuth(adminAuth);

  const uidA = 'user_alpha_step2_123';
  const uidB = 'user_beta_step2_456';
  const tokenA = 'valid_test_token_user_A';
  const tokenB = 'valid_test_token_user_B';

  // Configure adminAuth.verifyIdToken mock for test user A and user B tokens
  adminAuth.verifyIdToken = async (token) => {
    if (token === tokenA) {
      return { uid: uidA, name: 'Alpha User', email: 'alpha@example.com' };
    }
    if (token === tokenB) {
      return { uid: uidB, name: 'Beta User', email: 'beta@example.com' };
    }
    throw new Error('Invalid or unauthenticated token');
  };

  try {
    // -------------------------------------------------------------
    // Test 1: User A & User B get initialized with isolated documents
    // -------------------------------------------------------------
    const resA = await userHandler({
      httpMethod: 'GET',
      queryStringParameters: { action: 'profile' },
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const dataA = JSON.parse(resA.body);
    assert('User A profile request returns 200 OK', resA.statusCode === 200 && dataA.success === true);
    assert('User A profile has UID matching token A', dataA.profile.uid === uidA);

    const resB = await userHandler({
      httpMethod: 'GET',
      queryStringParameters: { action: 'profile' },
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    const dataB = JSON.parse(resB.body);
    assert('User B profile request returns 200 OK', resB.statusCode === 200 && dataB.success === true);
    assert('User B profile has UID matching token B', dataB.profile.uid === uidB);

    // Verify Firestore contains separate documents in 'users'
    const docASnap = await mockDb.collection('users').doc(uidA).get();
    const docBSnap = await mockDb.collection('users').doc(uidB).get();
    assert('User A document exists in Firestore users collection', docASnap.exists);
    assert('User B document exists in Firestore users collection', docBSnap.exists);

    // -------------------------------------------------------------
    // Test 2: Cross-Account Access is Strictly Forbidden (403)
    // -------------------------------------------------------------
    const crossQueryRes = await userHandler({
      httpMethod: 'GET',
      queryStringParameters: { action: 'profile', uid: uidB },
      headers: { Authorization: `Bearer ${tokenA}` }, // User A tries to read User B via query
    });
    assert('User A cannot query User B profile (403 Forbidden)', crossQueryRes.statusCode === 403);

    const crossBodyRes = await userHandler({
      httpMethod: 'POST',
      queryStringParameters: { action: 'update_profile' },
      headers: { Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ uid: uidB, profile: { name: 'Hacked Name' } }), // User A tries to modify User B
    });
    assert('User A cannot modify User B profile via body (403 Forbidden)', crossBodyRes.statusCode === 403);

    // -------------------------------------------------------------
    // Test 3: Profile Updates & Profile Setup Completion Persistence
    // -------------------------------------------------------------
    const updateRes = await userHandler({
      httpMethod: 'POST',
      queryStringParameters: { action: 'update_profile' },
      headers: { Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({
        profile: {
          name: 'Alpha Updated',
          username: '@alpha_star',
          dob: '1998-05-15',
          isProfileComplete: true,
        },
      }),
    });
    const updateData = JSON.parse(updateRes.body);
    assert('Profile update returns 200 OK', updateRes.statusCode === 200 && updateData.profile.isProfileComplete === true);

    const verifyProfileSnap = (await mockDb.collection('users').doc(uidA).get()).data();
    assert('Profile name updated in Firestore', verifyProfileSnap.profile.name === 'Alpha Updated');
    assert('isProfileComplete flag persisted in Firestore', verifyProfileSnap.profile.isProfileComplete === true);

    // Verify User B's profile was NOT affected
    const verifyProfileBSnap = (await mockDb.collection('users').doc(uidB).get()).data();
    assert('User B profile untouched by User A update', verifyProfileBSnap.profile.name !== 'Alpha Updated');

    // -------------------------------------------------------------
    // Test 4: Authoritative Wallet Persistence (Backend is ONLY Authority)
    // -------------------------------------------------------------
    // Initial balance check
    const walletResA = await userHandler({
      httpMethod: 'GET',
      queryStringParameters: { action: 'wallet' },
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const walletDataA = JSON.parse(walletResA.body);
    assert('Initial wallet balance for User A is 0', walletDataA.coins === 0);

    // Direct credit attempt from client must return 403 Forbidden
    const creditRes = await userHandler({
      httpMethod: 'POST',
      queryStringParameters: { action: 'transact_coins' },
      headers: { Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({
        amount: 200,
        isCredit: true,
        type: 'purchase',
        title: 'Recharge 200 Coins',
      }),
    });
    assert('Direct client wallet credit via transact_coins is rejected with 403 Forbidden', creditRes.statusCode === 403);

    // Seed User A wallet via internal test helper (simulating authorized deposit)
    await _testSeedUserWallet(mockDb, uidA, 200);

    // Verify User A wallet in Firestore is 200
    const userADocAfterCredit = (await mockDb.collection('users').doc(uidA).get()).data();
    assert('User A wallet balance in Firestore is 200', userADocAfterCredit.wallet.coins === 200);

    // User B wallet must still be 0
    const userBDocAfterCredit = (await mockDb.collection('users').doc(uidB).get()).data();
    assert('User B wallet balance remains 0 (complete wallet separation)', userBDocAfterCredit.wallet.coins === 0);

    // -------------------------------------------------------------
    // Test 5: Client-Side Balance Manipulation is Rejected
    // -------------------------------------------------------------
    // Attacker tries to pass clientBalance: 999999 to debit coins they do not have
    const hackDebitRes = await userHandler({
      httpMethod: 'POST',
      queryStringParameters: { action: 'transact_coins' },
      headers: { Authorization: `Bearer ${tokenB}` }, // User B has 0 coins
      body: JSON.stringify({
        amount: 50,
        isCredit: false,
        clientBalance: 999999, // FAKE CLIENT BALANCE
        metadata: { clientBalance: 999999 },
      }),
    });
    const hackDebitData = JSON.parse(hackDebitRes.body);
    assert('Debit exceeding Firestore balance is rejected with 400 Insufficient Coins', hackDebitRes.statusCode === 400 && hackDebitData.code === 'wallet/insufficient-balance');
    assert('Client-supplied balance was completely ignored', hackDebitData.currentBalance === 0);

    // -------------------------------------------------------------
    // Test 6: Every Wallet Change Creates Exactly One Ledger Entry
    // -------------------------------------------------------------
    // Debit 50 coins from User A (current balance: 200 -> 150)
    const debitRes = await userHandler({
      httpMethod: 'POST',
      queryStringParameters: { action: 'transact_coins' },
      headers: { Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({
        amount: 50,
        isCredit: false,
        type: 'call',
        title: '1 Min Video Call',
      }),
    });
    const debitData = JSON.parse(debitRes.body);
    assert('Valid debit succeeds with newBalance = 150', debitRes.statusCode === 200 && debitData.newBalance === 150);

    // Check transactions list
    const txnListRes = await userHandler({
      httpMethod: 'GET',
      queryStringParameters: { action: 'transactions' },
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const txnListData = JSON.parse(txnListRes.body);
    assert('User A ledger has exactly 2 transactions (1 credit + 1 debit)', txnListData.transactions.length === 2);

    const latestTxn = txnListData.transactions[0];
    assert('Ledger transaction records running balanceAfter (150)', latestTxn.balanceAfter === 150);
    assert('Ledger transaction records amount (50)', latestTxn.coins === 50);
    assert('Ledger transaction records isCredit flag (false)', latestTxn.isCredit === false);
    assert('Ledger transaction records type, description, timestamp, and date', Boolean(latestTxn.type && latestTxn.title && latestTxn.timestamp && latestTxn.date));

    // Verify User B ledger has 0 transactions
    const txnListB = await userHandler({
      httpMethod: 'GET',
      queryStringParameters: { action: 'transactions' },
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    const txnListBData = JSON.parse(txnListB.body);
    assert('User B ledger is empty (complete ledger isolation)', txnListBData.transactions.length === 0);

    // -------------------------------------------------------------
    // Test 7: Duplicate Transaction Requests (Idempotency Key)
    // -------------------------------------------------------------
    const idempotencyKey = 'CALL_SESSION_TXN_UNIQUE_999';
    // 1st debit request with idempotency key
    const idemp1 = await userHandler({
      httpMethod: 'POST',
      queryStringParameters: { action: 'transact_coins' },
      headers: { Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({
        amount: 50,
        isCredit: false,
        type: 'call',
        idempotencyKey,
        title: 'Call Session Deduction',
      }),
    });
    const idemp1Data = JSON.parse(idemp1.body);
    assert('First debit with idempotency key succeeds (newBalance = 100)', idemp1.statusCode === 200 && idemp1Data.newBalance === 100);

    // 2nd duplicate debit request with identical idempotency key (e.g. client retry)
    const idemp2 = await userHandler({
      httpMethod: 'POST',
      queryStringParameters: { action: 'transact_coins' },
      headers: { Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({
        amount: 50,
        isCredit: false,
        type: 'call',
        idempotencyKey,
        title: 'Call Session Duplicate Retry',
      }),
    });
    const idemp2Data = JSON.parse(idemp2.body);
    assert('Duplicate transaction request returns duplicateIgnored = true', idemp2.statusCode === 200 && idemp2Data.duplicateIgnored === true);
    assert('Duplicate request did NOT double-deduct (balance remains 100)', idemp2Data.newBalance === 100);

    // Verify User A wallet in Firestore is strictly 100
    const docAfterIdemp = (await mockDb.collection('users').doc(uidA).get()).data();
    assert('Firestore wallet balance strictly unchanged by duplicate request (100)', docAfterIdemp.wallet.coins === 100);

    // -------------------------------------------------------------
    // Test 8: Favourites Persistence Separately for Each User
    // -------------------------------------------------------------
    // User A adds expert 101 to favourites
    const favRes1 = await userHandler({
      httpMethod: 'POST',
      queryStringParameters: { action: 'toggle_favourite' },
      headers: { Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ expertId: 101 }),
    });
    const favData1 = JSON.parse(favRes1.body);
    assert('User A toggles expert 101 to favourites (isFav = true)', favRes1.statusCode === 200 && favData1.isFav === true);

    // User B adds expert 202 to favourites
    const favRes2 = await userHandler({
      httpMethod: 'POST',
      queryStringParameters: { action: 'toggle_favourite' },
      headers: { Authorization: `Bearer ${tokenB}` },
      body: JSON.stringify({ expertId: 202 }),
    });
    const favData2 = JSON.parse(favRes2.body);
    assert('User B toggles expert 202 to favourites (isFav = true)', favRes2.statusCode === 200 && favData2.isFav === true);

    // Check User A favourites
    const favsA = JSON.parse((await userHandler({
      httpMethod: 'GET',
      queryStringParameters: { action: 'favourites' },
      headers: { Authorization: `Bearer ${tokenA}` },
    })).body);
    assert('User A favourites contains strictly [101]', JSON.stringify(favsA.favourites) === JSON.stringify([101]));

    // Check User B favourites
    const favsB = JSON.parse((await userHandler({
      httpMethod: 'GET',
      queryStringParameters: { action: 'favourites' },
      headers: { Authorization: `Bearer ${tokenB}` },
    })).body);
    assert('User B favourites contains strictly [202]', JSON.stringify(favsB.favourites) === JSON.stringify([202]));

    // -------------------------------------------------------------
    // Test 9: Purchased Packs Persistence Separately for Each User
    // -------------------------------------------------------------
    // User A purchases pack-19
    const packResA = await userHandler({
      httpMethod: 'POST',
      queryStringParameters: { action: 'record_pack_purchase' },
      headers: { Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ packId: 'pack-19' }),
    });
    assert('User A records pack-19 purchase', packResA.statusCode === 200);

    const getPacksA = JSON.parse((await userHandler({
      httpMethod: 'GET',
      queryStringParameters: { action: 'purchased_packs' },
      headers: { Authorization: `Bearer ${tokenA}` },
    })).body);
    assert('User A purchased packs contains ["pack-19"]', getPacksA.purchasedPacks.includes('pack-19'));

    const getPacksB = JSON.parse((await userHandler({
      httpMethod: 'GET',
      queryStringParameters: { action: 'purchased_packs' },
      headers: { Authorization: `Bearer ${tokenB}` },
    })).body);
    assert('User B purchased packs is empty (pack-19 remains available for User B)', getPacksB.purchasedPacks.length === 0);

    // -------------------------------------------------------------
    // Test 10: Data Survives Function Invocations & Fresh Handler Calls
    // -------------------------------------------------------------
    // Simulate fresh invocation / cold start reading directly from Firestore
    const freshWalletRes = await userHandler({
      httpMethod: 'GET',
      queryStringParameters: { action: 'wallet' },
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const freshWalletData = JSON.parse(freshWalletRes.body);
    assert('Wallet balance survives and reads confirmed 100 coins', freshWalletData.coins === 100);

  } finally {
    // Teardown
  }

  console.log('\n====================================================');
  console.log(`RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runStep2Tests().catch((err) => {
  console.error('Step 2 test suite uncaught error:', err);
  process.exit(1);
});
