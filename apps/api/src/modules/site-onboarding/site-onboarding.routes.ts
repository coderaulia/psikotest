import { Router } from 'express';
import { z } from 'zod';

import { asyncHandler } from '../../lib/async-handler.js';
import { HttpError } from '../../lib/http-error.js';
import {
  activateCustomerAssessment,
  addCustomerAssessmentParticipant,
  completeCustomerAssessmentCheckout,
  createCustomerAssessment,
  importCustomerAssessmentParticipants,
  getCustomerAssessmentDetail,
  listCustomerAssessmentItems,
  listCustomerAssessmentParticipants,
  sendCustomerAssessmentBulkInvites,
  sendCustomerAssessmentParticipantInvite,
  updateCustomerAssessment,
} from './site-onboarding.service.js';

const assessmentSchema = z.object({
  testType: z.enum(['iq', 'disc', 'workload', 'custom']),
  title: z.string().min(3).max(150),
  purpose: z.enum(['recruitment', 'employee_development', 'academic_evaluation', 'research', 'self_assessment']),
  organizationName: z.string().min(2).max(190),
  administrationMode: z.enum(['supervised', 'remote_unsupervised']).default('remote_unsupervised'),
  timeLimitMinutes: z.coerce.number().int().positive().max(180).nullable().optional(),
  participantLimit: z.coerce.number().int().positive().max(50000).nullable().optional(),
  resultVisibility: z.enum(['participant_summary', 'review_required']),
  protectedDeliveryMode: z.boolean().optional().default(false),
});

const checkoutSchema = z.object({
  selectedPlan: z.enum(['starter', 'growth', 'research']),
  billingCycle: z.enum(['monthly', 'annual']).default('monthly'),
});

const participantCreateSchema = z.object({
  fullName: z.string().min(2).max(150),
  email: z.string().email(),
  employeeCode: z.string().max(100).nullable().optional(),
  department: z.string().max(120).nullable().optional(),
  positionTitle: z.string().max(120).nullable().optional(),
  note: z.string().max(255).nullable().optional(),
});

const participantSendSchema = z.object({
  channel: z.enum(['email', 'link']).default('email'),
});

const participantImportSchema = z.object({
  rows: z.array(participantCreateSchema).min(1).max(250),
});

const participantBulkSendSchema = z.object({
  channel: z.enum(['email', 'link']).default('email'),
});

const assessmentParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

const participantParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
  participantId: z.coerce.number().int().positive(),
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

siteOnboardingRoutes.get(
  '/assessments/:id',
  asyncHandler(async (request, response) => {
    if (!request.customerSession) {
      throw new HttpError(401, 'Customer session is required');
    }

    const { id } = assessmentParamsSchema.parse(request.params);
    const detail = await getCustomerAssessmentDetail(request.customerSession.accountId, id);

    if (!detail) {
      throw new HttpError(404, 'Assessment draft not found');
    }

    response.json(detail);
  }),
);

siteOnboardingRoutes.post(
  '/assessments',
  asyncHandler(async (request, response) => {
    if (!request.customerSession) {
      throw new HttpError(401, 'Customer session is required');
    }

    const payload = assessmentSchema.parse(request.body);
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
      protectedDeliveryMode: payload.protectedDeliveryMode,
    });

    response.status(201).json(assessment);
  }),
);

siteOnboardingRoutes.patch(
  '/assessments/:id',
  asyncHandler(async (request, response) => {
    if (!request.customerSession) {
      throw new HttpError(401, 'Customer session is required');
    }

    const { id } = assessmentParamsSchema.parse(request.params);
    const payload = assessmentSchema.parse(request.body);
    const assessment = await updateCustomerAssessment({
      customerAccountId: request.customerSession.accountId,
      assessmentId: id,
      testType: payload.testType,
      title: payload.title,
      organizationName: payload.organizationName,
      purpose: payload.purpose,
      administrationMode: payload.administrationMode,
      participantLimit: payload.participantLimit ?? null,
      timeLimitMinutes: payload.timeLimitMinutes ?? null,
      resultVisibility: payload.resultVisibility,
      protectedDeliveryMode: payload.protectedDeliveryMode,
    });

    response.json(assessment);
  }),
);

