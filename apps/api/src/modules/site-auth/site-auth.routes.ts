import { Router } from 'express';
import { z } from 'zod';

import { asyncHandler } from '../../lib/async-handler.js';
import { HttpError } from '../../lib/http-error.js';
import { createRateLimit } from '../../middleware/rate-limit.js';
import { requireCustomerAuth } from '../../middleware/require-customer-auth.js';
import {
  acceptWorkspaceInvite,
  getCustomerSessionProfile,
  getWorkspaceInvitePreview,
  loginCustomer,
  logoutCustomer,
  signupCustomer,
} from './site-auth.service.js';

const accountTypeSchema = z.enum(['business', 'researcher']);

const signupSchema = z.object({
  fullName: z.string().min(3).max(150),
  email: z.string().email(),
  password: z.string().min(8).max(255),
  accountType: accountTypeSchema,
  organizationName: z.string().min(2).max(190),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(255),
});

const inviteParamsSchema = z.object({
  token: z.string().min(24).max(120),
});

const acceptInviteSchema = z.object({
  fullName: z.string().min(2).max(150),
  password: z.string().min(8).max(255),
});

const signupRateLimit = createRateLimit({
  keyPrefix: 'customer-signup',
  windowMs: 60 * 60 * 1000,
  maxRequests: 8,
  message: 'Too many signup attempts. Please try again later.',
});

const loginRateLimit = createRateLimit({
  keyPrefix: 'customer-login',
  windowMs: 10 * 60 * 1000,
  maxRequests: 12,
  message: 'Too many login attempts. Please try again later.',
});

const inviteAcceptRateLimit = createRateLimit({
  keyPrefix: 'customer-invite-accept',
  windowMs: 10 * 60 * 1000,
  maxRequests: 10,
  message: 'Too many invitation activation attempts. Please try again later.',
});

export const siteAuthRoutes = Router();

siteAuthRoutes.post(
  '/signup',
  signupRateLimit,
  asyncHandler(async (request, response) => {
    const payload = signupSchema.parse(request.body);
    const session = await signupCustomer(payload);
    response.status(201).json(session);
  }),
);

siteAuthRoutes.post(
  '/login',
  loginRateLimit,
  asyncHandler(async (request, response) => {
    const payload = loginSchema.parse(request.body);
    const session = await loginCustomer(payload.email, payload.password);

    if (!session) {
      throw new HttpError(401, 'Invalid email or password');
    }

    response.json(session);
  }),
);

siteAuthRoutes.get(
  '/team-invites/:token',
  asyncHandler(async (request, response) => {
    const { token } = inviteParamsSchema.parse(request.params);
    const payload = await getWorkspaceInvitePreview(token);

    if (!payload) {
      throw new HttpError(404, 'Workspace invitation not found');
    }

    response.json(payload);
  }),
);

siteAuthRoutes.post(
  '/team-invites/:token/accept',
  inviteAcceptRateLimit,
  asyncHandler(async (request, response) => {
    const { token } = inviteParamsSchema.parse(request.params);
    const payload = acceptInviteSchema.parse(request.body);
    const session = await acceptWorkspaceInvite({
      token,
      fullName: payload.fullName,
      password: payload.password,
    });

    response.status(201).json(session);
  }),
);

siteAuthRoutes.post(
  '/logout',
  requireCustomerAuth,
  asyncHandler(async (request, response) => {
    if (!request.customerSession) {
      throw new HttpError(401, 'Customer session is required');
    }

    await logoutCustomer(request.customerSession);
    response.status(204).send();
  }),
);

siteAuthRoutes.get(
  '/me',
  requireCustomerAuth,
  asyncHandler(async (request, response) => {
    if (!request.customerSession) {
      throw new HttpError(401, 'Customer session is required');
    }

    const profile = await getCustomerSessionProfile(request.customerSession);

    if (!profile) {
      throw new HttpError(401, 'Customer session is no longer active');
    }

    response.json({ account: profile });
  }),
);
