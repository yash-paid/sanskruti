import { NextRequest } from 'next/server';
import { runNetlifyHandler } from '@/lib/legacy/bridge';

const payuInitiateModule = require('@/lib/legacy/payu-initiate');

export async function POST(req: NextRequest) {
  return runNetlifyHandler(payuInitiateModule.handler, req);
}

export async function OPTIONS(req: NextRequest) {
  return runNetlifyHandler(payuInitiateModule.handler, req);
}
