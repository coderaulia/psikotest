import { createHmac, timingSafeEqual } from 'node:crypto';

import { env } from '../config/env.js';

interface SignedTokenPayloadBase {
  type: 'admin' | 'customer' | 'submission';
  exp: number;
}

export interface AdminSessionClaims extends SignedTokenPayloadBase {
  type: 'admin';
  adminId: number;
  email: string;
  role: 'super_admin' | 'admin' | 'psychologist_reviewer';
}

export interface SubmissionAccessClaims extends SignedTokenPayloadBase {
  type: 'submission';
  submissionId: number;
  participantId: number;
}

export interface CustomerSessionClaims extends SignedTokenPayloadBase {
  type: 'customer';
  accountId: number;
  email: string;
  accountType: 'business' | 'researcher';
}

function encodePayload<T extends SignedTokenPayloadBase>(payload: T) {
  return Buffer.from(JSON.stringify(payload)).toString('base64url');
}

function decodePayload(encodedPayload: string) {
  return JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8')) as SignedTokenPayloadBase;
}

function createSignature(encodedPayload: string) {
  return createHmac('sha256', env.JWT_SECRET).update(encodedPayload).digest('base64url');
}

function signToken<T extends SignedTokenPayloadBase>(payload: T) {
  const encodedPayload = encodePayload(payload);
  const signature = createSignature(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

function verifyToken(token: string) {
  const [encodedPayload, providedSignature] = token.split('.');

  if (!encodedPayload || !providedSignature) {
    return null;
  }

  const expectedSignature = createSignature(encodedPayload);
  const providedBuffer = Buffer.from(providedSignature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (providedBuffer.length !== expectedBuffer.length) {
    return null;
  }

  if (!timingSafeEqual(providedBuffer, expectedBuffer)) {
    return null;
  }

  try {
    const payload = decodePayload(encodedPayload);

    if (payload.exp <= Math.floor(Date.now() / 1000)) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export function createAdminSessionToken(input: {
  adminId: number;
  email: string;
  role: 'super_admin' | 'admin' | 'psychologist_reviewer';
}) {
  return signToken<AdminSessionClaims>({
    type: 'admin',
    adminId: input.adminId,
    email: input.email,
    role: input.role,
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 12,
  });
}

export function verifyAdminSessionToken(token: string) {
  const payload = verifyToken(token);

  if (!payload || payload.type !== 'admin') {
    return null;
  }

  return payload as AdminSessionClaims;
}

export function createCustomerSessionToken(input: {
  accountId: number;
  email: string;
  accountType: 'business' | 'researcher';
}) {
  return signToken<CustomerSessionClaims>({
    type: 'customer',
    accountId: input.accountId,
    email: input.email,
    accountType: input.accountType,
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7,
  });
}

export function verifyCustomerSessionToken(token: string) {
  const payload = verifyToken(token);

  if (!payload || payload.type !== 'customer') {
    return null;
  }

  return payload as CustomerSessionClaims;
}

export function createSubmissionAccessToken(input: {
  submissionId: number;
  participantId: number;
}) {
  return signToken<SubmissionAccessClaims>({
    type: 'submission',
    submissionId: input.submissionId,
    participantId: input.participantId,
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24,
  });
}

export function verifySubmissionAccessToken(token: string) {
  const payload = verifyToken(token);

  if (!payload || payload.type !== 'submission') {
    return null;
  }

  return payload as SubmissionAccessClaims;
}

