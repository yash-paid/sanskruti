/**
 * Netlify Function: GET /api/ps-events
 * Authoritative Server-Side PlayStation Events Catalog & Live Stats
 */

const { getAllEvents, checkRateLimit } = require('./_ps-db');

exports.handler = async (event, context) => {
  // CORS Preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
        'Access-Control-Allow-Methods': 'GET, OPTIONS'
      },
      body: ''
    };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ success: false, error: 'Method Not Allowed' })
    };
  }

  try {
    const clientIp = event.headers['x-forwarded-for'] || event.headers['client-ip'] || '127.0.0.1';
    const rateCheck = checkRateLimit(clientIp, 60, 60000); // 60 requests per minute
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
          error: 'Rate limit exceeded. Please try again shortly.'
        })
      };
    }

    const data = await getAllEvents();

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Content-Type-Options': 'nosniff'
      },
      body: JSON.stringify(data)
    };
  } catch (err) {
    console.error('[PS-EVENTS ERROR]', err.message);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        success: false,
        error: 'Internal server error retrieving event configuration.'
      })
    };
  }
};
