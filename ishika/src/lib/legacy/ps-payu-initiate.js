/**
 * Netlify Function: POST /api/ps-payu-initiate
 * Secure PayU Hosted Checkout Initiation for PlayStation Events
 * 
 * - Authoritative server-side pricing and capacity validation
 * - Server-side SHA-512 PayU request hash generation
 * - Idempotent order tracking in persistent storage
 * - Never trusts client-supplied amounts
 */

const {
  initiatePsOrder,
  checkRateLimit,
  sanitizeString,
  isValidIndianPhone,
  isValidEmail
} = require('./_ps-db');
const { getPayUConfig, generateRequestHash } = require('./_payu-config');

exports.handler = async (event, context) => {
  // 1. CORS Preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
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

    // 2. Rate Limiting (60 requests per minute per IP)
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
          error: 'Rate limit exceeded. Please wait a moment before trying again.'
        })
      };
    }

    // 3. Parse and Validate Request Payload
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

    const { eventId, quantity, name, phone, email } = body;

    const cleanName = sanitizeString(name, 60);
    if (!cleanName || cleanName.length < 2) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ success: false, error: 'Please enter your full name as per government documents (minimum 2 characters).' })
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

    // 4. Server-Side Execution: Price & Capacity Authoritative Validation
    const cleanEventId = sanitizeString(eventId, 20);
    const cleanQty = parseInt(quantity, 10) || 1;

    const { order, event: psEvent } = await initiatePsOrder({
      eventId: cleanEventId,
      quantity: cleanQty,
      customerName: cleanName,
      customerPhone: phone,
      customerEmail: email,
      clientIp
    });

    // 5. PayU Gateway Configuration & Request Hash
    const config = getPayUConfig();
    if (!config.key || !config.salt) {
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ success: false, error: 'PayU merchant key or salt is not configured.' })
      };
    }

    const amountFormatted = order.totalAmount.toFixed(2);
    const productinfo = sanitizeString(order.eventTitle, 100);
    const surl = `${config.siteUrl}/.netlify/functions/ps-payu-response`;
    const furl = `${config.siteUrl}/.netlify/functions/ps-payu-response`;

    const udf1 = order.eventId;
    const udf2 = String(order.quantity);
    const udf3 = order.orderId;
    const udf4 = order.customer.phone;
    const udf5 = 'ps_event';

    const hash = generateRequestHash({
      key: config.key,
      txnid: order.txnid,
      amount: amountFormatted,
      productinfo,
      firstname: cleanName,
      email: order.customer.email,
      udf1,
      udf2,
      udf3,
      udf4,
      udf5,
      salt: config.salt
    });

    // 6. Return Secure Payment Form Payload
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'X-Content-Type-Options': 'nosniff'
      },
      body: JSON.stringify({
        success: true,
        mode: config.mode,
        isLive: config.isLive,
        actionUrl: config.paymentUrl,
        params: {
          key: config.key,
          txnid: order.txnid,
          amount: amountFormatted,
          productinfo,
          firstname: cleanName,
          email: order.customer.email,
          phone: order.customer.phone,
          surl,
          furl,
          hash,
          udf1,
          udf2,
          udf3,
          udf4,
          udf5
        },
        orderSummary: {
          orderId: order.orderId,
          txnid: order.txnid,
          eventId: order.eventId,
          eventTitle: order.eventTitle,
          unitPrice: order.unitPrice,
          quantity: order.quantity,
          totalAmount: order.totalAmount
        }
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

    console.error('[PS-PAYU-INITIATE ERROR]', err);
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ success: false, error: err.message || 'Payment initiation failed.' })
    };
  }
};
