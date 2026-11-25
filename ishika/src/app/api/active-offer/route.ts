import { NextRequest } from 'next/server';
import { runNetlifyHandler } from '@/lib/legacy/bridge';

const activeOfferModule = require('@/lib/legacy/active-offer');

export async function GET(req: NextRequest) {
  return runNetlifyHandler(activeOfferModule.handler, req);
}

export async function OPTIONS(req: NextRequest) {
  return runNetlifyHandler(activeOfferModule.handler, req);
}
