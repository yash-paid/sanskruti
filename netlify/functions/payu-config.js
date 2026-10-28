// Netlify Function: Public Safe PayU Environment Status (NO secrets)
const { getPayUConfig } = require('./_payu-config');

exports.handler = async (event, context) => {
  const config = getPayUConfig();

  // ONLY expose non-sensitive public configuration
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=60'
    },
    body: JSON.stringify({
      success: true,
      mode: config.mode,
      isLive: config.isLive,
      siteUrl: config.siteUrl
    })
  };
};
