/**
 * CONNECT Multi-User Backend & Data Architecture
 * 
 * Provides isolated, Firestore-persisted user profiles, independent authoritative wallets,
 * atomic coin ledger transactions, favourites, purchased pack records, daily login rewards,
 * and VIP entitlements.
 * 
 * Strict Security Guarantees:
 * - Every operation derives the authenticated UID exclusively from verified Firebase ID tokens.
 * - Cross-account access is strictly forbidden (403 Forbidden).
 * - Backend is the SOLE authority for coin balances. Client-supplied balances are 100% ignored.
 * - Every balance change creates an atomic, immutable ledger entry with running balanceAfter.
 * - Duplicate transaction requests (idempotency keys) cannot credit coins twice.
 * - Firestore transactions guarantee ACID atomicity across all instances.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const { getCanonicalPackage } = require('./_connect-db');

const ALLOWED_ORIGINS = [
  'https://sanskrutiservice.in',
  'https://www.sanskrutiservice.in',
  'http://localhost:5173',
  'http://localhost:8888',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:8888',
];

const getCorsOrigin = (event) => {
  const reqOrigin = event?.headers?.origin || event?.headers?.Origin || '';
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

// Safe Firebase Admin initialization
let adminApp = null;
let adminAuth = null;
let adminFirestore = null;
let adminInitialized = false;
let customFirestoreInjected = false;
let customAuthInjected = false;

const hasServiceAccountCredentials = Boolean(
  process.env.FIREBASE_SERVICE_ACCOUNT_KEY ||
  (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL)
);

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
      if (!customFirestoreInjected && hasServiceAccountCredentials) {
        try {
          adminFirestore = getFirestore(adminApp);
        } catch (e) {
          console.warn('getFirestore warning:', e.message);
        }
      }
    }
  } catch (e) {
    console.warn('Firebase Admin init in connect-user warning:', e.message);
  }

  return { adminApp, adminAuth, adminFirestore };
};

// Auto-run init
initFirebaseAdmin();

// Persistent Local Store paths for offline dev / legacy migration
const LOCAL_DB_FILE = path.join(__dirname, '_connect-store.json');
const TMP_DB_FILE = path.join(process.env.TMPDIR || process.env.TEMP || os.tmpdir() || '/tmp', 'connect_user_store.json');

const loadStore = () => {
  try {
    if (fs.existsSync(LOCAL_DB_FILE)) {
      const raw = fs.readFileSync(LOCAL_DB_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (e) {}

  try {
    if (fs.existsSync(TMP_DB_FILE)) {
      const raw = fs.readFileSync(TMP_DB_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (e) {}

  return {};
};

/**
 * Local Firestore-Compatible Adapter for offline development/tests without GCP credentials
 */
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

/* ── 7-Day Recurring Login Reward Table ── */
const DAILY_REWARDS = [
  { day: 1, coins: 10 },
  { day: 2, coins: 20 },
  { day: 3, coins: 30 },
  { day: 4, coins: 50 },
  { day: 5, coins: 70 },
  { day: 6, coins: 80 },
  { day: 7, coins: 100 },
];

/* ── Asia/Kolkata Calendar Day Helpers ── */
const getKolkataDateString = (date = new Date()) => {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date); // "YYYY-MM-DD"
};

const getYesterdayKolkataDateString = (date = new Date()) => {
  const d = new Date(date);
  d.setDate(d.getDate() - 1);
  return getKolkataDateString(d);
};

const getKolkataFormattedDateTime = () => {
  return (
    new Date().toLocaleDateString('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }) +
    ', ' +
    new Date().toLocaleTimeString('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
    })
  );
};

const getKolkataTimeRemainingToday = () => {
  const now = new Date();
  const kolkataNowString = now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
  const kolkataNow = new Date(kolkataNowString);
  const midnight = new Date(kolkataNow);
  midnight.setHours(24, 0, 0, 0);

  const diffMs = midnight.getTime() - kolkataNow.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  return `${diffHours}h ${diffMins}m`;
};

/**
 * Gets or creates the Firestore user document with lazy migration from _connect-store.json
 */
