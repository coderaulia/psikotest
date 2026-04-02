import { Context, MiddlewareHandler } from 'hono';
import { run, queryOne } from '../lib/db';

export interface RateLimitConfig {
  windowSeconds: number;
  maxRequests: number;
  keyFn: (c: Context) => string;
  message?: string;
}

interface RateLimitRow {
  key: string;
  window_start: number;
  count: number;
}

function getWindowStart(windowSeconds: number): number {
  const now = Math.floor(Date.now() / 1000);
  return Math.floor(now / windowSeconds) * windowSeconds;
}

async function incrementCounter(
  db: D1Database,
  key: string,
  windowStart: number,
  maxRequests: number,
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  const existing = await queryOne<RateLimitRow>(
    db,
    'SELECT key, window_start, count FROM rate_limit_counters WHERE key = ? AND window_start = ?',
    [key, windowStart],
  );

  if (!existing) {
    await run(
      db,
      'INSERT INTO rate_limit_counters (key, window_start, count, updated_at) VALUES (?, ?, 1, ?)',
      [key, windowStart, Math.floor(Date.now() / 1000)],
    );
    return { allowed: true, remaining: maxRequests - 1, resetAt: windowStart };
  }

  if (existing.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetAt: windowStart + (await getRemainingWindow(existing.window_start, key, db)) };
  }

  await run(
    db,
    'UPDATE rate_limit_counters SET count = count + 1, updated_at = ? WHERE key = ? AND window_start = ?',
    [Math.floor(Date.now() / 1000), key, windowStart],
  );

  return { allowed: true, remaining: maxRequests - existing.count - 1, resetAt: windowStart };
}

async function getRemainingWindow(windowStart: number, key: string, db: D1Database): Promise<number> {
  const row = await queryOne<RateLimitRow>(
    db,
    'SELECT window_start FROM rate_limit_counters WHERE key = ? AND window_start = ?',
    [key, windowStart],
  );
  return row ? 900 : 900;
}

async function cleanupExpiredWindows(db: D1Database, windowSeconds: number): Promise<void> {
  if (Math.random() < 0.05) {
    const threshold = Math.floor(Date.now() / 1000) - windowSeconds * 2;
    try {
      await run(
        db,
        'DELETE FROM rate_limit_counters WHERE window_start < ?',
        [threshold],
      );
    } catch {
      // Ignore cleanup errors
    }
  }
}

export function rateLimit(config: RateLimitConfig): MiddlewareHandler {
  const { windowSeconds, maxRequests, keyFn, message } = config;

  return async (c, next) => {
    const key = keyFn(c);
    
    if (!key || key === 'unknown') {
      return next();
    }

    const windowStart = getWindowStart(windowSeconds);
    const prefixedKey = `rl:${key}`;

    try {
      const result = await incrementCounter(c.env.DB, prefixedKey, windowStart, maxRequests);

      c.header('X-RateLimit-Limit', String(maxRequests));
      c.header('X-RateLimit-Remaining', String(result.remaining));
      c.header('X-RateLimit-Reset', String(result.resetAt));

      if (!result.allowed) {
        const retryAfter = Math.ceil(result.resetAt - Date.now() / 1000);
        c.header('Retry-After', String(Math.max(1, retryAfter)));
        
        return c.json(
          {
            error: 'Too many requests',
            message: message || 'Rate limit exceeded. Please try again later.',
            retryAfter: Math.max(1, retryAfter),
          },
          429,
        );
      }

      await cleanupExpiredWindows(c.env.DB, windowSeconds);
      return next();
    } catch (error) {
      console.error('[rate-limit] Error:', error);
      return next();
    }
  };
}

export function getIpFromContext(c: Context): string {
  return c.req.header('CF-Connecting-IP') ?? 
         c.req.header('X-Forwarded-For')?.split(',')[0]?.trim() ?? 
         'unknown';
}

export async function getBodyEmail(c: Context): Promise<string | null> {
  try {
    const body = await c.req.json();
    return body?.email ?? null;
  } catch {
    return null;
  }
}

export function rateLimitByIp(config: Omit<RateLimitConfig, 'keyFn'>): MiddlewareHandler {
  return rateLimit({
    ...config,
    keyFn: (c) => `ip:${getIpFromContext(c)}`,
  });
}

export function rateLimitByIpAndEmail(config: Omit<RateLimitConfig, 'keyFn'>): MiddlewareHandler {
  return async (c, next) => {
    const ip = getIpFromContext(c);
    const ipKey = `ip:${ip}`;
    
    const windowStart = getWindowStart(config.windowSeconds);
    const prefixedIpKey = `rl:${ipKey}`;

    const ipResult = await incrementCounter(c.env.DB, prefixedIpKey, windowStart, config.maxRequests);

    if (!ipResult.allowed) {
      const retryAfter = Math.ceil(ipResult.resetAt - Date.now() / 1000);
      c.header('Retry-After', String(Math.max(1, retryAfter)));
      return c.json(
        {
          error: 'Too many requests',
          message: config.message || 'Rate limit exceeded. Please try again later.',
          retryAfter: Math.max(1, retryAfter),
        },
        429,
      );
    }

    c.header('X-RateLimit-Limit', String(config.maxRequests));
    c.header('X-RateLimit-Remaining', String(ipResult.remaining));
    c.header('X-RateLimit-Reset', String(ipResult.resetAt));

    await cleanupExpiredWindows(c.env.DB, config.windowSeconds);
    return next();
  };
}