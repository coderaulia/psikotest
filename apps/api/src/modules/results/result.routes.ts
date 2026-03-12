import { Router } from 'express';
import { z } from 'zod';

import { asyncHandler } from '../../lib/async-handler.js';
import { createAuditEvent } from '../../lib/audit-log.js';
import { HttpError } from '../../lib/http-error.js';
import {
  getResultById,
  listResults,
  updateResultReviewStatus,
} from './result.service.js';

const testTypeSchema = z.enum(['iq', 'disc', 'workload', 'custom']);

const querySchema = z.object({
  search: z.string().optional(),
  testType: testTypeSchema.optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

const reviewStatusSchema = z.object({
  reviewStatus: z.enum(['preliminary', 'reviewed']),
});

export const resultRoutes = Router();

resultRoutes.get(
  '/',
  asyncHandler(async (request, response) => {
    const filters = querySchema.parse(request.query);
    response.json({ items: await listResults(filters) });
  }),
);

resultRoutes.get(
  '/:id',
  asyncHandler(async (request, response) => {
    const result = await getResultById(Number(request.params.id));

    if (!result) {
      throw new HttpError(404, 'Result not found');
    }

    response.json(result);
  }),
);

resultRoutes.patch(
  '/:id/review-status',
  asyncHandler(async (request, response) => {
    const payload = reviewStatusSchema.parse(request.body);

    if (!request.adminSession) {
      throw new HttpError(401, 'Admin session is required');
    }

    const result = await updateResultReviewStatus(
      Number(request.params.id),
      payload.reviewStatus,
      request.adminSession.adminId,
    );

    if (!result) {
      throw new HttpError(404, 'Result not found');
    }

    await createAuditEvent({
      actorType: 'admin',
      actorAdminId: request.adminSession.adminId,
      entityType: 'result',
      entityId: result.id,
      action: payload.reviewStatus === 'reviewed' ? 'result.reviewed' : 'result.reset_to_preliminary',
      metadata: { submissionId: result.submissionId },
    });

    response.json(result);
  }),
);
