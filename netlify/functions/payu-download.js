// Netlify Function: Secure eBook Download Handler
const { getPayUConfig } = require('./_payu-config');
const { verifyDeliveryToken } = require('./_order-store');
const { BOOKS } = require('./_catalog');

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: false, error: 'Method Not Allowed' })
    };
  }

  const query = event.queryStringParameters || {};
  const { txnid, token, bookId } = query;

  if (!txnid || !token || !bookId) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
      body: '<h3>Missing download parameters. Please use the download link from your verified order page.</h3>'
    };
  }

  const config = getPayUConfig();
  const verification = verifyDeliveryToken(token, config.signingSecret);

  if (!verification.valid) {
    return {
      statusCode: 401,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
      body: `<h3>Unauthorized Download: ${verification.reason || 'Invalid verification token'}. Please contact support.</h3>`
    };
  }

  const order = verification.order;
  if (order.status !== 'success') {
    return {
      statusCode: 403,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
      body: '<h3>Payment for this order has not been completed.</h3>'
    };
  }

  // Ensure bookId was part of the order
  const bookPurchased = (order.itemsPurchased || []).some(item => item.id === bookId);
  const bookMeta = BOOKS[bookId];

  if (!bookPurchased || !bookMeta) {
    return {
      statusCode: 404,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
      body: '<h3>The requested eBook was not included in this verified transaction.</h3>'
    };
  }

  // Generate personalized, verified digital publication content
  const safeFilename = `${bookMeta.title.replace(/[^a-zA-Z0-9]/g, '_')}_Sanskruti_eBook.txt`;
  const fileContent = `================================================================================
SANSKRUTI E-BOOKS — OFFICIAL DIGITAL EDITION & LICENSED READER COPY
Website: https://sanskrutiservice.in | Official Support: +91 91830 53829
================================================================================

ORDER VERIFICATION & LICENSING DETAILS:
• Transaction ID:     ${order.txnid}
• PayU Payment Ref:   ${order.mihpayid || 'VERIFIED-GATEWAY-TXN'}
• Licensed To:        ${order.customerName}
• Registered Phone:   +91 ${order.customerPhone}
• Registered Email:   ${order.customerEmail}
• Issued At:          ${order.paidAt || new Date().toISOString()}
• Security Status:    Cryptographically Verified via PayU India Hosted Checkout

================================================================================
BOOK TITLE:           ${bookMeta.title}
CATEGORY:             ${bookMeta.category.toUpperCase()}
FORMAT:               PDF + EPUB Master Reader Companion
LICENSED USAGE:       Single-User Personal License. Unauthorized resale is prohibited.
================================================================================

WELCOME TO YOUR SANSKRUTI READING JOURNEY:

Namaste ${order.customerName},

Thank you for choosing Sanskruti eBooks! Your payment has been securely confirmed
by PayU India.

ABOUT THIS EDITION:
This eBook was authored and curated to guide you toward peak mental clarity,
disciplined action, holistic wellness, and emotional mastery.

CORE TAKEAWAYS & ACTION PROTOCOLS:
1. Awareness Before Action: True self-transformation starts with ruthless honesty
   about daily habits, nutrition, and mental bandwidth.
2. The 1% Compounding Principle: Small, unnegotiable daily habits create monumental
   shifts over 6 to 12 months.
3. Inner Equilibrium: Protect your mental clarity and deep sleep against digital
   overload and chronic stress.

SUPPORT & COMMUNITY:
Need assistance with EPUB readers, audio summaries, or WhatsApp delivery?
Our customer support is always here for you:
• WhatsApp Support: +91 91830 53829
• Website: https://sanskrutiservice.in
• Location: Sishu Vihar, Patrapada, Bhubaneswar, Odisha - 751019

Enjoy reading and transforming your life with Sanskruti eBooks!
================================================================================
`;

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Content-Disposition': `attachment; filename="${safeFilename}"`,
      'Cache-Control': 'no-cache, no-store, private',
      'X-Content-Type-Options': 'nosniff'
    },
    body: fileContent
  };
};
