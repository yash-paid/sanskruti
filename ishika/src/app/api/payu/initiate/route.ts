import { NextRequest, NextResponse } from 'next/server';
import { getPayUConfig, generateRequestHash } from '@/lib/payu';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      type = 'membership',
      planId = 'vip_pass',
      amount = 199,
      name = '',
      phone = '',
      email = '',
      productTitle = "ISHIKA'S WORLD Membership",
    } = body;

    // 1. Validate Customer Information
    const cleanName = String(name || '').trim();
    if (!cleanName || cleanName.length < 2) {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid full name (minimum 2 characters).' },
        { status: 400 }
      );
    }

    const cleanPhone = String(phone || '').replace(/[^0-9]/g, '');
    if (cleanPhone.length !== 10) {
      return NextResponse.json(
        { success: false, error: 'Please provide a valid 10-digit Indian mobile number.' },
        { status: 400 }
      );
    }

    const cleanEmail = String(email || '').trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!cleanEmail || !emailRegex.test(cleanEmail)) {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid email address.' },
        { status: 400 }
      );
    }

    const parsedAmount = Number(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid order amount.' },
        { status: 400 }
      );
    }

    // 2. PayU Configuration
    const config = getPayUConfig();
    if (!config.key || !config.salt) {
      return NextResponse.json(
        { success: false, error: 'PayU merchant key or salt is not configured.' },
        { status: 500 }
      );
    }

    // 3. Prepare Transaction Parameters
    const txnid = `ISHIKA_${Date.now()}_${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    const amountFormatted = parsedAmount.toFixed(2);
    const productinfo = String(productTitle).substring(0, 80).replace(/[^a-zA-Z0-9 _-]/g, '');
    const surl = `${config.siteUrl}/api/payu/response`;
    const furl = `${config.siteUrl}/api/payu/response`;

    const udf1 = String(type); // 'membership' or 'merch'
    const udf2 = String(planId); // plan id or internal order id
    const udf3 = cleanPhone;
    const udf4 = cleanName.substring(0, 30);
    const udf5 = 'ishika_world';

    // 4. Generate SHA-512 Request Hash
    const hash = generateRequestHash({
      key: config.key,
      txnid,
      amount: amountFormatted,
      productinfo,
      firstname: cleanName,
      email: cleanEmail,
      udf1,
      udf2,
      udf3,
      udf4,
      udf5,
      salt: config.salt,
    });

    return NextResponse.json({
      success: true,
      mode: config.mode,
      isLive: config.isLive,
      actionUrl: config.paymentUrl,
      params: {
        key: config.key,
        txnid,
        amount: amountFormatted,
        productinfo,
        firstname: cleanName,
        email: cleanEmail,
        phone: cleanPhone,
        surl,
        furl,
        hash,
        udf1,
        udf2,
        udf3,
        udf4,
        udf5,
      },
      orderSummary: {
        txnid,
        amount: parsedAmount,
        type,
        productTitle,
      },
    });
  } catch (error: any) {
    console.error('[PAYU INITIATE ERROR]', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to initiate PayU payment.' },
      { status: 500 }
    );
  }
}
