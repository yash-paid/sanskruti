/**
 * CONNECT Mobile Number Authentication Netlify Function
 * 
 * Provides production-secure mobile number + password authentication with Cloud Firestore persistence.
 * Features:
 * - Persistent Firestore storage in collection 'phone_credentials' with E.164 phone document ID.
 * - Atomic duplicate registration prevention via Firestore transactions.
 * - Persistent rate-limiting and account lockout fields (failedLoginAttempts, lockedUntil).
 * - Zero-downtime lazy migration of existing accounts from read-only _phone-users.json.
 * - Strict preservation of existing UIDs (phone_<digits>) and bcrypt/PBKDF2 password verification.
 * - Server-side Firebase Custom Token generation via Firebase Admin SDK.
 * - Safe fail-closed error handling (no insecure local fallback on database errors).
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const hasServiceAccountCredentials = Boolean(
  process.env.FIREBASE_SERVICE_ACCOUNT_KEY ||
  (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL)
);

// Safe Firebase Admin initialization
let adminApp = null;
let adminAuth = null;
let adminFirestore = null;
let adminInitialized = false;
let customFirestoreInjected = false;
let customAuthInjected = false;

const initFirebaseAdmin = () => {
  if (adminInitialized) {
    return { adminApp, adminAuth, adminFirestore };
  }

  try {
    const { initializeApp, getApps, cert } = require('firebase-admin/app');
    const { getAuth } = require('firebase-admin/auth');
    const { getFirestore } = require('firebase-admin/firestore');

    if (getApps().length === 0) {
      if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
        adminApp = initializeApp({
          credential: cert(serviceAccount),
          projectId: serviceAccount.project_id || process.env.FIREBASE_PROJECT_ID || 'mystic-now-482206-r1',
        });
      } else if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
        adminApp = initializeApp({
          credential: cert({
            projectId: process.env.FIREBASE_PROJECT_ID || 'mystic-now-482206-r1',
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
          }),
          projectId: process.env.FIREBASE_PROJECT_ID || 'mystic-now-482206-r1',
        });
      } else {
        adminApp = initializeApp({
          projectId: process.env.FIREBASE_PROJECT_ID || 'mystic-now-482206-r1',
        });
      }
      adminInitialized = true;
    } else {
      adminApp = getApps()[0];
      adminInitialized = true;
    }

    if (adminApp) {
      if (!customAuthInjected) {
        try {
          adminAuth = getAuth(adminApp);
        } catch (e) {
          console.warn('getAuth warning:', e.message);
        }
      }
      if (!customFirestoreInjected) {
        try {
          adminFirestore = getFirestore(adminApp);
        } catch (e) {
          console.warn('getFirestore warning:', e.message);
        }
      }
    }
  } catch (e) {
    console.warn('Firebase Admin init warning in connect-auth-phone:', e.message);
  }

  return { adminApp, adminAuth, adminFirestore };
};

// Auto-run init
initFirebaseAdmin();

// Read-only legacy fallback file for lazy migration
const DB_FILE = path.join(__dirname, '_phone-users.json');

const loadPhoneUsers = () => {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('Error reading legacy phone users store:', e.message);
  }
  return {};
};

/**
 * Normalizes Indian mobile number to canonical E.164 (+91XXXXXXXXXX)
 */
const normalizeIndianMobile = (input) => {
  if (!input || typeof input !== 'string') return null;
  const digits = input.replace(/[^0-9]/g, '');

  if (digits.length === 10) {
    return `+91${digits}`;
  }
  if (digits.length === 12 && digits.startsWith('91')) {
    return `+${digits}`;
  }
  if (digits.length === 11 && digits.startsWith('0')) {
    return `+91${digits.slice(1)}`;
  }
  if (input.startsWith('+91') && digits.length === 12) {
    return `+${digits}`;
  }
  return null;
};

/**
 * Validates canonical Indian mobile format: +91 followed by 6, 7, 8, or 9 and 9 digits
 */
const isValidIndianMobile = (e164) => {
  return /^\+91[6-9]\d{9}$/.test(e164);
};

/**
 * Bcrypt password hashing (Cost 10)
 */
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

/**
 * Timing-safe password verification with backwards compatibility for PBKDF2
 */
