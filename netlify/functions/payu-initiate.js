// Netlify Function: Initiate PayU Hosted Checkout Payment
const crypto = require('crypto');
const { getPayUConfig, generateRequestHash } = require('./_payu-config');
const { validateAndCalculateOrder } = require('./_catalog');
const { recordOrder } = require('./_order-store');

exports.handler = async (event, context) => {
  // CORS & Preflight handling
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: false, error: 'Method Not Allowed' })
    };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const {
      itemType,
      itemId,
      cartItems = [],
      couponCode = '',
      name = '',
      phone = '',
      email = ''
    } = body;

    // 1. Validate customer input
    const cleanName = String(name).trim();
    if (!cleanName || cleanName.length < 2) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: false, error: 'Please provide a valid full name.' })
      };
    }

    const cleanPhone = String(phone).replace(/[^0-9]/g, '');
    if (cleanPhone.length !== 10) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: false, error: 'Please provide a valid 10-digit WhatsApp phone number.' })
      };
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!cleanEmail || !emailRegex.test(cleanEmail)) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: false, error: 'Please provide a valid email address.' })
      };
    }

    // 2. Validate order & price on server
    let orderCalc;
    try {
      orderCalc = validateAndCalculateOrder({
        itemType,
        itemId,
        cartItems,
        couponCode
      });
    } catch (valErr) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: false, error: valErr.message })
      };
    }

    // 3. Resolve PayU configuration
    const config = getPayUConfig();
    if (!config.key || !config.salt) {
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: false,
          error: 'PayU merchant key or salt is not configured on the server.'
        })
      };
    }

    // 4. Generate unique transaction ID (max 30 chars for PayU)
    const randomSuffix = crypto.randomBytes(3).toString('hex').toUpperCase();
    const txnid = `SKT_${Date.now()}_${randomSuffix}`;

    // Callback URLs
    const surl = `${config.siteUrl}/.netlify/functions/payu-response`;
    const furl = `${config.siteUrl}/.netlify/functions/payu-response`;

    // User Defined Fields (UDFs) for tracking order metadata through PayU
    const udf1 = `${itemType}:${itemId || 'cart'}`.substring(0, 50);
    const udf2 = cleanPhone;
    const udf3 = orderCalc.appliedCoupon ? `COUPON_${orderCalc.appliedCoupon}` : 'NO_COUPON';
    const udf4 = `${orderCalc.itemsPurchased.length}_items`;
    const udf5 = (reqBody && reqBody.source === 'index-php') ? 'index-php' : 'sanskruti-web';

    // 5. Generate secure SHA-512 request hash server-side
    const hash = generateRequestHash({
      key: config.key,
      txnid,
      amount: orderCalc.amountFormatted,
      productinfo: orderCalc.productInfo,
      firstname: cleanName,
      email: cleanEmail,
      udf1,
      udf2,
      udf3,
      udf4,
      udf5,
      salt: config.salt
    });

    // 6. Record order in local store
    recordOrder(txnid, {
      txnid,
      status: 'initiated',
      amount: orderCalc.amountFormatted,
      subtotal: orderCalc.subtotal,
      appliedCoupon: orderCalc.appliedCoupon,
      productinfo: orderCalc.productInfo,
      itemsPurchased: orderCalc.itemsPurchased,
      productCategory: orderCalc.productCategory,
      customerName: cleanName,
      customerPhone: cleanPhone,
      customerEmail: cleanEmail,
      createdAt: new Date().toISOString()
    });

    // 7. Return initiation payload to client
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: true,
        mode: config.mode,
        isLive: config.isLive,
        actionUrl: config.paymentUrl,
        params: {
          key: config.key,
          txnid,
          amount: orderCalc.amountFormatted,
          productinfo: orderCalc.productInfo,
          firstname: cleanName,
          email: cleanEmail,
          phone: cleanPhone,
          surl,
          furl,
          hash,
          udf1,
          udf2,
          udf3,
          udf4,
          udf5
        }
      })
    };
  } catch (err) {
    console.error('Error in payu-initiate:', err);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: false, error: 'Internal server error processing payment request.' })
    };
  }
};
