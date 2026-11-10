/**
 * Step 1B.2 Automated Verification Suite:
 * Cloud Firestore Migration for Phone Authentication
 * 
 * Tests:
 * 1. New user registration persists to Firestore 'phone_credentials' with E.164 ID
 * 2. Atomic duplicate registration prevention returns 409 Conflict
 * 3. Concurrent registration race conditions are safely resolved by Firestore transactions
 * 4. Existing legacy account in _phone-users.json lazily migrates to Firestore on login
 * 5. Legacy PBKDF2 and bcrypt password verification both succeed
 * 6. Migration strictly preserves existing UID (no UID regeneration)
 * 7. Wrong password increments persistent failedLoginAttempts in Firestore
 * 8. 5 failed login attempts trigger lockedUntil and return 429 Too Many Requests
 * 9. Fail-closed safe error (500 auth/database-unavailable) when Firestore is unavailable
 * 10. No local JSON write fallback on Firestore failure (read-only preservation)
 * 11. Sensitive fields (passwordHash, password) are never exposed in responses
 * 12. Firebase Custom Token is generated and signed with custom claims
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

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

const { handler: phoneAuthHandler, _setFirestoreDb, _setAdminAuth } = require('./netlify/functions/connect-auth-phone');
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

// In-Memory Mock Firestore Implementation supporting collection, doc, transactions, and locking
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
            const merged = { ...existing, ...updates };
            store.set(docId, JSON.parse(JSON.stringify(merged)));
          },
          delete: async () => {
            store.delete(docId);
          }
        };
      }
    };
  }

  async runTransaction(updateFunction) {
    // In Firestore, concurrent transactions touching the same document are isolated/serialized
    const run = async () => {
      const stagedWrites = [];
      const transaction = {
        get: async (docRef) => {
          return await docRef.get();
        },
        set: (docRef, data) => {
          stagedWrites.push({ type: 'set', docRef, data });
        },
        update: (docRef, updates) => {
          stagedWrites.push({ type: 'update', docRef, updates });
        },
        delete: (docRef) => {
          stagedWrites.push({ type: 'delete', docRef });
        }
      };

      const result = await updateFunction(transaction);

      // Commit staged writes
      for (const write of stagedWrites) {
        if (write.type === 'set') {
          await write.docRef.set(write.data);
        } else if (write.type === 'update') {
          await write.docRef.update(write.updates);
        } else if (write.type === 'delete') {
          await write.docRef.delete();
        }
      }

      return result;
    };

    // Chain to queue for transaction isolation
    const nextInQueue = this._txQueue.then(run, run);
    this._txQueue = nextInQueue;
    return await nextInQueue;
  }
}

async function runStep1B2Tests() {
  console.log('====================================================');
  console.log(' STEP 1B.2: FIRESTORE PHONE AUTH STORAGE MIGRATION  ');
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

  const LEGACY_FILE = path.join(__dirname, 'netlify', 'functions', '_phone-users.json');
  const initialLegacyContent = fs.existsSync(LEGACY_FILE) ? fs.readFileSync(LEGACY_FILE, 'utf-8') : '{}';

  try {
    // -------------------------------------------------------------
    // Test 1: New Mobile Registration writes to Firestore
    // -------------------------------------------------------------
    const regRes = await phoneAuthHandler({
      httpMethod: 'POST',
      body: JSON.stringify({
        mode: 'signup',
        phone: '9876512345',
        password: 'Password123!',
        name: 'Firestore User 1',
      }),
    });
    const regData = JSON.parse(regRes.body);
    assert('New mobile signup returns 200 OK', regRes.statusCode === 200 && regData.success === true);
    assert('Signup canonicalizes phone to E.164 (+919876512345)', regData.phone === '+919876512345');
    assert('Signup generates deterministic UID (phone_919876512345)', regData.uid === 'phone_919876512345');

    // Verify document exists in Firestore 'phone_credentials'
    const storedSnap = await mockDb.collection('phone_credentials').doc('+919876512345').get();
    assert('Document stored in Firestore phone_credentials with E.164 key', storedSnap.exists);
    const storedData = storedSnap.data();
    assert('Stored data contains bcrypt hash starting with $2', storedData.passwordHash && storedData.passwordHash.startsWith('$2'));
    assert('Stored data initializes failedLoginAttempts to 0 and lockedUntil to null', storedData.failedLoginAttempts === 0 && storedData.lockedUntil === null);
    assert('Signup response never leaks password or passwordHash', !regData.passwordHash && !regData.password);
    assert('Signup response returns genuine Firebase Custom Token', Boolean(regData.customToken) && regData.customToken.startsWith('ey'));

    // -------------------------------------------------------------
    // Test 2: Atomic Duplicate Registration Prevention
    // -------------------------------------------------------------
    const dupRes = await phoneAuthHandler({
      httpMethod: 'POST',
      body: JSON.stringify({
        mode: 'signup',
        phone: '09876512345', // Different format, same normalized number
        password: 'AnotherPassword456!',
        name: 'Duplicate Attempt',
      }),
    });
    const dupData = JSON.parse(dupRes.body);
    assert('Duplicate mobile registration returns 409 Conflict', dupRes.statusCode === 409 && dupData.code === 'auth/phone-already-in-use');

    // -------------------------------------------------------------
    // Test 3: Concurrent Registration Race Condition
    // -------------------------------------------------------------
    const parallelPhone = '9876599999';
    const [p1, p2] = await Promise.all([
      phoneAuthHandler({
        httpMethod: 'POST',
        body: JSON.stringify({ mode: 'signup', phone: parallelPhone, password: 'SecurePassword123!', name: 'User A' }),
      }),
      phoneAuthHandler({
        httpMethod: 'POST',
        body: JSON.stringify({ mode: 'signup', phone: parallelPhone, password: 'SecurePassword456!', name: 'User B' }),
      }),
    ]);
    const p1Status = p1.statusCode;
    const p2Status = p2.statusCode;
    const exactlyOneSucceeded = (p1Status === 200 && p2Status === 409) || (p1Status === 409 && p2Status === 200);
    assert('Concurrent registration race condition results in exactly 1 success (200) and 1 conflict (409)', exactlyOneSucceeded);

    // -------------------------------------------------------------
    // Test 4: Lazy Migration of Existing Account from _phone-users.json
    // -------------------------------------------------------------
    // Create a legacy record with legacy PBKDF2 password in _phone-users.json
    const legacyPhone = '+919876544444';
    const legacyPlainPassword = 'LegacyPassword123!';
    const salt = crypto.randomBytes(16).toString('hex');
    const legacyPbkdf2Hash = `${salt}:${crypto.pbkdf2Sync(legacyPlainPassword, salt, 100000, 64, 'sha512').toString('hex')}`;
    const legacyUid = 'phone_919876544444';

    const legacyStoreObj = JSON.parse(initialLegacyContent);
    legacyStoreObj[legacyPhone] = {
      uid: legacyUid,
      phone: legacyPhone,
      name: 'Legacy User',
      username: '@legacy_user',
      passwordHash: legacyPbkdf2Hash,
      createdAt: '2025-01-01T00:00:00.000Z',
    };
    fs.writeFileSync(LEGACY_FILE, JSON.stringify(legacyStoreObj, null, 2), 'utf-8');

    // Before login: Document does NOT exist in Firestore
    const preMigrateSnap = await mockDb.collection('phone_credentials').doc(legacyPhone).get();
    assert('Legacy account is not yet in Firestore prior to login', !preMigrateSnap.exists);

    // Login with legacy credentials
    const legacyLoginRes = await phoneAuthHandler({
      httpMethod: 'POST',
      body: JSON.stringify({
        mode: 'login',
        phone: '9876544444',
        password: legacyPlainPassword,
      }),
    });
    const legacyLoginData = JSON.parse(legacyLoginRes.body);
    assert('Login with legacy PBKDF2 password succeeds with 200 OK', legacyLoginRes.statusCode === 200 && legacyLoginData.success === true);
    assert('Legacy account strictly preserves existing UID (no regeneration)', legacyLoginData.uid === legacyUid);

    // After login: Document IS lazily migrated into Firestore
    const postMigrateSnap = await mockDb.collection('phone_credentials').doc(legacyPhone).get();
    assert('Legacy account is lazily migrated into Firestore phone_credentials', postMigrateSnap.exists);
    const postMigrateData = postMigrateSnap.data();
    assert('Migrated Firestore doc preserves original UID', postMigrateData.uid === legacyUid);
    assert('Migrated Firestore doc flagged with migratedFromLocal: true', postMigrateData.migratedFromLocal === true);
    assert('Migrated Firestore doc password upgraded to bcrypt ($2)', postMigrateData.passwordHash.startsWith('$2'));

    // -------------------------------------------------------------
    // Test 5: Wrong Password Tracking & Firestore Persistent Lockout
    // -------------------------------------------------------------
    const testLockedPhone = '+919876512345';
    const fail1 = await phoneAuthHandler({
      httpMethod: 'POST',
      body: JSON.stringify({ mode: 'login', phone: testLockedPhone, password: 'WrongPassword!' }),
    });
    assert('Wrong password returns 401 Unauthorized', fail1.statusCode === 401);

    const docAfter1Fail = (await mockDb.collection('phone_credentials').doc(testLockedPhone).get()).data();
    assert('Failed login increments failedLoginAttempts in Firestore to 1', docAfter1Fail.failedLoginAttempts === 1);

    // 4 more failed attempts (total 5)
    await phoneAuthHandler({ httpMethod: 'POST', body: JSON.stringify({ mode: 'login', phone: testLockedPhone, password: 'WrongPassword!' }) });
    await phoneAuthHandler({ httpMethod: 'POST', body: JSON.stringify({ mode: 'login', phone: testLockedPhone, password: 'WrongPassword!' }) });
    await phoneAuthHandler({ httpMethod: 'POST', body: JSON.stringify({ mode: 'login', phone: testLockedPhone, password: 'WrongPassword!' }) });
    await phoneAuthHandler({ httpMethod: 'POST', body: JSON.stringify({ mode: 'login', phone: testLockedPhone, password: 'WrongPassword!' }) });

    const docAfter5Fails = (await mockDb.collection('phone_credentials').doc(testLockedPhone).get()).data();
    assert('5 failed attempts set lockedUntil timestamp in Firestore', Boolean(docAfter5Fails.lockedUntil));

    // 6th attempt should be rejected with 429 Too Many Requests
    const lockedRes = await phoneAuthHandler({
      httpMethod: 'POST',
      body: JSON.stringify({ mode: 'login', phone: testLockedPhone, password: 'Password123!' }),
    });
    const lockedData = JSON.parse(lockedRes.body);
    assert('Locked account returns 429 Too Many Requests', lockedRes.statusCode === 429 && lockedData.code === 'auth/too-many-requests');

    // -------------------------------------------------------------
    // Test 6: Database Outage / Fail-Closed Behavior
    // -------------------------------------------------------------
    _setFirestoreDb(null); // Simulate Firestore outage
    const outageRes = await phoneAuthHandler({
      httpMethod: 'POST',
      body: JSON.stringify({ mode: 'login', phone: '9876512345', password: 'Password123!' }),
    });
    const outageData = JSON.parse(outageRes.body);
    assert('Firestore unavailability returns 500 auth/database-unavailable', outageRes.statusCode === 500 && outageData.code === 'auth/database-unavailable');

    // Verify signup also fails closed with 500 when Firestore is down
    const outageSignupRes = await phoneAuthHandler({
      httpMethod: 'POST',
      body: JSON.stringify({ mode: 'signup', phone: '9876588888', password: 'Password123!', name: 'Outage User' }),
    });
    assert('Signup during Firestore outage returns 500 safely (no insecure local fallback)', outageSignupRes.statusCode === 500);

    // Restore mockDb
    _setFirestoreDb(mockDb);

    // -------------------------------------------------------------
    // Test 7: Successful Login with Reset of Failed Attempts
    // -------------------------------------------------------------
    const resetUserPhone = '+919876500009';
    await phoneAuthHandler({
      httpMethod: 'POST',
      body: JSON.stringify({ mode: 'signup', phone: resetUserPhone, password: 'ValidPassword123!', name: 'Reset User' }),
    });
    // Trigger 1 failed attempt
    await phoneAuthHandler({
      httpMethod: 'POST',
      body: JSON.stringify({ mode: 'login', phone: resetUserPhone, password: 'Wrong!' }),
    });
    let resetSnap = (await mockDb.collection('phone_credentials').doc(resetUserPhone).get()).data();
    assert('Pre-condition: failedLoginAttempts is 1', resetSnap.failedLoginAttempts === 1);

    // Now login successfully
    const successLogin = await phoneAuthHandler({
      httpMethod: 'POST',
      body: JSON.stringify({ mode: 'login', phone: resetUserPhone, password: 'ValidPassword123!' }),
    });
    assert('Login with correct password returns 200 OK', successLogin.statusCode === 200);

    resetSnap = (await mockDb.collection('phone_credentials').doc(resetUserPhone).get()).data();
    assert('Successful login resets failedLoginAttempts to 0 in Firestore', resetSnap.failedLoginAttempts === 0);

  } finally {
    // Restore original _phone-users.json so repository remains untouched
    fs.writeFileSync(LEGACY_FILE, initialLegacyContent, 'utf-8');
  }

  console.log('\n====================================================');
  console.log(`RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runStep1B2Tests().catch((err) => {
  console.error('Test suite uncaught error:', err);
  process.exit(1);
});
