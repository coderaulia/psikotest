import { Router } from 'express';

import { asyncHandler } from '../../lib/async-handler.js';
import { requireAdminAuth } from '../../middleware/require-admin-auth.js';
import { createRateLimit } from '../../middleware/rate-limit.js';
import { login, logout } from './auth.controller.js';

const loginRateLimit = createRateLimit({
  keyPrefix: 'admin-login',
  windowMs: 10 * 60 * 1000,
  maxRequests: 10,
  message: 'Too many admin login attempts. Please try again later.',
});

export const authRoutes = Router();

authRoutes.post('/login', loginRateLimit, asyncHandler(async (request, response) => login(request, response)));
authRoutes.post('/logout', requireAdminAuth, asyncHandler(async (request, response) => logout(request, response)));
