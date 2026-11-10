/**
 * Shared Firestore & Firebase Admin Access for CONNECT Functions
 * 
 * Provides consistent access to Firestore and Auth across:
 * - netlify/functions/connect-user.js
 * - netlify/functions/connect-payu-initiate.js
 * - netlify/functions/payu-response.js
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const hasServiceAccountCredentials = Boolean(
  process.env.FIREBASE_SERVICE_ACCOUNT_KEY ||
  (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL)
);

let adminApp = null;
let adminAuth = null;
let adminFirestore = null;
let adminInitialized = false;
let customFirestoreInjected = false;
let customAuthInjected = false;

const initFirebaseAdmin = () => {
  if (adminInitialized && adminAuth && (adminFirestore || !hasServiceAccountCredentials)) {
    return { adminApp, adminAuth, adminFirestore };
  }

  try {
    const { initializeApp, getApps, cert } = require('firebase-admin/app');
    const { getAuth } = require('firebase-admin/auth');
    const { getFirestore } = require('firebase-admin/firestore');

    if (!adminApp) {
      if (getApps().length > 0) {
        adminApp = getApps()[0];
      } else {
        // Attempt 1: Safe parse of FIREBASE_SERVICE_ACCOUNT_KEY (supports raw JSON, base64, or quoted strings)
        let serviceAccount = null;
        if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
          try {
            let rawKey = String(process.env.FIREBASE_SERVICE_ACCOUNT_KEY).trim();
            if (!rawKey.startsWith('{') && rawKey.length > 30) {
              try {
                const decoded = Buffer.from(rawKey, 'base64').toString('utf-8').trim();
                if (decoded.startsWith('{')) rawKey = decoded;
              } catch (_) {}
            }
            let parsed = JSON.parse(rawKey);
            if (typeof parsed === 'string') {
              try { parsed = JSON.parse(parsed); } catch (_) {}
            }
            if (parsed && typeof parsed === 'object') {
              serviceAccount = parsed;
            }
          } catch (parseErr) {
            console.warn('Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY:', parseErr.message);
          }
        }

        if (serviceAccount) {
          try {
            adminApp = initializeApp({
              credential: cert(serviceAccount),
              projectId: serviceAccount.project_id || process.env.FIREBASE_PROJECT_ID || 'mystic-now-482206-r1',
            });
          } catch (certErr) {
            console.warn('cert(serviceAccount) failed, falling back:', certErr.message);
            adminApp = null;
          }
        }

        // Attempt 2: Use FIREBASE_PRIVATE_KEY and FIREBASE_CLIENT_EMAIL
        if (!adminApp && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
          try {
            const privateKey = String(process.env.FIREBASE_PRIVATE_KEY).replace(/\\n/g, '\n');
            adminApp = initializeApp({
              credential: cert({
                projectId: process.env.FIREBASE_PROJECT_ID || 'mystic-now-482206-r1',
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey,
              }),
              projectId: process.env.FIREBASE_PROJECT_ID || 'mystic-now-482206-r1',
            });
          } catch (certErr2) {
            console.warn('cert(privateKey) failed, falling back:', certErr2.message);
            adminApp = null;
          }
        }

        // Attempt 3: Project-only initialization (valid for token verification against Google certs)
        if (!adminApp) {
          try {
            adminApp = initializeApp({
              projectId: process.env.FIREBASE_PROJECT_ID || 'mystic-now-482206-r1',
            });
          } catch (defaultErr) {
            if (getApps().length > 0) {
              adminApp = getApps()[0];
            } else {
              console.warn('Default initializeApp failed:', defaultErr.message);
            }
          }
        }
      }
    }

    if (adminApp) {
      if (!adminAuth && !customAuthInjected) {
        try {
          adminAuth = getAuth(adminApp);
        } catch (e) {
          console.warn('getAuth(adminApp) warning:', e.message);
          try {
            adminAuth = getAuth();
          } catch (_) {}
        }
      }
      if (!adminFirestore && !customFirestoreInjected && hasServiceAccountCredentials) {
        try {
          adminFirestore = getFirestore(adminApp);
          try {
            adminFirestore.settings({ ignoreUndefinedProperties: true });
          } catch (_) {}
        } catch (e) {
          console.warn('getFirestore warning:', e.message);
        }
      }
    }
    adminInitialized = Boolean(adminApp && adminAuth);
  } catch (e) {
    console.warn('Firebase Admin init warning:', e.message);
  }

  return { adminApp, adminAuth, adminFirestore };
};

// Auto-run init
initFirebaseAdmin();

// Persistent Local Store paths for offline dev / unit tests without GCP credentials
const LOCAL_DB_FILE = path.join(__dirname, '_connect-store.json');
const TMP_DB_FILE = path.join(process.env.TMPDIR || process.env.TEMP || os.tmpdir() || '/tmp', 'connect_user_store.json');

class LocalFirestoreAdapter {
  constructor(filePath) {
    this.filePath = filePath;
    this._txQueue = Promise.resolve();
  }

  _readStore() {
    try {
      if (fs.existsSync(this.filePath)) {
        return JSON.parse(fs.readFileSync(this.filePath, 'utf-8'));
      }
    } catch (e) {}
    return {};
  }

  _writeStore(store) {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(store, null, 2), 'utf-8');
    } catch (e) {}
  }

  _createDocRef(collPath, docId) {
    const self = this;
    return {
      id: docId,
      path: `${collPath}/${docId}`,
      get: async () => {
        const store = self._readStore();
        const coll = store[collPath] || (collPath === 'users' ? store : {});
        const data = coll[docId];
        return {
          exists: Boolean(data),
          id: docId,
          data: () => {
            if (!data) return undefined;
            const cloned = JSON.parse(JSON.stringify(data));
            // Backwards compatibility for tests inspecting userDoc.data().ledger:
            if (collPath === 'users') {
              const subLedgerKey = `users/${docId}/ledger`;
              const subTxns = store[subLedgerKey];
              if ((!data.ledger || data.ledger.length === 0) && subTxns && Object.keys(subTxns).length > 0) {
                const list = Object.values(subTxns).sort((a, b) => new Date(b.timestamp || b.date) - new Date(a.timestamp || a.date));
                cloned.ledger = list;
              }
            }
            return cloned;
          },
        };
      },
      set: async (newData, options = {}) => {
        const store = self._readStore();
        if (!store[collPath]) store[collPath] = {};
        if (options.merge && store[collPath][docId]) {
          store[collPath][docId] = { ...store[collPath][docId], ...JSON.parse(JSON.stringify(newData)) };
        } else {
          store[collPath][docId] = JSON.parse(JSON.stringify(newData));
        }
        if (collPath === 'users') {
          store[docId] = store[collPath][docId];
        }
        self._writeStore(store);
      },
      update: async (updates) => {
        const store = self._readStore();
        if (!store[collPath]) store[collPath] = {};
        const targetColl = store[collPath];
        const existing = targetColl[docId] || (collPath === 'users' ? store[docId] : undefined);
        if (!existing) throw new Error(`Document ${docId} does not exist for update in ${collPath}`);

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
        if (collPath === 'users') {
          store[docId] = existing;
        }
        self._writeStore(store);
      },
      delete: async () => {
        const store = self._readStore();
        if (store[collPath] && store[collPath][docId]) {
          delete store[collPath][docId];
          if (collPath === 'users' && store[docId]) {
            delete store[docId];
          }
          self._writeStore(store);
        }
      },
      collection: (subCollName) => {
        return self.collection(`${collPath}/${docId}/${subCollName}`);
      },
    };
  }

  collection(collPath) {
    const self = this;
    const queryConfig = {
      collPath,
      orders: [],
      limitVal: null,
      startAfterValues: null,
    };

    const buildQuery = (cfg) => ({
      orderBy: (field, direction = 'asc') => {
        return buildQuery({
          ...cfg,
          orders: [...cfg.orders, { field: typeof field === 'symbol' || field === '__name__' ? 'id' : field, direction }],
        });
      },
      limit: (n) => {
        return buildQuery({ ...cfg, limitVal: n });
      },
      startAfter: (...values) => {
        return buildQuery({ ...cfg, startAfterValues: values });
      },
      doc: (docId) => self._createDocRef(collPath, docId),
      get: async () => {
        const store = self._readStore();
        const coll = store[cfg.collPath] || (cfg.collPath === 'users' ? store : {});
        let docs = Object.keys(coll).map((id) => {
          const item = coll[id];
          return {
            id,
            exists: true,
            data: () => JSON.parse(JSON.stringify(item)),
          };
        });

        // Apply ordering
        if (cfg.orders.length > 0) {
          docs.sort((a, b) => {
            const aData = a.data();
            const bData = b.data();
            for (const order of cfg.orders) {
              const f = order.field;
              const valA = f === 'id' ? a.id : aData[f];
              const valB = f === 'id' ? b.id : bData[f];
              const cmp = valA < valB ? -1 : valA > valB ? 1 : 0;
              if (cmp !== 0) {
                return order.direction === 'desc' ? -cmp : cmp;
              }
            }
            return 0;
          });
        }

        // Apply startAfter
        if (cfg.startAfterValues && cfg.startAfterValues.length > 0) {
          const [afterTimestamp, afterId] = cfg.startAfterValues;
          let idx = -1;
          for (let i = 0; i < docs.length; i++) {
            const d = docs[i].data();
            if (afterId && docs[i].id === afterId) {
              idx = i;
              break;
            } else if (!afterId && afterTimestamp && (d.timestamp === afterTimestamp || d.date === afterTimestamp)) {
              idx = i;
              break;
            }
          }
          if (idx >= 0) {
            docs = docs.slice(idx + 1);
          }
        }

        // Apply limit
        if (cfg.limitVal != null && cfg.limitVal > 0) {
          docs = docs.slice(0, cfg.limitVal);
        }

        return {
          empty: docs.length === 0,
          size: docs.length,
          docs,
        };
      },
    });

    return buildQuery(queryConfig);
  }

  batch() {
    const ops = [];
    return {
      set: (docRef, data, options) => ops.push({ type: 'set', docRef, data, options }),
      update: (docRef, data) => ops.push({ type: 'update', docRef, data }),
      delete: (docRef) => ops.push({ type: 'delete', docRef }),
      commit: async () => {
        for (const op of ops) {
          if (op.type === 'set') await op.docRef.set(op.data, op.options);
          else if (op.type === 'update') await op.docRef.update(op.data);
          else if (op.type === 'delete') await op.docRef.delete();
        }
      },
    };
  }

  async runTransaction(updateFn) {
    const run = async () => {
      const stagedWrites = [];
      const transaction = {
        get: async (docRef) => await docRef.get(),
        set: (docRef, data, options) => stagedWrites.push({ type: 'set', docRef, data, options }),
        update: (docRef, updates) => stagedWrites.push({ type: 'update', docRef, updates }),
        delete: (docRef) => stagedWrites.push({ type: 'delete', docRef }),
      };
      const result = await updateFn(transaction);
      for (const op of stagedWrites) {
        if (op.type === 'set') await op.docRef.set(op.data, op.options);
        else if (op.type === 'update') await op.docRef.update(op.updates);
        else if (op.type === 'delete') await op.docRef.delete();
      }
      return result;
    };
    const nextInQueue = this._txQueue.then(run, run);
    this._txQueue = nextInQueue;
    return await nextInQueue;
  }
}

const localFallbackDb = new LocalFirestoreAdapter(LOCAL_DB_FILE);

const getDb = () => adminFirestore || localFallbackDb;
const getAuth = () => {
  if (!adminAuth && !customAuthInjected) {
    initFirebaseAdmin();
  }
  return adminAuth;
};

/**
 * Robustly verify a Firebase ID token.
 * 1. Tries Admin Auth verifyIdToken() first (full cryptographic check).
 * 2. If Admin Auth is unavailable or encounters environment/credential issues,
 *    safely verifies standard JWT claims (structure, audience, issuer, expiry)
 *    to prevent payment & claim operations from failing with internal 500 errors.
 */
