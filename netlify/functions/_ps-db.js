/**
 * Server-Side Database & Business Logic Engine for PlayStation Events (/PS)
 * 
 * Provides:
 * - Persistent storage across serverless container invocations & local dev
 * - Atomic concurrency queue to prevent race conditions during ticket allocation
 * - Server-authoritative event configuration (prices, caps, specs)
 * - Server-side validation of inputs, pricing, and remaining capacities
 * - Idempotency key tracking to eliminate duplicate submissions
 * - In-memory sliding-window rate limiting
 * - Accurate India Standard Time (IST, UTC+05:30) midnight countdown targets
 * - Strict Legal & Regulatory Compliance Gate (Public Gambling Act & Payment Aggregator Rules)
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const os = require('os');

// Primary persistence paths
const LOCAL_STORE_FILE = path.join(__dirname, '_ps-store.json');
const TMP_STORE_FILE = path.join(
  process.env.TMPDIR || process.env.TEMP || os.tmpdir() || '/tmp',
  'sanskruti_ps_store.json'
);

// In-memory runtime cache
let memoryStore = null;

// Concurrency mutex queue for atomic operations
let dbMutexQueue = Promise.resolve();

/**
 * Executes an operation sequentially through the atomic mutex queue
 */
function runAtomic(fn) {
  const resultPromise = dbMutexQueue.then(async () => {
    return await fn();
  });
  // Keep queue alive even if a previous operation threw an error
  dbMutexQueue = resultPromise.catch(() => {});
  return resultPromise;
}

/**
 * Load store from disk or tmpdir
 */
function loadStore() {
  if (memoryStore) return memoryStore;

  let localEvents = {};
  try {
    if (fs.existsSync(LOCAL_STORE_FILE)) {
      const local = JSON.parse(fs.readFileSync(LOCAL_STORE_FILE, 'utf-8'));
      localEvents = local.events || {};
    }
  } catch (_) {}

  // Try reading from TMP_STORE_FILE first (most recent in serverless)
  try {
    if (fs.existsSync(TMP_STORE_FILE)) {
      memoryStore = JSON.parse(fs.readFileSync(TMP_STORE_FILE, 'utf-8'));
      // Ensure all canonical events are present and updated
      memoryStore.events = { ...localEvents, ...(memoryStore.events || {}) };
      return memoryStore;
    }
  } catch (_) {}

  // Fallback to repository LOCAL_STORE_FILE
  try {
    if (fs.existsSync(LOCAL_STORE_FILE)) {
      memoryStore = JSON.parse(fs.readFileSync(LOCAL_STORE_FILE, 'utf-8'));
      return memoryStore;
    }
  } catch (_) {}

  // Default initial store if neither exists
  memoryStore = {
    events: localEvents,
    orders: {},
    tickets: {},
    results: {},
    audit_logs: []
  };
  return memoryStore;
}

/**
 * Save store to disk and tmpdir
 */
function saveStore(store) {
  memoryStore = store;
  const serialized = JSON.stringify(store, null, 2);

  // Write to TMP_STORE_FILE
  try {
    fs.writeFileSync(TMP_STORE_FILE, serialized, 'utf-8');
  } catch (_) {}

  // Write to LOCAL_STORE_FILE if writable
  try {
    fs.writeFileSync(LOCAL_STORE_FILE, serialized, 'utf-8');
  } catch (_) {}
}

/**
 * Calculate accurate timestamp for the upcoming 00:00:00 midnight IST (UTC+05:30)
 */
function getNextMidnightIST(nowMs = Date.now()) {
  const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
  const istNow = new Date(nowMs + IST_OFFSET_MS);

  // Determine current IST calendar date
  const year = istNow.getUTCFullYear();
  const month = istNow.getUTCMonth();
  const date = istNow.getUTCDate();

  // Target midnight IST (next day at 00:00:00 IST)
  // In UTC ms: Date.UTC(year, month, date + 1, 0, 0, 0) - IST_OFFSET_MS
  const targetUtcMs = Date.UTC(year, month, date + 1, 0, 0, 0) - IST_OFFSET_MS;
  const remainingSeconds = Math.max(0, Math.floor((targetUtcMs - nowMs) / 1000));

  return {
    targetIso: new Date(targetUtcMs).toISOString(),
    targetUtcMs,
    remainingSeconds,
    istTimeString: '00:00:00 IST'
  };
}

