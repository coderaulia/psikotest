import { Router } from 'express';
import { z } from 'zod';

import { asyncHandler } from '../../lib/async-handler.js';
import { HttpError } from '../../lib/http-error.js';
import { getCustomerWorkspaceSettings, updateCustomerWorkspaceSettings } from './site-workspace.service.js';

const workspaceSettingsSchema = z.object({
  organizationName: z.string().min(2).max(190),
  brandName: z.string().min(2).max(190),
  brandTagline: z.string().min(3).max(240),
  supportEmail: z.string().email(),
  contactPerson: z.string().min(2).max(150),
  defaultAssessmentPurpose: z.enum(['recruitment', 'employee_development', 'academic_evaluation', 'research', 'self_assessment']),
  defaultAdministrationMode: z.enum(['supervised', 'remote_unsupervised']),
  defaultResultVisibility: z.enum(['participant_summary', 'review_required']),
  defaultParticipantLimit: z.coerce.number().int().positive().max(50000).nullable(),
  defaultTimeLimitMinutes: z.coerce.number().int().positive().max(180).nullable(),
  defaultConsentStatement: z.string().min(10).max(2000),
  defaultPrivacyStatement: z.string().min(10).max(2000),
});

export const siteWorkspaceRoutes = Router();

siteWorkspaceRoutes.get(
  '/settings',
  asyncHandler(async (request, response) => {
    if (!request.customerSession) {
      throw new HttpError(401, 'Customer session is required');
    }

    const payload = await getCustomerWorkspaceSettings(request.customerSession.accountId);
    response.json(payload);
  }),
);

siteWorkspaceRoutes.patch(
  '/settings',
  asyncHandler(async (request, response) => {
    if (!request.customerSession) {
      throw new HttpError(401, 'Customer session is required');
    }

    const payload = workspaceSettingsSchema.parse(request.body);
    const updated = await updateCustomerWorkspaceSettings(request.customerSession.accountId, payload);
    response.json(updated);
  }),
);
