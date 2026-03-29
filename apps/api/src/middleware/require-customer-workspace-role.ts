import type { Request } from 'express';

import { HttpError } from '../lib/http-error.js';

export type CustomerWorkspaceRole = 'owner' | 'admin' | 'operator' | 'reviewer';

export function requireCustomerWorkspaceRole(
  request: Request,
  allowedRoles: CustomerWorkspaceRole[],
  message = 'This action requires additional workspace permissions',
) {
  if (!request.customerSession) {
    throw new HttpError(401, 'Customer session is required');
  }

  if (!allowedRoles.includes(request.customerSession.workspaceRole)) {
    throw new HttpError(403, message);
  }
}
