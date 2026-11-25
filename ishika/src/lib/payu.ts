import crypto from 'crypto';

export interface PayUConfig {
  mode: 'TEST' | 'LIVE';
  isLive: boolean;
  key: string;
  salt: string;
  paymentUrl: string;
  siteUrl: string;
}

export function getPayUConfig(): PayUConfig {
  const rawMode = (process.env.PAYU_MODE || 'TEST').trim().toUpperCase();
  const isLive = rawMode === 'LIVE' || rawMode === 'PRODUCTION';
  const mode: 'TEST' | 'LIVE' = isLive ? 'LIVE' : 'TEST';

  const key = isLive
    ? (process.env.PAYU_LIVE_KEY || process.env.PAYU_KEY || '').trim()
    : (process.env.PAYU_TEST_KEY || process.env.PAYU_KEY || 'gtKFFx').trim();

  const salt = isLive
    ? (process.env.PAYU_LIVE_SALT || process.env.PAYU_SALT || '').trim()
    : (process.env.PAYU_TEST_SALT || process.env.PAYU_SALT || 'eCwWELxi').trim();

  const paymentUrl = isLive
    ? 'https://secure.payu.in/_payment'
    : 'https://test.payu.in/_payment';

  let siteUrl = (
    process.env.SITE_URL || 
    process.env.URL || 
    (process.env.NODE_ENV === 'production' ? 'https://sanskrutiservice.in' : 'http://localhost:3000')
  ).trim();

  if (siteUrl.endsWith('/')) {
    siteUrl = siteUrl.slice(0, -1);
  }

  return {
    mode,
    isLive,
    key,
    salt,
    paymentUrl,
    siteUrl,
  };
}

export interface GenerateHashParams {
  key: string;
  txnid: string;
  amount: string;
  productinfo: string;
  firstname: string;
  email: string;
  udf1?: string;
  udf2?: string;
  udf3?: string;
  udf4?: string;
  udf5?: string;
  salt: string;
}

export function generateRequestHash({
  key,
  txnid,
  amount,
  productinfo,
  firstname,
  email,
  udf1 = '',
  udf2 = '',
  udf3 = '',
  udf4 = '',
  udf5 = '',
  salt,
}: GenerateHashParams): string {
  const hashString = [
    key,
    txnid,
    amount,
    productinfo,
    firstname,
    email,
    udf1,
    udf2,
    udf3,
    udf4,
    udf5,
    '', // udf6
    '', // udf7
    '', // udf8
    '', // udf9
    '', // udf10
    salt,
  ].join('|');

  return crypto.createHash('sha512').update(hashString, 'utf-8').digest('hex');
}

export interface VerifyResponseHashParams {
  key: string;
  txnid: string;
  amount: string;
  productinfo: string;
  firstname: string;
  email: string;
  status: string;
  udf1?: string;
  udf2?: string;
  udf3?: string;
  udf4?: string;
  udf5?: string;
  salt: string;
  additionalCharges?: string;
  receivedHash: string;
}

export function verifyResponseHash({
  key,
  txnid,
  amount,
  productinfo,
  firstname,
  email,
  status,
  udf1 = '',
  udf2 = '',
  udf3 = '',
  udf4 = '',
  udf5 = '',
  salt,
  additionalCharges = '',
  receivedHash,
}: VerifyResponseHashParams): boolean {
  let hashString: string;

  if (additionalCharges && additionalCharges.trim()) {
    hashString = [
      additionalCharges,
      salt,
      status,
      '', // udf10
      '', // udf9
      '', // udf8
      '', // udf7
      '', // udf6
      udf5,
      udf4,
      udf3,
      udf2,
      udf1,
      email,
      firstname,
      productinfo,
      amount,
      txnid,
      key,
    ].join('|');
  } else {
    hashString = [
      salt,
      status,
      '', // udf10
      '', // udf9
      '', // udf8
      '', // udf7
      '', // udf6
      udf5,
      udf4,
      udf3,
      udf2,
      udf1,
      email,
      firstname,
      productinfo,
      amount,
      txnid,
      key,
    ].join('|');
  }

  const computedHash = crypto.createHash('sha512').update(hashString, 'utf-8').digest('hex');
  return computedHash.toLowerCase() === (receivedHash || '').toLowerCase();
}
