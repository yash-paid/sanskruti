/**
 * Netlify Function: POST /.netlify/functions/ps-payu-response
 * (also mapped to /api/ps-payu-response)
 * 
 * PayU Callback Handler for PlayStation Events:
 * - Reverse SHA-512 Hash Cryptographic Verification
 * - Server-to-Server PayU Verification (verify_payment postservice)
 * - Atomic Idempotent Ticket Allocation
 * - Secure HTTP 303 Redirects to Existing Website Flow
 */

const { getPayUConfig, verifyResponseHash, verifyPaymentWithPayUServer } = require('./_payu-config');
const {
  confirmPsPayment,
  rejectPsPayment,
  cancelPsPayment,
  pendingPsPayment,
  getOrderByTxnid
} = require('./_ps-db');

/**
 * Builds clean HTTP 303 Redirect Response with fallback HTML
 */
function buildRedirectResponse(targetUrl, heading = 'Processing Payment...', subtext = 'Securely redirecting you back to PlayStation Events.') {
  const htmlBody = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${heading}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      background: #000411;
      color: #ffffff;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      text-align: center;
      padding: 1rem;
    }
    .card {
      background: #0a1128;
      border: 1px solid rgba(255, 255, 255, 0.12);
      padding: 2.5rem;
      border-radius: 14px;
      max-width: 440px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.5);
    }
    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid rgba(255, 255, 255, 0.1);
      border-top-color: #0070d1;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 0 auto 1.5rem;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    a { color: #0070d1; text-decoration: none; font-weight: 600; }
  </style>
</head>
<body>
  <div class="card">
    <div class="spinner"></div>
    <h3 style="margin-top:0; font-size:18px;">${heading}</h3>
    <p style="color:#94a3b8; font-size:14px; line-height:1.5;">${subtext}</p>
    <p style="font-size:13px; margin-top:20px;"><a href="${targetUrl}">Click here if not redirected automatically</a></p>
  </div>
  <script>window.location.replace("${targetUrl}");</script>