const getOrCreateFirestoreUser = async (db, uid, decodedToken = {}) => {
  const userDocRef = db.collection('users').doc(uid);
  const snap = await userDocRef.get();
  if (snap.exists) {
    return { docRef: userDocRef, data: snap.data(), isNew: false };
  }

  // Lazy migration of existing record from legacy store
  const legacyStore = loadStore();
  const legacyUser = legacyStore[uid];

  const initialData = {
    profile: {
      uid,
      userId: legacyUser?.profile?.userId || ('CN-' + uid.replace(/[^a-zA-Z0-9]/g, '').slice(-6).toUpperCase()),
      name: legacyUser?.profile?.name || (decodedToken.name || decodedToken.display_name || 'CONNECT User'),
      username: legacyUser?.profile?.username || ('@user_' + uid.slice(-4)),
      email: legacyUser?.profile?.email || (decodedToken.email || ''),
      phone: legacyUser?.profile?.phone || (decodedToken.phone_number || ''),
      avatar: legacyUser?.profile?.avatar || '/default-avatars/1.png',
      dob: legacyUser?.profile?.dob || '2000-01-01',
      isProfileComplete: Boolean(legacyUser?.profile?.isProfileComplete),
      createdAt: legacyUser?.profile?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    wallet: {
      coins: (legacyUser?.wallet && typeof legacyUser.wallet.coins === 'number') ? legacyUser.wallet.coins : 0,
      updatedAt: legacyUser?.wallet?.updatedAt || new Date().toISOString(),
    },
    favourites: Array.isArray(legacyUser?.favourites)
      ? legacyUser.favourites
      : Array.isArray(legacyUser?.profile?.favourites)
      ? legacyUser.profile.favourites
      : [],
    purchasedPacks: Array.isArray(legacyUser?.purchasedPacks)
      ? legacyUser.purchasedPacks
      : [],
    ledger: Array.isArray(legacyUser?.ledger) ? legacyUser.ledger : [],
    daily_rewards: legacyUser?.daily_rewards || {
      state: {
        currentStreak: 0,
        lastClaimDate: null,
        cycleCount: 0,
        lastAwardedCoins: 0,
        updatedAt: new Date().toISOString(),
      },
      claims: {},
    },
    vip: legacyUser?.vip || {
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
    calls: Array.isArray(legacyUser?.calls) ? legacyUser.calls : [],
    payments: Array.isArray(legacyUser?.payments) ? legacyUser.payments : [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await userDocRef.set(initialData);
  return { docRef: userDocRef, data: initialData, isNew: true };
};

const LEASE_DURATION_MS = 10000; // 10 seconds

const encodeCursor = (docData, docId) => {
  const cursorObj = {
    t: docData.timestamp || docData.date || new Date().toISOString(),
    id: docId,
  };
  return Buffer.from(JSON.stringify(cursorObj), 'utf8').toString('base64url');
};

const decodeCursor = (cursorString) => {
  if (!cursorString || typeof cursorString !== 'string') return null;
  try {
    const raw = Buffer.from(cursorString, 'base64url').toString('utf8');
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed.t !== 'string' || typeof parsed.id !== 'string') {
      return null;
    }
    return parsed;
  } catch (e) {
    return null;
  }
};

/**
 * Coordinates atomic lazy migration of legacy users/{uid}.ledger into users/{uid}/ledger/{txnId}
 * 
 * Safety Guarantees:
 * - Cryptographic unique ownerToken per worker.
 * - 10-second lease with heartbeat renewal before batch operations.
 * - Fences stale workers whose lease expired.
 * - Stable deterministic SHA-256 fingerprint IDs for records lacking IDs.
 * - Collision detection without silent overwrites.
 * - Deep field-by-field record content parity verification before marking status 'completed'.
 * - Preserves the legacy userData.ledger array intact.
 */
const coordinateLedgerMigration = async (db, uid, options = {}) => {
  const userDocRef = db.collection('users').doc(uid);
  const ownerToken = options.ownerToken || `OWNER-${crypto.randomUUID()}`;

  // 1. Transaction to check / acquire lock
  const lockResult = await db.runTransaction(async (tx) => {
    const userSnap = await tx.get(userDocRef);
    if (!userSnap.exists) return { skip: true };
    const userData = userSnap.data() || {};
    const migration = userData.ledgerMigration || {};

    if (migration.status === 'completed' && !options.force) {
      return { completed: true, migration };
    }

    const now = Date.now();
    if (migration.status === 'in_progress' && migration.leaseExpiresAtMs && now < migration.leaseExpiresAtMs) {
      return {
        lockedByOther: true,
        ownerToken: migration.ownerToken,
        leaseExpiresAtMs: migration.leaseExpiresAtMs,
      };
    }

    // Acquire lock
    tx.update(userDocRef, {
      'ledgerMigration.status': 'in_progress',
      'ledgerMigration.ownerToken': ownerToken,
      'ledgerMigration.lockedAt': new Date().toISOString(),
      'ledgerMigration.leaseExpiresAtMs': now + LEASE_DURATION_MS,
      'ledgerMigration.heartbeatAtMs': now,
      'ledgerMigration.attemptCount': (migration.attemptCount || 0) + 1,
      updatedAt: new Date().toISOString(),
    });

    return {
      acquired: true,
      ownerToken,
      legacyLedger: Array.isArray(userData.ledger) ? userData.ledger : [],
    };
  });

  if (lockResult.completed) {
    return { success: true, status: 'completed' };
  }
  if (lockResult.lockedByOther) {
    return { success: false, status: 'locked', ownerToken: lockResult.ownerToken };
  }
  if (lockResult.skip) {
    return { success: false, status: 'user_not_found' };
  }

  const legacyLedger = lockResult.legacyLedger;
  if (!legacyLedger || legacyLedger.length === 0) {
    // Empty legacy array -> mark completed immediately
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(userDocRef);
      const currentOwner = snap.data()?.ledgerMigration?.ownerToken;
      if (currentOwner !== ownerToken) throw new Error('MIGRATION_FENCED_ERROR: Lease lost before completion commit');
      tx.update(userDocRef, {
        'ledgerMigration.status': 'completed',
        'ledgerMigration.completedAt': new Date().toISOString(),
        'ledgerMigration.legacyCount': 0,
        'ledgerMigration.migratedCount': 0,
        'ledgerMigration.ownerToken': null,
        'ledgerMigration.leaseExpiresAtMs': null,
      });
    });
    return { success: true, status: 'completed', migratedCount: 0 };
  }

  // 2. Process records, generate deterministic IDs, detect collisions
  const seenIds = new Set();
  const processedRecords = [];

  for (const rawEntry of legacyLedger) {
    let entryId = rawEntry.id;
    const fingerprint = crypto
      .createHash('sha256')
      .update(`${uid}|${rawEntry.timestamp || rawEntry.date}|${rawEntry.type}|${rawEntry.coins || rawEntry.amount}|${rawEntry.balanceAfter}`)
      .digest('hex')
      .slice(0, 16);

    if (!entryId || typeof entryId !== 'string') {
      entryId = `TXN-LEG-${fingerprint}`;
    }

    if (seenIds.has(entryId)) {
      const existing = processedRecords.find((r) => r.id === entryId);
      const isIdentical =
        existing &&
        existing.coins === (rawEntry.coins != null ? rawEntry.coins : rawEntry.amount || 0) &&
        existing.balanceAfter === rawEntry.balanceAfter &&
        existing.type === rawEntry.type &&
        existing.timestamp === rawEntry.timestamp;

      if (isIdentical) {
        continue; // Deduplicate identical duplicate
      } else {
        // Disambiguate conflicting content
        entryId = `${entryId}_COLLISION_${fingerprint}`;
      }
    }

    seenIds.add(entryId);
    processedRecords.push({
      ...rawEntry,
      id: entryId,
      uid,
      coins: Number(rawEntry.coins != null ? rawEntry.coins : rawEntry.amount || 0),
      amount: Number(rawEntry.amount != null ? rawEntry.amount : rawEntry.coins || 0),
      balanceAfter: Number(rawEntry.balanceAfter || 0),
      isCredit: Boolean(rawEntry.isCredit),
      type: rawEntry.type || 'unknown',
      title: rawEntry.title || 'Transaction',
      description: rawEntry.description || rawEntry.title || 'Transaction',
      status: rawEntry.status || 'Completed',
      date: rawEntry.date || new Date().toISOString(),
      timestamp: rawEntry.timestamp || new Date().toISOString(),
      migratedAt: new Date().toISOString(),
      metadata: rawEntry.metadata || {},
    });
  }

  // 3. Batch processing in chunks with heartbeat renewal
  const CHUNK_SIZE = 50;
  for (let i = 0; i < processedRecords.length; i += CHUNK_SIZE) {
    const chunk = processedRecords.slice(i, i + CHUNK_SIZE);

    // Heartbeat check / renewal
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(userDocRef);
      const state = snap.data()?.ledgerMigration;
      if (state?.ownerToken !== ownerToken) {
        throw new Error('MIGRATION_FENCED_ERROR: Stale worker lease lost');
      }
      tx.update(userDocRef, {
        'ledgerMigration.leaseExpiresAtMs': Date.now() + LEASE_DURATION_MS,
        'ledgerMigration.heartbeatAtMs': Date.now(),
      });
    });

    const batch = db.batch();
    for (const record of chunk) {
      const docRef = userDocRef.collection('ledger').doc(record.id);
      const existingDoc = await docRef.get();
      if (existingDoc.exists) {
        const ed = existingDoc.data();
        if (
          ed.coins !== record.coins ||
          ed.amount !== record.amount ||
          ed.balanceAfter !== record.balanceAfter ||
          ed.isCredit !== record.isCredit ||
          ed.type !== record.type
        ) {
          throw new Error(`CONTENT_PARITY_FAILED: Pre-existing subcollection record ${record.id} has conflicting data`);
        }
      }
      batch.set(docRef, record, { merge: true });
    }
    await batch.commit();
  }

  // 4. Deep Record Parity Verification
  for (const record of processedRecords) {
    const docSnap = await userDocRef.collection('ledger').doc(record.id).get();
    if (!docSnap.exists) {
      throw new Error(`CONTENT_PARITY_FAILED: Document ${record.id} not found in subcollection`);
    }
    const d = docSnap.data();
    if (
      d.coins !== record.coins ||
      d.amount !== record.amount ||
      d.balanceAfter !== record.balanceAfter ||
      d.isCredit !== record.isCredit ||
      d.type !== record.type ||
      d.timestamp !== record.timestamp
    ) {
      throw new Error(`CONTENT_PARITY_FAILED: Field mismatch on document ${record.id}`);
    }
  }

  // 5. Commit Completed Status (Fenced)
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(userDocRef);
    const state = snap.data()?.ledgerMigration;
    if (state?.ownerToken !== ownerToken) {
      throw new Error('MIGRATION_FENCED_ERROR: Lease lost before completion commit');
    }
    tx.update(userDocRef, {
      'ledgerMigration.status': 'completed',
      'ledgerMigration.completedAt': new Date().toISOString(),
      'ledgerMigration.legacyCount': legacyLedger.length,
      'ledgerMigration.migratedCount': processedRecords.length,
      'ledgerMigration.ownerToken': null,
      'ledgerMigration.leaseExpiresAtMs': null,
      updatedAt: new Date().toISOString(),
    });
  });

  return {
    success: true,
    status: 'completed',
    migratedCount: processedRecords.length,
  };
};

