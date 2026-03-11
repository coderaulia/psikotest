import type { NextFunction, Request, Response } from 'express';

import { verifyAdminSessionToken } from '../lib/signed-token.js';

function readBearerToken(request: Request) {
  const authorization = request.header('Authorization');

  if (!authorization || !authorization.startsWith('Bearer ')) {
    return null;
  }

  const token = authorization.slice('Bearer '.length).trim();
  return token.length > 0 ? token : null;
}

export function requireAdminAuth(request: Request, response: Response, next: NextFunction) {
  const token = readBearerToken(request);

  if (!token) {
    return response.status(401).json({
      error: 'Missing or invalid Authorization header',
    });
  }

  const adminSession = verifyAdminSessionToken(token);

  if (!adminSession) {
    return response.status(401).json({
      error: 'Invalid or expired admin session',
    });
  }

  request.adminSession = adminSession;
  return next();
}
