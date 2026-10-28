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
 * Generates a tamper-proof cryptographic delivery token for verified eBook downloads.
 * Valid for 48 hours.
 */
function generateDeliveryToken(order, secret) {
  const expiresAt = Date.now() + 48 * 60 * 60 * 1000; // 48 hours
  const payload = `${order.txnid}|${order.status}|${order.amount}|${order.customerEmail}|${order.customerPhone}|${expiresAt}`;
  const signature = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  return `${order.txnid}.${expiresAt}.${signature}`;
}

/**
 * Verifies the validity of an eBook delivery token.
 */
function verifyDeliveryToken(token, secret) {
  if (!token || typeof token !== 'string') return { valid: false, reason: 'Missing token' };

  const parts = token.split('.');
  if (parts.length !== 3) return { valid: false, reason: 'Malformed token' };

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

  if (crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
    return { valid: true, order };
  }

  return { valid: false, reason: 'Invalid signature' };
}

module.exports = {
  recordOrder,
  getOrder,
  isDuplicatePayment,
  generateDeliveryToken,
  verifyDeliveryToken
};
