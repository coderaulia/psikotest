import { Router } from 'express';
import { z } from 'zod';

import { asyncHandler } from '../../lib/async-handler.js';
import { HttpError } from '../../lib/http-error.js';
import { requireCustomerAuth } from '../../middleware/require-customer-auth.js';
import { getCustomerSessionProfile, loginCustomer, signupCustomer } from './site-auth.service.js';

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

export const siteAuthRoutes = Router();

siteAuthRoutes.post(
  '/signup',
  asyncHandler(async (request, response) => {
    const payload = signupSchema.parse(request.body);
    const session = await signupCustomer(payload);
    response.status(201).json(session);
  }),
);

siteAuthRoutes.post(
  '/login',
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
  '/me',
  requireCustomerAuth,
  asyncHandler(async (request, response) => {
    if (!request.customerSession) {
      throw new HttpError(401, 'Customer session is required');
    }

    const profile = await getCustomerSessionProfile(request.customerSession.accountId);

    if (!profile) {
      throw new HttpError(401, 'Customer session is no longer active');
    }

    response.json({ account: profile });
  }),
);
