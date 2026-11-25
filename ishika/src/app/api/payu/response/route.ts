import { NextRequest } from 'next/server';
import { getPayUConfig, verifyResponseHash } from '@/lib/payu';

export async function POST(req: NextRequest) {
  try {
    const config = getPayUConfig();

    // Parse form-data or urlencoded payload from PayU callback
    let bodyParams: Record<string, string> = {};
    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      formData.forEach((val, key) => {
        bodyParams[key] = String(val);
      });
    } else {
      const text = await req.text();
      const searchParams = new URLSearchParams(text);
      searchParams.forEach((val, key) => {
        bodyParams[key] = val;
      });
    }

    const status = (bodyParams.status || '').toLowerCase();
    const txnid = bodyParams.txnid || '';
    const amount = bodyParams.amount || '0.00';
    const productinfo = bodyParams.productinfo || '';
    const firstname = bodyParams.firstname || '';
    const email = bodyParams.email || '';
    const udf1 = bodyParams.udf1 || 'membership'; // 'membership' | 'merch'
    const udf2 = bodyParams.udf2 || '';
    const udf3 = bodyParams.udf3 || '';
    const udf4 = bodyParams.udf4 || '';
    const udf5 = bodyParams.udf5 || '';
    const receivedHash = bodyParams.hash || '';
    const additionalCharges = bodyParams.additionalCharges || '';
    const errorMessage = bodyParams.error_Message || bodyParams.unmappedstatus || '';

    // Verify reverse hash
    const isHashValid = verifyResponseHash({
      key: config.key,
      txnid,
      amount,
      productinfo,
      firstname,
      email,
      status,
      udf1,
      udf2,
      udf3,
      udf4,
      udf5,
      salt: config.salt,
      additionalCharges,
      receivedHash,
    });

    const isSuccessful = status === 'success' && isHashValid;

    let redirectUrl: string;
    if (isSuccessful) {
      if (udf1 === 'merch') {
        redirectUrl = `${config.siteUrl}/checkout?payment=success&txnid=${encodeURIComponent(txnid)}&amount=${encodeURIComponent(amount)}&orderId=${encodeURIComponent(udf2 || txnid)}`;
      } else {
        const purchasedTier = (udf2 === 'elite' || udf2 === 'elite_circle') ? 'Elite' : (udf2 === 'explorer' ? 'Explorer' : 'VIP');
        redirectUrl = `${config.siteUrl}/membership?payment=success&txnid=${encodeURIComponent(txnid)}&tier=${encodeURIComponent(purchasedTier)}&plan=${encodeURIComponent(udf2 || 'elite')}`;
      }
    } else {
      const failureReason = errorMessage || (!isHashValid ? 'Payment verification failed (Security Hash Mismatch).' : 'Transaction was declined or cancelled.');
      if (udf1 === 'merch') {
        redirectUrl = `${config.siteUrl}/checkout?payment=failed&txnid=${encodeURIComponent(txnid)}&reason=${encodeURIComponent(failureReason)}`;
      } else {
        redirectUrl = `${config.siteUrl}/membership?payment=failed&txnid=${encodeURIComponent(txnid)}&reason=${encodeURIComponent(failureReason)}`;
      }
    }

    // Return HTTP 303 Redirect along with HTML fallback
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${isSuccessful ? 'Payment Confirmed' : 'Payment Status'}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      background: #050507;
      color: #ffffff;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      text-align: center;
      padding: 1.5rem;
    }
    .card {
      background: #0d0d12;
      border: 1px solid ${isSuccessful ? 'rgba(74, 222, 128, 0.3)' : 'rgba(233, 30, 140, 0.3)'};
      padding: 2.5rem 2rem;
      border-radius: 18px;
      max-width: 440px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.8);
    }
    .spinner {
      width: 42px;
      height: 42px;
      border: 3px solid rgba(255, 255, 255, 0.1);
      border-top-color: #e91e8c;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 0 auto 1.5rem;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    h2 { margin: 0 0 10px 0; font-size: 20px; font-weight: 700; color: #fff; }
    p { color: #a1a1aa; font-size: 14px; line-height: 1.5; margin: 0 0 18px 0; }
    a { color: #f472b6; text-decoration: none; font-weight: 600; font-size: 13px; }
  </style>
  <script>
    setTimeout(function() {
      window.location.replace(${JSON.stringify(redirectUrl)});
    }, 500);
  </script>
</head>
<body>
  <div class="card">
    <div class="spinner"></div>
    <h2>${isSuccessful ? 'Payment Successful!' : 'Updating Payment Status...'}</h2>
    <p>${isSuccessful ? 'Redirecting you back to your exclusive benefits...' : 'Securely redirecting you back to Ishika’s World...'}</p>
    <a href="${redirectUrl}">Click here if not redirected automatically</a>
  </div>
</body>
</html>`;

    return new Response(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (error: any) {
    console.error('[PAYU RESPONSE ERROR]', error);
    const fallbackUrl = '/membership?payment=failed&reason=System%20processing%20error';
    return Response.redirect(fallbackUrl, 303);
  }
}
