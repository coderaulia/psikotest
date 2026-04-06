import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../lib/async-handler.js';
import { createAuditEvent } from '../../lib/audit-log.js';
import { HttpError } from '../../lib/http-error.js';
import { fetchAllCustomers, setCustomerStatus } from './customers.repository.js';
const querySchema = z.object({
    search: z.string().optional(),
    status: z.enum(['active', 'inactive']).optional(),
    accountType: z.enum(['business', 'researcher']).optional(),
});
export const customersRoutes = Router();
// Only super_admin may access customer management
function requireSuperAdmin(request) {
    if (!request.adminSession) {
        throw new HttpError(401, 'Admin session is required');
    }
    if (request.adminSession.role !== 'super_admin') {
        throw new HttpError(403, 'Super admin access required');
    }
}
customersRoutes.get('/', asyncHandler(async (request, response) => {
    requireSuperAdmin(request);
    const filters = querySchema.parse(request.query);
    const items = await fetchAllCustomers(filters);
    response.json({ items });
}));
customersRoutes.patch('/:id/status', asyncHandler(async (request, response) => {
    requireSuperAdmin(request);
    const id = Number(request.params.id);
    if (!Number.isFinite(id) || id < 1) {
        throw new HttpError(400, 'Invalid customer id');
    }
    const { status } = z.object({ status: z.enum(['active', 'inactive']) }).parse(request.body);
    await setCustomerStatus(id, status);
    await createAuditEvent({
        actorType: 'admin',
        actorAdminId: request.adminSession.adminId,
        entityType: 'customer_account',
        entityId: id,
        action: 'customer_account.status_changed',
        metadata: { status },
    });
    response.json({ id, status });
}));