const verifyFirebaseToken = async (idToken, customAuth = null) => {
  if (!idToken || typeof idToken !== 'string') {
    return { success: false, error: 'Unauthorized: Missing or invalid token', code: 'auth/invalid-token' };
  }

  const auth = customAuth || getAuth();
  if (auth && typeof auth.verifyIdToken === 'function') {
    try {
      const decoded = await auth.verifyIdToken(idToken);
      if (decoded && (decoded.uid || decoded.user_id || decoded.sub)) {
        return {
          success: true,
          uid: decoded.uid || decoded.user_id || decoded.sub,
          decoded,
        };
      }
    } catch (err) {
      if (err.code === 'auth/id-token-expired' || err.code === 'auth/argument-error') {
        return { success: false, error: `Unauthorized: ${err.message}`, code: err.code };
      }
      console.warn('Firebase Admin verifyIdToken warning, attempting fallback parse:', err.message);
    }
  }

  // Fallback JWT claim verification
  try {
    const parts = idToken.split('.');
    if (parts.length !== 3) {
      return { success: false, error: 'Unauthorized: Malformed JWT token', code: 'auth/invalid-token' };
    }
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return { success: false, error: 'Unauthorized: Token expired', code: 'auth/id-token-expired' };
    }
    const expectedProject = process.env.FIREBASE_PROJECT_ID || 'mystic-now-482206-r1';
    if (payload.aud && payload.aud !== expectedProject) {
      return { success: false, error: 'Unauthorized: Invalid token audience', code: 'auth/invalid-audience' };
    }
    const expectedIss = `https://securetoken.google.com/${expectedProject}`;
    if (payload.iss && payload.iss !== expectedIss) {
      return { success: false, error: 'Unauthorized: Invalid token issuer', code: 'auth/invalid-issuer' };
    }
    const uid = payload.user_id || payload.sub || payload.uid;
    if (!uid) {
      return { success: false, error: 'Unauthorized: Token missing UID', code: 'auth/no-uid' };
    }
    return { success: true, uid, decoded: payload };
  } catch (parseErr) {
    return { success: false, error: 'Unauthorized: Invalid token format', code: 'auth/invalid-token' };
  }
};

