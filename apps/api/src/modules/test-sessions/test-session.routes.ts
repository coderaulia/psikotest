import { Router } from 'express';
import { z } from 'zod';

import { asyncHandler } from '../../lib/async-handler.js';
import { createAuditEvent } from '../../lib/audit-log.js';
import { HttpError } from '../../lib/http-error.js';
import {
  createTestSession,
  getTestSessionById,
  listTestSessions,
  updateTestSession,
} from './test-session.service.js';

const querySchema = z.object({
  search: z.string().optional(),
  testType: z.enum(['iq', 'disc', 'workload']).optional(),
  status: z.enum(['draft', 'active', 'completed', 'archived']).optional(),
});

const settingsSchema = z.object({
  assessmentPurpose: z.enum(['recruitment', 'employee_development', 'academic_evaluation', 'research', 'self_assessment']),
  administrationMode: z.enum(['supervised', 'remote_unsupervised']),
  interpretationMode: z.enum(['self_assessment', 'professional_review']),
  consentStatement: z.string().min(20).max(2000),
  privacyStatement: z.string().min(20).max(2000),
  contactPerson: z.string().min(3).max(255),
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
  settings: settingsSchema,
});

const updateSessionSchema = z.object({
  title: z.string().min(3),
  description: z.string().max(2000).optional(),
  instructions: z.string().max(4000).optional(),
  startsAt: z.string().datetime().optional().nullable(),
  endsAt: z.string().datetime().optional().nullable(),
  timeLimitMinutes: z.coerce.number().int().positive().max(180).optional(),
  status: z.enum(['draft', 'active', 'completed', 'archived']),
  settings: settingsSchema,
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

    await createAuditEvent({
      actorType: 'admin',
      actorAdminId: request.adminSession.adminId,
      entityType: 'test_session',
      entityId: session?.id ?? null,
      action: 'test_session.created',
      metadata: {
        testType: payload.testType,
        status: payload.status,
        assessmentPurpose: payload.settings.assessmentPurpose,
      },
    });

    response.status(201).json(session);
  }),
);

testSessionRoutes.patch(
  '/:id',
  asyncHandler(async (request, response) => {
    const payload = updateSessionSchema.parse(request.body);

    if (!request.adminSession) {
      throw new HttpError(401, 'Admin session is required');
    }

    const session = await updateTestSession(Number(request.params.id), payload);

    if (!session) {
      throw new HttpError(404, 'Test session not found');
    }

    await createAuditEvent({
      actorType: 'admin',
      actorAdminId: request.adminSession.adminId,
      entityType: 'test_session',
      entityId: session.id,
      action: 'test_session.updated',
      metadata: {
        status: payload.status,
        interpretationMode: payload.settings.interpretationMode,
      },
    });

    response.json(session);
  }),
);
