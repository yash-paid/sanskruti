import { NextRequest } from 'next/server';
import { runNetlifyHandler } from '@/lib/legacy/bridge';

const connectUserModule = require('@/lib/legacy/connect-user');

export async function GET(req: NextRequest) {
  return runNetlifyHandler(connectUserModule.handler, req);
}

export async function POST(req: NextRequest) {
  return runNetlifyHandler(connectUserModule.handler, req);
}

export async function OPTIONS(req: NextRequest) {
  return runNetlifyHandler(connectUserModule.handler, req);
}
