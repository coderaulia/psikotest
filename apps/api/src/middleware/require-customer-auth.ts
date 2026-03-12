import type { NextFunction, Request, Response } from 'express';

import { verifyCustomerSessionToken } from '../lib/signed-token.js';

function readBearerToken(request: Request) {
  const authorization = request.header('Authorization');

  if (!authorization || !authorization.startsWith('Bearer ')) {
    return null;
  }

  const token = authorization.slice('Bearer '.length).trim();
  return token.length > 0 ? token : null;
}

export function requireCustomerAuth(request: Request, response: Response, next: NextFunction) {
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

  request.customerSession = customerSession;
  return next();
}
