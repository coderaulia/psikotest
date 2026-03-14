import { Router } from 'express';
import type { Request } from 'express';
import { z } from 'zod';

import { asyncHandler } from '../../lib/async-handler.js';
import { createAuditEvent } from '../../lib/audit-log.js';
import { HttpError } from '../../lib/http-error.js';
import {
  getResultById,
  listResults,
  listReviewerQueue,
  updateResultReview,
} from './result.service.js';

const testTypeSchema = z.enum(['iq', 'disc', 'workload', 'custom']);
const reviewStatusSchema = z.enum(['scored_preliminary', 'in_review', 'reviewed', 'released']);

const querySchema = z.object({
  search: z.string().optional(),
  testType: testTypeSchema.optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  reviewStatus: reviewStatusSchema.optional(),
});

const reviewUpdateSchema = z.object({
  reviewStatus: reviewStatusSchema.optional(),
  professionalSummary: z.string().trim().max(5000).nullable().optional(),
  recommendation: z.string().trim().max(3000).nullable().optional(),
  limitations: z.string().trim().max(3000).nullable().optional(),
  reviewerNotes: z.string().trim().max(5000).nullable().optional(),
}).refine((value) => Object.keys(value).length > 0, {
  message: 'At least one review field must be provided',
});

function requireReviewerSession(request: Request) {
  if (!request.adminSession) {
    throw new HttpError(401, 'Admin session is required');
  }

  if (!['super_admin', 'psychologist_reviewer'].includes(request.adminSession.role)) {
    throw new HttpError(403, 'Reviewer access is required');
  }

  return request.adminSession;
}

export const resultRoutes = Router();

resultRoutes.get(
  '/',
  asyncHandler(async (request, response) => {
    const filters = querySchema.parse(request.query);
    response.json({ items: await listResults(filters) });
  }),
);

resultRoutes.get(
  '/reviewer-queue',
  asyncHandler(async (request, response) => {
    requireReviewerSession(request);
    response.json({ items: await listReviewerQueue() });
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
  '/:id/review',
  asyncHandler(async (request, response) => {
    const payload = reviewUpdateSchema.parse(request.body);
    const adminSession = requireReviewerSession(request);

    const result = await updateResultReview(
      Number(request.params.id),
      payload,
      adminSession.adminId,
    );

    if (!result) {
      throw new HttpError(404, 'Result not found');
    }

    await createAuditEvent({
      actorType: 'admin',
      actorAdminId: adminSession.adminId,
      entityType: 'result',
      entityId: result.id,
      action: payload.reviewStatus === 'released'
        ? 'result.released'
        : payload.reviewStatus === 'reviewed'
          ? 'result.reviewed'
          : payload.reviewStatus === 'in_review'
            ? 'result.review_started'
            : 'result.review_updated',
      metadata: {
        submissionId: result.submissionId,
        reviewStatus: result.reviewStatus,
      },
    });

    response.json(result);
  }),
);

resultRoutes.patch(
  '/:id/review-status',
  asyncHandler(async (request, response) => {
    const payload = z.object({ reviewStatus: reviewStatusSchema }).parse(request.body);
    const adminSession = requireReviewerSession(request);

    const result = await updateResultReview(
      Number(request.params.id),
      { reviewStatus: payload.reviewStatus },
      adminSession.adminId,
    );

    if (!result) {
      throw new HttpError(404, 'Result not found');
    }

    await createAuditEvent({
      actorType: 'admin',
      actorAdminId: adminSession.adminId,
      entityType: 'result',
      entityId: result.id,
      action: payload.reviewStatus === 'released'
        ? 'result.released'
        : payload.reviewStatus === 'reviewed'
          ? 'result.reviewed'
          : payload.reviewStatus === 'in_review'
            ? 'result.review_started'
            : 'result.reset_to_preliminary',
      metadata: {
        submissionId: result.submissionId,
        reviewStatus: result.reviewStatus,
      },
    });

    response.json(result);
  }),
);
