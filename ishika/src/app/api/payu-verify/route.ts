import { NextRequest } from 'next/server';
import { runNetlifyHandler } from '@/lib/legacy/bridge';

const payuVerifyModule = require('@/lib/legacy/payu-verify');

export async function GET(req: NextRequest) {
  return runNetlifyHandler(payuVerifyModule.handler, req);
}

export async function POST(req: NextRequest) {
  return runNetlifyHandler(payuVerifyModule.handler, req);
}

export async function OPTIONS(req: NextRequest) {
  return runNetlifyHandler(payuVerifyModule.handler, req);
}
