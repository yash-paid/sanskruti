import { NextRequest } from 'next/server';
import { runNetlifyHandler } from '@/lib/legacy/bridge';

const connectPayuModule = require('@/lib/legacy/connect-payu-initiate');

export async function POST(req: NextRequest) {
  return runNetlifyHandler(connectPayuModule.handler, req);
}

export async function OPTIONS(req: NextRequest) {
  return runNetlifyHandler(connectPayuModule.handler, req);
}