/**
 * Reconciles subcollection transactions into legacy array during a rollback
 * Never copies more than 100 transactions into the legacy array.
 */
const reconcileRollbackToLegacyArray = async (db, uid) => {
  const userDocRef = db.collection('users').doc(uid);
  return await db.runTransaction(async (tx) => {
    const userSnap = await tx.get(userDocRef);
    if (!userSnap.exists) return { success: false, error: 'User not found' };

    const subSnap = await userDocRef.collection('ledger').orderBy('timestamp', 'desc').limit(100).get();
    const subTxns = subSnap.docs ? subSnap.docs.map((d) => d.data()) : [];

    // Capped at 100 to strictly respect document size boundaries
    const reconciled = subTxns.slice(0, 100);

    tx.update(userDocRef, {
      ledger: reconciled,
      'ledgerMigration.status': 'rolled_back',
      'ledgerMigration.rolledBackAt': new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return {
      success: true,
      reconciledCount: reconciled.length,
    };
  });
};

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': getCorsOrigin(event),
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  try {
    const urlParams = event.queryStringParameters || {};
    const action = urlParams.action;

    if (!action) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing action parameter.' }),
      };
    }

    // Health check is public (unauthenticated)
    if (action === 'health') {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          status: 'ok',
          service: 'connect-user',
          timestamp: new Date().toISOString(),
          adminInitialized,
        }),
      };
    }

    // ─────────────────────────────────────────────────────────────
    // STEP 1: Secure Firebase Authentication Token Verification
    // ─────────────────────────────────────────────────────────────
    const reqHeaders = event.headers || {};
    const authHeader = reqHeaders['authorization'] || reqHeaders['Authorization'] || '';

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({
          error: 'Unauthorized: Missing or malformed Authorization header. Expected Bearer <token>.',
          code: 'auth/missing-token',
        }),
      };
    }

    const idToken = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (!idToken) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({
          error: 'Unauthorized: Firebase ID token is empty.',
          code: 'auth/missing-token',
        }),
      };
    }

    const { adminAuth: currentAuth, adminFirestore: currentDbInstance } = initFirebaseAdmin();

    if (!currentAuth) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: 'Internal server error: Firebase Admin Auth is not initialized.',
          code: 'auth/admin-not-initialized',
        }),
      };
    }

    let decodedToken;
    try {
      const checkRevoked = Boolean(hasServiceAccountCredentials);
      decodedToken = await currentAuth.verifyIdToken(idToken, checkRevoked);
    } catch (tokenErr) {
      console.warn('Firebase ID token verification failed:', tokenErr.code, tokenErr.message);
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({
          error: `Unauthorized: ${tokenErr.message || 'Invalid or expired Firebase ID token.'}`,
          code: tokenErr.code || 'auth/invalid-token',
        }),
      };
    }

    // Authenticated UID derived EXCLUSIVELY from the verified Firebase ID token
    const authenticatedUid = decodedToken.uid;
    if (!authenticatedUid) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({
          error: 'Unauthorized: Token payload does not contain a valid UID.',
          code: 'auth/invalid-uid',
        }),
      };
    }

    let body = {};
    if (event.body) {
      if (typeof event.body === 'object') {
        body = event.body;
      } else if (typeof event.body === 'string') {
        try {
          body = JSON.parse(event.body);
        } catch (e) {
          try {
            body = JSON.parse(Buffer.from(event.body, event.isBase64Encoded ? 'base64' : 'utf8').toString());
          } catch (e2) {}
        }
      }
    }

    // Strict Cross-Account Protection: Never trust client-specified UID
    const targetUid = urlParams.uid || body.uid;
    if (targetUid && targetUid !== authenticatedUid) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({
          error: 'Forbidden: You cannot access or modify another user\'s account data.',
          code: 'auth/cross-user-forbidden',
        }),
      };
    }

    // Derive effective UID exclusively from verified token
    const effectiveUid = authenticatedUid;

    // Determine active database:
    // 1. Explicitly injected mock DB (e.g. during test runs)
    // 2. Real Cloud Firestore (when credentials configured)
    // 3. Fail-closed safe 500 error if DB is explicitly set to null (outage simulation)
    // 4. Local Firestore Adapter for offline local testing without GCP keys
    let currentDb = currentDbInstance;
    if (customFirestoreInjected && currentDbInstance === null) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: 'Authentication database service is currently unavailable. Please try again.',
          code: 'auth/database-unavailable',
        }),
      };
    }
    if (!currentDb) {
      if (hasServiceAccountCredentials) {
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({
            error: 'Database service is currently unavailable. Please try again.',
            code: 'auth/database-unavailable',
          }),
        };
      }
      currentDb = localFallbackDb;
    }

    // ─────────────────────────────────────────────────────────────
    // 1. GET PROFILE
    // ─────────────────────────────────────────────────────────────
    if (action === 'profile' && event.httpMethod === 'GET') {
      const user = await getOrCreateFirestoreUser(currentDb, effectiveUid, decodedToken);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, profile: user.data.profile }),
      };
    }

    // ─────────────────────────────────────────────────────────────
    // 2. UPDATE PROFILE
    // ─────────────────────────────────────────────────────────────
    if (action === 'update_profile' && event.httpMethod === 'POST') {
      const user = await getOrCreateFirestoreUser(currentDb, effectiveUid, decodedToken);
      const updates = body.profile || body;
      const profile = user.data.profile;

      if (updates.name) profile.name = updates.name.trim();
      if (updates.username) profile.username = updates.username.trim();
      if (updates.avatar) profile.avatar = updates.avatar;
      if (updates.dob) profile.dob = updates.dob;
      if (updates.phone) profile.phone = updates.phone;
      if (updates.email) profile.email = updates.email;
      if (updates.isProfileComplete !== undefined) {
        profile.isProfileComplete = Boolean(updates.isProfileComplete);
      }
      if (Array.isArray(updates.favourites)) {
        user.data.favourites = updates.favourites;
        profile.favourites = updates.favourites;
      }
      profile.updatedAt = new Date().toISOString();

      await user.docRef.update({
        profile,
        favourites: user.data.favourites || [],
        updatedAt: new Date().toISOString(),
      });

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, profile }),
      };
    }

    // ─────────────────────────────────────────────────────────────
    // 3. GET WALLET BALANCE (Firestore Authoritative)
    // ─────────────────────────────────────────────────────────────
    if (action === 'wallet' && event.httpMethod === 'GET') {
      const user = await getOrCreateFirestoreUser(currentDb, effectiveUid, decodedToken);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          coins: user.data.wallet.coins,
          updatedAt: user.data.wallet.updatedAt,
        }),
      };
    }

    // ─────────────────────────────────────────────────────────────
    // 4. ATOMIC COIN TRANSACTION (Authorized Deductions Only)
    // ─────────────────────────────────────────────────────────────
    if (action === 'transact_coins' && event.httpMethod === 'POST') {
      const rawAmount = body.amount !== undefined ? body.amount : urlParams.amount;
      const amount = parseInt(rawAmount, 10);
      const isCredit = body.isCredit !== undefined ? Boolean(body.isCredit) : (urlParams.isCredit === 'true');
      const type = body.type || 'call';
      const title = body.title || 'Video Call Spend';
      const idempotencyKey = body.idempotencyKey || body.clientTxnId || body.txnId || null;

      // 1. CRITICAL SECURITY GUARD: Prevent all direct client-initiated wallet credits
      if (isCredit) {
        return {
          statusCode: 403,
          headers,
          body: JSON.stringify({
            error: 'Forbidden: Direct wallet credit is not permitted from client requests. Credits must originate from verified server-side payment callbacks or authorized reward actions.',
            code: 'wallet/credit-forbidden',
          }),
        };
      }

      // 2. Validate deduction parameters server-side
      if (!amount || isNaN(amount) || amount <= 0 || !Number.isInteger(amount)) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            error: 'Valid positive integer coin amount is required for deductions.',
            code: 'wallet/invalid-amount',
          }),
        };
      }

      const ALLOWED_DEBIT_TYPES = ['call', 'gift', 'spend'];
      const normalizedType = String(type || 'call').toLowerCase().trim();
      if (!ALLOWED_DEBIT_TYPES.includes(normalizedType)) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            error: `Invalid debit transaction type "${type}". Allowed deduction types are: ${ALLOWED_DEBIT_TYPES.join(', ')}.`,
            code: 'wallet/invalid-transaction-type',
          }),
        };
      }

      const debitTitle = String(title || (normalizedType === 'gift' ? 'Gift Sent' : 'Video Call Spend')).trim().slice(0, 100);

      // Execute atomic transaction inside Firestore (Backend is ONLY authority, zero clientBalance trust)
      const userDocRef = currentDb.collection('users').doc(effectiveUid);

      const txResult = await currentDb.runTransaction(async (transaction) => {
        const snap = await transaction.get(userDocRef);
        let userData;
        if (!snap.exists) {
          userData = {
            profile: {
              uid: effectiveUid,
              userId: 'CN-' + effectiveUid.replace(/[^a-zA-Z0-9]/g, '').slice(-6).toUpperCase(),
              name: decodedToken.name || decodedToken.display_name || 'CONNECT User',
              username: '@user_' + effectiveUid.slice(-4),
              email: decodedToken.email || '',
              phone: decodedToken.phone_number || '',
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
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          transaction.set(userDocRef, userData);
        } else {
          userData = snap.data();
        }

        const currentCoins = (userData.wallet && typeof userData.wallet.coins === 'number') ? userData.wallet.coins : 0;
        const ledger = Array.isArray(userData.ledger) ? userData.ledger : [];

        // Idempotency check: if debit transaction with this idempotencyKey already exists, do NOT double-deduct
        if (idempotencyKey) {
          if (typeof userDocRef.collection === 'function') {
            const subLedgerDoc = await transaction.get(userDocRef.collection('ledger').doc(idempotencyKey));
            if (subLedgerDoc && subLedgerDoc.exists) {
              return {
                duplicate: true,
                transaction: subLedgerDoc.data(),
                newBalance: currentCoins,
              };
            }
          }
          const existingTxn = ledger.find((t) => t.id === idempotencyKey || t.idempotencyKey === idempotencyKey);
          if (existingTxn) {
            return {
              duplicate: true,
              transaction: existingTxn,
              newBalance: currentCoins,
            };
          }
        }

        // Backend is the ONLY authority for balance:
        // Reject debit if insufficient coins
        if (currentCoins < amount) {
          return {
            insufficient: true,
            currentBalance: currentCoins,
          };
        }

        const newBalance = currentCoins - amount;
        const txnId = idempotencyKey || `TXN-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

        const ledgerEntry = {
          id: txnId,
          uid: effectiveUid,
          type: normalizedType,
          title: debitTitle,
          description: debitTitle,
          coins: amount,
          amount,
          isCredit: false,
          balanceAfter: newBalance,
          status: 'Completed',
          date: getKolkataFormattedDateTime(),
          timestamp: new Date().toISOString(),
          idempotencyKey: idempotencyKey || txnId,
          metadata: body.metadata || {},
        };

        const hasSubcoll = typeof userDocRef.collection === 'function';
        const rootUpdates = {
          'wallet.coins': newBalance,
          'wallet.updatedAt': new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        // Atomic write: wallet balance on root document + immutable record in subcollection (or fallback array)
        if (hasSubcoll) {
          const ledgerDocRef = userDocRef.collection('ledger').doc(txnId);
          transaction.update(userDocRef, rootUpdates);
          transaction.set(ledgerDocRef, ledgerEntry);
        } else {
          rootUpdates.ledger = [ledgerEntry, ...ledger].slice(0, 100);
          transaction.update(userDocRef, rootUpdates);
        }

        return {
          success: true,
          newBalance,
          transaction: ledgerEntry,
        };
      });

      if (txResult.insufficient) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            error: 'Insufficient coins in wallet.',
            currentBalance: txResult.currentBalance,
            required: amount,
            code: 'wallet/insufficient-balance',
          }),
        };
      }

      if (txResult.duplicate) {
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            newBalance: txResult.newBalance,
            transaction: txResult.transaction,
            duplicateIgnored: true,
          }),
        };
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          newBalance: txResult.newBalance,
          transaction: txResult.transaction,
        }),
      };
    }

    // ─────────────────────────────────────────────────────────────
    // 5. GET TRANSACTIONS (PAGINATED SUBCOLLECTION LEDGER)
    // ─────────────────────────────────────────────────────────────
    if (action === 'transactions' && event.httpMethod === 'GET') {
      const user = await getOrCreateFirestoreUser(currentDb, effectiveUid, decodedToken);
      const userDocRef = currentDb.collection('users').doc(effectiveUid);

      // Lazy migrate if legacy array has items and migration not completed
      const migrationStatus = user.data?.ledgerMigration?.status;
      if (migrationStatus !== 'completed' && Array.isArray(user.data?.ledger) && user.data.ledger.length > 0) {
        try {
          await coordinateLedgerMigration(currentDb, effectiveUid);
        } catch (migErr) {
          console.warn('Lazy migration attempt warning:', migErr.message);
        }
      }

      // Pagination params (default 20, max 100)
      const rawLimit = parseInt(urlParams.limit || 20, 10);
      const limit = Math.min(Math.max(isNaN(rawLimit) ? 20 : rawLimit, 1), 100);
      const rawCursor = urlParams.cursor || null;

      let cursorObj = null;
      if (rawCursor) {
        cursorObj = decodeCursor(rawCursor);
        if (!cursorObj) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({
              error: 'Invalid pagination cursor.',
              code: 'INVALID_PAGINATION_CURSOR',
            }),
          };
        }
      }

      let docs = [];
      let hasMore = false;

      // Query subcollection with timestamp desc and docId desc tie-breaker if collection is supported
      if (typeof userDocRef.collection === 'function') {
        let query = userDocRef.collection('ledger')
          .orderBy('timestamp', 'desc')
          .orderBy('__name__', 'desc')
          .limit(limit + 1);

        if (cursorObj) {
          query = query.startAfter(cursorObj.t, cursorObj.id);
        }

        const querySnap = await query.get();
        docs = querySnap.docs ? querySnap.docs.map((d) => d.data()) : [];
      }

      // Fallback if subcollection is empty/unsupported but legacy array has entries
      if (docs.length === 0 && !cursorObj && Array.isArray(user.data?.ledger) && user.data.ledger.length > 0 && migrationStatus !== 'completed') {
        docs = user.data.ledger.slice(0, limit + 1);
      }

      if (docs.length > limit) {
        hasMore = true;
        docs = docs.slice(0, limit);
      }

      let nextCursor = null;
      if (hasMore && docs.length > 0) {
        const lastDoc = docs[docs.length - 1];
        nextCursor = encodeCursor(lastDoc, lastDoc.id);
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          transactions: docs,
          pagination: {
            hasMore,
            nextCursor,
            limit,
          },
        }),
      };
    }

    // ─────────────────────────────────────────────────────────────
    // 6. GET FAVOURITES
    // ─────────────────────────────────────────────────────────────
    if (action === 'favourites' && event.httpMethod === 'GET') {
      const user = await getOrCreateFirestoreUser(currentDb, effectiveUid, decodedToken);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          favourites: user.data.favourites || [],
        }),
      };
    }

    // ─────────────────────────────────────────────────────────────
    // 7. TOGGLE FAVOURITE
    // ─────────────────────────────────────────────────────────────
    if (action === 'toggle_favourite' && event.httpMethod === 'POST') {
      const expertId = body.expertId || urlParams.expertId;
      if (!expertId) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Missing expertId parameter.' }),
        };
      }

      const userDocRef = currentDb.collection('users').doc(effectiveUid);
      const favResult = await currentDb.runTransaction(async (transaction) => {
        const snap = await transaction.get(userDocRef);
        let userData;
        if (!snap.exists) {
          const created = await getOrCreateFirestoreUser(currentDb, effectiveUid, decodedToken);
          userData = created.data;
        } else {
          userData = snap.data();
        }

        const favs = Array.isArray(userData.favourites) ? [...userData.favourites] : [];
        const idx = favs.indexOf(expertId);
        let isFav = false;
        if (idx >= 0) {
          favs.splice(idx, 1);
          isFav = false;
        } else {
          favs.push(expertId);
          isFav = true;
        }

        transaction.update(userDocRef, {
          favourites: favs,
          'profile.favourites': favs,
          updatedAt: new Date().toISOString(),
        });

        return { favourites: favs, isFav };
      });

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          favourites: favResult.favourites,
          isFav: favResult.isFav,
        }),
      };
    }

    // ─────────────────────────────────────────────────────────────
    // 8. UPDATE FAVOURITES (Batch)
    // ─────────────────────────────────────────────────────────────
    if (action === 'update_favourites' && event.httpMethod === 'POST') {
      const newFavs = Array.isArray(body.favourites) ? body.favourites : [];
      const userDocRef = currentDb.collection('users').doc(effectiveUid);

      await currentDb.runTransaction(async (transaction) => {
        transaction.update(userDocRef, {
          favourites: newFavs,
          'profile.favourites': newFavs,
          updatedAt: new Date().toISOString(),
        });
      });

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, favourites: newFavs }),
      };
    }

    // ─────────────────────────────────────────────────────────────
    // 9. GET PURCHASED PACKS
    // ─────────────────────────────────────────────────────────────
    if (action === 'purchased_packs' && event.httpMethod === 'GET') {
      const user = await getOrCreateFirestoreUser(currentDb, effectiveUid, decodedToken);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          purchasedPacks: user.data.purchasedPacks || [],
        }),
      };
    }

    // ─────────────────────────────────────────────────────────────
    // 10. RECORD PACK PURCHASE (Disappears from available list)
    // ─────────────────────────────────────────────────────────────
    if (action === 'record_pack_purchase' && event.httpMethod === 'POST') {
      const packId = body.packId || urlParams.packId;
      if (!packId) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Missing packId parameter.' }),
        };
      }

      // Restrict arbitrary pack IDs: must be a canonical package in server catalog
      const canonicalPack = typeof getCanonicalPackage === 'function' ? getCanonicalPackage(packId) : null;
      if (!canonicalPack) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            error: `Invalid or unrecognized pack ID "${packId}". Arbitrary pack IDs cannot be recorded without verified server authorization.`,
            code: 'order/invalid-pack',
          }),
        };
      }

      // If an order ID/txnid is provided, verify it belongs to this user and is successful
      const orderId = body.orderId || body.txnid || urlParams.orderId || urlParams.txnid;
      if (orderId) {
        const orderSnap = await currentDb.collection('connect_orders').doc(orderId).get();
        if (orderSnap.exists) {
          const oData = orderSnap.data();
          if (oData.uid !== effectiveUid || oData.status !== 'success') {
            return {
              statusCode: 403,
              headers,
              body: JSON.stringify({
                error: 'Order verification failed for this pack purchase.',
                code: 'order/unauthorized-order',
              }),
            };
          }
        }
      }

      const userDocRef = currentDb.collection('users').doc(effectiveUid);
      const packResult = await currentDb.runTransaction(async (transaction) => {
        const snap = await transaction.get(userDocRef);
        let userData;
        if (!snap.exists) {
          const created = await getOrCreateFirestoreUser(currentDb, effectiveUid, decodedToken);
          userData = created.data;
        } else {
          userData = snap.data();
        }

        const currentPacks = Array.isArray(userData.purchasedPacks) ? [...userData.purchasedPacks] : [];
        if (!currentPacks.includes(packId)) {
          currentPacks.push(packId);
        }

        transaction.update(userDocRef, {
          purchasedPacks: currentPacks,
          updatedAt: new Date().toISOString(),
        });

        return { purchasedPacks: currentPacks };
      });

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          purchasedPacks: packResult.purchasedPacks,
        }),
      };
    }

    // ─────────────────────────────────────────────────────────────
    // 11. GET DAILY REWARD STATUS
    // ─────────────────────────────────────────────────────────────
    if (action === 'daily_rewards' && event.httpMethod === 'GET') {
      const user = await getOrCreateFirestoreUser(currentDb, effectiveUid, decodedToken);
      const today = getKolkataDateString();
      const yesterday = getYesterdayKolkataDateString();

      const rState = user.data.daily_rewards.state;
      const claimedToday = rState.lastClaimDate === today;

      let nextDayNumber = 1;
      if (claimedToday) {
        nextDayNumber = rState.currentStreak > 0 ? ((rState.currentStreak - 1) % 7) + 1 : 1;
      } else if (rState.lastClaimDate === yesterday) {
        nextDayNumber = (rState.currentStreak % 7) + 1;
      } else {
        nextDayNumber = 1;
      }

      const nextReward = DAILY_REWARDS.find((r) => r.day === nextDayNumber) || DAILY_REWARDS[0];

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          todayDate: today,
          claimedToday,
          currentStreak: rState.currentStreak,
          lastClaimDate: rState.lastClaimDate,
          nextDayNumber,
          nextRewardCoins: nextReward.coins,
          cycleCount: rState.cycleCount,
          timeUntilNextClaim: getKolkataTimeRemainingToday(),
        }),
      };
    }

    // ─────────────────────────────────────────────────────────────
    // 12. CLAIM DAILY REWARD (Atomic via Firestore Transaction)
    // ─────────────────────────────────────────────────────────────
    if (action === 'claim_daily_reward' && event.httpMethod === 'POST') {
      const today = getKolkataDateString();
      const yesterday = getYesterdayKolkataDateString();
      const userDocRef = currentDb.collection('users').doc(effectiveUid);

      // Ensure user document exists in Firestore BEFORE starting the transaction
      await getOrCreateFirestoreUser(currentDb, effectiveUid, decodedToken);

      const claimResult = await currentDb.runTransaction(async (transaction) => {
        const snap = await transaction.get(userDocRef);
        const userData = snap.exists ? snap.data() : {};

        if (userData.daily_rewards?.claims?.[today] || userData.daily_rewards?.state?.lastClaimDate === today) {
          return { alreadyClaimed: true };
        }

        const rState = userData.daily_rewards?.state || { currentStreak: 0, cycleCount: 0 };
        let newStreak = 1;
        if (rState.lastClaimDate === yesterday) {
          newStreak = rState.currentStreak + 1;
          if (newStreak > 7) {
            newStreak = 1;
            rState.cycleCount = (rState.cycleCount || 0) + 1;
          }
        } else {
          newStreak = 1;
        }

        const reward = DAILY_REWARDS.find((r) => r.day === newStreak) || DAILY_REWARDS[0];
        const coinsAwarded = reward.coins;
        const currentCoins = userData.wallet?.coins || 0;
        const newBalance = currentCoins + coinsAwarded;

        const updatedState = {
          currentStreak: newStreak,
          lastClaimDate: today,
          lastAwardedCoins: coinsAwarded,
          cycleCount: rState.cycleCount || 0,
          updatedAt: new Date().toISOString(),
        };

        const updatedClaims = {
          ...(userData.daily_rewards?.claims || {}),
          [today]: {
            date: today,
            dayNumber: newStreak,
            coinsAwarded,
            claimedAt: new Date().toISOString(),
            type: 'daily_login',
          },
        };

        const txnId = `TXN-RWD-${today.replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;
        const ledgerEntry = {
          id: txnId,
          uid: effectiveUid,
          type: 'daily_reward',
          title: `Daily Login Reward - Day ${newStreak}`,
          description: `Daily Login Reward - Day ${newStreak}`,
          coins: coinsAwarded,
          amount: coinsAwarded,
          isCredit: true,
          balanceAfter: newBalance,
          status: 'Completed',
          date: getKolkataFormattedDateTime(),
          timestamp: new Date().toISOString(),
        };

        const hasSubcoll = typeof userDocRef.collection === 'function';
        const rootUpdates = {
          'wallet.coins': newBalance,
          'wallet.updatedAt': new Date().toISOString(),
          daily_rewards: {
            state: updatedState,
            claims: updatedClaims,
          },
          updatedAt: new Date().toISOString(),
        };

        // Atomic write: wallet and rewards state on root document + immutable record in subcollection
        if (hasSubcoll) {
          const ledgerDocRef = userDocRef.collection('ledger').doc(txnId);
          transaction.update(userDocRef, rootUpdates);
          transaction.set(ledgerDocRef, ledgerEntry);
        } else {
          const legacyLedger = Array.isArray(userData.ledger) ? userData.ledger : [];
          rootUpdates.ledger = [ledgerEntry, ...legacyLedger].slice(0, 100);
          transaction.update(userDocRef, rootUpdates);
        }

        return {
          alreadyClaimed: false,
          coinsAwarded,
          newBalance,
          dayNumber: newStreak,
          todayDate: today,
          txnId,
        };
      });

      if (claimResult.alreadyClaimed) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            error: 'Daily reward has already been claimed for today.',
            code: 'ALREADY_CLAIMED_TODAY',
          }),
        };
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          coinsAwarded: claimResult.coinsAwarded,
          newBalance: claimResult.newBalance,
          dayNumber: claimResult.dayNumber,
          nextDayNumber: (claimResult.dayNumber % 7) + 1,
          todayDate: claimResult.todayDate,
          txnId: claimResult.txnId,
        }),
      };
    }

    // ─────────────────────────────────────────────────────────────
    // 13. GET VIP ENTITLEMENT
    // ─────────────────────────────────────────────────────────────
    if (action === 'vip' && event.httpMethod === 'GET') {
      const user = await getOrCreateFirestoreUser(currentDb, effectiveUid, decodedToken);
      const vip = user.data.vip?.entitlement || { active: false, status: 'none' };
      const today = getKolkataDateString();
      const claimedToday = Boolean(user.data.vip?.claims?.[`vip-${today}`]);

      if (vip.active) {
        const expiryMs = vip.expiryDateMs || (vip.expiryDate ? new Date(vip.expiryDate).getTime() : 0);
        if (expiryMs && Date.now() > expiryMs) {
          vip.active = false;
          vip.status = 'expired';
          await user.docRef.update({
            'vip.entitlement.active': false,
            'vip.entitlement.status': 'expired',
            'profile.isVip': false,
            updatedAt: new Date().toISOString(),
          }).catch(() => {});
        }
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          entitlement: vip,
          vipBonusClaimedToday: claimedToday,
        }),
      };
    }

    // ─────────────────────────────────────────────────────────────
    // 14. CLAIM VIP DAILY BONUS
    // ─────────────────────────────────────────────────────────────
    if (action === 'claim_vip_bonus' && event.httpMethod === 'POST') {
      const today = getKolkataDateString();
      const userDocRef = currentDb.collection('users').doc(effectiveUid);

      // Ensure user document exists in Firestore BEFORE starting the transaction
      await getOrCreateFirestoreUser(currentDb, effectiveUid, decodedToken);

      const vipResult = await currentDb.runTransaction(async (transaction) => {
        const snap = await transaction.get(userDocRef);
        const userData = snap.exists ? snap.data() : {};

        const vip = userData.vip?.entitlement;
        if (!vip || !vip.active || vip.status !== 'active') {
          return { error: 'No active VIP membership found.', code: 'NO_ACTIVE_VIP' };
        }

        const expiryMs = vip.expiryDateMs || (vip.expiryDate ? new Date(vip.expiryDate).getTime() : 0);
        if (expiryMs && Date.now() > expiryMs) {
          // Atomically mark expired entitlement in Firestore
          transaction.update(userDocRef, {
            'vip.entitlement.active': false,
            'vip.entitlement.status': 'expired',
            'profile.isVip': false,
            updatedAt: new Date().toISOString(),
          });
          return { error: 'Your VIP membership has expired.', code: 'VIP_MEMBERSHIP_EXPIRED' };
        }

        if (userData.vip?.claims?.[`vip-${today}`]) {
          return { error: 'VIP bonus already claimed for today.', code: 'VIP_BONUS_ALREADY_CLAIMED_TODAY' };
        }

        const bonusAmount = vip.dailyBonusCoins || (vip.planId === 'diamond' ? 1200 : vip.planId === 'gold' ? 500 : 200);
        const currentCoins = userData.wallet?.coins || 0;
        const newBalance = currentCoins + bonusAmount;

        const updatedClaims = {
          ...(userData.vip?.claims || {}),
          [`vip-${today}`]: {
            date: today,
            bonusCoins: bonusAmount,
            planId: vip.planId,
            claimedAt: new Date().toISOString(),
            type: 'vip_daily_bonus',
          },
        };

        const txnId = `TXN-VIP-${today.replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;
        const ledgerEntry = {
          id: txnId,
          uid: effectiveUid,
          type: 'vip_bonus',
          title: `${vip.planName || 'VIP'} Daily Bonus`,
          description: `${vip.planName || 'VIP'} Daily Bonus`,
          coins: bonusAmount,
          amount: bonusAmount,
          isCredit: true,
          balanceAfter: newBalance,
          status: 'Completed',
          date: getKolkataFormattedDateTime(),
          timestamp: new Date().toISOString(),
        };

        const hasSubcoll = typeof userDocRef.collection === 'function';
        const rootUpdates = {
          'wallet.coins': newBalance,
          'wallet.updatedAt': new Date().toISOString(),
          'vip.claims': updatedClaims,
          updatedAt: new Date().toISOString(),
        };

        // Atomic write: wallet and VIP claims on root document + immutable record in subcollection
        if (hasSubcoll) {
          const ledgerDocRef = userDocRef.collection('ledger').doc(txnId);
          transaction.update(userDocRef, rootUpdates);
          transaction.set(ledgerDocRef, ledgerEntry);
        } else {
          const legacyLedger = Array.isArray(userData.ledger) ? userData.ledger : [];
          rootUpdates.ledger = [ledgerEntry, ...legacyLedger].slice(0, 100);
          transaction.update(userDocRef, rootUpdates);
        }

        return { success: true, bonusAmount, newBalance, planName: vip.planName };
      });

      if (vipResult.error) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: vipResult.error, code: vipResult.code }),
        };
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(vipResult),
      };
    }

    // ─────────────────────────────────────────────────────────────
    // 15. ACTIVATE VIP MEMBERSHIP (BLOCKED - SERVER-SIDE PAYMENT REQUIRED)
    // ─────────────────────────────────────────────────────────────
    if (action === 'activate_vip') {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({
          error: 'Forbidden: Direct client VIP activation is disabled. Verified payment required.',
          code: 'VIP_PAYMENT_REQUIRED',
        }),
      };
    }

    // ─────────────────────────────────────────────────────────────
    // 16. CALL HISTORY
    // ─────────────────────────────────────────────────────────────
    if (action === 'call_history' && event.httpMethod === 'GET') {
      const user = await getOrCreateFirestoreUser(currentDb, effectiveUid, decodedToken);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          calls: user.data.calls || [],
        }),
      };
    }

    // ─────────────────────────────────────────────────────────────
    // 17. RECORD CALL
    // ─────────────────────────────────────────────────────────────
    if (action === 'record_call' && event.httpMethod === 'POST') {
      const user = await getOrCreateFirestoreUser(currentDb, effectiveUid, decodedToken);
      const callRecord = {
        id: `CALL-${Date.now().toString(36).toUpperCase()}`,
        name: body.name || 'CONNECT Expert',
        type: body.type || 'Video',
        duration: body.duration || '1m 00s',
        durationSeconds: body.durationSeconds || 60,
        coins: body.coins || 0,
        time: getKolkataFormattedDateTime(),
        timestamp: new Date().toISOString(),
        status: 'Completed',
      };

      const updatedCalls = [callRecord, ...(user.data.calls || [])].slice(0, 100);
      await user.docRef.update({
        calls: updatedCalls,
        updatedAt: new Date().toISOString(),
      });

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, call: callRecord }),
      };
    }

    // ─────────────────────────────────────────────────────────────
    // 18. REDEEM PROMO CODE (Backend Authority, Zero clientBalance Trust)
    // ─────────────────────────────────────────────────────────────
    if (action === 'redeem_code' && event.httpMethod === 'POST') {
      const rawCode = String(body.code || urlParams.code || '').trim().toUpperCase();
      if (!rawCode) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Promo code is required.' }),
        };
      }

      const userDocRef = currentDb.collection('users').doc(effectiveUid);
      const userSnap = await userDocRef.get();
      const userData = userSnap.exists ? userSnap.data() : {};
      const promoProtection = userData.promoProtection || {};

      // Check brute-force lockout status
      if (promoProtection.lockedUntilMs && Date.now() < promoProtection.lockedUntilMs) {
        const waitMins = Math.ceil((promoProtection.lockedUntilMs - Date.now()) / 60000);
        return {
          statusCode: 429,
          headers,
          body: JSON.stringify({
            error: `Too many invalid promo code attempts. Please try again after ${waitMins} minutes.`,
            code: 'promo/too-many-attempts',
          }),
        };
      }

      let coinsAwarded = 0;
      let promoTitle = '';
      if (rawCode === 'YASH') {
        coinsAwarded = 500;
        promoTitle = 'Promo Code Redeemed (YASH)';
      } else {
        const nextAttempts = (promoProtection.failedAttempts || 0) + 1;
        const updates = {
          'promoProtection.failedAttempts': nextAttempts,
          'promoProtection.lastAttemptMs': Date.now(),
          updatedAt: new Date().toISOString(),
        };
        if (nextAttempts >= 5) {
          updates['promoProtection.lockedUntilMs'] = Date.now() + 15 * 60 * 1000;
        }
        await userDocRef.update(updates).catch(() => {});

        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            error: 'Invalid promo code. Please enter a valid code.',
            code: 'promo/invalid-code',
            remainingAttempts: Math.max(0, 5 - nextAttempts),
          }),
        };
      }

      // Ensure user document exists in Firestore BEFORE starting the transaction
      await getOrCreateFirestoreUser(currentDb, effectiveUid, decodedToken);

      const redeemResult = await currentDb.runTransaction(async (transaction) => {
        const snap = await transaction.get(userDocRef);
        const freshUserData = snap.exists ? snap.data() : {};

        const currentCoins = freshUserData.wallet?.coins || 0;
        const newBalance = currentCoins + coinsAwarded;

        const txnId = `TXN-PROMO-${Date.now().toString(36).toUpperCase()}`;
        const ledgerEntry = {
          id: txnId,
          uid: effectiveUid,
          type: 'promo_code',
          title: promoTitle,
          description: promoTitle,
          coins: coinsAwarded,
          amount: coinsAwarded,
          isCredit: true,
          balanceAfter: newBalance,
          status: 'Completed',
          date: getKolkataFormattedDateTime(),
          timestamp: new Date().toISOString(),
          metadata: { code: rawCode },
        };

        const hasSubcoll = typeof userDocRef.collection === 'function';
        const rootUpdates = {
          'wallet.coins': newBalance,
          'wallet.updatedAt': new Date().toISOString(),
          'promoProtection.failedAttempts': 0,
          'promoProtection.lockedUntilMs': null,
          updatedAt: new Date().toISOString(),
        };

        // Atomic write: wallet on root document + immutable record in subcollection + reset failed attempts
        if (hasSubcoll) {
          const ledgerDocRef = userDocRef.collection('ledger').doc(txnId);
          transaction.update(userDocRef, rootUpdates);
          transaction.set(ledgerDocRef, ledgerEntry);
        } else {
          const legacyLedger = Array.isArray(freshUserData.ledger) ? freshUserData.ledger : [];
          rootUpdates.ledger = [ledgerEntry, ...legacyLedger].slice(0, 100);
          transaction.update(userDocRef, rootUpdates);
        }

        return { newBalance, txnId };
      });

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          code: rawCode,
          coinsAwarded,
          newBalance: redeemResult.newBalance,
          message: `🎉 Success! 500 Coins added to your wallet with code ${rawCode}!`,
        }),
      };
    }

    // ─────────────────────────────────────────────────────────────
    // 19. CONTROLLED TEST CREDIT (Permanently Disabled in Production)
    // ─────────────────────────────────────────────────────────────
    if (action === 'test_credit_coins') {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({
          error: 'Forbidden: test_credit_coins has been permanently disabled.',
          code: 'auth/action-disabled',
        }),
      };
    }

    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: `Unknown action: ${action}` }),
    };
  } catch (err) {
    console.error('connect-user function error:', err);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': getCorsOrigin(event),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ error: 'Internal server error: ' + err.message }),
    };
  }
};

// Test helper hooks for offline testing
exports._setFirestoreDb = (customDb) => {
  adminFirestore = customDb;
  customFirestoreInjected = true;
};

exports._setAdminAuth = (customAuth) => {
  adminAuth = customAuth;
  customAuthInjected = true;
};

// Internal test-only helper (not exposed via HTTP) for setting mock user balance in automated tests
exports._testSeedUserWallet = async (db, uid, coins) => {
  const userDocRef = db.collection('users').doc(uid);
  const snap = await userDocRef.get();
  const seedTxn = {
    id: `TXN-SEED-${Date.now()}`,
    type: 'deposit',
    title: 'Initial Seed Balance',
    description: 'Initial Seed Balance',
    coins,
    amount: coins,
    isCredit: true,
    balanceAfter: coins,
    status: 'Completed',
    date: '10 Nov 2026, 08:00 pm',
    timestamp: new Date().toISOString(),
  };

  if (snap.exists) {
    const existingLedger = snap.data().ledger || [];
    await userDocRef.update({
      'wallet.coins': coins,
      'wallet.updatedAt': new Date().toISOString(),
      ledger: [seedTxn, ...existingLedger],
    });
  } else {
    await userDocRef.set({
      profile: {
        uid,
        userId: 'CN-' + uid.replace(/[^a-zA-Z0-9]/g, '').slice(-6).toUpperCase(),
        name: 'Test Seeded User',
        username: '@test_user',
        email: 'test@example.com',
        phone: '+919876500000',
        avatar: '/default-avatars/1.png',
        dob: '2000-01-01',
        isProfileComplete: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      wallet: {
        coins,
        updatedAt: new Date().toISOString(),
      },
      favourites: [],
      purchasedPacks: [],
      ledger: [seedTxn],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }
};

exports.coordinateLedgerMigration = coordinateLedgerMigration;
exports.reconcileRollbackToLegacyArray = reconcileRollbackToLegacyArray;
exports.encodeCursor = encodeCursor;
exports.decodeCursor = decodeCursor;
