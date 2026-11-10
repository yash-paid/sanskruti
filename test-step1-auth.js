/**
 * Step 1 Automated Verification Suite
 * Tests Firebase ID Token verification, cross-user isolation, and error responses.
 */

const { handler } = require('./netlify/functions/connect-user');
const { initializeApp, getApps } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');

const adminApp = getApps().length === 0
  ? initializeApp({ projectId: 'mystic-now-482206-r1' })
  : getApps()[0];
const adminAuth = getAuth(adminApp);

async function runTests() {
  console.log('====================================================');
  console.log('   STEP 1: SECURE FIREBASE AUTHENTICATION TESTS   ');
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

  // 1. Health check (public, unauthenticated)
  try {
    const res = await handler({
      httpMethod: 'GET',
      queryStringParameters: { action: 'health' },
      headers: {},
    });
    const data = JSON.parse(res.body);
    assert('Public action=health returns 200 without token', res.statusCode === 200 && data.status === 'ok');
  } catch (e) {
    assert('Public action=health returns 200 without token', false, e.message);
  }

  // 2. Missing Authorization header returns 401
  try {
    const res = await handler({
      httpMethod: 'GET',
      queryStringParameters: { action: 'profile', uid: 'test_user_1' },
      headers: {
        'x-user-uid': 'test_user_1', // Insecure header must be ignored
      },
    });
    const data = JSON.parse(res.body);
    assert('Missing Authorization header returns 401', res.statusCode === 401 && data.code === 'auth/missing-token');
  } catch (e) {
    assert('Missing Authorization header returns 401', false, e.message);
  }

  // 3. Malformed Authorization header returns 401
  try {
    const res = await handler({
      httpMethod: 'GET',
      queryStringParameters: { action: 'wallet', uid: 'test_user_1' },
      headers: {
        authorization: 'Basic dXNlcjpwYXNz',
      },
    });
    const data = JSON.parse(res.body);
    assert('Malformed Authorization header (not Bearer) returns 401', res.statusCode === 401 && data.code === 'auth/missing-token');
  } catch (e) {
    assert('Malformed Authorization header (not Bearer) returns 401', false, e.message);
  }

  // 4. Empty Bearer token returns 401
  try {
    const res = await handler({
      httpMethod: 'GET',
      queryStringParameters: { action: 'wallet', uid: 'test_user_1' },
      headers: {
        authorization: 'Bearer    ',
      },
    });
    const data = JSON.parse(res.body);
    assert('Empty Bearer token returns 401', res.statusCode === 401 && data.code === 'auth/missing-token');
  } catch (e) {
    assert('Empty Bearer token returns 401', false, e.message);
  }

  // 5. Invalid / Fake token returns 401
  try {
    const res = await handler({
      httpMethod: 'GET',
      queryStringParameters: { action: 'wallet', uid: 'test_user_1' },
      headers: {
        authorization: 'Bearer invalid_garbage_token_value_xyz123',
      },
    });
    const data = JSON.parse(res.body);
    assert('Invalid / fake token returns 401', res.statusCode === 401 && res.body.includes('Unauthorized'));
  } catch (e) {
    assert('Invalid / fake token returns 401', false, e.message);
  }

  // 6. Expired JWT token returns 401
  try {
    // Malformed/expired JWT token representation
    const expiredFakeJwt = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImFiYzEyMyJ9.eyJleHAiOjE1MTYyMzkwMjIsImlhdCI6MTUxNjIzNTQyMiwic3ViIjoidXNlcl8xMjMifQ.c2lnbmF0dXJl';
    const res = await handler({
      httpMethod: 'GET',
      queryStringParameters: { action: 'wallet', uid: 'test_user_1' },
      headers: {
        authorization: `Bearer ${expiredFakeJwt}`,
      },
    });
    const data = JSON.parse(res.body);
    assert('Expired/invalid token returns 401', res.statusCode === 401 && res.body.includes('Unauthorized'));
  } catch (e) {
    assert('Expired/invalid token returns 401', false, e.message);
  }

  // 7. Test User A attempting to access User B data (Cross-Account Isolation)
  // We simulate a mock verified token resolution for User A
  try {
    const originalVerify = adminAuth.verifyIdToken.bind(adminAuth);
    adminAuth.verifyIdToken = async (token) => {
      if (token === 'valid_token_user_A') {
        return { uid: 'user_A_id_123', email: 'userA@test.com' };
      }
      return originalVerify(token);
    };

    // Case 7a: User A sends valid token, but passes ?uid=user_B in query
    const resSnoopQuery = await handler({
      httpMethod: 'GET',
      queryStringParameters: { action: 'wallet', uid: 'user_B_id_999' },
      headers: {
        authorization: 'Bearer valid_token_user_A',
      },
    });
    const dataSnoopQuery = JSON.parse(resSnoopQuery.body);
    assert(
      'User A with valid token cannot access User B via query ?uid=user_B (Returns 403 Forbidden)',
      resSnoopQuery.statusCode === 403 && dataSnoopQuery.code === 'auth/cross-user-forbidden'
    );

    // Case 7b: User A sends valid token, but passes body { uid: 'user_B' } in POST
    const resSnoopBody = await handler({
      httpMethod: 'POST',
      queryStringParameters: { action: 'update_profile' },
      headers: {
        authorization: 'Bearer valid_token_user_A',
      },
      body: JSON.stringify({ uid: 'user_B_id_999', name: 'Hacker' }),
    });
    const dataSnoopBody = JSON.parse(resSnoopBody.body);
    assert(
      'User A with valid token cannot modify User B via body { uid: "user_B" } (Returns 403 Forbidden)',
      resSnoopBody.statusCode === 403 && dataSnoopBody.code === 'auth/cross-user-forbidden'
    );

    // Case 7c: User A sends valid token, but sends x-user-uid: user_B (Header spoofing)
    // The server must ignore x-user-uid and ONLY operate on user_A!
    const resSpoofHeader = await handler({
      httpMethod: 'GET',
      queryStringParameters: { action: 'wallet' }, // No target UID in query
      headers: {
        authorization: 'Bearer valid_token_user_A',
        'x-user-uid': 'user_B_id_999',
      },
    });
    const dataSpoofHeader = JSON.parse(resSpoofHeader.body);
    assert(
      'Server ignores x-user-uid header and derives identity strictly from token (User A wallet returned, 200 OK)',
      resSpoofHeader.statusCode === 200 && typeof dataSpoofHeader.coins === 'number'
    );

    // Case 7d: User A valid profile update operates strictly on User A
    const resUpdateUserA = await handler({
      httpMethod: 'POST',
      queryStringParameters: { action: 'update_profile' },
      headers: {
        authorization: 'Bearer valid_token_user_A',
      },
      body: JSON.stringify({ name: 'User A Authenticated Name' }),
    });
    const dataUpdateUserA = JSON.parse(resUpdateUserA.body);
    assert(
      'Valid authenticated request for User A succeeds and updates User A profile',
      resUpdateUserA.statusCode === 200 && dataUpdateUserA.profile && dataUpdateUserA.profile.uid === 'user_A_id_123'
    );

    // Restore verifyIdToken
    adminAuth.verifyIdToken = originalVerify;
  } catch (e) {
    assert('Cross-Account Isolation test suite', false, e.message);
  }

  // 8. Test Live Firebase Anonymous / Auth Token Integration via Firebase REST API
  try {
    const apiKey = "AIzaSyBKxUkC-b8aMcLJLJHhPnsUPghljca1uyo";
    // Sign up an anonymous test user via Firebase Auth REST API
    const signupRes = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ returnSecureToken: true }),
    });
    const signupData = await signupRes.json();

    if (signupData && signupData.idToken && signupData.localId) {
      console.log(`\n[Live Firebase Auth Test] Minted real token for test UID: ${signupData.localId}`);
      
      // Call connect-user with the real, live Firebase ID token
      const liveRes = await handler({
        httpMethod: 'GET',
        queryStringParameters: { action: 'profile' },
        headers: {
          authorization: `Bearer ${signupData.idToken}`,
        },
      });
      const liveData = JSON.parse(liveRes.body);
      assert(
        'Real live Firebase ID token verified by verifyIdToken() and returns user profile',
        liveRes.statusCode === 200 && liveData.profile && liveData.profile.uid === signupData.localId
      );

      // Clean up test account via REST API
      await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:delete?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: signupData.idToken }),
      }).catch(() => {});
    } else {
      console.log('Skipping live REST signup test (Network or API key restricted):', signupData.error);
    }
  } catch (liveErr) {
    console.log('Live Firebase REST test skipped or offline:', liveErr.message);
  }

  console.log('\n====================================================');
  console.log(`RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});

