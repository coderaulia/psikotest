import type { NextFunction, Request, Response } from 'express';

import { verifyCustomerSessionToken } from '../lib/signed-token.js';
import { findActiveCustomerById } from '../modules/site-auth/site-auth.repository.js';

function readBearerToken(request: Request) {
  const authorization = request.header('Authorization');

  if (!authorization || !authorization.startsWith('Bearer ')) {
    return null;
  }

  const token = authorization.slice('Bearer '.length).trim();
  return token.length > 0 ? token : null;
}

export async function requireCustomerAuth(request: Request, response: Response, next: NextFunction) {
  try {
    const token = readBearerToken(request);

    if (!token) {
      return response.status(401).json({
        error: 'Missing or invalid Authorization header',
      });
    }

    const customerSession = verifyCustomerSessionToken(token);

    if (!customerSession) {
      return response.status(401).json({
        error: 'Invalid or expired customer session',
      });
    }

    const activeAccount = await findActiveCustomerById(customerSession.accountId);

    if (
      !activeAccount
      || activeAccount.session_version !== customerSession.sessionVersion
      || activeAccount.account_type !== customerSession.accountType
      || activeAccount.email !== customerSession.email
    ) {
      return response.status(401).json({
        error: 'Customer session is no longer active',
      });
    }

    request.customerSession = {
      ...customerSession,
      email: activeAccount.email,
      accountType: activeAccount.account_type,
      sessionVersion: activeAccount.session_version,
    };
    return next();
  } catch (error) {
    return next(error);
  }
}
