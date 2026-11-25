// PayU India Configuration & Cryptographic Hash Helpers
const crypto = require('crypto');

/**
 * Returns active configuration based on PAYU_MODE ('TEST' or 'LIVE').
 * Default is safely 'TEST'.
 */
function getPayUConfig() {
  const rawMode = (process.env.PAYU_MODE || 'TEST').trim().toUpperCase();
  const isLive = rawMode === 'LIVE' || rawMode === 'PRODUCTION';
  const mode = isLive ? 'LIVE' : 'TEST';

  // Support dedicated keys or shared fallback keys
  const key = isLive
    ? (process.env.PAYU_LIVE_KEY || process.env.PAYU_KEY || '').trim()
    : (process.env.PAYU_TEST_KEY || process.env.PAYU_KEY || 'gtKFFx').trim();

  const salt = isLive
    ? (process.env.PAYU_LIVE_SALT || process.env.PAYU_SALT || '').trim()
    : (process.env.PAYU_TEST_SALT || process.env.PAYU_SALT || 'eCwWELxi').trim();

  const paymentUrl = isLive
    ? 'https://secure.payu.in/_payment'
    : 'https://test.payu.in/_payment';

  const verifyServiceUrl = isLive
    ? 'https://info.payu.in/merchant/postservice?form=2'
    : 'https://test.payu.in/merchant/postservice?form=2';

  // Base site URL (fallback to production domain or localhost)
  let siteUrl = (process.env.SITE_URL || process.env.URL || 'https://sanskrutiservice.in').trim();
  // Strip trailing slash
  if (siteUrl.endsWith('/')) {
    siteUrl = siteUrl.slice(0, -1);
  }

  const signingSecret = (
    process.env.ORDER_SIGNING_SECRET || 
    salt || 
    'sanskruti-order-token-secret-fallback'
  ).trim();

  return {
    mode,
    isLive,
    key,
    salt,
    paymentUrl,
    verifyServiceUrl,
    siteUrl,
    signingSecret
  };
}

/**
 * Generates PayU Hosted Checkout SHA-512 Request Hash
 * Sequence: sha512(key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||SALT)
 */
function generateRequestHash({ key, txnid, amount, productinfo, firstname, email, udf1 = '', udf2 = '', udf3 = '', udf4 = '', udf5 = '', salt }) {
  const hashString = [
    key,
    txnid,
    amount,
    productinfo,
    firstname,
    email,
    udf1,
    udf2,
    udf3,
    udf4,
    udf5,
    '', '', '', '', '', // represents 6 structural pipes: ||||||
    salt
  ].join('|');

  return crypto.createHash('sha512').update(hashString, 'utf-8').digest('hex');
}

/**
 * Generates and Verifies PayU Response SHA-512 Reverse Hash
 * If additionalCharges is present:
 *   sha512(additionalCharges|SALT|status||||||udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key)
 * Else:
 *   sha512(SALT|status||||||udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key)
 */
function verifyResponseHash(responseParams, salt) {
  const {
    key = '',
    txnid = '',
    amount = '',
    productinfo = '',
    firstname = '',
    email = '',
    udf1 = '',
    udf2 = '',
    udf3 = '',
    udf4 = '',
    udf5 = '',
    status = '',
    additionalCharges = '',
    hash = ''
  } = responseParams;

  let hashString = '';
  if (additionalCharges && String(additionalCharges).trim().length > 0) {
    hashString = [
      additionalCharges,
      salt,
      status,
      '', '', '', '', '', // 6 pipes between status and udf5
      udf5,
      udf4,
      udf3,
      udf2,
      udf1,
      email,
      firstname,
      productinfo,
      amount,
      txnid,
      key
    ].join('|');
  } else {
    hashString = [
      salt,
      status,
      '', '', '', '', '', // 6 pipes between status and udf5
      udf5,
      udf4,
      udf3,
      udf2,
      udf1,
      email,
      firstname,
      productinfo,
      amount,
      txnid,
      key
    ].join('|');
  }

  const calculatedHash = crypto.createHash('sha512').update(hashString, 'utf-8').digest('hex');
  const isValid = calculatedHash.toLowerCase() === String(hash || '').trim().toLowerCase();

  return {
    isValid,
    calculatedHash,
    receivedHash: hash
  };
}

/**
 * Generates PayU verify_payment Command Hash
 * Sequence: sha512(key|command|var1|salt)
 */
function generateVerifyPaymentHash({ key, command = 'verify_payment', var1, salt }) {
  const hashString = `${key}|${command}|${var1}|${salt}`;
  return crypto.createHash('sha512').update(hashString, 'utf-8').digest('hex');
}

/**
 * Server-to-Server Payment Verification with PayU
 * Calls PayU postservice API to independently confirm payment status.
 */
async function verifyPaymentWithPayUServer({ key, salt, txnid, verifyServiceUrl }) {
  const command = 'verify_payment';
  const hash = generateVerifyPaymentHash({ key, command, var1: txnid, salt });

  const bodyParams = new URLSearchParams();
  bodyParams.append('key', key);
  bodyParams.append('command', command);
  bodyParams.append('var1', txnid);
  bodyParams.append('hash', hash);

  try {
    const response = await fetch(verifyServiceUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: bodyParams.toString()
    });

    const data = await response.json();
    return {
      success: true,
      data
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

module.exports = {
  getPayUConfig,
  generateRequestHash,
  verifyResponseHash,
  generateVerifyPaymentHash,
  verifyPaymentWithPayUServer
};