siteOnboardingRoutes.post(
  '/assessments/:id/activate',
  asyncHandler(async (request, response) => {
    if (!request.customerSession) {
      throw new HttpError(401, 'Customer session is required');
    }

    const { id } = assessmentParamsSchema.parse(request.params);
    const assessment = await activateCustomerAssessment(request.customerSession.accountId, id);
    response.json(assessment);
  }),
);

siteOnboardingRoutes.post(
  '/assessments/:id/checkout',
  asyncHandler(async (request, response) => {
    if (!request.customerSession) {
      throw new HttpError(401, 'Customer session is required');
    }

    const { id } = assessmentParamsSchema.parse(request.params);
    const payload = checkoutSchema.parse(request.body ?? {});
    const assessment = await completeCustomerAssessmentCheckout({
      customerAccountId: request.customerSession.accountId,
      assessmentId: id,
      plan: payload.selectedPlan,
      billingCycle: payload.billingCycle,
    });

    response.json(assessment);
  }),
);

siteOnboardingRoutes.get(
  '/assessments/:id/participants',
  asyncHandler(async (request, response) => {
    if (!request.customerSession) {
      throw new HttpError(401, 'Customer session is required');
    }

    const { id } = assessmentParamsSchema.parse(request.params);
    const participants = await listCustomerAssessmentParticipants(request.customerSession.accountId, id);
    response.json(participants);
  }),
);

siteOnboardingRoutes.post(
  '/assessments/:id/participants',
  asyncHandler(async (request, response) => {
    if (!request.customerSession) {
      throw new HttpError(401, 'Customer session is required');
    }

    const { id } = assessmentParamsSchema.parse(request.params);
    const payload = participantCreateSchema.parse(request.body);
    const participant = await addCustomerAssessmentParticipant({
      customerAccountId: request.customerSession.accountId,
      assessmentId: id,
      fullName: payload.fullName,
      email: payload.email,
      employeeCode: payload.employeeCode ?? null,
      department: payload.department ?? null,
      positionTitle: payload.positionTitle ?? null,
      note: payload.note ?? null,
    });

    response.status(201).json(participant);
  }),
);

siteOnboardingRoutes.post(
  '/assessments/:id/participants/import',
  asyncHandler(async (request, response) => {
    if (!request.customerSession) {
      throw new HttpError(401, 'Customer session is required');
    }

    const { id } = assessmentParamsSchema.parse(request.params);
    const payload = participantImportSchema.parse(request.body ?? {});
    const summary = await importCustomerAssessmentParticipants({
      customerAccountId: request.customerSession.accountId,
      assessmentId: id,
      rows: payload.rows.map((row) => ({
        fullName: row.fullName,
        email: row.email,
        employeeCode: row.employeeCode ?? null,
        department: row.department ?? null,
        positionTitle: row.positionTitle ?? null,
        note: row.note ?? null,
      })),
    });

    response.status(201).json(summary);
  }),
);

siteOnboardingRoutes.post(
  '/assessments/:id/participants/send-bulk',
  asyncHandler(async (request, response) => {
    if (!request.customerSession) {
      throw new HttpError(401, 'Customer session is required');
    }

    const { id } = assessmentParamsSchema.parse(request.params);
    const payload = participantBulkSendSchema.parse(request.body ?? {});
    const delivery = await sendCustomerAssessmentBulkInvites({
      customerAccountId: request.customerSession.accountId,
      assessmentId: id,
      channel: payload.channel,
    });

    response.json(delivery);
  }),
);

siteOnboardingRoutes.post(
  '/assessments/:id/participants/:participantId/send',
  asyncHandler(async (request, response) => {
    if (!request.customerSession) {
      throw new HttpError(401, 'Customer session is required');
    }

    const { id, participantId } = participantParamsSchema.parse(request.params);
    const payload = participantSendSchema.parse(request.body ?? {});
    const delivery = await sendCustomerAssessmentParticipantInvite({
      customerAccountId: request.customerSession.accountId,
      assessmentId: id,
      participantRecordId: participantId,
      channel: payload.channel,
    });

    response.json(delivery);
  }),
);
