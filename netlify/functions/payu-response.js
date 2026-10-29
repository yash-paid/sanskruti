// Netlify Function: Handle PayU Callback (surl and furl)
const { getPayUConfig, verifyResponseHash, verifyPaymentWithPayUServer } = require('./_payu-config');
const { recordOrder, getOrder, isDuplicatePayment, generateDeliveryToken } = require('./_order-store');
const { BOOKS, BUNDLES, SERVICES } = require('./_catalog');

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
    productinfo = '',
    firstname = '',
    email = '',
    phone = '',
    hash = '',
    mihpayid = '',
    bank_ref_num = '',
    error_Message = '',
    additionalCharges = '',
    udf1 = '',
    udf2 = '',
    udf3 = '',
    udf4 = '',
    udf5 = ''
  } = params;

  let redirectUrl = `${config.siteUrl}/payment-status.html`;

  // If no txnid received
  if (!txnid) {
    const errorUrl = `${config.siteUrl}/payment-status.html?status=error&msg=${encodeURIComponent('No transaction ID received in gateway callback.')}`;
    return buildRedirectResponse(errorUrl);
  }

  // Pre-resolve order and product category so all branches (success, failure, cancellation) route accurately
  let existingOrder = getOrder(txnid) || {};
  let itemsPurchased = existingOrder.itemsPurchased;
  if (!itemsPurchased || itemsPurchased.length === 0) {
    itemsPurchased = reconstructItemsFromUdf(udf1);
  }
  const category = (itemsPurchased && itemsPurchased[0] && itemsPurchased[0].category) || existingOrder.productCategory || 'ebook';

  /**
   * Helper to construct category-specific status and return URLs
   */
  function getRedirectUrl({ targetCategory, status, txnid, token = '', amount = '', mihpayid = '', errorMsg = '' }) {
    if (targetCategory === 'service') {
      const base = `${config.siteUrl}/service/payment-status.html`;
      if (status === 'success') {
        return `${base}?status=success&txnid=${encodeURIComponent(txnid)}&token=${encodeURIComponent(token)}&amount=${encodeURIComponent(amount)}&mihpayid=${encodeURIComponent(mihpayid)}`;
      } else if (status === 'cancelled') {
        return `${base}?status=cancelled&txnid=${encodeURIComponent(txnid)}&msg=${encodeURIComponent(errorMsg)}`;
      } else if (status === 'failed') {
        return `${base}?status=failed&txnid=${encodeURIComponent(txnid)}&msg=${encodeURIComponent(errorMsg)}`;
      } else if (status === 'pending') {
        return `${base}?status=pending&txnid=${encodeURIComponent(txnid)}&amount=${encodeURIComponent(amount)}`;
      } else {
        return `${base}?status=${encodeURIComponent(status)}&txnid=${encodeURIComponent(txnid)}&msg=${encodeURIComponent(errorMsg)}`;
      }
    } else if (targetCategory === 'wavc') {
      const isIndexPhp = udf5 === 'index-php' || (udf1 && (udf1.includes('wavc-call-49') || udf1.includes('wavc-call-99')));
      const base = isIndexPhp ? `${config.siteUrl}/wa.vc/index.php.html` : `${config.siteUrl}/wa.vc/WA%20Meet.html`;
      if (status === 'success') {
        return `${base}?txnid=${encodeURIComponent(txnid)}&token=${encodeURIComponent(token)}&status=success`;
      } else {
        return `${base}?status=${encodeURIComponent(status)}&txnid=${encodeURIComponent(txnid)}&msg=${encodeURIComponent(errorMsg)}`;
      }
    } else if (targetCategory === 'meeting') {
      const base = `${config.siteUrl}/payment-status.html`;
      return `${base}?status=${encodeURIComponent(status)}&type=meeting&txnid=${encodeURIComponent(txnid)}&token=${encodeURIComponent(token)}&amount=${encodeURIComponent(amount)}&mihpayid=${encodeURIComponent(mihpayid)}&msg=${encodeURIComponent(errorMsg)}`;
    } else {
      // Default: eBook order (Preserves 100% backward compatibility)
      const base = `${config.siteUrl}/payment-status.html`;
      if (status === 'success') {
        return `${base}?status=success&txnid=${encodeURIComponent(txnid)}&token=${encodeURIComponent(token)}&amount=${encodeURIComponent(amount)}&mihpayid=${encodeURIComponent(mihpayid)}`;
      } else if (status === 'pending') {
        return `${base}?status=pending&txnid=${encodeURIComponent(txnid)}&amount=${encodeURIComponent(amount)}`;
      } else {
        return `${base}?status=${encodeURIComponent(status)}&txnid=${encodeURIComponent(txnid)}&msg=${encodeURIComponent(errorMsg)}`;
      }
    }
  }

  // 1. Verify reverse SHA-512 response hash
  const hashCheck = verifyResponseHash(params, config.salt);
  if (!hashCheck.isValid) {
    console.error('PAYU HASH TAMPERING DETECTED for txnid:', txnid, {
      received: hashCheck.receivedHash,
      calculated: hashCheck.calculatedHash
    });

    recordOrder(txnid, {
      txnid,
      status: 'tampered',
      tamperDetails: 'Reverse SHA-512 hash mismatch',
      rawStatus: status,
      productCategory: category
    });

    const tamperedUrl = getRedirectUrl({
      targetCategory: category,
      status: 'tampered',
      txnid,
      errorMsg: 'Security verification failed. Payment hash mismatch.'
    });
    return buildRedirectResponse(tamperedUrl);
  }

  // 2. Check duplicate payment protection
  if (isDuplicatePayment(txnid, mihpayid)) {
    console.log(`Duplicate payment notification for txnid: ${txnid}`);
    const existingOrder = getOrder(txnid) || {};
    const existingToken = generateDeliveryToken(existingOrder, config.signingSecret);
    const duplicateUrl = getRedirectUrl({
      targetCategory: category,
      status: 'success',
      txnid,
      token: existingToken,
      amount: existingOrder.amount || amount,
      mihpayid
    }) + '&duplicate=1';
    return buildRedirectResponse(duplicateUrl);
  }

  // 3. Process based on PayU status
  const normalizedStatus = String(status).toLowerCase();

  if (normalizedStatus === 'success') {
    // Attempt secondary Server-to-Server verification with PayU
    let serverVerificationPassed = true;
    try {
      const serverCheck = await verifyPaymentWithPayUServer({
        key: config.key,
        salt: config.salt,
        txnid,
        verifyServiceUrl: config.verifyServiceUrl
      });

      if (serverCheck.success && serverCheck.data && serverCheck.data.status === 1) {
        // Detailed transaction status from PayU postservice
        const txnDetails = serverCheck.data.transaction_details && serverCheck.data.transaction_details[txnid];
        if (txnDetails && txnDetails.status && txnDetails.status.toLowerCase() !== 'success') {
          serverVerificationPassed = false;
        }
      }
    } catch (e) {
      // In offline/mock mode or if PayU service is unreachable, proceed based on valid cryptographic reverse hash
      console.warn('PayU Server-to-Server status verification warning:', e.message);
    }

    if (!serverVerificationPassed) {
      recordOrder(txnid, {
        txnid,
        status: 'failed',
        failureReason: 'Server verification returned non-success status',
        productCategory: category
      });
      const failUrl = getRedirectUrl({
        targetCategory: category,
        status: 'failed',
        txnid,
        errorMsg: 'Payment confirmation failed verification.'
      });
      return buildRedirectResponse(failUrl);
    }

    // Update and record verified order
    const updatedOrder = recordOrder(txnid, {
      txnid,
      status: 'success',
      amount: amount || existingOrder.amount,
      mihpayid,
      bank_ref_num,
      customerName: firstname || existingOrder.customerName,
      customerEmail: email || existingOrder.customerEmail,
      customerPhone: phone || udf2 || existingOrder.customerPhone,
      productinfo,
      itemsPurchased,
      productCategory: category,
      fulfilled: true,
      paidAt: new Date().toISOString()
    });

    // Generate tamper-proof cryptographic delivery token
    const token = generateDeliveryToken(updatedOrder, config.signingSecret);

    // Route customer back to the category-specific verified experience
    redirectUrl = getRedirectUrl({
      targetCategory: category,
      status: 'success',
      txnid,
      token,
      amount,
      mihpayid
    });
    return buildRedirectResponse(redirectUrl);

  } else if (normalizedStatus === 'pending') {
    recordOrder(txnid, {
      txnid,
      status: 'pending',
      amount,
      mihpayid,
      customerName: firstname,
      customerEmail: email,
      customerPhone: phone,
      productCategory: category
    });

    redirectUrl = getRedirectUrl({
      targetCategory: category,
      status: 'pending',
      txnid,
      amount
    });
    return buildRedirectResponse(redirectUrl);

  } else {
    // Payment failure or cancellation
    const isCancelled = normalizedStatus === 'cancel' ||
                        normalizedStatus === 'cancelled' ||
                        String(params.unmappedstatus || '').toLowerCase().includes('cancel') ||
                        String(error_Message || '').toLowerCase().includes('cancel');

    const failureStatus = isCancelled ? 'cancelled' : 'failed';
    const errorMsg = error_Message || (isCancelled ? 'Payment was cancelled by user.' : 'Payment was declined or unsuccessful.');

    recordOrder(txnid, {
      txnid,
      status: failureStatus,
      amount,
      mihpayid,
      error_Message: errorMsg,
      productCategory: category
    });

    redirectUrl = getRedirectUrl({
      targetCategory: category,
      status: failureStatus,
      txnid,
      errorMsg
    });
    return buildRedirectResponse(redirectUrl);
  }
};

