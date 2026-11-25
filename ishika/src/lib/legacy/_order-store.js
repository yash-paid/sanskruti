// Order Storage, Duplicate Payment Protection & Cryptographic Delivery Tokens
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// In-memory cache for fast lookups within the same container instance
const memoryOrders = new Map();

// Optional file cache in OS temp directory for persistence across function invocations
const TEMP_CACHE_FILE = path.join(
  process.env.TMPDIR || process.env.TEMP || '/tmp',
  'sanskruti_orders.json'
);

function loadPersistentOrders() {
  try {
    if (fs.existsSync(TEMP_CACHE_FILE)) {
      const data = JSON.parse(fs.readFileSync(TEMP_CACHE_FILE, 'utf-8'));
      for (const [k, v] of Object.entries(data)) {
        memoryOrders.set(k, v);
      }
    }
  } catch (err) {
    // Ignore cache load errors in read-only environments
  }
}

function savePersistentOrders() {
  try {
    const obj = {};
    for (const [k, v] of memoryOrders.entries()) {
      obj[k] = v;
    }
    fs.writeFileSync(TEMP_CACHE_FILE, JSON.stringify(obj), 'utf-8');
  } catch (err) {
    // Ignore cache save errors in read-only environments
  }
}

// Initial load
loadPersistentOrders();

/**
 * Record an initiated or updated order
 */
function recordOrder(txnid, orderData) {
  const existing = memoryOrders.get(txnid) || {};
  const updated = {
    ...existing,
    ...orderData,
    updatedAt: new Date().toISOString()
  };
  memoryOrders.set(txnid, updated);
  savePersistentOrders();
  return updated;
}

/**
 * Get order by txnid
 */
function getOrder(txnid) {
  loadPersistentOrders();
  return memoryOrders.get(txnid) || null;
}

/**
 * Duplicate Payment Protection:
 * Checks if a transaction has already been processed and fulfilled.
 */
function isDuplicatePayment(txnid, mihpayid) {
  loadPersistentOrders();
  const order = memoryOrders.get(txnid);
  if (!order) return false;

  // If already delivered and payment confirmed
  if (order.status === 'success' && order.fulfilled === true) {
    return true;
  }

  // Also check if mihpayid was already processed under another record
  if (mihpayid) {
    for (const [id, ord] of memoryOrders.entries()) {
      if (id !== txnid && ord.mihpayid === mihpayid && ord.status === 'success') {
        return true;
      }
    }
  }

  return false;
}

/**
 * Generates a tamper-proof cryptographic delivery token for verified eBook downloads & service bookings.
 * Valid for 48 hours.
 * Uses a stateless base64url payload with HMAC-SHA256 signature to guarantee
 * seamless verification across independent serverless function containers.
 */
function generateDeliveryToken(order, secret) {
  const expiresAt = Date.now() + 48 * 60 * 60 * 1000; // 48 hours
  const payloadData = {
    txnid: order.txnid,
    status: order.status || 'success',
    amount: order.amount,
    customerName: order.customerName || '',
    customerEmail: order.customerEmail || '',
    customerPhone: order.customerPhone || '',
    category: order.productCategory || order.category || 'ebook',
    itemsPurchased: order.itemsPurchased || [],
    mihpayid: order.mihpayid || '',
    paidAt: order.paidAt || new Date().toISOString(),
    expiresAt
  };
  const payloadStr = Buffer.from(JSON.stringify(payloadData)).toString('base64url');
  const signature = crypto.createHmac('sha256', secret).update(payloadStr).digest('hex');
  return `${payloadStr}.${signature}`;
}

/**
 * Verifies the validity of an order delivery token.
 * Supports both self-contained stateless tokens (payload.sig) and legacy (txnid.exp.sig).
 */
function verifyDeliveryToken(token, secret) {
  if (!token || typeof token !== 'string') return { valid: false, reason: 'Missing token' };

  const parts = token.split('.');

  // 1. New Stateless Self-Contained Token Format (payloadBase64.signature)
  if (parts.length === 2) {
    const [payloadStr, signature] = parts;
    const expectedSig = crypto.createHmac('sha256', secret).update(payloadStr).digest('hex');
    if (signature.length !== expectedSig.length || !crypto.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expectedSig, 'hex'))) {
      return { valid: false, reason: 'Invalid signature' };
    }
    try {
      const order = JSON.parse(Buffer.from(payloadStr, 'base64url').toString('utf-8'));
      if (order.expiresAt && Date.now() > order.expiresAt) {
        return { valid: false, reason: 'Token expired' };
      }
      // Cache in local memory for process consistency
      recordOrder(order.txnid, order);
      return { valid: true, order };
    } catch (e) {
      return { valid: false, reason: 'Malformed token payload' };
    }
  }

  // 2. Legacy 3-part Token Format (txnid.expiresAt.signature)
  if (parts.length === 3) {
    const [txnid, expiresAtStr, signature] = parts;
    const expiresAt = parseInt(expiresAtStr, 10);

    if (isNaN(expiresAt) || Date.now() > expiresAt) {
      return { valid: false, reason: 'Token expired' };
    }

    const order = getOrder(txnid);
    if (!order) {
      return { valid: false, reason: 'Order not found for transaction' };
    }

    const expectedPayload = `${order.txnid}|${order.status}|${order.amount}|${order.customerEmail}|${order.customerPhone}|${expiresAt}`;
    const expectedSignature = crypto.createHmac('sha256', secret).update(expectedPayload).digest('hex');

    if (signature.length === expectedSignature.length && crypto.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expectedSignature, 'hex'))) {
      return { valid: true, order };
    }

    return { valid: false, reason: 'Invalid signature' };
  }

  return { valid: false, reason: 'Malformed token' };
}

module.exports = {
  recordOrder,
  getOrder,
  isDuplicatePayment,
  generateDeliveryToken,
  verifyDeliveryToken
};
