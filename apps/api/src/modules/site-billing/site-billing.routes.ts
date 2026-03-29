import { Router } from 'express';
import { z } from 'zod';

import { asyncHandler } from '../../lib/async-handler.js';
import { HttpError } from '../../lib/http-error.js';
import { requireCustomerWorkspaceRole } from '../../middleware/require-customer-workspace-role.js';
import { getWorkspaceBillingOverview, updateWorkspaceSubscriptionSelection } from './site-billing.service.js';

const subscriptionSchema = z.object({
  selectedPlan: z.enum(['starter', 'growth', 'research']),
  billingCycle: z.enum(['monthly', 'annual']).default('monthly'),
});

export const siteBillingRoutes = Router();

siteBillingRoutes.get(
  '/overview',
  asyncHandler(async (request, response) => {
    if (!request.customerSession) {
      throw new HttpError(401, 'Customer session is required');
    }

    requireCustomerWorkspaceRole(request, ['owner', 'admin'], 'Workspace billing is limited to owners and workspace admins');
    const payload = await getWorkspaceBillingOverview(request.customerSession.accountId);
    response.json(payload);
  }),
);

siteBillingRoutes.patch(
  '/subscription',
  asyncHandler(async (request, response) => {
    if (!request.customerSession) {
      throw new HttpError(401, 'Customer session is required');
    }

    requireCustomerWorkspaceRole(request, ['owner'], 'Only the workspace owner can change the subscription');
    const payload = subscriptionSchema.parse(request.body ?? {});
    const updated = await updateWorkspaceSubscriptionSelection({
      customerAccountId: request.customerSession.accountId,
      planCode: payload.selectedPlan,
      billingCycle: payload.billingCycle,
    });

    response.json(updated);
  }),
);
