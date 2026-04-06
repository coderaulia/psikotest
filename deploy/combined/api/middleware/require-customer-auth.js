import { verifyCustomerSessionToken } from '../lib/signed-token.js';
import { findActiveCustomerById, findActiveWorkspaceMemberById } from '../modules/site-auth/site-auth.repository.js';
function readBearerToken(request) {
    const authorization = request.header('Authorization');
    if (!authorization || !authorization.startsWith('Bearer ')) {
        return null;
    }
    const token = authorization.slice('Bearer '.length).trim();
    return token.length > 0 ? token : null;
}
export async function requireCustomerAuth(request, response, next) {
    try {
        const token = readBearerToken(request);
        if (!token) {
            return response.status(401).json({
                error: 'Missing or invalid Authorization header',
            });
        }
        const customerSession = verifyCustomerSessionToken(token);
        if (!customerSession) {
            return response.status(401).json({
                error: 'Invalid or expired customer session',
            });
        }
        if (customerSession.actorType === 'workspace_member') {
            const activeMember = await findActiveWorkspaceMemberById(customerSession.accountId, customerSession.actorId);
            if (!activeMember
                || activeMember.session_version !== customerSession.sessionVersion
                || activeMember.role !== customerSession.workspaceRole
                || activeMember.email !== customerSession.email
                || activeMember.account_type !== customerSession.accountType) {
                return response.status(401).json({
                    error: 'Customer session is no longer active',
                });
            }
            request.customerSession = {
                ...customerSession,
                email: activeMember.email,
                accountType: activeMember.account_type,
                workspaceRole: activeMember.role,
                sessionVersion: activeMember.session_version,
            };
            return next();
        }
        const activeAccount = await findActiveCustomerById(customerSession.accountId);
        if (!activeAccount
            || activeAccount.session_version !== customerSession.sessionVersion
            || activeAccount.account_type !== customerSession.accountType
            || activeAccount.email !== customerSession.email) {
            return response.status(401).json({
                error: 'Customer session is no longer active',
            });
        }
        request.customerSession = {
            ...customerSession,
            actorId: activeAccount.id,
            actorType: 'owner',
            email: activeAccount.email,
            accountType: activeAccount.account_type,
            workspaceRole: 'owner',
            sessionVersion: activeAccount.session_version,
        };
        return next();
    }
    catch (error) {
        return next(error);
    }
}
