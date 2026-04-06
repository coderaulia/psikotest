import { createHmac, timingSafeEqual } from 'node:crypto';
import { env } from '../config/env.js';
const FOUR_HOURS_IN_SECONDS = 60 * 60 * 4;
function encodePayload(payload) {
    return Buffer.from(JSON.stringify(payload)).toString('base64url');
}
function decodePayload(encodedPayload) {
    return JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8'));
}
function createSignature(encodedPayload) {
    return createHmac('sha256', env.JWT_SECRET).update(encodedPayload).digest('base64url');
}
function signToken(payload) {
    const encodedPayload = encodePayload(payload);
    const signature = createSignature(encodedPayload);
    return `${encodedPayload}.${signature}`;
}
function verifyToken(token) {
    const [encodedPayload, providedSignature] = token.split('.');
    if (!encodedPayload || !providedSignature) {
        return null;
    }
    const expectedSignature = createSignature(encodedPayload);
    const providedBuffer = Buffer.from(providedSignature);
    const expectedBuffer = Buffer.from(expectedSignature);
    if (providedBuffer.length !== expectedBuffer.length) {
        return null;
    }
    if (!timingSafeEqual(providedBuffer, expectedBuffer)) {
        return null;
    }
    try {
        const payload = decodePayload(encodedPayload);
        if (payload.exp <= Math.floor(Date.now() / 1000)) {
            return null;
        }
        return payload;
    }
    catch {
        return null;
    }
}
export function createAdminSessionToken(input) {
    return signToken({
        type: 'admin',
        adminId: input.adminId,
        email: input.email,
        role: input.role,
        sessionVersion: input.sessionVersion,
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 12,
    });
}
export function verifyAdminSessionToken(token) {
    const payload = verifyToken(token);
    if (!payload || payload.type !== 'admin') {
        return null;
    }
    return payload;
}
export function createCustomerSessionToken(input) {
    return signToken({
        type: 'customer',
        accountId: input.accountId,
        actorId: input.actorId,
        actorType: input.actorType,
        email: input.email,
        accountType: input.accountType,
        workspaceRole: input.workspaceRole,
        sessionVersion: input.sessionVersion,
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7,
    });
}
export function verifyCustomerSessionToken(token) {
    const payload = verifyToken(token);
    if (!payload || payload.type !== 'customer') {
        return null;
    }
    return payload;
}
export function createSubmissionAccessToken(input) {
    const exp = Math.floor(Date.now() / 1000) + FOUR_HOURS_IN_SECONDS;
    return {
        token: signToken({
            type: 'submission',
            submissionId: input.submissionId,
            participantId: input.participantId,
            exp,
        }),
        expiresAt: new Date(exp * 1000).toISOString(),
    };
}
export function verifySubmissionAccessToken(token) {
    const payload = verifyToken(token);
    if (!payload || payload.type !== 'submission') {
        return null;
    }
    return payload;
}
