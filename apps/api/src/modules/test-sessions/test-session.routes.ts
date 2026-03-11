import { Router } from 'express';
import { z } from 'zod';

import { asyncHandler } from '../../lib/async-handler.js';
import { HttpError } from '../../lib/http-error.js';
import {
  createTestSession,
  getTestSessionById,
  listTestSessions,
} from './test-session.service.js';

const querySchema = z.object({
  search: z.string().optional(),
  testType: z.enum(['iq', 'disc', 'workload']).optional(),
  status: z.enum(['draft', 'active', 'completed', 'archived']).optional(),
});

const createSessionSchema = z.object({
  title: z.string().min(3),
  testType: z.enum(['iq', 'disc', 'workload']),
  description: z.string().max(2000).optional(),
  instructions: z.string().max(4000).optional(),
  startsAt: z.string().datetime().optional().nullable(),
  endsAt: z.string().datetime().optional().nullable(),
  timeLimitMinutes: z.coerce.number().int().positive().max(180).optional(),
  status: z.enum(['draft', 'active']).default('active'),
});

export const testSessionRoutes = Router();

testSessionRoutes.get(
  '/',
  asyncHandler(async (request, response) => {
    const filters = querySchema.parse(request.query);
    response.json({ items: await listTestSessions(filters) });
  }),
);

testSessionRoutes.get(
  '/:id',
  asyncHandler(async (request, response) => {
    const session = await getTestSessionById(Number(request.params.id));

    if (!session) {
      throw new HttpError(404, 'Test session not found');
    }

    response.json(session);
  }),
);

testSessionRoutes.post(
  '/',
  asyncHandler(async (request, response) => {
    const payload = createSessionSchema.parse(request.body);

    if (!request.adminSession) {
      throw new HttpError(401, 'Admin session is required');
    }

    const session = await createTestSession({
      ...payload,
      createdByAdminId: request.adminSession.adminId,
    });

    response.status(201).json(session);
  }),
);