const verifyPassword = async (password, storedHash) => {
  if (!storedHash) return false;
  if (storedHash.startsWith('$2')) {
    return await bcrypt.compare(password, storedHash);
  }
  // Backwards compatibility for legacy PBKDF2 accounts
  if (storedHash.includes(':')) {
    const [salt, originalHash] = storedHash.split(':');
    const checkHash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
    return crypto.timingSafeEqual(Buffer.from(checkHash, 'hex'), Buffer.from(originalHash, 'hex'));
  }
  return false;
};

const ALLOWED_ORIGINS = [
  'https://sanskrutiservice.in',
  'https://www.sanskrutiservice.in',
  'http://localhost:5173',
  'http://localhost:8888',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:8888',
];

const getCorsOrigin = (event) => {
  const reqOrigin = event.headers?.origin || event.headers?.Origin || '';
  if (!reqOrigin) {
    return process.env.URL || 'https://sanskrutiservice.in';
  }
  if (
    ALLOWED_ORIGINS.includes(reqOrigin) ||
    (process.env.URL && reqOrigin === process.env.URL) ||
    (process.env.DEPLOY_PRIME_URL && reqOrigin === process.env.DEPLOY_PRIME_URL) ||
    reqOrigin.endsWith('.netlify.app')
  ) {
    return reqOrigin;
  }
  return 'https://sanskrutiservice.in';
};

const getClientIp = (event) => {
  const h = event.headers || {};
  return (
    h['x-nf-client-connection-ip'] ||
    h['client-ip'] ||
    (h['x-forwarded-for'] ? h['x-forwarded-for'].split(',')[0].trim() : '') ||
    h['x-real-ip'] ||
    '127.0.0.1'
  );
};

/**
 * Persistent, abuse-resistant rate limiting in Cloud Firestore
 * Tracks attempt count within rolling windows per IP to prevent credential stuffing and registration flooding.
 */
