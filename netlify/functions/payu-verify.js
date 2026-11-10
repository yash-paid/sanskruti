// Netlify Function: Verify Order Status & Authenticate eBook Delivery
const { getPayUConfig } = require('./_payu-config');
const { verifyDeliveryToken, getOrder } = require('./_order-store');
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
  const { txnid, token } = query;

  if (!txnid) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: false, error: 'Missing transaction ID' })
    };
  }

  const config = getPayUConfig();

  // If token is provided, cryptographically verify it
  if (token) {
    const verification = verifyDeliveryToken(token, config.signingSecret);
    if (!verification.valid) {
      return {
        statusCode: 401,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: false,
          verified: false,
          error: verification.reason || 'Invalid or expired verification token'
        })
      };
    }

    const order = verification.order;
    const category = (order.itemsPurchased && order.itemsPurchased[0] && order.itemsPurchased[0].category) || order.productCategory || 'ebook';

    let itemsWithDownloads = [];
    if (category === 'ebook') {
      itemsWithDownloads = (order.itemsPurchased || []).map(item => ({
        id: item.id,
        title: item.title,
        price: item.price,
        category: 'ebook',
        downloadUrl: `/.netlify/functions/payu-download?txnid=${encodeURIComponent(order.txnid)}&token=${encodeURIComponent(token)}&bookId=${encodeURIComponent(item.id)}`
      }));
    } else {
      itemsWithDownloads = (order.itemsPurchased || []).map(item => ({
        id: item.id,
        title: item.title,
        price: item.price,
        category: item.category || category
      }));
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, max-age=0'
      },
      body: JSON.stringify({
        success: true,
        verified: true,
        order: {
          txnid: order.txnid,
          status: order.status,
          amount: order.amount,
          category,
          customerName: order.customerName,
          customerEmail: order.customerEmail,
          customerPhone: order.customerPhone,
          mihpayid: order.mihpayid,
          paidAt: order.paidAt,
          items: itemsWithDownloads
        }
      })
    };
  }

  // Lookup order by txnid for status checks (non-sensitive info only)
  const order = getOrder(txnid);
  if (!order) {
    return {
      statusCode: 404,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: false, error: 'Transaction not found' })
    };
  }

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store, max-age=0'
    },
    body: JSON.stringify({
      success: true,
      verified: order.status === 'success',
      order: {
        txnid: order.txnid,
        status: order.status,
        amount: order.amount,
        createdAt: order.createdAt,
        error_Message: order.error_Message || null
      }
    })
  };
};
