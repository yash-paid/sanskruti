/**
 * Step 2A.1 Automated Verification Suite:
 * Critical Wallet Credit Security Guard & Deduction Hardening
 * 
 * Tests:
 * 1. Authenticated user CANNOT credit their own wallet via transact_coins (returns 403 Forbidden).
 * 2. Query param isCredit=true is also blocked with 403 Forbidden.
 * 3. test_credit_coins is permanently disabled (returns 403 Forbidden).
 * 4. Normal valid deductions (type: 'call') succeed with 200 OK.
 * 5. Normal valid deductions (type: 'gift') succeed with 200 OK.
 * 6. Unauthorized debit types (e.g. 'hack') are rejected with 400 Bad Request.
 * 7. Invalid/negative/non-integer amounts are rejected with 400 Bad Request.
 * 8. Insufficient balance rejects deduction with 400 Insufficient Coins.
 * 9. Duplicate debit requests with same idempotencyKey do not double-deduct.
 */

const crypto = require('crypto');

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

async function runStep2A1Tests() {
  console.log('====================================================');
  console.log(' STEP 2A.1: CRITICAL WALLET CREDIT SECURITY FIX     ');
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

  const testUid = 'user_step2a1_test_uid';
  const testToken = 'valid_token_step2a1';

  adminAuth.verifyIdToken = async (token) => {
    if (token === testToken) {
      return { uid: testUid, name: 'Security Test User', email: 'sec@test.com' };
    }
    throw new Error('Invalid token');
  };

  try {
    // -------------------------------------------------------------
    // Test 1: Direct client credit via transact_coins is BLOCKED (403)
    // -------------------------------------------------------------
    const creditAttemptRes = await userHandler({
      httpMethod: 'POST',
      queryStringParameters: { action: 'transact_coins' },
      headers: { Authorization: `Bearer ${testToken}` },
      body: JSON.stringify({
        amount: 50000,
        isCredit: true,
        type: 'purchase',
        title: 'Hacked Free Coins',
      }),
    });
    const creditAttemptData = JSON.parse(creditAttemptRes.body);
    assert(
      'Authenticated user calling transact_coins with isCredit: true is rejected with 403 Forbidden',
      creditAttemptRes.statusCode === 403 && creditAttemptData.code === 'wallet/credit-forbidden'
    );

    // -------------------------------------------------------------
    // Test 2: Query param isCredit=true is also BLOCKED (403)
    // -------------------------------------------------------------
    const queryCreditAttemptRes = await userHandler({
      httpMethod: 'POST',
      queryStringParameters: { action: 'transact_coins', isCredit: 'true', amount: '1000' },
      headers: { Authorization: `Bearer ${testToken}` },
      body: JSON.stringify({}),
    });
    const queryCreditData = JSON.parse(queryCreditAttemptRes.body);
    assert(
      'Credit attempt via query param isCredit=true is rejected with 403 Forbidden',
      queryCreditAttemptRes.statusCode === 403 && queryCreditData.code === 'wallet/credit-forbidden'
    );

    // -------------------------------------------------------------
    // Test 3: test_credit_coins is completely disabled (403)
    // -------------------------------------------------------------
    const testCreditRes = await userHandler({
      httpMethod: 'POST',
      queryStringParameters: { action: 'test_credit_coins' },
      headers: { Authorization: `Bearer ${testToken}` },
      body: JSON.stringify({ amount: 999999 }),
    });
    const testCreditData = JSON.parse(testCreditRes.body);
    assert(
      'test_credit_coins is permanently disabled and returns 403 Forbidden',
      testCreditRes.statusCode === 403 && testCreditData.code === 'auth/action-disabled'
    );

    // -------------------------------------------------------------
    // Test 4: Verify wallet balance is strictly 0 (no unauthorized credits occurred)
    // -------------------------------------------------------------
    const walletCheckRes = await userHandler({
      httpMethod: 'GET',
      queryStringParameters: { action: 'wallet' },
      headers: { Authorization: `Bearer ${testToken}` },
    });
    const walletCheckData = JSON.parse(walletCheckRes.body);
    assert('User wallet balance remains 0 after all credit attack attempts', walletCheckData.coins === 0);

    // -------------------------------------------------------------
    // Test 5: Insufficient balance rejects deduction (400)
    // -------------------------------------------------------------
    const insufficientRes = await userHandler({
      httpMethod: 'POST',
      queryStringParameters: { action: 'transact_coins' },
      headers: { Authorization: `Bearer ${testToken}` },
      body: JSON.stringify({
        amount: 50,
        isCredit: false,
        type: 'call',
        title: 'Video Call Deduction',
      }),
    });
    const insufficientData = JSON.parse(insufficientRes.body);
    assert(
      'Debit exceeding balance is rejected with 400 Insufficient Coins',
      insufficientRes.statusCode === 400 && insufficientData.code === 'wallet/insufficient-balance'
    );

    // -------------------------------------------------------------
    // Test 6: Seed verified starting balance for deduction testing
    // -------------------------------------------------------------
    await _testSeedUserWallet(mockDb, testUid, 200);
    const seededWallet = JSON.parse((await userHandler({
      httpMethod: 'GET',
      queryStringParameters: { action: 'wallet' },
      headers: { Authorization: `Bearer ${testToken}` },
    })).body);
    assert('Pre-condition: User wallet seeded with 200 confirmed coins for deduction tests', seededWallet.coins === 200);

    // -------------------------------------------------------------
    // Test 7: Normal valid deduction (type: 'call') succeeds (200 OK)
    // -------------------------------------------------------------
    const validCallDebit = await userHandler({
      httpMethod: 'POST',
      queryStringParameters: { action: 'transact_coins' },
      headers: { Authorization: `Bearer ${testToken}` },
      body: JSON.stringify({
        amount: 60,
        isCredit: false,
        type: 'call',
        title: 'Video Call (1 Min)',
      }),
    });
    const validCallData = JSON.parse(validCallDebit.body);
    assert(
      'Normal authorized video call deduction succeeds with 200 OK (200 - 60 = 140)',
      validCallDebit.statusCode === 200 && validCallData.newBalance === 140
    );

    // -------------------------------------------------------------
    // Test 8: Normal valid deduction (type: 'gift') succeeds (200 OK)
    // -------------------------------------------------------------
    const validGiftDebit = await userHandler({
      httpMethod: 'POST',
      queryStringParameters: { action: 'transact_coins' },
      headers: { Authorization: `Bearer ${testToken}` },
      body: JSON.stringify({
        amount: 40,
        isCredit: false,
        type: 'gift',
        title: 'Virtual Rose Gift',
      }),
    });
    const validGiftData = JSON.parse(validGiftDebit.body);
    assert(
      'Normal authorized gift deduction succeeds with 200 OK (140 - 40 = 100)',
      validGiftDebit.statusCode === 200 && validGiftData.newBalance === 100
    );

    // -------------------------------------------------------------
    // Test 9: Unauthorized debit type (e.g. 'hack') is rejected (400)
    // -------------------------------------------------------------
    const invalidTypeRes = await userHandler({
      httpMethod: 'POST',
      queryStringParameters: { action: 'transact_coins' },
      headers: { Authorization: `Bearer ${testToken}` },
      body: JSON.stringify({
        amount: 10,
        isCredit: false,
        type: 'arbitrary_injection',
      }),
    });
    const invalidTypeData = JSON.parse(invalidTypeRes.body);
    assert(
      'Unauthorized debit transaction type is rejected with 400 Bad Request',
      invalidTypeRes.statusCode === 400 && invalidTypeData.code === 'wallet/invalid-transaction-type'
    );

    // -------------------------------------------------------------
    // Test 10: Invalid / negative / zero amounts are rejected (400)
    // -------------------------------------------------------------
    const negAmountRes = await userHandler({
      httpMethod: 'POST',
      queryStringParameters: { action: 'transact_coins' },
      headers: { Authorization: `Bearer ${testToken}` },
      body: JSON.stringify({
        amount: -50,
        isCredit: false,
        type: 'call',
      }),
    });
    assert('Negative deduction amount is rejected with 400 Bad Request', negAmountRes.statusCode === 400);

    const zeroAmountRes = await userHandler({
      httpMethod: 'POST',
      queryStringParameters: { action: 'transact_coins' },
      headers: { Authorization: `Bearer ${testToken}` },
      body: JSON.stringify({
        amount: 0,
        isCredit: false,
        type: 'call',
      }),
    });
    assert('Zero deduction amount is rejected with 400 Bad Request', zeroAmountRes.statusCode === 400);

    // -------------------------------------------------------------
    // Test 11: Duplicate debit request protection with idempotencyKey
    // -------------------------------------------------------------
    const debitIdempotencyKey = 'CALL_SESSION_DEBIT_12345';
    // 1st debit request
    const debit1 = await userHandler({
      httpMethod: 'POST',
      queryStringParameters: { action: 'transact_coins' },
      headers: { Authorization: `Bearer ${testToken}` },
      body: JSON.stringify({
        amount: 30,
        isCredit: false,
        type: 'call',
        idempotencyKey: debitIdempotencyKey,
      }),
    });
    const debit1Data = JSON.parse(debit1.body);
    assert('First debit with idempotency key succeeds (100 - 30 = 70)', debit1.statusCode === 200 && debit1Data.newBalance === 70);

    // 2nd duplicate debit request with identical idempotencyKey
    const debit2 = await userHandler({
      httpMethod: 'POST',
      queryStringParameters: { action: 'transact_coins' },
      headers: { Authorization: `Bearer ${testToken}` },
      body: JSON.stringify({
        amount: 30,
        isCredit: false,
        type: 'call',
        idempotencyKey: debitIdempotencyKey,
      }),
    });
    const debit2Data = JSON.parse(debit2.body);
    assert('Duplicate debit request returns duplicateIgnored = true', debit2.statusCode === 200 && debit2Data.duplicateIgnored === true);
    assert('Duplicate debit request did NOT double-deduct (balance remains 70)', debit2Data.newBalance === 70);

    // Verify final wallet balance in Firestore
    const finalWallet = JSON.parse((await userHandler({
      httpMethod: 'GET',
      queryStringParameters: { action: 'wallet' },
      headers: { Authorization: `Bearer ${testToken}` },
    })).body);
    assert('Confirmed final Firestore wallet balance is exactly 70', finalWallet.coins === 70);

  } catch (err) {
    console.error('Unexpected test error:', err);
    failed++;
  }

  console.log('\n====================================================');
  console.log(`RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runStep2A1Tests().catch((err) => {
  console.error('Step 2A.1 test runner error:', err);
  process.exit(1);
});

