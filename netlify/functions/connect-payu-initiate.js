/**
 * CONNECT PayU Payment Initiation Netlify Function
 * 
 * Provides production-secure payment initiation exclusively for CONNECT coin recharges.
 * Security Guarantees:
 * 1. Strict Firebase ID token verification using Firebase Admin verifyIdToken().
 * 2. Authenticated UID derived exclusively from decoded token. Never trusts client-supplied UID.
 * 3. Package price and coin count validated strictly against canonical server catalog.
 * 4. Pending order stored in Firestore collection 'connect_orders' with expectedAmount, expectedCoins, and status: 'pending'.
 * 5. Generates cryptographically secure SHA-512 request hash with PayU credentials.
 * 6. Completely isolated from Sanskruti eBook and service checkouts.
 */

const crypto = require('crypto');
const { getPayUConfig, generateRequestHash } = require('./_payu-config');
const { getDb, getAuth, getCanonicalPackage, getCanonicalVipPlan } = require('./_connect-db');

const ALLOWED_ORIGINS = [
  'https://sanskrutiservice.in',
  'https://www.sanskrutiservice.in',
  'http://localhost:5173',
  'http://localhost:8888',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:8888',
];

const getCorsOrigin = (event) => {
  const reqOrigin = event.headers?.origin || event.headers?.Origin || '';
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

exports.handler = async (event, context) => {
  const corsOrigin = getCorsOrigin(event);

  // 1. CORS Preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': corsOrigin,
        'Access-Control-Allow-Headers': 'Authorization, Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: '',
    };
  }

  const headers = {
    'Access-Control-Allow-Origin': corsOrigin,
    'Content-Type': 'application/json',
  };

  // 2. HTTP Method Validation
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method Not Allowed', code: 'auth/method-not-allowed' }),
    };
  }

  try {
    // 3. Verify Firebase ID Token
    const authHeader = event.headers.authorization || event.headers.Authorization || '';
    if (!authHeader.startsWith('Bearer ')) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({
          error: 'Unauthorized: Missing or malformed Firebase ID token.',
          code: 'auth/missing-token',
        }),
      };
    }

    const idToken = authHeader.split('Bearer ')[1].trim();
    if (!idToken) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({
          error: 'Unauthorized: Empty token provided.',
          code: 'auth/empty-token',
        }),
      };
    }

    const adminAuth = getAuth();
    if (!adminAuth) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: 'Internal error: Firebase Auth Admin not available.',
          code: 'auth/admin-unavailable',
        }),
      };
    }

    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(idToken);
    } catch (tokenErr) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({
          error: 'Unauthorized: Invalid or expired Firebase ID token.',
          code: tokenErr.code || 'auth/invalid-token',
        }),
      };
    }

    const verifiedUid = decodedToken.uid;
    if (!verifiedUid) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({
          error: 'Unauthorized: Token does not contain a valid UID.',
          code: 'auth/no-uid',
        }),
      };
    }

    // 4. Validate Package or VIP Plan
    const body = JSON.parse(event.body || '{}');
    const { packageId, planId, name, phone, email } = body;

    const canonicalVipPlan = getCanonicalVipPlan(planId || packageId);
    const canonicalPackage = !canonicalVipPlan ? getCanonicalPackage(packageId) : null;

    if (!canonicalVipPlan && !canonicalPackage) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: `Invalid or unrecognized coin package or VIP plan: ${planId || packageId}`,
          code: planId ? 'order/invalid-item' : 'order/invalid-package',
        }),
      };
    }

    const isVip = Boolean(canonicalVipPlan);
    const targetItem = canonicalVipPlan || canonicalPackage;

    // 5. PayU Configuration
    const config = getPayUConfig();
    if (!config.key || !config.salt) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: 'PayU merchant key or salt is not configured on the server.',
          code: 'payment/config-error',
        }),
      };
    }

    // 6. Generate Unique Transaction ID (Max 30 chars for PayU)
    const randomSuffix = crypto.randomBytes(4).toString('hex').toUpperCase();
    const txnid = `CN_${Date.now()}_${randomSuffix}`;

    const amountFormatted = Number(targetItem.price).toFixed(2);
    const surl = `${config.siteUrl}/.netlify/functions/payu-response`;
    const furl = `${config.siteUrl}/.netlify/functions/payu-response`;

    // Customer info from body with fallback to token
    const customerName = String(name || decodedToken.name || 'CONNECT User').trim() || 'CONNECT User';
    const customerPhone = String(phone || decodedToken.phone_number || '9876543210').replace(/[^0-9]/g, '').slice(-10) || '9876543210';
    const customerEmail = String(email || decodedToken.email || `${verifiedUid}@connect.local`).trim().toLowerCase();

    // UDFs strictly bound to verified identity and canonical item
    const udf1 = verifiedUid;
    const udf2 = targetItem.id;
    const udf3 = isVip ? 'connect_vip_subscription' : 'connect_wallet_recharge';
    const udf4 = isVip ? String(targetItem.durationDays) : String(targetItem.coins);
    const udf5 = 'connect';

    // 7. Store Order in Firestore
    const orderRecord = isVip
      ? {
          txnid,
          uid: verifiedUid,
          orderType: 'vip',
          planId: targetItem.planId,
          packageName: targetItem.title,
          planName: targetItem.planName,
          durationDays: targetItem.durationDays,
          dailyBonusCoins: targetItem.dailyBonusCoins,
          expectedAmount: Number(targetItem.price),
          expectedCoins: 0,
          status: 'pending',
          fulfilled: false,
          createdAt: new Date().toISOString(),
          customerName,
          customerPhone,
          customerEmail,
          category: 'connect_vip',
        }
      : {
          txnid,
          uid: verifiedUid,
          orderType: 'coins',
          packageId: targetItem.id,
          packageName: targetItem.title,
          expectedAmount: Number(targetItem.price),
          expectedCoins: Number(targetItem.coins),
          status: 'pending',
          fulfilled: false,
          createdAt: new Date().toISOString(),
          customerName,
          customerPhone,
          customerEmail,
          category: 'connect',
        };

    const db = getDb();
    await db.collection('connect_orders').doc(txnid).set(orderRecord);

    // 8. Generate Request Hash
    const hash = generateRequestHash({
      key: config.key,
      txnid,
      amount: amountFormatted,
      productinfo: targetItem.title,
      firstname: customerName,
      email: customerEmail,
      udf1,
      udf2,
      udf3,
      udf4,
      udf5,
      salt: config.salt,
    });

    // 9. Return Initiation Payload
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        mode: config.mode,
        isLive: config.isLive,
        actionUrl: config.paymentUrl,
        params: {
          key: config.key,
          txnid,
          amount: amountFormatted,
          productinfo: targetItem.title,
          firstname: customerName,
          email: customerEmail,
          phone: customerPhone,
          surl,
          furl,
          hash,
          udf1,
          udf2,
          udf3,
          udf4,
          udf5,
        },
      }),
    };
  } catch (err) {
    console.error('Error in connect-payu-initiate:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Internal server error processing payment initiation: ' + err.message,
        code: 'order/internal-error',
      }),
    };
  }
};

