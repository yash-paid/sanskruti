import { NextRequest } from 'next/server';
import { runNetlifyHandler } from '@/lib/legacy/bridge';

const payuResponseModule = require('@/lib/legacy/payu-response');

export async function POST(req: NextRequest) {
  return runNetlifyHandler(payuResponseModule.handler, req);
}

export async function GET(req: NextRequest) {
  return runNetlifyHandler(payuResponseModule.handler, req);
}