</body>
</html>`;

  return {
    statusCode: 303,
    headers: {
      'Location': targetUrl,
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    },
    body: htmlBody
  };
}

exports.handler = async (event, context) => {
  // PayU sends POST requests to surl/furl
  let rawBody = event.body || '';
  if (event.isBase64Encoded) {
    rawBody = Buffer.from(rawBody, 'base64').toString('utf-8');
  }

  // Parse Form URL-encoded parameters from PayU
  const params = Object.fromEntries(new URLSearchParams(rawBody));
  const config = getPayUConfig();

  const {
    txnid = '',
    status = '',
    amount = '',
    mihpayid = '',
    bank_ref_num = '',
    error_Message = '',
    udf1 = '', // eventId
    udf2 = '', // quantity
    udf3 = '', // orderId
    udf4 = '', // phone
    udf5 = ''  // 'ps_event'
  } = params;

  // Base fallback redirect
  const baseSiteUrl = config.siteUrl || 'http://localhost:3000';

  // If no txnid received
  if (!txnid) {
    const errorUrl = `${baseSiteUrl}/?payment=failed&status=missing_txnid&msg=${encodeURIComponent('No transaction identifier received from payment gateway.')}`;
    return buildRedirectResponse(errorUrl, 'Invalid Payment Response', 'No transaction ID was provided.');
  }

  // 1. Verify Reverse SHA-512 Hash
  const hashCheck = verifyResponseHash(params, config.salt);
  if (!hashCheck.isValid) {
    console.error('[PS-PAYU HASH TAMPERING DETECTED]', {
      txnid,
      received: hashCheck.receivedHash,
      calculated: hashCheck.calculatedHash
    });

    try {
      await rejectPsPayment({
        txnid,
        mihpayid,
        failureReason: 'Reverse SHA-512 hash tampering detected',
        rawStatus: status
      });
    } catch (_) {}

    const tamperedUrl = `${baseSiteUrl}/?payment=failed&status=tampered&txnid=${encodeURIComponent(txnid)}&msg=${encodeURIComponent('Security verification failed. Reverse payment hash mismatch.')}`;
    return buildRedirectResponse(tamperedUrl, 'Security Verification Failed', 'Payment response hash failed cryptographic verification.');
  }

  // 2. Normalize Status
  const normalizedStatus = String(status || '').trim().toLowerCase();

  // 3. Handle SUCCESS Status
  if (normalizedStatus === 'success') {
    // Secondary Server-to-Server Verification Check with PayU
    let serverVerificationPassed = true;
    try {
      const serverCheck = await verifyPaymentWithPayUServer({
        key: config.key,
        salt: config.salt,
        txnid,
        verifyServiceUrl: config.verifyServiceUrl
      });

      if (serverCheck.success && serverCheck.data && serverCheck.data.status === 1) {
        const txnDetails = serverCheck.data.transaction_details && serverCheck.data.transaction_details[txnid];
        if (txnDetails && txnDetails.status && txnDetails.status.toLowerCase() !== 'success') {
          serverVerificationPassed = false;
        }
      }
    } catch (e) {
      // In offline testing or network timeouts, proceed based on cryptographically verified reverse hash
      console.warn('[PS-PAYU] Secondary verify_payment check warning:', e.message);
    }

    if (!serverVerificationPassed) {
      await rejectPsPayment({
        txnid,
        mihpayid,
        failureReason: 'PayU server-to-server check returned non-success',
        rawStatus: status
      });
      const failUrl = `${baseSiteUrl}/?payment=failed&status=verification_failed&txnid=${encodeURIComponent(txnid)}&msg=${encodeURIComponent('Payment confirmation failed secondary server verification.')}`;
      return buildRedirectResponse(failUrl, 'Verification Failed', 'Transaction could not be verified by the gateway.');
    }

    // Atomic & Idempotent Confirmation
    try {
      const confirmResult = await confirmPsPayment({
        txnid,
        mihpayid,
        bank_ref_num,
        amountReceived: amount,
        rawStatus: status,
        paymentData: params
      });

      const order = confirmResult.order;
      const successUrl = `${baseSiteUrl}/?payment=success&txnid=${encodeURIComponent(txnid)}&orderId=${encodeURIComponent(order.orderId)}&token=${encodeURIComponent(order.token || '')}`;
      return buildRedirectResponse(successUrl, 'Payment Verified!', 'Redirecting to your confirmed ticket details...');
    } catch (confirmErr) {
      console.error('[PS-PAYU CONFIRM ERROR]', confirmErr.message);
      const failUrl = `${baseSiteUrl}/?payment=failed&status=failed&txnid=${encodeURIComponent(txnid)}&msg=${encodeURIComponent(confirmErr.message)}`;
      return buildRedirectResponse(failUrl, 'Ticket Allocation Issue', confirmErr.message);
    }
  }

  // 4. Handle FAILED / REJECTED Status
  if (normalizedStatus === 'failure' || normalizedStatus === 'failed' || normalizedStatus === 'rejected') {
    await rejectPsPayment({
      txnid,
      mihpayid,
      failureReason: error_Message || 'Transaction rejected by issuing bank.',
      rawStatus: status
    });

    const cleanMsg = error_Message || 'Payment was unsuccessful or declined by your bank.';
    const failUrl = `${baseSiteUrl}/?payment=failed&status=failed&txnid=${encodeURIComponent(txnid)}&orderId=${encodeURIComponent(udf3)}&msg=${encodeURIComponent(cleanMsg)}`;
    return buildRedirectResponse(failUrl, 'Payment Failed', cleanMsg);
  }

  // 5. Handle CANCELLED Status
  if (normalizedStatus === 'cancelled' || normalizedStatus === 'usercancelled') {
    await cancelPsPayment({
      txnid,
      reason: error_Message || 'User cancelled payment during checkout.'
    });

    const cancelUrl = `${baseSiteUrl}/?payment=cancelled&status=cancelled&txnid=${encodeURIComponent(txnid)}&orderId=${encodeURIComponent(udf3)}&msg=${encodeURIComponent('Payment was cancelled.')}`;
    return buildRedirectResponse(cancelUrl, 'Payment Cancelled', 'You cancelled the transaction.');
  }

  // 6. Handle PENDING / IN_PROGRESS Status
  await pendingPsPayment({
    txnid,
    mihpayid,
    reason: error_Message || 'Bank payment reconciliation pending.'
  });

  const pendingUrl = `${baseSiteUrl}/?payment=pending&status=pending&txnid=${encodeURIComponent(txnid)}&orderId=${encodeURIComponent(udf3)}&msg=${encodeURIComponent('Payment is currently pending verification from your bank.')}`;
  return buildRedirectResponse(pendingUrl, 'Payment Pending', 'Awaiting final clearance from your payment provider.');
};
