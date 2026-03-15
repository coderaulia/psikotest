import type { NextFunction, Request, Response } from 'express';

import { verifyAdminSessionToken } from '../lib/signed-token.js';
import { findActiveAdminById } from '../modules/auth/auth.repository.js';

function readBearerToken(request: Request) {
  const authorization = request.header('Authorization');

  if (!authorization || !authorization.startsWith('Bearer ')) {
    return null;
  }

  const token = authorization.slice('Bearer '.length).trim();
  return token.length > 0 ? token : null;
}

export async function requireAdminAuth(request: Request, response: Response, next: NextFunction) {
  try {
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

    const activeAdmin = await findActiveAdminById(adminSession.adminId);

    if (
      !activeAdmin
      || activeAdmin.session_version !== adminSession.sessionVersion
      || activeAdmin.role !== adminSession.role
      || activeAdmin.email !== adminSession.email
    ) {
      return response.status(401).json({
        error: 'Admin session is no longer active',
      });
    }

    request.adminSession = {
      ...adminSession,
      email: activeAdmin.email,
      role: activeAdmin.role,
      sessionVersion: activeAdmin.session_version,
    };
    return next();
  } catch (error) {
    return next(error);
  }
}