/**
 * Calculate verified participants count for an event
 */
function getEventVerifiedCount(eventId, store = loadStore()) {
  let count = 0;
  for (const ord of Object.values(store.orders || {})) {
    if (ord.eventId === eventId && (ord.status === 'CONFIRMED' || ord.status === 'VERIFIED')) {
      count += (ord.quantity || 1);
    }
  }
  return count;
}

/**
 * Sliding Window Rate Limiter
 */
const rateLimitMap = new Map();
function checkRateLimit(clientIp, limit = 20, windowMs = 60000) {
  const now = Date.now();
  const record = rateLimitMap.get(clientIp) || { count: 0, resetAt: now + windowMs };

  if (now > record.resetAt) {
    record.count = 1;
    record.resetAt = now + windowMs;
    rateLimitMap.set(clientIp, record);
    return { allowed: true, remaining: limit - 1, resetInMs: windowMs };
  }

  if (record.count >= limit) {
    return { allowed: false, remaining: 0, resetInMs: record.resetAt - now };
  }

  record.count += 1;
  rateLimitMap.set(clientIp, record);
  return { allowed: true, remaining: limit - record.count, resetInMs: record.resetAt - now };
}

/**
 * Sanitizes input string to prevent XSS and SQL/NoSQL injection
 */
function sanitizeString(str, maxLength = 100) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/[<>'"&;`]/g, '') // Strip potentially hazardous symbols
    .trim()
    .slice(0, maxLength);
}

/**
 * Validate 10-digit Indian mobile number
 */
function isValidIndianPhone(phone) {
  const clean = String(phone).replace(/\D/g, '');
  // Format: 10 digits starting with 6, 7, 8, or 9
  return /^[6-9]\d{9}$/.test(clean);
}

/**
 * Validate standard email
 */
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim().toLowerCase());
}

/**
 * Get all events with server-computed live stats
 */
async function getAllEvents() {
  return runAtomic(() => {
    const store = loadStore();
    const midnight = getNextMidnightIST();
    const resultList = [];

    for (const [id, event] of Object.entries(store.events)) {
      const verifiedParticipants = getEventVerifiedCount(id, store);
      const remainingCapacity = Math.max(0, event.plannedCap - verifiedParticipants);

      resultList.push({
        id: event.id,
        code: event.code,
        eventNumber: event.eventNumber,
        category: event.category,
        isPro: event.isPro,
        title: event.title,
        ticketPrice: event.ticketPrice,
        plannedCap: event.plannedCap,
        verifiedParticipants,
        remainingCapacity,
        progressPercent: Number(((verifiedParticipants / event.plannedCap) * 100).toFixed(1)),
        shortPrize: event.shortPrize,
        specs: event.specs,
        rules: event.rules,
        status: event.status,
        complianceStatus: 'GATEWAY_LOCKED_PENDING_LEGAL_APPROVAL',
        legalNotice: 'Under the Public Gambling Act and Payment Aggregator contest guidelines, live paid participation is gated pending verified statutory compliance.',
        schedule: {
          nextResultTime: midnight.targetIso,
          targetUtcMs: midnight.targetUtcMs,
          remainingSeconds: midnight.remainingSeconds,
          timeZone: 'Asia/Kolkata (IST)'
        }
      });
    }

    return {
      success: true,
      serverTime: new Date().toISOString(),
      events: resultList,
      complianceGate: {
        active: true,
        realMoneyCollection: false,
        reason: 'Payment gateway initiation for prize draws is held pending regulatory clearance.'
      }
    };
  });
}

/**
 * Get single event by ID
 */
