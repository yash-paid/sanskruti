/**
 * Netlify Function: POST /api/ps-order
 * Validated Order Creation, Capacity Enforcer & Legal Compliance Gating
 */

const {
  createOrder,
  checkRateLimit,
  sanitizeString,
  isValidIndianPhone,
  isValidEmail
} = require('./_ps-db');

exports.handler = async (event, context) => {
  // CORS Preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, X-Idempotency-Key',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ success: false, error: 'Method Not Allowed' })
    };
  }

  try {
    const clientIp = event.headers['x-forwarded-for'] || event.headers['client-ip'] || '127.0.0.1';
    
    // 1. Rate Limiting (60 order requests per minute per IP)
    const rateCheck = checkRateLimit(clientIp, 60, 60000);
    if (!rateCheck.allowed) {
      return {
        statusCode: 429,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Retry-After': Math.ceil(rateCheck.resetInMs / 1000).toString()
        },
        body: JSON.stringify({
          success: false,
          error: 'Order rate limit exceeded. Please wait a minute before trying again.'
        })
      };
    }

    // 2. Parse Payload
    let body = {};
    try {
      body = JSON.parse(event.body || '{}');
    } catch (_) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ success: false, error: 'Malformed JSON payload.' })
      };
    }

    const {
      eventId,
      quantity,
      name,
      phone,
      email,
      idempotencyKey: bodyIdempotencyKey,
      testMode
    } = body;

    const idempotencyKey = event.headers['x-idempotency-key'] || bodyIdempotencyKey;

    // 3. Server-side validation of Customer Information
    const cleanName = sanitizeString(name, 60);
    if (!cleanName || cleanName.length < 2) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ success: false, error: 'Please enter a valid full name (minimum 2 characters).' })
      };
    }

    if (!isValidIndianPhone(phone)) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ success: false, error: 'Please provide a valid 10-digit Indian mobile number.' })
      };
    }

    if (!isValidEmail(email)) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ success: false, error: 'Please provide a valid email address.' })
      };
    }

    // 4. Server-Side Execution with Mutex & Idempotency
    const result = await createOrder({
      eventId: sanitizeString(eventId, 20),
      quantity,
      customerName: cleanName,
      customerPhone: phone,
      customerEmail: email,
      idempotencyKey: idempotencyKey ? sanitizeString(idempotencyKey, 64) : null,
      clientIp,
      testMode: Boolean(testMode)
    });

    const statusCode = result.isDuplicate ? 200 : 201;

    return {
      statusCode,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'X-Content-Type-Options': 'nosniff'
      },
      body: JSON.stringify({
        success: true,
        isDuplicate: result.isDuplicate,
        order: result.order,
        complianceNotice: 'Under the Public Gambling Act and Payment Aggregator contest guidelines, live monetary collection is held pending statutory compliance. This order is recorded in the persistent ledger under review status.'
      })
    };
  } catch (err) {
    if (err.code === 'CAPACITY_EXCEEDED') {
      return {
        statusCode: 409,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ success: false, error: err.message, code: 'CAPACITY_EXCEEDED' })
      };
    }

    console.error('[PS-ORDER ERROR]', err.message);
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ success: false, error: err.message || 'Order processing failed.' })
    };
  }
};
