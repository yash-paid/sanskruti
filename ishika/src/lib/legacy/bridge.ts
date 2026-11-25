import { NextRequest, NextResponse } from 'next/server';

export async function runNetlifyHandler(handler: any, req: NextRequest) {
  try {
    const method = req.method;
    const url = new URL(req.url);

    const queryStringParameters: Record<string, string> = {};
    url.searchParams.forEach((val, key) => {
      queryStringParameters[key] = val;
    });

    let body = '';
    if (method !== 'GET' && method !== 'HEAD' && method !== 'OPTIONS') {
      try {
        body = await req.text();
      } catch {}
    }

    const headers: Record<string, string> = {};
    req.headers.forEach((val, key) => {
      headers[key] = val;
    });

    const event = {
      httpMethod: method,
      path: url.pathname,
      queryStringParameters,
      headers,
      body,
    };

    const res = await handler(event, {});
    const resHeaders = new Headers();
    if (res.headers) {
      Object.entries(res.headers).forEach(([k, v]: any) => {
        resHeaders.set(k, String(v));
      });
    }

    return new NextResponse(res.body || '', {
      status: res.statusCode || 200,
      headers: resHeaders,
    });
  } catch (error: any) {
    console.error('[NETLIFY BRIDGE ERROR]', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Bridge Error' },
      { status: 500 }
    );
  }
}