async function getEventById(eventId) {
  return runAtomic(() => {
    const store = loadStore();
    const event = store.events[eventId];
    if (!event) return null;

    const verifiedParticipants = getEventVerifiedCount(eventId, store);
    const remainingCapacity = Math.max(0, event.plannedCap - verifiedParticipants);
    const midnight = getNextMidnightIST();

    return {
      ...event,
      verifiedParticipants,
      remainingCapacity,
      progressPercent: Number(((verifiedParticipants / event.plannedCap) * 100).toFixed(1)),
      schedule: {
        nextResultTime: midnight.targetIso,
        targetUtcMs: midnight.targetUtcMs,
        remainingSeconds: midnight.remainingSeconds,
        timeZone: 'Asia/Kolkata (IST)'
      }
    };
  });
}

/**
 * Create a ticket order with atomic capacity validation, idempotency, and legal compliance gating
 */
async function createOrder({
  eventId,
  quantity,
  customerName,
  customerPhone,
  customerEmail,
  idempotencyKey,
  clientIp = '127.0.0.1',
  testMode = false
}) {
  return runAtomic(() => {
    const store = loadStore();

    // 1. Check idempotency key if provided
    if (idempotencyKey) {
      for (const ord of Object.values(store.orders || {})) {
        if (ord.idempotencyKey === idempotencyKey) {
          // Idempotent duplicate: return existing order record
          return {
            isDuplicate: true,
            order: ord
          };
        }
      }
    }

    // 2. Validate Event
    const event = store.events[eventId];
    if (!event) {
      throw new Error(`Invalid event ID: ${eventId}`);
    }

    // 3. Validate Quantity
    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty < 1) {
      throw new Error('Quantity must be an integer of 1 or greater.');
    }
    if (qty > 50) {
      throw new Error('Maximum ticket quantity per order is 50.');
    }

    // 4. Server-Side Price Calculation (Frontend price is NEVER trusted)
    const unitPrice = event.ticketPrice;
    const totalAmount = unitPrice * qty;

    // 5. Atomic Capacity Check
    const verifiedCount = getEventVerifiedCount(eventId, store);
    const remaining = event.plannedCap - verifiedCount;
    if (qty > remaining) {
      const err = new Error(`Requested ${qty} tickets exceeds remaining capacity of ${remaining}.`);
      err.code = 'CAPACITY_EXCEEDED';
      throw err;
    }

    // 6. Generate Unique Order ID & Cryptographic Signature
    const timestamp = Date.now();
    const randomHex = crypto.randomBytes(4).toString('hex').toUpperCase();
    const orderId = `ORD-PS-${timestamp}-${randomHex}`;

    // Cryptographic audit signature
    const secretKey = process.env.PS_SIGNING_SECRET || 'ps-compliance-salt-2026';
    const signature = crypto
      .createHmac('sha256', secretKey)
      .update(`${orderId}:${eventId}:${unitPrice}:${qty}:${totalAmount}:${timestamp}`)
      .digest('hex');

    // Generate individual tickets for the order
    const issuedTickets = [];
    for (let i = 1; i <= qty; i++) {
      const ticketId = `TK-${event.code}-${timestamp.toString().slice(-6)}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
      const ticket = {
        ticketId,
        orderId,
        eventId,
        ticketIndex: i,
        totalInOrder: qty,
        unitPrice,
        status: testMode ? 'VERIFIED' : 'PENDING_LEGAL_COMPLIANCE_APPROVAL',
        issuedAt: new Date(timestamp).toISOString()
      };
      issuedTickets.push(ticket);
      store.tickets[ticketId] = ticket;
    }

    // Order record
    const orderRecord = {
      orderId,
      idempotencyKey: idempotencyKey || null,
      eventId,
      eventCode: event.code,
      eventTitle: event.title,
      unitPrice,
      quantity: qty,
      totalAmount,
      customer: {
        name: sanitizeString(customerName, 60),
        phone: String(customerPhone).replace(/\D/g, '').slice(-10),
        email: String(customerEmail).trim().toLowerCase().slice(0, 80)
      },
      status: testMode ? 'VERIFIED' : 'PENDING_LEGAL_COMPLIANCE_APPROVAL',
      testMode: Boolean(testMode),
      paymentGateway: 'DISABLED_PENDING_LEGAL_APPROVAL',
      paymentNotice: 'Payment initiation is held until statutory gaming/lottery licensing and payment aggregator approvals are confirmed.',
      signature,
      tickets: issuedTickets.map(t => t.ticketId),
      createdAt: new Date(timestamp).toISOString(),
      updatedAt: new Date(timestamp).toISOString(),
      clientIpHash: crypto.createHash('sha256').update(clientIp).digest('hex').slice(0, 16)
    };

    store.orders[orderId] = orderRecord;

    // Audit log
    store.audit_logs.push({
      type: 'ORDER_CREATED',
      orderId,
      eventId,
      qty,
      totalAmount,
      status: orderRecord.status,
      timestamp: new Date().toISOString()
    });

    saveStore(store);

    return {
      isDuplicate: false,
      order: orderRecord
    };
  });
}

/**
 * Retrieve an order by orderId and verify cryptographic integrity
 */
async function getOrderById(orderId) {
  return runAtomic(() => {
    const store = loadStore();
    const order = store.orders[orderId];
    if (!order) return null;

    // Verify cryptographic signature
    const secretKey = process.env.PS_SIGNING_SECRET || 'ps-compliance-salt-2026';
    let isTamperFree = false;
    if (order.status === 'CONFIRMED' && order.token) {
      const expectedToken = crypto
        .createHmac('sha256', secretKey)
        .update(`${order.orderId}:${order.txnid}:${order.totalAmount}:CONFIRMED`)
        .digest('hex');
      isTamperFree = (expectedToken === order.token);
    } else if (order.signature) {
      const timestamp = new Date(order.createdAt).getTime();
      const expectedSig = crypto
        .createHmac('sha256', secretKey)
        .update(`${order.orderId}:${order.eventId}:${order.unitPrice}:${order.quantity}:${order.totalAmount}:${timestamp}`)
        .digest('hex');
      const expectedTxnSig = crypto
        .createHmac('sha256', secretKey)
        .update(`${order.orderId}:${order.txnid}:${order.eventId}:${order.unitPrice}:${order.quantity}:${order.totalAmount}:${timestamp}`)
        .digest('hex');
      isTamperFree = (expectedSig === order.signature || expectedTxnSig === order.signature);
    }

    return {
      ...order,
      isTamperFree,
      ticketsData: (order.tickets || []).map(id => store.tickets[id] || { ticketId: id })
    };
  });
}

/**
 * Lookup order by txnid
 */
async function getOrderByTxnid(txnid) {
  return runAtomic(() => {
    const store = loadStore();
    for (const ord of Object.values(store.orders || {})) {
      if (ord.txnid === txnid) {
        return {
          ...ord,
          ticketsData: (ord.tickets || []).map(id => store.tickets[id] || { ticketId: id })
        };
      }
    }
    return null;
  });
}

/**
 * Initiate a PlayStation Order for PayU Hosted Checkout
 */
async function initiatePsOrder({
  eventId,
  quantity,
  customerName,
  customerPhone,
  customerEmail,
  clientIp = '127.0.0.1',
  txnid,
  orderId
}) {
  return runAtomic(() => {
    const store = loadStore();

    // 1. Validate Event
    const event = store.events[eventId];
    if (!event) {
      throw new Error(`Invalid event ID: ${eventId}`);
    }

    // 2. Validate Quantity
    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty < 1) {
      throw new Error('Quantity must be an integer of 1 or greater.');
    }
    if (qty > 50) {
      throw new Error('Maximum ticket quantity per order is 50.');
    }

    // 3. Server-Side Price Calculation (Frontend price is NEVER trusted)
    const unitPrice = Number(event.ticketPrice);
    const totalAmount = unitPrice * qty;

    // 4. Atomic Remaining Capacity Validation
    const verifiedCount = getEventVerifiedCount(eventId, store);
    const remaining = event.plannedCap - verifiedCount;
    if (qty > remaining) {
      const err = new Error(`Requested ${qty} tickets exceeds remaining capacity of ${remaining}.`);
      err.code = 'CAPACITY_EXCEEDED';
      throw err;
    }

    // 5. Generate unique IDs if not passed
    const now = Date.now();
    const finalOrderId = orderId || `ORD-PS-${now}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    const finalTxnid = txnid || `TXN_PS_${now}_${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

    // Cryptographic signature
    const secretKey = process.env.PS_SIGNING_SECRET || 'ps-compliance-salt-2026';
    const signature = crypto
      .createHmac('sha256', secretKey)
      .update(`${finalOrderId}:${finalTxnid}:${eventId}:${unitPrice}:${qty}:${totalAmount}:${now}`)
      .digest('hex');

    const orderRecord = {
      orderId: finalOrderId,
      txnid: finalTxnid,
      eventId,
      eventCode: event.code,
      eventTitle: event.title,
      unitPrice,
      quantity: qty,
      totalAmount,
      customer: {
        name: sanitizeString(customerName, 60),
        phone: String(customerPhone).replace(/\D/g, '').slice(-10),
        email: String(customerEmail).trim().toLowerCase().slice(0, 80)
      },
      status: 'PAYMENT_PENDING',
      paymentGateway: 'PayU Hosted Checkout (TEST MODE)',
      tickets: [],
      signature,
      createdAt: new Date(now).toISOString(),
      updatedAt: new Date(now).toISOString(),
      clientIp
    };

    store.orders[finalOrderId] = orderRecord;

    store.audit_logs.push({
      type: 'PAYMENT_INITIATED',
      orderId: finalOrderId,
      txnid: finalTxnid,
      eventId,
      qty,
      totalAmount,
      timestamp: new Date().toISOString()
    });

    saveStore(store);

    return {
      order: orderRecord,
      event
    };
  });
}

/**
 * Confirm PayU payment for an order (Atomic & Idempotent)
 */
async function confirmPsPayment({
  txnid,
  mihpayid,
  bank_ref_num,
  amountReceived,
  rawStatus = 'success',
  paymentData = {}
}) {
  return runAtomic(() => {
    const store = loadStore();

    // 1. Locate existing order by txnid
    let orderKey = null;
    let order = null;
    for (const [key, ord] of Object.entries(store.orders || {})) {
      if (ord.txnid === txnid || ord.orderId === txnid) {
        orderKey = key;
        order = ord;
        break;
      }
    }

    if (!order) {
      throw new Error(`Order not found for transaction ID: ${txnid}`);
    }

    // 2. Idempotency Check: if already confirmed, return safely without duplicating
    if (order.status === 'CONFIRMED' || order.status === 'VERIFIED') {
      return {
        isDuplicate: true,
        order
      };
    }

    // 3. Validate Amount Authoritatively
    const expectedAmount = Number(order.totalAmount);
    const actualAmount = parseFloat(amountReceived);
    if (isNaN(actualAmount) || Math.abs(expectedAmount - actualAmount) > 0.01) {
      order.status = 'TAMPERED_AMOUNT_MISMATCH';
      order.tamperDetails = `Expected amount ₹${expectedAmount}, received ₹${amountReceived}`;
      order.updatedAt = new Date().toISOString();
      saveStore(store);
      throw new Error(`Payment amount mismatch: expected ₹${expectedAmount}, received ₹${amountReceived}`);
    }

    // 4. Capacity Re-Check
    const event = store.events[order.eventId];
    if (event) {
      const verifiedCount = getEventVerifiedCount(order.eventId, store);
      const remaining = event.plannedCap - verifiedCount;
      if (order.quantity > remaining) {
        order.status = 'CAPACITY_OVERFLOW_REFUND_DUE';
        order.updatedAt = new Date().toISOString();
        saveStore(store);
        throw new Error(`Event capacity reached before confirmation. Transaction marked for refund.`);
      }
    }

    // 5. Generate Individual Tickets
    const timestamp = Date.now();
    const issuedTicketIds = [];
    for (let i = 1; i <= order.quantity; i++) {
      const ticketId = `TK-${order.eventCode}-${timestamp.toString().slice(-6)}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
      const ticketRecord = {
        ticketId,
        orderId: order.orderId,
        txnid: order.txnid,
        eventId: order.eventId,
        ticketIndex: i,
        totalInOrder: order.quantity,
        unitPrice: order.unitPrice,
        status: 'CONFIRMED',
        issuedAt: new Date(timestamp).toISOString()
      };
      issuedTicketIds.push(ticketId);
      store.tickets[ticketId] = ticketRecord;
    }

    // 6. Generate Verification Token
    const secretKey = process.env.PS_SIGNING_SECRET || 'ps-compliance-salt-2026';
    const token = crypto
      .createHmac('sha256', secretKey)
      .update(`${order.orderId}:${order.txnid}:${order.totalAmount}:CONFIRMED`)
      .digest('hex');

    // 7. Update Order
    order.status = 'CONFIRMED';
    order.mihpayid = mihpayid || '';
    order.bank_ref_num = bank_ref_num || '';
    order.tickets = issuedTicketIds;
    order.token = token;
    order.paymentConfirmedAt = new Date().toISOString();
    order.updatedAt = new Date().toISOString();

    store.audit_logs.push({
      type: 'PAYMENT_CONFIRMED',
      orderId: order.orderId,
      txnid: order.txnid,
      eventId: order.eventId,
      tickets: issuedTicketIds,
      amount: order.totalAmount,
      timestamp: new Date().toISOString()
    });

    saveStore(store);

    return {
      isDuplicate: false,
      order
    };
  });
}

