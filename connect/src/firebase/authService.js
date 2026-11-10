import {
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithCustomToken,
  signInAnonymously,
  updateProfile,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth, googleProvider } from './config';

/**
 * Maps Firebase Auth error codes to user-friendly messages.
 */
export const getAuthErrorMessage = (error) => {
  if (!error) return 'An unknown error occurred.';
  const code = error.code || '';

  switch (code) {
    case 'auth/popup-closed-by-user':
      return 'Google sign-in popup was closed before completion.';
    case 'auth/cancelled-popup-request':
      return 'Sign-in operation was cancelled.';
    case 'auth/popup-blocked':
      return 'Sign-in popup was blocked by browser. Please allow popups for localhost.';
    case 'auth/unauthorized-domain':
      return 'This domain is not authorized in Firebase Console. Please add it to Authorized Domains.';
    case 'auth/user-not-found':
      return 'No account found with this email address. Please sign up first.';
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Invalid credentials or password. Please try again.';
    case 'auth/phone-already-in-use':
      return 'This mobile number is already registered. Please log in instead.';
    case 'auth/invalid-phone':
      return '❌ Wrong number! Please input correct 10-digit mobile number.';
    case 'auth/email-already-in-use':
      return 'This email is already registered. Please log in instead.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters long.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/network-request-failed':
      return 'Network connection error. Please check your internet connection.';
    case 'auth/operation-not-allowed':
      return 'Anonymous guest sign-in is not enabled in Firebase Console.';
    case 'auth/admin-restricted-operation':
      return 'Anonymous sign-in is currently restricted by administrator.';
    case 'auth/too-many-requests':
      return 'Too many failed login attempts. Please try again later or reset password.';
    default:
      return error.message || 'Authentication failed. Please try again.';
  }
};

/**
 * Sign in with Google (Popup on desktop, with redirect fallback for mobile).
 */
export const signInWithGoogle = async () => {
  const isMobile =
    typeof navigator !== 'undefined' &&
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );

  if (isMobile) {
    try {
      return await signInWithPopup(auth, googleProvider);
    } catch (popupErr) {
      if (
        popupErr.code === 'auth/popup-blocked' ||
        popupErr.code === 'auth/popup-closed-by-user'
      ) {
        // Fallback to full page redirect on mobile
        await signInWithRedirect(auth, googleProvider);
        return null;
      }
      throw popupErr;
    }
  }

  // Desktop popup
  return await signInWithPopup(auth, googleProvider);
};

/**
 * Handle mobile redirect sign-in result on page mount.
 */
export const handleRedirectResult = async () => {
  try {
    return await getRedirectResult(auth);
  } catch (err) {
    console.warn('Redirect sign-in error:', err);
    throw err;
  }
};

/**
 * Sign in with Email and Password
 */
export const signInWithEmail = async (email, password) => {
  return await signInWithEmailAndPassword(auth, email.trim(), password);
};

/**
 * Create new account with Email and Password
 */
export const signUpWithEmail = async (email, password, displayName = '') => {
  const userCredential = await createUserWithEmailAndPassword(
    auth,
    email.trim(),
    password
  );
  if (displayName && userCredential.user) {
    try {
      await updateProfile(userCredential.user, { displayName });
    } catch (e) {}
  }
  return userCredential;
};

/**
 * Normalizes Indian mobile number to canonical E.164 (+91XXXXXXXXXX).
 */
export const normalizeIndianMobile = (input) => {
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
 * Validates canonical Indian mobile format (+91 followed by 6, 7, 8, or 9 and 9 digits).
 */
export const isValidIndianMobile = (e164) => {
  return /^\+91[6-9]\d{9}$/.test(e164);
};

/**
 * Detects whether the input is an email, an Indian mobile number, or invalid.
 */
export const detectIdentifierType = (input) => {
  if (!input || typeof input !== 'string') return 'unknown';
  const trimmed = input.trim();
  if (trimmed.includes('@')) {
    return 'email';
  }
  const digits = trimmed.replace(/[^0-9]/g, '');
  if (digits.length >= 10) {
    const normalized = normalizeIndianMobile(trimmed);
    if (normalized && isValidIndianMobile(normalized)) {
      return 'phone';
    }
  }
  return 'unknown';
};

const PHONE_AUTH_STORAGE_KEY = 'connect_phone_auth_session';

export const getStoredPhoneUser = () => {
  return null;
};

export const savePhoneAuthSession = () => {
  // Deprecated: Production security requires authentic Firebase sessions only
  try {
    localStorage.removeItem(PHONE_AUTH_STORAGE_KEY);
  } catch (e) {}
};

export const clearPhoneAuthSession = () => {
  try {
    localStorage.removeItem(PHONE_AUTH_STORAGE_KEY);
  } catch (e) {}
};

/**
 * Authenticates with Indian mobile number + password via secure Netlify function backend.
 * Generates and exchanges a Firebase Custom Token to establish a genuine Firebase session.
 */
export const authenticateWithPhone = async ({ mode, phone, password, name = '' }) => {
  const normalizedPhone = normalizeIndianMobile(phone);
  if (!normalizedPhone || !isValidIndianMobile(normalizedPhone)) {
    const err = new Error('Please enter a valid 10-digit Indian mobile number (e.g. 9876543210).');
    err.code = 'auth/invalid-phone';
    throw err;
  }

  const endpoint = '/.netlify/functions/connect-auth-phone';
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      mode,
      phone: normalizedPhone,
      password,
      name,
    }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.error || 'Mobile authentication failed.');
    error.code = data.code || `auth/http-${response.status}`;
    error.status = response.status;
    throw error;
  }

  if (!data.customToken) {
    const error = new Error('Server did not return a valid authentication token. Please try again.');
    error.code = 'auth/missing-custom-token';
    throw error;
  }

  // Sign into Firebase Client SDK using the verified Custom Token
  const userCredential = await signInWithCustomToken(auth, data.customToken);
  const user = userCredential.user;

  // Clean up any legacy localStorage phone session
  clearPhoneAuthSession();

  return {
    user,
    uid: user.uid,
    phone: data.phone,
    name: data.name,
    username: data.username,
  };
};

/**
 * Sign in anonymously with Firebase for Guest users
 */
export const signInAsGuest = async () => {
  return await signInAnonymously(auth);
};

/**
 * Log out of Firebase and clear phone session
 */
export const logOut = async () => {
  clearPhoneAuthSession();
  return await signOut(auth);
};

/**
 * Subscribe to Firebase auth state changes
 */
export const subscribeToAuth = (callback) => {
  return onAuthStateChanged(auth, callback);
};


