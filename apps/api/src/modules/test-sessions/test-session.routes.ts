import { Router } from 'express';
import { z } from 'zod';

import { HttpError } from '../../lib/http-error.js';
import {
  createTestSession,
  getTestSessionById,
  listTestSessions,
} from './test-session.service.js';

const createSessionSchema = z.object({
  title: z.string().min(3),
  testType: z.enum(['iq', 'disc', 'workload']),
  startsAt: z.string().optional(),
});

export const testSessionRoutes = Router();

testSessionRoutes.get('/', (_request, response) => {
  response.json({ items: listTestSessions() });
});

testSessionRoutes.get('/:id', (request, response) => {
  const session = getTestSessionById(Number(request.params.id));

  if (!session) {
    throw new HttpError(404, 'Test session not found');
  }

  response.json(session);
});

testSessionRoutes.post('/', (request, response) => {
  const payload = createSessionSchema.parse(request.body);
  const session = createTestSession(payload);

  response.status(201).json(session);
});
