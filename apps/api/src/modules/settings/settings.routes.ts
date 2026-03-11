import { Router } from 'express';
import { z } from 'zod';

import { asyncHandler } from '../../lib/async-handler.js';
import { HttpError } from '../../lib/http-error.js';
import { createAuditEvent } from '../../lib/audit-log.js';
import {
  getSettingsOverview,
  updateAdminProfile,
  updateSessionDefaults,
} from './settings.service.js';

const sessionDefaultsSchema = z.object({
  timeLimitMinutes: z.coerce.number().int().positive().max(180),
  descriptionTemplate: z.string().min(10).max(1000),
  instructions: z.array(z.string().min(3).max(500)).min(1).max(12),
  settings: z.object({
    assessmentPurpose: z.enum(['recruitment', 'employee_development', 'academic_evaluation', 'research', 'self_assessment']),
    administrationMode: z.enum(['supervised', 'remote_unsupervised']),
    interpretationMode: z.enum(['self_assessment', 'professional_review']),
    consentStatement: z.string().min(20).max(2000),
    privacyStatement: z.string().min(20).max(2000),
    contactPerson: z.string().min(3).max(255),
  }),
});

const profileSchema = z.object({
  fullName: z.string().min(3).max(150),
  email: z.string().email().max(190),
});

export const settingsRoutes = Router();

settingsRoutes.get(
  '/',
  asyncHandler(async (request, response) => {
    if (!request.adminSession) {
      throw new HttpError(401, 'Admin session is required');
    }

    response.json(await getSettingsOverview(request.adminSession.adminId));
  }),
);

settingsRoutes.patch(
  '/profile',
  asyncHandler(async (request, response) => {
    if (!request.adminSession) {
      throw new HttpError(401, 'Admin session is required');
    }

    const payload = profileSchema.parse(request.body);
    const profile = await updateAdminProfile(request.adminSession.adminId, payload);

    await createAuditEvent({
      actorType: 'admin',
      actorAdminId: request.adminSession.adminId,
      entityType: 'admin_profile',
      entityId: request.adminSession.adminId,
      action: 'admin_profile.updated',
      metadata: { email: profile.email },
    });

    response.json(profile);
  }),
);

settingsRoutes.patch(
  '/session-defaults',
  asyncHandler(async (request, response) => {
    if (!request.adminSession) {
      throw new HttpError(401, 'Admin session is required');
    }

    const payload = sessionDefaultsSchema.parse(request.body);
    const defaults = await updateSessionDefaults(payload);

    await createAuditEvent({
      actorType: 'admin',
      actorAdminId: request.adminSession.adminId,
      entityType: 'app_settings',
      entityId: null,
      action: 'session_defaults.updated',
      metadata: {
        assessmentPurpose: defaults.settings.assessmentPurpose,
        interpretationMode: defaults.settings.interpretationMode,
      },
    });

    response.json(defaults);
  }),
);
