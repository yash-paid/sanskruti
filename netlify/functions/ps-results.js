/**
 * Netlify Function: GET /api/ps-results
 * Official Auditable Results & Schedule Status (Strict Truth Enforcement)
 */

const { getAllEvents, checkRateLimit } = require('./_ps-db');

exports.handler = async (event, context) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
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
    const rateCheck = checkRateLimit(clientIp, 60, 60000);
    if (!rateCheck.allowed) {
      return {
        statusCode: 429,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ success: false, error: 'Rate limit exceeded.' })
      };
    }

    const { events, serverTime } = await getAllEvents();

    const resultsList = events.map(ev => ({
      eventId: ev.id,
      eventCode: ev.code,
      title: ev.title,
      category: ev.category,
      scheduledDrawTime: ev.schedule.nextResultTime,
      status: 'AWAITING_AUTHORIZED_EXECUTION',
      winnerDeclared: false,
      winners: [],
      auditNotice: 'Results are conducted exclusively under certified independent supervisory oversight. No unapproved random prize selection is automated.'
    }));

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-cache'
      },
      body: JSON.stringify({
        success: true,
        serverTime,
        results: resultsList,
        regulatoryDisclosure: 'In compliance with applicable consumer laws, prize draw execution requires independent auditor attestation.'
      })
    };
  } catch (err) {
    console.error('[PS-RESULTS ERROR]', err.message);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ success: false, error: 'Internal server error.' })
    };
  }
};
