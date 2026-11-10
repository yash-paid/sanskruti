/**
 * Step 1B Automated Verification Suite
 * Tests Production-Secure Phone + Password Authentication,
 * bcrypt hashing, atomic duplicate prevention, anti-enumeration,
 * rate limiting, and custom token integration.
 */

const crypto = require('crypto');

// If running in local test environment without Netlify production environment variables,
// configure local RSA test key so Firebase Admin SDK can sign Custom Tokens locally
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

const fs = require('fs');
const path = require('path');
const { handler: phoneAuthHandler } = require('./netlify/functions/connect-auth-phone');
const { handler: userHandler } = require('./netlify/functions/connect-user');
const { initializeApp: initAdmin, getApps, cert } = require('firebase-admin/app');
const { getAuth: getAdminAuth } = require('firebase-admin/auth');

// Backup existing _phone-users.json
const DB_FILE = path.join(__dirname, 'netlify', 'functions', '_phone-users.json');
let originalStoreBackup = null;
try {
  if (fs.existsSync(DB_FILE)) {
    originalStoreBackup = fs.readFileSync(DB_FILE, 'utf-8');
  }
} catch (e) {}

async function runStep1BTests() {
  console.log('====================================================');
  console.log(' STEP 1B: PRODUCTION-SECURE PHONE AUTHENTICATION   ');
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

  const testMobile = '9876500001';
  const testPassword = 'SecurePassword123!';
  const testName = 'Test Phone User';

  try {
    // 1. Test New mobile registration
    const regRes = await phoneAuthHandler({
      httpMethod: 'POST',
      body: JSON.stringify({
        mode: 'signup',
        phone: testMobile,
        password: testPassword,
        name: testName,
      }),
    });
    const regData = JSON.parse(regRes.body);
    assert('New mobile registration succeeds with 200 OK', regRes.statusCode === 200 && regData.success === true);
    assert('Registered user has canonical E.164 phone (+919876500001)', regData.phone === '+919876500001');
    assert('Response never returns passwordHash or plaintext password', !regData.passwordHash && !regData.password);
    assert('Registration response includes genuine Firebase Custom Token', Boolean(regData.customToken) && regData.customToken.startsWith('ey'));

    // Verify stored password is a valid bcrypt hash ($2a$ or $2b$)
    const store = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
    const storedUser = store['+919876500001'];
    assert(
      'Password stored securely on server using bcrypt (starts with $2)',
      storedUser && storedUser.passwordHash && storedUser.passwordHash.startsWith('$2')
    );

    // 2. Test Login with correct password
    const loginRes = await phoneAuthHandler({
      httpMethod: 'POST',
      body: JSON.stringify({
        mode: 'login',
        phone: testMobile,
        password: testPassword,
      }),
    });
    const loginData = JSON.parse(loginRes.body);
    assert('Login with correct password succeeds with 200 OK', loginRes.statusCode === 200 && loginData.success === true);
    assert('Login response includes customToken and never passwordHash', Boolean(loginData.customToken) && !loginData.passwordHash);

    // 3. Test Wrong password rejection
    const wrongPassRes = await phoneAuthHandler({
      httpMethod: 'POST',
      body: JSON.stringify({
        mode: 'login',
        phone: testMobile,
        password: 'WrongPassword999!',
      }),
    });
    const wrongPassData = JSON.parse(wrongPassRes.body);
    assert(
      'Wrong password rejected with 401 Unauthorized',
      wrongPassRes.statusCode === 401 && wrongPassData.code === 'auth/invalid-credential'
    );

    // 4. Test Anti-Enumeration: Non-existent mobile returns identical safe error (401)
    const nonExistentRes = await phoneAuthHandler({
      httpMethod: 'POST',
      body: JSON.stringify({
        mode: 'login',
        phone: '9876599999', // Not registered
        password: testPassword,
      }),
    });
    const nonExistentData = JSON.parse(nonExistentRes.body);
    assert(
      'Non-existent phone returns identical generic 401 (Anti-Enumeration Protection)',
      nonExistentRes.statusCode === 401 &&
      nonExistentData.code === 'auth/invalid-credential' &&
      nonExistentData.error === wrongPassData.error
    );

    // 5. Test Duplicate mobile registration rejection (409 Conflict)
    const dupRes = await phoneAuthHandler({
      httpMethod: 'POST',
      body: JSON.stringify({
        mode: 'signup',
        phone: testMobile,
        password: 'AnotherPassword123!',
      }),
    });
    const dupData = JSON.parse(dupRes.body);
    assert(
      'Duplicate mobile registration rejected with 409 Conflict',
      dupRes.statusCode === 409 && dupData.code === 'auth/phone-already-in-use'
    );

    // 6. Test Different Formattings resolve consistently
    const formats = [
      '+91 98765 00001',
      '09876500001',
      '+91-98765-00001',
      '919876500001',
      ' 9876500001 ',
    ];
    let allFormatsMatch = true;
    for (const fmt of formats) {
      const res = await phoneAuthHandler({
        httpMethod: 'POST',
        body: JSON.stringify({
          mode: 'login',
          phone: fmt,
          password: testPassword,
        }),
      });
      if (res.statusCode !== 200) {
        allFormatsMatch = false;
        break;
      }
    }
    assert('Different phone number formattings resolve consistently to canonical account', allFormatsMatch);

    // 7. Test Concurrent Duplicate Registrations (Atomic Lock Test)
    const concurrentMobile = '9876500099';
    const concurrentRequests = Array.from({ length: 5 }, () =>
      phoneAuthHandler({
        httpMethod: 'POST',
        body: JSON.stringify({
          mode: 'signup',
          phone: concurrentMobile,
          password: 'Password123!',
          name: 'Concurrent User',
        }),
      })
    );
    const concurrentResponses = await Promise.all(concurrentRequests);
    const successCount = concurrentResponses.filter((r) => r.statusCode === 200).length;
    const conflictCount = concurrentResponses.filter((r) => r.statusCode === 409).length;
    assert(
      'Concurrent duplicate signups create exactly 1 account and reject all other attempts (Atomic Lock)',
      successCount === 1 && conflictCount === 4
    );

    // 8. Test Rate Limiting / Brute-Force Protection
    const bruteForceMobile = '9876500088';
    // Register account first
    await phoneAuthHandler({
      httpMethod: 'POST',
      body: JSON.stringify({ mode: 'signup', phone: bruteForceMobile, password: 'RealPassword123!' }),
    });

    let wasRateLimited = false;
    for (let i = 0; i < 7; i++) {
      const res = await phoneAuthHandler({
        httpMethod: 'POST',
        body: JSON.stringify({
          mode: 'login',
          phone: bruteForceMobile,
          password: 'WrongPassword!',
        }),
      });
      if (res.statusCode === 429) {
        wasRateLimited = true;
        break;
      }
    }
    assert('Brute-force attempts trigger 429 Too Many Requests rate-limiting', wasRateLimited);

    // 9. Test Protected API token requirement
    // Request without token must be rejected with 401
    const unauthRes = await userHandler({
      httpMethod: 'GET',
      queryStringParameters: { action: 'wallet', uid: `phone_9876500001` },
      headers: { 'x-user-uid': `phone_9876500001` },
    });
    assert('Protected API strictly rejects phone UID without valid Bearer ID token (401)', unauthRes.statusCode === 401);

  } finally {
    // Restore original store
    if (originalStoreBackup !== null) {
      try {
        fs.writeFileSync(DB_FILE, originalStoreBackup, 'utf-8');
      } catch (e) {}
    }
  }

  console.log('\n====================================================');
  console.log(`RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runStep1BTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