/**
 * Mark payment as failed/rejected
 */
async function rejectPsPayment({ txnid, mihpayid, failureReason, rawStatus }) {
  return runAtomic(() => {
    const store = loadStore();
    for (const ord of Object.values(store.orders || {})) {
      if (ord.txnid === txnid || ord.orderId === txnid) {
        if (ord.status === 'CONFIRMED' || ord.status === 'VERIFIED') return ord;
        ord.status = 'FAILED';
        ord.failureReason = failureReason || 'Transaction rejected by gateway/bank.';
        ord.mihpayid = mihpayid || ord.mihpayid || null;
        ord.updatedAt = new Date().toISOString();
        saveStore(store);
        return ord;
      }
    }
    return null;
  });
}

/**
 * Mark payment as cancelled
 */
async function cancelPsPayment({ txnid, reason }) {
  return runAtomic(() => {
    const store = loadStore();
    for (const ord of Object.values(store.orders || {})) {
      if (ord.txnid === txnid || ord.orderId === txnid) {
        if (ord.status === 'CONFIRMED' || ord.status === 'VERIFIED') return ord;
        ord.status = 'CANCELLED';
        ord.cancelReason = reason || 'User cancelled payment.';
        ord.updatedAt = new Date().toISOString();
        saveStore(store);
        return ord;
      }
    }
    return null;
  });
}

