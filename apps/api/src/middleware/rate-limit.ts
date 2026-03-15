import type { NextFunction, Request, Response } from 'express';

interface RateLimitOptions {
  keyPrefix: string;
  windowMs: number;
  maxRequests: number;
  message: string;
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

function getRequestIp(request: Request) {
  const forwarded = request.header('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0]?.trim() ?? 'unknown';
  }

  return request.ip || request.socket.remoteAddress || 'unknown';
}

export function createRateLimit(options: RateLimitOptions) {
  return function rateLimitMiddleware(request: Request, response: Response, next: NextFunction) {
    const now = Date.now();
    const key = `${options.keyPrefix}:${getRequestIp(request)}`;
    const current = rateLimitStore.get(key);

    if (!current || current.resetAt <= now) {
      rateLimitStore.set(key, {
        count: 1,
        resetAt: now + options.windowMs,
      });
      return next();
    }

    if (current.count >= options.maxRequests) {
      const retryAfterSeconds = Math.max(1, Math.ceil((current.resetAt - now) / 1000));
      response.setHeader('Retry-After', String(retryAfterSeconds));
      return response.status(429).json({
        error: options.message,
      });
    }

    current.count += 1;
    rateLimitStore.set(key, current);
    return next();
  };
}
