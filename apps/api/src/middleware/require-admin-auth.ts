import type { NextFunction, Request, Response } from 'express';

export function requireAdminAuth(request: Request, response: Response, next: NextFunction) {
  const authorization = request.header('Authorization');

  if (!authorization) {
    return response.status(401).json({
      error: 'Missing Authorization header',
    });
  }

  return next();
}
