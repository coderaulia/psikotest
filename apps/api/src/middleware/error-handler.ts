import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';

import { env } from '../config/env.js';
import { HttpError } from '../lib/http-error.js';

function formatErrorForLog(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
    };
  }

  return {
    message: 'Unknown error',
  };
}

export function errorHandler(
  error: unknown,
  _request: Request,
  response: Response,
  _next: NextFunction,
) {
  if (error instanceof HttpError) {
    return response.status(error.statusCode).json({
      error: error.message,
    });
  }

  if (error instanceof ZodError) {
    return response.status(400).json({
      error: error.issues[0]?.message ?? 'Invalid request payload',
      validationErrors: error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      })),
    });
  }

  if (env.NODE_ENV !== 'test') {
    console.error('[api] Unhandled error', formatErrorForLog(error));
  }

  return response.status(500).json({
    error: 'Internal server error',
  });
}