const checkPersistentIpRateLimit = async (db, clientIp, options = {}) => {
  if (!db) return { allowed: true };
  const { maxAttempts = clientIp === '127.0.0.1' ? 60 : 15, windowMs = 60000, blockDurationMs = 300000 } = options;
  
  const ipHash = crypto.createHash('sha256').update(clientIp).digest('hex').slice(0, 20);
  const rateDocRef = db.collection('rate_limits').doc(`ip_${ipHash}`);
  
  return await db.runTransaction(async (transaction) => {
    const snap = await transaction.get(rateDocRef);
    const now = Date.now();
    let rateData = snap.exists ? snap.data() : { attempts: 0, windowStart: now, blockedUntil: 0 };

    if (rateData.blockedUntil && now < rateData.blockedUntil) {
      const waitMins = Math.ceil((rateData.blockedUntil - now) / 60000);
      return {
        allowed: false,
        waitMins,
        blockedUntil: rateData.blockedUntil,
      };
    }

    if (now - (rateData.windowStart || 0) > windowMs) {
      rateData.attempts = 1;
      rateData.windowStart = now;
      rateData.blockedUntil = 0;
    } else {
      rateData.attempts = (rateData.attempts || 0) + 1;
    }

    if (rateData.attempts > maxAttempts) {
      rateData.blockedUntil = now + blockDurationMs;
      transaction.set(rateDocRef, { ...rateData, ipHash, updatedAt: new Date().toISOString() });
      const waitMins = Math.ceil(blockDurationMs / 60000);
      return {
        allowed: false,
        waitMins,
        blockedUntil: rateData.blockedUntil,
      };
    }

    transaction.set(rateDocRef, { ...rateData, ipHash, updatedAt: new Date().toISOString() });
    return { allowed: true, attempts: rateData.attempts };
  });
};

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': getCorsOrigin(event),
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const { mode, phone, password, name } = body;

    if (!mode || (mode !== 'login' && mode !== 'signup')) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid mode. Must be "login" or "signup".' }),
      };
    }

    if (!phone) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Please enter a valid 10-digit mobile number.' }),
      };
    }

    if (!password || password.length < 6) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Password must be at least 6 characters long.' }),
      };
    }

    const normalizedPhone = normalizeIndianMobile(phone);
    if (!normalizedPhone || !isValidIndianMobile(normalizedPhone)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Wrong number! Please input correct 10-digit mobile number.',
        }),
      };
    }

    const { adminAuth: currentAuth, adminFirestore: currentDb } = initFirebaseAdmin();

    // Fail safely if Firestore is unavailable (no insecure local fallback writes)
    if (!currentDb) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: 'Authentication database service is currently unavailable. Please try again.',
          code: 'auth/database-unavailable',
        }),
      };
    }

    // Persistent IP Rate Limiting Check
    const clientIp = getClientIp(event);
    const rateCheck = await checkPersistentIpRateLimit(currentDb, clientIp);
    if (!rateCheck.allowed) {
      return {
        statusCode: 429,
        headers,
        body: JSON.stringify({
          error: `Too many requests from this IP address. Please try again after ${rateCheck.waitMins} minutes.`,
          code: 'auth/too-many-requests',
        }),
      };
    }

    const phoneDigits = normalizedPhone.replace(/[^0-9]/g, '');
    const uid = `phone_${phoneDigits}`;

    // ─────────────────────────────────────────────────────────────
    // 1. SIGNUP (Atomic Duplicate Prevention via Firestore Transaction)
    // ─────────────────────────────────────────────────────────────
    if (mode === 'signup') {
      try {
        const atomicResult = await currentDb.runTransaction(async (transaction) => {
          const docRef = currentDb.collection('phone_credentials').doc(normalizedPhone);
          const docSnap = await transaction.get(docRef);

          if (docSnap.exists) {
            return { conflict: true };
          }

          // Check legacy store as well (read-only)
          const legacyStore = loadPhoneUsers();
          if (legacyStore[normalizedPhone]) {
            return { conflict: true };
          }

          const passwordHash = await hashPassword(password);
          const userRecord = {
            uid,
            phone: normalizedPhone,
            name: (name || 'CONNECT User').trim(),
            username: '@' + (name ? name.toLowerCase().replace(/[^a-z0-9]/g, '_') : `user_${phoneDigits.slice(-4)}`),
            passwordHash,
            failedLoginAttempts: 0,
            lockedUntil: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          transaction.set(docRef, userRecord);

          // Atomically initialize users/{uid} document with the chosen name
          const userDocRef = currentDb.collection('users').doc(uid);
          transaction.set(userDocRef, {
            profile: {
              uid,
              userId: 'CN-' + phoneDigits.slice(-6).toUpperCase(),
              name: userRecord.name,
              username: userRecord.username,
              phone: normalizedPhone,
              email: '',
              avatar: '/default-avatars/1.png',
              dob: '2000-01-01',
              isProfileComplete: false,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            wallet: { coins: 0, updatedAt: new Date().toISOString() },
            favourites: [],
            purchasedPacks: [],
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
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });

          return { conflict: false, userRecord };
        });

        if (atomicResult.conflict) {
          return {
            statusCode: 409,
            headers,
            body: JSON.stringify({
              error: 'This mobile number is already registered. Please log in instead.',
              code: 'auth/phone-already-in-use',
            }),
          };
        }

        const userRecord = atomicResult.userRecord;

        // Generate Firebase Custom Token
        let customToken = null;
        if (currentAuth) {
          try {
            customToken = await currentAuth.createCustomToken(uid, {
              phone_number: normalizedPhone,
              display_name: userRecord.name,
            });
          } catch (tokenErr) {
            console.error('Firebase Admin customToken generation failed:', tokenErr.message);
            return {
              statusCode: 500,
              headers,
              body: JSON.stringify({
                error: 'Authentication service temporarily unavailable. Token generation failed.',
                code: 'auth/token-generation-failed',
              }),
            };
          }
        } else {
          return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
              error: 'Authentication service unavailable: Firebase Admin not initialized.',
              code: 'auth/admin-not-initialized',
            }),
          };
        }

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            uid,
            phone: normalizedPhone,
            name: userRecord.name,
            username: userRecord.username,
            customToken,
            message: 'Account created successfully!',
          }),
        };
      } catch (txErr) {
        console.error('Firestore signup transaction error:', txErr);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({
            error: 'Database operation failed during registration. Please try again.',
            code: 'auth/database-error',
          }),
        };
      }
    }

    // ─────────────────────────────────────────────────────────────
    // 2. LOGIN (Firestore Persistent Lockout & Lazy Migration)
    // ─────────────────────────────────────────────────────────────
    if (mode === 'login') {
      try {
        const docRef = currentDb.collection('phone_credentials').doc(normalizedPhone);
        const userDocSnap = await docRef.get();
        let userRecord = userDocSnap.exists ? userDocSnap.data() : null;
        let isLazyMigrated = false;

        // If not in Firestore, check legacy store for lazy migration
        if (!userRecord) {
          const legacyStore = loadPhoneUsers();
          const legacyRecord = legacyStore[normalizedPhone];
          if (legacyRecord) {
            userRecord = legacyRecord;
            isLazyMigrated = true;
          }
        }

        // Check persistent lockout status
        if (userRecord && userRecord.lockedUntil) {
          const lockExpiry = new Date(userRecord.lockedUntil).getTime();
          if (Date.now() < lockExpiry) {
            const waitMins = Math.ceil((lockExpiry - Date.now()) / 60000);
            return {
              statusCode: 429,
              headers,
              body: JSON.stringify({
                error: `Too many failed login attempts. Please try again after ${waitMins} minutes.`,
                code: 'auth/too-many-requests',
              }),
            };
          }
        }

        // Timing-safe verification
        const dummyBcryptHash = '$2a$10$wT0vA9e1P6qF7vL8hZ9K2e6J2e3H1l2b3c4d5e6f7g8h9i0j1k2l3';
        const isMatch = userRecord
          ? await verifyPassword(password, userRecord.passwordHash)
          : await verifyPassword(password, dummyBcryptHash);

        if (!userRecord || !isMatch) {
          // Increment persistent lockout in Firestore if doc exists
          if (userDocSnap.exists) {
            const nextAttempts = (userRecord.failedLoginAttempts || 0) + 1;
            const updates = {
              failedLoginAttempts: nextAttempts,
              updatedAt: new Date().toISOString(),
            };
            if (nextAttempts >= 5) {
              updates.lockedUntil = new Date(Date.now() + 15 * 60 * 1000).toISOString();
            }
            await docRef.update(updates).catch(() => {});
          }

          return {
            statusCode: 401,
            headers,
            body: JSON.stringify({
              error: 'Invalid mobile number or password. Please check your credentials.',
              code: 'auth/invalid-credential',
            }),
          };
        }

        // Successful password verification:
        // If from legacy store, lazily migrate to Firestore immediately with exact UID preserved
        if (isLazyMigrated) {
          const migratedData = {
            uid: userRecord.uid, // EXACT SAME UID PRESERVED!
            phone: normalizedPhone,
            name: userRecord.name || 'CONNECT User',
            username: userRecord.username || `@user_${phoneDigits.slice(-4)}`,
            passwordHash: userRecord.passwordHash.startsWith('$2')
              ? userRecord.passwordHash
              : await hashPassword(password),
            failedLoginAttempts: 0,
            lockedUntil: null,
            createdAt: userRecord.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            migratedFromLocal: true,
          };
          await docRef.set(migratedData);
          userRecord = migratedData;
        } else {
          // Reset failed attempts in Firestore on successful login
          if (userRecord.failedLoginAttempts > 0 || userRecord.lockedUntil) {
            await docRef.update({
              failedLoginAttempts: 0,
              lockedUntil: null,
              updatedAt: new Date().toISOString(),
            }).catch(() => {});
          }
        }

        // Generate Firebase Custom Token
        let customToken = null;
        if (currentAuth) {
          try {
            customToken = await currentAuth.createCustomToken(userRecord.uid, {
              phone_number: normalizedPhone,
              display_name: userRecord.name,
            });
          } catch (tokenErr) {
            console.error('Firebase Admin customToken generation failed:', tokenErr.message);
            return {
              statusCode: 500,
              headers,
              body: JSON.stringify({
                error: 'Authentication service temporarily unavailable. Token generation failed.',
                code: 'auth/token-generation-failed',
              }),
            };
          }
        } else {
          return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
              error: 'Authentication service unavailable: Firebase Admin not initialized.',
              code: 'auth/admin-not-initialized',
            }),
          };
        }

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            uid: userRecord.uid,
            phone: normalizedPhone,
            name: userRecord.name,
            username: userRecord.username,
            customToken,
            message: 'Login successful!',
          }),
        };
      } catch (loginErr) {
        console.error('Firestore login error:', loginErr);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({
            error: 'Database operation failed during login. Please try again.',
            code: 'auth/database-error',
          }),
        };
      }
    }
  } catch (err) {
    console.error('Mobile auth handler error:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Authentication failed due to a server error. Please try again.',
        code: 'auth/internal-error',
      }),
    };
  }
};

// Test helper hooks for injecting mocks during offline automated testing
exports._setFirestoreDb = (customDb) => {
  adminFirestore = customDb;
  customFirestoreInjected = true;
};

exports._setAdminAuth = (customAuth) => {
  adminAuth = customAuth;
  customAuthInjected = true;
};