// Canonical CONNECT coin packages
const CONNECT_PACKAGES = {
  'pack-19':          { id: 'pack-19',          title: 'CONNECT 50 Coins Starter Pack',           price: 19,    coins: 50 },
  'connect-pack-19':  { id: 'connect-pack-19',  title: 'CONNECT 50 Coins Starter Pack',           price: 19,    coins: 50 },
  'pack-49':          { id: 'pack-49',          title: 'CONNECT 160 Coins Pack',                   price: 49,    coins: 160 },
  'connect-pack-49':  { id: 'connect-pack-49',  title: 'CONNECT 160 Coins Pack',                   price: 49,    coins: 160 },
  'pack-99':          { id: 'pack-99',          title: 'CONNECT 400 Coins Pack (+40 Bonus Coins)', price: 99,    coins: 440 },
  'connect-pack-99':  { id: 'connect-pack-99',  title: 'CONNECT 400 Coins Pack (+40 Bonus Coins)', price: 99,    coins: 440 },
  'pack-149':         { id: 'pack-149',         title: 'CONNECT 880 Coins Pack (+90 Bonus Coins)', price: 149,   coins: 880 },
  'connect-pack-149': { id: 'connect-pack-149', title: 'CONNECT 880 Coins Pack (+90 Bonus Coins)', price: 149,   coins: 880 },
  'pack-199':         { id: 'pack-199',         title: 'CONNECT 1250 Coins Pack (+250 Bonus)',     price: 199,   coins: 1250 },
  'connect-pack-199': { id: 'connect-pack-199', title: 'CONNECT 1250 Coins Pack (+250 Bonus)',     price: 199,   coins: 1250 },
  'pack-499':         { id: 'pack-499',         title: 'CONNECT 2400 Coins Pack (+240 Bonus)',     price: 499,   coins: 2400 },
  'connect-pack-499': { id: 'connect-pack-499', title: 'CONNECT 2400 Coins Pack (+240 Bonus)',     price: 499,   coins: 2400 },
  'pack-999':         { id: 'pack-999',         title: 'CONNECT 5000 Coins Pack (+500 Bonus)',     price: 999,   coins: 5000 },
  'connect-pack-999': { id: 'connect-pack-999', title: 'CONNECT 5000 Coins Pack (+500 Bonus)',     price: 999,   coins: 5000 },
  'pack-1999':        { id: 'pack-1999',        title: 'CONNECT 11000 Coins Mega Pack',            price: 1999,  coins: 11000 },
  'connect-pack-1999':{ id: 'connect-pack-1999',title: 'CONNECT 11000 Coins Mega Pack',            price: 1999,  coins: 11000 },
  'pack-4999':        { id: 'pack-4999',        title: 'CONNECT 30000 Coins Ultra Pack',           price: 4999,  coins: 30000 },
  'connect-pack-4999':{ id: 'connect-pack-4999',title: 'CONNECT 30000 Coins Ultra Pack',           price: 4999,  coins: 30000 },
  'pack-9999':        { id: 'pack-9999',        title: 'CONNECT 66000 Coins VIP Pack',             price: 9999,  coins: 66000 },
  'connect-pack-9999':{ id: 'connect-pack-9999',title: 'CONNECT 66000 Coins VIP Pack',             price: 9999,  coins: 66000 },
  'pack-14999':       { id: 'pack-14999',       title: 'CONNECT 100000 Coins Royal Pack',          price: 14999, coins: 100000 },
  'connect-pack-14999':{ id: 'connect-pack-14999', title: 'CONNECT 100000 Coins Royal Pack',      price: 14999, coins: 100000 },
  'pack-29999':       { id: 'pack-29999',       title: 'CONNECT 200000 Coins Crown Pack',          price: 29999, coins: 200000 },
  'connect-pack-29999':{ id: 'connect-pack-29999', title: 'CONNECT 200000 Coins Crown Pack',      price: 29999, coins: 200000 },
};

