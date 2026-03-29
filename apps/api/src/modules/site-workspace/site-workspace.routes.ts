import { Router } from 'express';
import { z } from 'zod';

import { asyncHandler } from '../../lib/async-handler.js';
import { HttpError } from '../../lib/http-error.js';
import {
  addCustomerWorkspaceMember,
  getCustomerWorkspaceSettings,
  listCustomerWorkspaceMembers,
  sendCustomerWorkspaceMemberInvite,
  updateCustomerWorkspaceSettings,
} from './site-workspace.service.js';

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

const workspaceMemberSchema = z.object({
  fullName: z.string().min(2).max(150),
  email: z.string().email(),
  role: z.enum(['admin', 'operator', 'reviewer']),
});

const memberParamsSchema = z.object({
  memberId: z.coerce.number().int().positive(),
});

function requireWorkspaceAdminRole(request: { customerSession?: { workspaceRole: 'owner' | 'admin' | 'operator' | 'reviewer' } }) {
  if (!request.customerSession) {
    throw new HttpError(401, 'Customer session is required');
  }

  if (!['owner', 'admin'].includes(request.customerSession.workspaceRole)) {
    throw new HttpError(403, 'This action requires workspace admin access');
  }
}

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
    requireWorkspaceAdminRole(request);

    const payload = workspaceSettingsSchema.parse(request.body);
    const updated = await updateCustomerWorkspaceSettings(request.customerSession!.accountId, payload);
    response.json(updated);
  }),
);

siteWorkspaceRoutes.get(
  '/team',
  asyncHandler(async (request, response) => {
    if (!request.customerSession) {
      throw new HttpError(401, 'Customer session is required');
    }

    const payload = await listCustomerWorkspaceMembers(request.customerSession.accountId);
    response.json(payload);
  }),
);

siteWorkspaceRoutes.post(
  '/team',
  asyncHandler(async (request, response) => {
    requireWorkspaceAdminRole(request);

    const payload = workspaceMemberSchema.parse(request.body);
    const member = await addCustomerWorkspaceMember({
      accountId: request.customerSession!.accountId,
      fullName: payload.fullName,
      email: payload.email,
      role: payload.role,
    });

    response.status(201).json(member);
  }),
);

siteWorkspaceRoutes.post(
  '/team/:memberId/send',
  asyncHandler(async (request, response) => {
    requireWorkspaceAdminRole(request);

    const { memberId } = memberParamsSchema.parse(request.params);
    const payload = await sendCustomerWorkspaceMemberInvite({
      accountId: request.customerSession!.accountId,
      memberId,
    });

    response.json(payload);
  }),
);
