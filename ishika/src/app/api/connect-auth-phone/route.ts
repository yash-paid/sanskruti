import { NextRequest } from 'next/server';
import { runNetlifyHandler } from '@/lib/legacy/bridge';

const authPhoneModule = require('@/lib/legacy/connect-auth-phone');

export async function POST(req: NextRequest) {
  return runNetlifyHandler(authPhoneModule.handler, req);
}

export async function OPTIONS(req: NextRequest) {
  return runNetlifyHandler(authPhoneModule.handler, req);
}