/**
 * Mark payment as pending
 */
async function pendingPsPayment({ txnid, mihpayid, reason }) {
  return runAtomic(() => {
    const store = loadStore();
    for (const ord of Object.values(store.orders || {})) {
      if (ord.txnid === txnid || ord.orderId === txnid) {
        if (ord.status === 'CONFIRMED' || ord.status === 'VERIFIED') return ord;
        ord.status = 'PAYMENT_PENDING';
        ord.pendingReason = reason || 'Payment pending gateway confirmation.';
        ord.mihpayid = mihpayid || ord.mihpayid || null;
        ord.updatedAt = new Date().toISOString();
        saveStore(store);
        return ord;
      }
    }
    return null;
  });
}

/**
 * Reset test store (for automated test suite isolation)
 */
async function _resetStoreForTesting() {
  return runAtomic(() => {
    const store = loadStore();
    store.orders = {};
    store.tickets = {};
    store.audit_logs = [];
    saveStore(store);
    return true;
  });
}

module.exports = {
  runAtomic,
  getNextMidnightIST,
  checkRateLimit,
  sanitizeString,
  isValidIndianPhone,
  isValidEmail,
  getAllEvents,
  getEventById,
  createOrder,
  getOrderById,
  getOrderByTxnid,
  initiatePsOrder,
  confirmPsPayment,
  rejectPsPayment,
  cancelPsPayment,
  pendingPsPayment,
  _resetStoreForTesting
};
