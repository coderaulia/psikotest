import { Router } from 'express';
import { z } from 'zod';

import { asyncHandler } from '../../lib/async-handler.js';
import { HttpError } from '../../lib/http-error.js';
import { createCustomerAssessment, listCustomerAssessmentItems } from './site-onboarding.service.js';

const createAssessmentSchema = z.object({
  testType: z.enum(['iq', 'disc', 'workload', 'custom']),
  title: z.string().min(3).max(150),
  purpose: z.enum(['recruitment', 'employee_development', 'academic_evaluation', 'research', 'self_assessment']),
  organizationName: z.string().min(2).max(190),
  administrationMode: z.enum(['supervised', 'remote_unsupervised']).default('remote_unsupervised'),
  timeLimitMinutes: z.coerce.number().int().positive().max(180).nullable().optional(),
  participantLimit: z.coerce.number().int().positive().max(50000).nullable().optional(),
  resultVisibility: z.enum(['participant_summary', 'review_required']),
});

export const siteOnboardingRoutes = Router();

siteOnboardingRoutes.get(
  '/assessments',
  asyncHandler(async (request, response) => {
    if (!request.customerSession) {
      throw new HttpError(401, 'Customer session is required');
    }

    const items = await listCustomerAssessmentItems(request.customerSession.accountId);
    response.json({ items });
  }),
);

siteOnboardingRoutes.post(
  '/assessments',
  asyncHandler(async (request, response) => {
    if (!request.customerSession) {
      throw new HttpError(401, 'Customer session is required');
    }

    const payload = createAssessmentSchema.parse(request.body);
    const assessment = await createCustomerAssessment({
      customerAccountId: request.customerSession.accountId,
      testType: payload.testType,
      title: payload.title,
      organizationName: payload.organizationName,
      purpose: payload.purpose,
      administrationMode: payload.administrationMode,
      participantLimit: payload.participantLimit ?? null,
      timeLimitMinutes: payload.timeLimitMinutes ?? null,
      resultVisibility: payload.resultVisibility,
    });

    response.status(201).json(assessment);
  }),
);
