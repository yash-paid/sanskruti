/**
 * Netlify Function: GET/POST /api/ps-verify
 * Cryptographic Order & Ticket Verification Endpoint
 */

const { getOrderById, checkRateLimit, sanitizeString } = require('./_ps-db');

exports.handler = async (event, context) => {
  // CORS Preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
      },
      body: ''
    };
  }

  try {
    const clientIp = event.headers['x-forwarded-for'] || event.headers['client-ip'] || '127.0.0.1';
    const rateCheck = checkRateLimit(clientIp, 40, 60000);
    if (!rateCheck.allowed) {
      return {
        statusCode: 429,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ success: false, error: 'Rate limit exceeded.' })
      };
    }

    let queryKey = '';
    let token = '';
    if (event.httpMethod === 'GET') {
      queryKey = (event.queryStringParameters && (event.queryStringParameters.orderId || event.queryStringParameters.txnid)) || '';
      token = (event.queryStringParameters && event.queryStringParameters.token) || '';
    } else if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}');
      queryKey = body.orderId || body.txnid || '';
      token = body.token || '';
    } else {
      return {
        statusCode: 405,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ success: false, error: 'Method Not Allowed' })
      };
    }

    const cleanQuery = sanitizeString(queryKey, 50);
    if (!cleanQuery) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ success: false, error: 'Missing orderId or txnid parameter.' })
      };
    }

    const order = await getOrderById(cleanQuery);
    if (!order) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ success: false, error: 'Order not found in persistent database.' })
      };
    }

    const isConfirmed = (order.status === 'CONFIRMED' || order.status === 'VERIFIED');
    const isTokenValid = Boolean(token && order.token && order.token === token);

    // Mask sensitive phone and email for public verification response
    const maskedPhone = order.customer.phone
      ? `${order.customer.phone.slice(0, 2)}******${order.customer.phone.slice(-2)}`
      : '***';
    const maskedEmail = order.customer.email
      ? `${order.customer.email.slice(0, 2)}***@${order.customer.email.split('@')[1] || '***'}`
      : '***';

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'X-Content-Type-Options': 'nosniff'
      },
      body: JSON.stringify({
        success: true,
        orderId: order.orderId,
        txnid: order.txnid || null,
        eventId: order.eventId,
        eventTitle: order.eventTitle,
        unitPrice: order.unitPrice,
        quantity: order.quantity,
        totalAmount: order.totalAmount,
        status: order.status,
        isConfirmed,
        isTokenValid,
        createdAt: order.createdAt,
        paymentConfirmedAt: order.paymentConfirmedAt || null,
        isTamperFree: order.isTamperFree,
        customerMasked: {
          name: order.customer.name,
          phone: maskedPhone,
          email: maskedEmail
        },
        ticketsCount: (order.tickets || []).length,
        ticketIds: order.tickets
      })
    };
  } catch (err) {
    console.error('[PS-VERIFY ERROR]', err.message);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ success: false, error: 'Internal verification error.' })
    };
  }
};
