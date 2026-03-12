import { Router } from 'express';
import { z } from 'zod';

import { asyncHandler } from '../../lib/async-handler.js';
import { listParticipants } from './participants.service.js';

const testTypeSchema = z.enum(['iq', 'disc', 'workload', 'custom']);

const querySchema = z.object({
  search: z.string().optional(),
  testType: testTypeSchema.optional(),
  status: z.enum(['not_started', 'in_progress', 'submitted', 'scored']).optional(),
});

export const participantRoutes = Router();

participantRoutes.get(
  '/',
  asyncHandler(async (request, response) => {
    const filters = querySchema.parse(request.query);
    response.json({ items: await listParticipants(filters) });
  }),
);
