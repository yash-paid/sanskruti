/**
 * CONNECT Mobile Number Authentication Netlify Function
 * 
 * Provides secure mobile number + password authentication without OTP or fake emails.
 * Uses PBKDF2 cryptographic password hashing, strict E.164 Indian mobile normalization,
 * persistent account storage, and Firebase Custom Token generation via Firebase Admin SDK.
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const hasServiceAccountCredentials = Boolean(
  process.env.FIREBASE_SERVICE_ACCOUNT_KEY ||
  (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL)
);

// Safe Firebase Admin initialization
let adminApp = null;
let adminAuth = null;
let adminFirestore = null;
let adminInitialized = false;

try {
  const { initializeApp, getApps, cert } = require('firebase-admin/app');
  const { getAuth } = require('firebase-admin/auth');
  const { getFirestore } = require('firebase-admin/firestore');

  if (hasServiceAccountCredentials) {
    if (getApps().length === 0) {
      if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
        adminApp = initializeApp({
          credential: cert(serviceAccount),
        });
      } else {
        adminApp = initializeApp({
          credential: cert({
            projectId: process.env.FIREBASE_PROJECT_ID || 'mystic-now-482206-r1',
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
          }),
        });
      }
      adminInitialized = true;
    } else {
      adminApp = getApps()[0];
      adminInitialized = true;
    }

    if (adminApp) {
      adminAuth = getAuth(adminApp);
      try {
        adminFirestore = getFirestore(adminApp);
      } catch (fsErr) {}
    }
  }
} catch (e) {
  console.warn('Firebase Admin init warning:', e.message);
}

// Persistent File-Based Storage for Phone Accounts
const DB_FILE = path.join(__dirname, '_phone-users.json');

const loadPhoneUsers = () => {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('Error reading phone users store:', e.message);
  }
  return {};
};

const savePhoneUsers = (users) => {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(users, null, 2), 'utf-8');
    return true;
  } catch (e) {
    console.error('Error writing phone users store:', e.message);
    return false;
  }
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
 * Secure PBKDF2 Password Hashing (100,000 iterations, SHA-512, 16-byte random salt)
 */
const hashPassword = (password) => {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
};

/**
 * Timing-safe password verification
 */
const verifyPassword = (password, storedHash) => {
  if (!storedHash || !storedHash.includes(':')) return false;
  const [salt, originalHash] = storedHash.split(':');
  const checkHash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return crypto.timingSafeEqual(Buffer.from(checkHash, 'hex'), Buffer.from(originalHash, 'hex'));
};

exports.handler = async (event, context) => {
  // CORS Headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
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

    // Deterministic unique UID for this mobile number
    const phoneDigits = normalizedPhone.replace(/[^0-9]/g, '');
    const uid = `phone_${phoneDigits}`;

    const usersStore = loadPhoneUsers();

    if (mode === 'signup') {
      // 1. Check if mobile number already registered
      if (usersStore[normalizedPhone]) {
        return {
          statusCode: 409,
          headers,
          body: JSON.stringify({
            error: 'This mobile number is already registered. Please log in instead.',
            code: 'auth/phone-already-in-use',
          }),
        };
      }

      // 2. Hash password & store account
      const passwordHash = hashPassword(password);
      const userRecord = {
        uid,
        phone: normalizedPhone,
        name: (name || 'CONNECT User').trim(),
        username: '@' + (name ? name.toLowerCase().replace(/[^a-z0-9]/g, '_') : `user_${phoneDigits.slice(-4)}`),
        passwordHash,
        createdAt: new Date().toISOString(),
      };

      usersStore[normalizedPhone] = userRecord;
      savePhoneUsers(usersStore);

      // 3. Generate Firebase Custom Token
      let customToken = null;
      if (adminAuth) {
        try {
          customToken = await adminAuth.createCustomToken(uid, {
            phone_number: normalizedPhone,
          });
        } catch (tokenErr) {
          console.warn('Firebase Admin customToken generation failed:', tokenErr.message);
        }
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
    } else if (mode === 'login') {
      // 1. Check if user exists
      const existingUser = usersStore[normalizedPhone];
      if (!existingUser) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({
            error: 'No account found with this mobile number. Please sign up.',
            code: 'auth/user-not-found',
          }),
        };
      }

      // 2. Verify password hash
      const isMatch = verifyPassword(password, existingUser.passwordHash);
      if (!isMatch) {
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({
            error: 'Incorrect password for this mobile number. Please try again.',
            code: 'auth/wrong-password',
          }),
        };
      }

      // 3. Generate Firebase Custom Token
      let customToken = null;
      if (adminAuth) {
        try {
          customToken = await adminAuth.createCustomToken(uid, {
            phone_number: normalizedPhone,
          });
        } catch (tokenErr) {
          console.warn('Firebase Admin customToken generation failed:', tokenErr.message);
        }
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          uid,
          phone: normalizedPhone,
          name: existingUser.name,
          username: existingUser.username,
          customToken,
          message: 'Login successful!',
        }),
      };
    }
  } catch (err) {
    console.error('Mobile auth function error:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Authentication failed due to a server error. Please try again.',
      }),
    };
  }
};