/**
 * Reconstruct purchased items from UDF1 when memory cache was cleared
 */
function reconstructItemsFromUdf(udf1) {
  if (!udf1) return [];
  const [type, id] = udf1.split(':');
  if (type === 'single' && BOOKS[id]) {
    return [{ id, title: BOOKS[id].title, price: BOOKS[id].price, category: 'ebook' }];
  } else if (type === 'bundle' && BUNDLES[id]) {
    return BUNDLES[id].bookIds.map(bId => ({
      id: bId,
      title: BOOKS[bId] ? BOOKS[bId].title : bId,
      price: BOOKS[bId] ? BOOKS[bId].price : 0,
      category: 'ebook'
    }));
  } else if ((type === 'service' || type === 'wavc' || type === 'meeting') && SERVICES[id]) {
    return [{
      id: SERVICES[id].id,
      title: SERVICES[id].title,
      price: SERVICES[id].price,
      category: SERVICES[id].category
    }];
  }
  return [];
}

/**
 * Returns HTTP 303 with HTML fallback for seamless browser redirection
 */
function buildRedirectResponse(targetUrl) {
  const isService = targetUrl.includes('/service/');
  const isWavc = targetUrl.includes('wa.vc');
  const heading = isService ? 'Finalizing Your Service Order...' : (isWavc ? 'Finalizing Your Video Call Order...' : 'Finalizing Your eBook Order...');
  const subtext = isService
    ? 'Please wait while we verify your transaction and prepare your service access.'
    : (isWavc
      ? 'Please wait while we verify your transaction and prepare your call session.'
      : 'Please wait while we verify your transaction and prepare your digital downloads.');

  const htmlBody = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="refresh" content="0;url=${targetUrl}">
  <title>Redirecting to Order Status...</title>
  <style>
    body {
      background: #030712;
      color: #e2e8f0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
      margin: 0;
      text-align: center;
    }
    .card {
      background: #0f172a;
      border: 1px solid rgba(255,255,255,0.1);
      padding: 2.5rem;
      border-radius: 16px;
      max-width: 420px;
    }
    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid rgba(255,255,255,0.1);
      border-top-color: #38bdf8;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 0 auto 1.5rem;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    a { color: #fbbf24; text-decoration: none; font-weight: 600; }
  </style>
</head>
<body>
  <div class="card">
    <div class="spinner"></div>
    <h3 style="margin-top:0;">${heading}</h3>
    <p style="color:#94a3b8;font-size:0.95rem;">${subtext}</p>
    <p style="font-size:0.85rem;"><a href="${targetUrl}">Click here if not redirected automatically</a></p>
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
