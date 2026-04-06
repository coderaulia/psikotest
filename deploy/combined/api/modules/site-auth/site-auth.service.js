import { env } from '../../config/env.js';
import { createAuditEvent } from '../../lib/audit-log.js';
import { HttpError } from '../../lib/http-error.js';
import { hashPassword, verifyPassword } from '../../lib/password.js';
import { createCustomerSessionToken } from '../../lib/signed-token.js';
import { activateWorkspaceMemberInvite, createCustomerAccount, findActiveCustomerById, findActiveWorkspaceMemberByEmail, findActiveWorkspaceMemberById, findCustomerByEmail, findCustomerById, findWorkspaceMemberInviteByToken, markCustomerLogin, markWorkspaceMemberLogin, revokeCustomerSessions, revokeWorkspaceMemberSessions, } from './site-auth.repository.js';
function mapOwnerAccount(record) {
    return {
        id: record.id,
        fullName: record.full_name,
        email: record.email,
        accountType: record.account_type,
        organizationName: record.organization_name,
        workspaceRole: 'owner',
        sessionSource: 'owner',
        workspaceMemberId: null,
    };
}
function mapWorkspaceMemberAccount(record) {
    return {
        id: record.customer_account_id,
        fullName: record.full_name,
        email: record.email,
        accountType: record.account_type,
        organizationName: record.organization_name,
        workspaceRole: record.role,
        sessionSource: 'workspace_member',
        workspaceMemberId: record.id,
    };
}
function createOwnerSessionResponse(record) {
    return {
        token: createCustomerSessionToken({
            accountId: record.id,
            actorId: record.id,
            actorType: 'owner',
            email: record.email,
            accountType: record.account_type,
            workspaceRole: 'owner',
            sessionVersion: record.session_version,
        }),
        account: mapOwnerAccount(record),
    };
}
function createWorkspaceMemberSessionResponse(record) {
    return {
        token: createCustomerSessionToken({
            accountId: record.customer_account_id,
            actorId: record.id,
            actorType: 'workspace_member',
            email: record.email,
            accountType: record.account_type,
            workspaceRole: record.role,
            sessionVersion: record.session_version,
        }),
        account: mapWorkspaceMemberAccount(record),
    };
}
function isExpired(value) {
    return value ? new Date(value).getTime() <= Date.now() : false;
}
export async function signupCustomer(input) {
    const existingOwner = await findCustomerByEmail(input.email);
    const existingWorkspaceMember = await findActiveWorkspaceMemberByEmail(input.email);
    if (existingOwner || existingWorkspaceMember) {
        throw new HttpError(409, 'An account with this email already exists');
    }
    const passwordHash = await hashPassword(input.password);
    const record = await createCustomerAccount({
        fullName: input.fullName,
        email: input.email,
        passwordHash,
        accountType: input.accountType,
        organizationName: input.organizationName,
    });
    if (!record) {
        throw new HttpError(500, 'Unable to create account');
    }
    return createOwnerSessionResponse(record);
}
export async function loginCustomer(email, password) {
    const ownerRecord = await findCustomerByEmail(email);
    if (ownerRecord && ownerRecord.status === 'active') {
        const ownerPasswordIsValid = await verifyPassword(password, ownerRecord.password_hash);
        if (ownerPasswordIsValid) {
            try {
                await markCustomerLogin(ownerRecord.id);
            }
            catch {
                if (env.NODE_ENV !== 'test') {
                    console.warn('[site-auth] Failed to update customer login audit metadata');
                }
            }
            return createOwnerSessionResponse(ownerRecord);
        }
    }
    const memberRecord = await findActiveWorkspaceMemberByEmail(email);
    if (!memberRecord || !memberRecord.password_hash) {
        return null;
    }
    const memberPasswordIsValid = await verifyPassword(password, memberRecord.password_hash);
    if (!memberPasswordIsValid) {
        return null;
    }
    try {
        await markWorkspaceMemberLogin(memberRecord.customer_account_id, memberRecord.id);
    }
    catch {
        if (env.NODE_ENV !== 'test') {
            console.warn('[site-auth] Failed to update workspace member login audit metadata');
        }
    }
    return createWorkspaceMemberSessionResponse(memberRecord);
}
export async function getCustomerSessionProfile(session) {
    if (session.actorType === 'workspace_member') {
        const memberRecord = await findActiveWorkspaceMemberById(session.accountId, session.actorId);
        if (!memberRecord
            || memberRecord.session_version !== session.sessionVersion
            || memberRecord.role !== session.workspaceRole
            || memberRecord.email !== session.email
            || memberRecord.account_type !== session.accountType) {
            return null;
        }
        return mapWorkspaceMemberAccount(memberRecord);
    }
    const ownerRecord = await findActiveCustomerById(session.accountId);
    if (!ownerRecord
        || ownerRecord.session_version !== session.sessionVersion
        || ownerRecord.email !== session.email
        || ownerRecord.account_type !== session.accountType) {
        return null;
    }
    return mapOwnerAccount(ownerRecord);
}
export async function logoutCustomer(session) {
    if (session.actorType === 'workspace_member') {
        await revokeWorkspaceMemberSessions(session.accountId, session.actorId);
        return;
    }
    const ownerRecord = await findCustomerById(session.accountId);
    if (!ownerRecord) {
        return;
    }
    await revokeCustomerSessions(session.accountId);
}
export async function getWorkspaceInvitePreview(token) {
    const invite = await findWorkspaceMemberInviteByToken(token);
    if (!invite) {
        return null;
    }
    return {
        invite: {
            organizationName: invite.organization_name,
            accountType: invite.account_type,
            fullName: invite.full_name,
            email: invite.email,
            role: invite.role,
            expiresAt: invite.activation_expires_at,
            isExpired: isExpired(invite.activation_expires_at),
        },
    };
}
export async function acceptWorkspaceInvite(input) {
    const invite = await findWorkspaceMemberInviteByToken(input.token);
    if (!invite) {
        throw new HttpError(404, 'Workspace invitation not found');
    }
    if (isExpired(invite.activation_expires_at)) {
        throw new HttpError(410, 'Workspace invitation has expired');
    }
    const passwordHash = await hashPassword(input.password);
    const activatedMember = await activateWorkspaceMemberInvite({
        customerAccountId: invite.customer_account_id,
        memberId: invite.id,
        fullName: input.fullName,
        passwordHash,
    });
    if (!activatedMember) {
        throw new HttpError(500, 'Unable to activate workspace invitation');
    }
    await createAuditEvent({
        actorType: 'system',
        entityType: 'customer_workspace_member',
        entityId: activatedMember.id,
        action: 'customer_workspace.member_activated',
        metadata: {
            customerAccountId: activatedMember.customer_account_id,
            email: activatedMember.email,
            role: activatedMember.role,
        },
    });
    return createWorkspaceMemberSessionResponse(activatedMember);
}
