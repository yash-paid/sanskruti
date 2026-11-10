/**
 * Step 1A Automated Verification Suite
 * Tests Firebase Anonymous Authentication for Guest Login,
 * token generation, protected API access, and logout.
 */

const { initializeApp: initClient } = require('./connect/node_modules/firebase/app');
const {
  getAuth: getClientAuth,
  signInAnonymously,
  signOut,
} = require('./connect/node_modules/firebase/auth');
const { handler } = require('./netlify/functions/connect-user');

const firebaseConfig = {
  apiKey: 'AIzaSyBKxUkC-b8aMcLJLJHhPnsUPghljca1uyo',
  authDomain: 'mystic-now-482206-r1.firebaseapp.com',
  projectId: 'mystic-now-482206-r1',
};

async function runStep1ATests() {
  console.log('====================================================');
  console.log('  STEP 1A: FIREBASE ANONYMOUS GUEST AUTHENTICATION  ');
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

  const clientApp = initClient(firebaseConfig);
  const auth = getClientAuth(clientApp);

  let guestCred = null;
  let guestToken = null;
  let guestUid = null;

  // 1. Test anonymous login execution
  try {
    guestCred = await signInAnonymously(auth);
    guestUid = guestCred.user.uid;
    assert('Firebase signInAnonymously() succeeds', Boolean(guestCred && guestCred.user));
  } catch (err) {
    assert('Firebase signInAnonymously() succeeds', false, err.message);
  }

  // 2. Test auth.currentUser exists and has unique Firebase UID
  try {
    const currentUser = auth.currentUser;
    assert('auth.currentUser exists and matches credential UID', Boolean(currentUser && currentUser.uid === guestUid));
    assert('auth.currentUser.isAnonymous is true', currentUser?.isAnonymous === true);
    assert('Guest UID is unique Firebase UID (not CN-GUEST)', Boolean(guestUid && guestUid !== 'CN-GUEST' && guestUid.length >= 20));
  } catch (err) {
    assert('auth.currentUser checks', false, err.message);
  }

  // 3. Test Firebase ID token acquisition
  try {
    guestToken = await auth.currentUser.getIdToken();
    assert('auth.currentUser.getIdToken() returns valid JWT', Boolean(guestToken && guestToken.split('.').length === 3));
  } catch (err) {
    assert('auth.currentUser.getIdToken() returns valid JWT', false, err.message);
  }

  // 4. Test protected API call: fetch profile with Bearer token
  let profileData = null;
  try {
    const res = await handler({
      httpMethod: 'GET',
      queryStringParameters: { action: 'profile' },
      headers: {
        authorization: `Bearer ${guestToken}`,
      },
    });
    profileData = JSON.parse(res.body);
    assert(
      'Protected API GET profile succeeds with anonymous Firebase ID token (200 OK)',
      res.statusCode === 200 && profileData.success === true && profileData.profile.uid === guestUid
    );
    assert(
      'Guest profile receives unique userId formatted from Firebase UID',
      profileData.profile && profileData.profile.userId.startsWith('CN-') && profileData.profile.userId !== 'CN-GUEST'
    );
  } catch (err) {
    assert('Protected API GET profile with token', false, err.message);
  }

  // 5. Test protected API call: wallet balance check (No fake coins)
  try {
    const res = await handler({
      httpMethod: 'GET',
      queryStringParameters: { action: 'wallet' },
      headers: {
        authorization: `Bearer ${guestToken}`,
      },
    });
    const walletData = JSON.parse(res.body);
    assert(
      'Protected API GET wallet succeeds (200 OK) with 0 initial coins (no fake balance)',
      res.statusCode === 200 && walletData.coins === 0
    );
  } catch (err) {
    assert('Protected API GET wallet', false, err.message);
  }

  // 6. Test protected API call: transactions check (Empty ledger, no fake transactions)
  try {
    const res = await handler({
      httpMethod: 'GET',
      queryStringParameters: { action: 'transactions' },
      headers: {
        authorization: `Bearer ${guestToken}`,
      },
    });
    const txData = JSON.parse(res.body);
    assert(
      'Protected API GET transactions succeeds with empty ledger (no fake transactions)',
      res.statusCode === 200 && Array.isArray(txData.transactions) && txData.transactions.length === 0
    );
  } catch (err) {
    assert('Protected API GET transactions', false, err.message);
  }

  // 7. Test Logout: signs out from Firebase and clears session
  try {
    await signOut(auth);
    assert('signOut(auth) succeeds and auth.currentUser becomes null', auth.currentUser === null);
  } catch (err) {
    assert('signOut(auth) succeeds', false, err.message);
  }

  // 8. Test post-logout protected API call without token (Rejected 401)
  try {
    const res = await handler({
      httpMethod: 'GET',
      queryStringParameters: { action: 'profile' },
      headers: {},
    });
    const data = JSON.parse(res.body);
    assert('Protected API rejects request without token after logout (401 Unauthorized)', res.statusCode === 401 && data.code === 'auth/missing-token');
  } catch (err) {
    assert('Post-logout protected API rejection', false, err.message);
  }

  console.log('\n====================================================');
  console.log(`RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runStep1ATests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});

