import assert from 'node:assert/strict';
import test from 'node:test';
import { hashPassword, verifyPassword } from '../lib/password.js';
import { createAdminSessionToken, createSubmissionAccessToken, verifyAdminSessionToken, verifySubmissionAccessToken, } from '../lib/signed-token.js';
test('password hashing verifies the original password and rejects the wrong one', async () => {
    const hashed = await hashPassword('StrongPassword123!');
    assert.match(hashed, /^scrypt\$/);
    assert.equal(await verifyPassword('StrongPassword123!', hashed), true);
    assert.equal(await verifyPassword('WrongPassword123!', hashed), false);
});
test('admin session token preserves claims and rejects tampering', () => {
    const token = createAdminSessionToken({
        adminId: 11,
        email: 'admin@example.com',
        role: 'super_admin',
        sessionVersion: 1,
    });
    const claims = verifyAdminSessionToken(token);
    assert.ok(claims);
    assert.equal(claims?.adminId, 11);
    assert.equal(claims?.email, 'admin@example.com');
    assert.equal(claims?.role, 'super_admin');
    assert.equal(verifyAdminSessionToken(`${token}tampered`), null);
});
test('submission access token preserves participant and submission ids', () => {
    const token = createSubmissionAccessToken({
        submissionId: 55,
        participantId: 77,
    });
    assert.match(token.expiresAt, /^\d{4}-\d{2}-\d{2}T/);
    const claims = verifySubmissionAccessToken(token.token);
    assert.ok(claims);
    assert.equal(claims?.submissionId, 55);
    assert.equal(claims?.participantId, 77);
});