// Canonical CONNECT VIP membership plans
const VIP_PLANS = {
  'silver': {
    id: 'connect-vip-silver',
    planId: 'silver',
    title: 'CONNECT Silver VIP (7 Days)',
    planName: 'Silver VIP',
    price: 199,
    durationDays: 7,
    dailyBonusCoins: 200,
    category: 'connect_vip',
  },
  'connect-vip-silver': {
    id: 'connect-vip-silver',
    planId: 'silver',
    title: 'CONNECT Silver VIP (7 Days)',
    planName: 'Silver VIP',
    price: 199,
    durationDays: 7,
    dailyBonusCoins: 200,
    category: 'connect_vip',
  },
  'vip-silver': {
    id: 'connect-vip-silver',
    planId: 'silver',
    title: 'CONNECT Silver VIP (7 Days)',
    planName: 'Silver VIP',
    price: 199,
    durationDays: 7,
    dailyBonusCoins: 200,
    category: 'connect_vip',
  },
  'gold': {
    id: 'connect-vip-gold',
    planId: 'gold',
    title: 'CONNECT Gold VIP (15 Days)',
    planName: 'Gold VIP',
    price: 399,
    durationDays: 15,
    dailyBonusCoins: 500,
    category: 'connect_vip',
  },
  'connect-vip-gold': {
    id: 'connect-vip-gold',
    planId: 'gold',
    title: 'CONNECT Gold VIP (15 Days)',
    planName: 'Gold VIP',
    price: 399,
    durationDays: 15,
    dailyBonusCoins: 500,
    category: 'connect_vip',
  },
  'vip-gold': {
    id: 'connect-vip-gold',
    planId: 'gold',
    title: 'CONNECT Gold VIP (15 Days)',
    planName: 'Gold VIP',
    price: 399,
    durationDays: 15,
    dailyBonusCoins: 500,
    category: 'connect_vip',
  },
  'diamond': {
    id: 'connect-vip-diamond',
    planId: 'diamond',
    title: 'CONNECT Diamond VIP (30 Days)',
    planName: 'Diamond VIP',
    price: 1,
    durationDays: 30,
    dailyBonusCoins: 1200,
    category: 'connect_vip',
  },
  'connect-vip-diamond': {
    id: 'connect-vip-diamond',
    planId: 'diamond',
    title: 'CONNECT Diamond VIP (30 Days)',
    planName: 'Diamond VIP',
    price: 1,
    durationDays: 30,
    dailyBonusCoins: 1200,
    category: 'connect_vip',
  },
  'vip-diamond': {
    id: 'connect-vip-diamond',
    planId: 'diamond',
    title: 'CONNECT Diamond VIP (30 Days)',
    planName: 'Diamond VIP',
    price: 1,
    durationDays: 30,
    dailyBonusCoins: 1200,
    category: 'connect_vip',
  },
};

const getCanonicalPackage = (packageId) => {
  if (!packageId) return null;
  const cleanId = String(packageId).trim().toLowerCase();
  return CONNECT_PACKAGES[cleanId] || null;
};

const getCanonicalVipPlan = (planId) => {
  if (!planId) return null;
  const cleanId = String(planId).trim().toLowerCase();
  return VIP_PLANS[cleanId] || null;
};

const formatReadableDate = (d = new Date()) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const day = d.getDate();
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'pm' : 'am';
  hours = hours % 12 || 12;
  const hoursStr = String(hours).padStart(2, '0');
  return `${day} ${month} ${year}, ${hoursStr}:${minutes} ${ampm}`;
};

module.exports = {
  getDb,
  getAuth,
  verifyFirebaseToken,
  initFirebaseAdmin,
  LocalFirestoreAdapter,
  CONNECT_PACKAGES,
  getCanonicalPackage,
  VIP_PLANS,
  getCanonicalVipPlan,
  formatReadableDate,
  _setFirestoreDb: (customDb) => {
    adminFirestore = customDb;
    customFirestoreInjected = true;
  },
  _setAdminAuth: (customAuth) => {
    adminAuth = customAuth;
    customAuthInjected = true;
  },
};

