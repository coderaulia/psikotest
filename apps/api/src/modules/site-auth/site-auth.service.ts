import { HttpError } from '../../lib/http-error.js';
import { hashPassword, verifyPassword } from '../../lib/password.js';
import { createCustomerSessionToken } from '../../lib/signed-token.js';
import {
  createCustomerAccount,
  findCustomerByEmail,
  findCustomerById,
  markCustomerLogin,
  type CustomerAccountRecord,
} from './site-auth.repository.js';

export interface CustomerSessionResponse {
  token: string;
  account: {
    id: number;
    fullName: string;
    email: string;
    accountType: 'business' | 'researcher';
    organizationName: string;
  };
}

function mapAccount(record: CustomerAccountRecord) {
  return {
    id: record.id,
    fullName: record.full_name,
    email: record.email,
    accountType: record.account_type,
    organizationName: record.organization_name,
  };
}

function createSessionResponse(record: CustomerAccountRecord): CustomerSessionResponse {
  return {
    token: createCustomerSessionToken({
      accountId: record.id,
      email: record.email,
      accountType: record.account_type,
    }),
    account: mapAccount(record),
  };
}

export async function signupCustomer(input: {
  fullName: string;
  email: string;
  password: string;
  accountType: 'business' | 'researcher';
  organizationName: string;
}) {
  const existing = await findCustomerByEmail(input.email);

  if (existing) {
    throw new HttpError(409, 'An account with this email already exists');
  }

  const passwordHash = await hashPassword(input.password);
  const record = await createCustomerAccount({
    fullName: input.fullName,
    email: input.email,
    passwordHash,
    accountType: input.accountType,
    organizationName: input.organizationName,
  });

  if (!record) {
    throw new HttpError(500, 'Unable to create account');
  }

  return createSessionResponse(record);
}

export async function loginCustomer(email: string, password: string) {
  const record = await findCustomerByEmail(email);

  if (!record || record.status !== 'active') {
    return null;
  }

  const passwordIsValid = await verifyPassword(password, record.password_hash);

  if (!passwordIsValid) {
    return null;
  }

  try {
    await markCustomerLogin(record.id);
  } catch (error) {
    console.warn('[site-auth] Failed to update customer last_login_at', error);
  }

  return createSessionResponse(record);
}

export async function getCustomerSessionProfile(accountId: number) {
  const record = await findCustomerById(accountId);

  if (!record || record.status !== 'active') {
    return null;
  }

  return mapAccount(record);
}
