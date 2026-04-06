import { HttpError } from '../lib/http-error.js';
export function requireCustomerWorkspaceRole(request, allowedRoles, message = 'This action requires additional workspace permissions') {
    if (!request.customerSession) {
        throw new HttpError(401, 'Customer session is required');
    }
    if (!allowedRoles.includes(request.customerSession.workspaceRole)) {
        throw new HttpError(403, message);
    }
}
