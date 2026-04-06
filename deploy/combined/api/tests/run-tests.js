import assert from 'node:assert/strict';
import { hashPassword, verifyPassword } from '../lib/password.js';
import { createAdminSessionToken, createCustomerSessionToken, createSubmissionAccessToken, verifyAdminSessionToken, verifyCustomerSessionToken, verifySubmissionAccessToken, } from '../lib/signed-token.js';
import { scoreAssessment } from '../modules/scoring/score-assessment.js';
import { getParticipantResultMode, parseTestSessionSettings } from '../modules/test-sessions/session-settings.js';
import { runApiIntegrationTests } from './api-integration.js';
function createBaseCompliance() {
    return {
        assessmentPurpose: 'recruitment',
        administrationMode: 'remote_unsupervised',
        interpretationMode: 'professional_review',
        participantResultMode: 'review_required',
        participantLimit: null,
        consentStatement: 'Consent statement for testing purposes.',
        privacyStatement: 'Privacy statement for testing purposes.',
        contactPerson: 'Testing Admin',
        distributionPolicy: 'participant_summary',
        protectedDeliveryMode: false,
        participantResultAccess: 'summary',
        hrResultAccess: 'full',
    };
}
function testIqScoring() {
    const context = {
        participantId: 1,
        definition: {
            session: {
                id: 1,
                title: 'IQ Session',
                testType: 'iq',
                instructions: [],
                estimatedMinutes: 15,
                status: 'active',
                delivery: { mode: 'full', totalQuestions: 1, totalGroups: 1 },
                compliance: createBaseCompliance(),
            },
            questions: [
                { id: 101, code: 'IQ_1', questionType: 'single_choice', prompt: 'Question 1', options: [{ id: 1001, key: 'A', label: 'A', isCorrect: true }, { id: 1002, key: 'B', label: 'B', isCorrect: false }] },
                { id: 102, code: 'IQ_2', questionType: 'single_choice', prompt: 'Question 2', options: [{ id: 1003, key: 'A', label: 'A', isCorrect: true }, { id: 1004, key: 'B', label: 'B', isCorrect: false }] },
                { id: 103, code: 'IQ_3', questionType: 'single_choice', prompt: 'Question 3', options: [{ id: 1005, key: 'A', label: 'A', isCorrect: true }, { id: 1006, key: 'B', label: 'B', isCorrect: false }] },
                { id: 104, code: 'IQ_4', questionType: 'single_choice', prompt: 'Question 4', options: [{ id: 1007, key: 'A', label: 'A', isCorrect: true }, { id: 1008, key: 'B', label: 'B', isCorrect: false }] },
                { id: 105, code: 'IQ_5', questionType: 'single_choice', prompt: 'Question 5', options: [{ id: 1009, key: 'A', label: 'A', isCorrect: true }, { id: 1010, key: 'B', label: 'B', isCorrect: false }] },
            ],
        },
        answers: [
            { questionId: 101, selectedOptionId: 1001 },
            { questionId: 102, selectedOptionId: 1003 },
            { questionId: 103, selectedOptionId: 1005 },
            { questionId: 104, selectedOptionId: 1007 },
            { questionId: 105, selectedOptionId: 1010 },
        ],
    };
    const result = scoreAssessment(context);
    assert.equal(result.scoreTotal, 118);
    assert.equal(result.scoreBand, 'above_average');
    assert.equal(result.interpretationKey, 'iq_above_average');
    assert.equal(result.summaries[0]?.score, 4);
}
function testDiscScoring() {
    const context = {
        participantId: 7,
        definition: {
            session: {
                id: 2,
                title: 'DISC Session',
                testType: 'disc',
                instructions: [],
                estimatedMinutes: 15,
                status: 'active',
                delivery: { mode: 'full', totalQuestions: 1, totalGroups: 1 },
                compliance: createBaseCompliance(),
            },
            questions: [
                { id: 201, code: 'DISC_1', questionType: 'forced_choice', options: [{ id: 2001, key: 'A', label: 'A', dimensionKey: 'D' }, { id: 2002, key: 'B', label: 'B', dimensionKey: 'I' }, { id: 2003, key: 'C', label: 'C', dimensionKey: 'S' }, { id: 2004, key: 'D', label: 'D', dimensionKey: 'C' }] },
                { id: 202, code: 'DISC_2', questionType: 'forced_choice', options: [{ id: 2005, key: 'A', label: 'A', dimensionKey: 'D' }, { id: 2006, key: 'B', label: 'B', dimensionKey: 'I' }, { id: 2007, key: 'C', label: 'C', dimensionKey: 'S' }, { id: 2008, key: 'D', label: 'D', dimensionKey: 'C' }] },
                { id: 203, code: 'DISC_3', questionType: 'forced_choice', options: [{ id: 2009, key: 'A', label: 'A', dimensionKey: 'D' }, { id: 2010, key: 'B', label: 'B', dimensionKey: 'I' }, { id: 2011, key: 'C', label: 'C', dimensionKey: 'S' }, { id: 2012, key: 'D', label: 'D', dimensionKey: 'C' }] },
            ],
        },
        answers: [
            { questionId: 201, mostOptionId: 2002, leastOptionId: 2004 },
            { questionId: 202, mostOptionId: 2006, leastOptionId: 2008 },
            { questionId: 203, mostOptionId: 2009, leastOptionId: 2011 },
        ],
    };
    const result = scoreAssessment(context);
    assert.equal(result.scoreTotal, 3);
    assert.equal(result.primaryType, 'I');
    assert.equal(result.secondaryType, 'D');
    assert.equal(result.profileCode, 'I/D');
    assert.deepEqual(result.payload.scores, { D: 1, I: 2, S: 0, C: 0 });
}
function testWorkloadScoring() {
    const context = {
        participantId: 22,
        definition: {
            session: {
                id: 3,
                title: 'Workload Session',
                testType: 'workload',
                instructions: [],
                estimatedMinutes: 10,
                status: 'active',
                delivery: { mode: 'full', totalQuestions: 1, totalGroups: 1 },
                compliance: createBaseCompliance(),
            },
            questions: [
                { id: 301, code: 'WORK_1', questionType: 'likert', dimensionKey: 'mental_demand', options: [{ id: 3001, key: '1', label: '1', value: 1 }, { id: 3002, key: '4', label: '4', value: 4 }] },
                { id: 302, code: 'WORK_2', questionType: 'likert', dimensionKey: 'stress_level', options: [{ id: 3003, key: '2', label: '2', value: 2 }, { id: 3004, key: '3', label: '3', value: 3 }] },
                { id: 303, code: 'WORK_3', questionType: 'likert', dimensionKey: 'fatigue', options: [{ id: 3005, key: '2', label: '2', value: 2 }, { id: 3006, key: '5', label: '5', value: 5 }] },
            ],
        },
        answers: [
            { questionId: 301, selectedOptionId: 3002, value: 4 },
            { questionId: 302, selectedOptionId: 3004, value: 3 },
            { questionId: 303, selectedOptionId: 3005, value: 2 },
        ],
    };
    const result = scoreAssessment(context);
    assert.equal(result.scoreTotal, 9);
    assert.equal(result.scoreBand, 'moderate_workload');
    assert.equal(result.interpretationKey, 'moderate_workload');
    assert.equal(result.summaries.at(-1)?.score, 3);
}
function testCustomResearchScoring() {
    const context = {
        participantId: 31,
        definition: {
            session: {
                id: 4,
                title: 'Research Pilot',
                testType: 'custom',
                instructions: [],
                estimatedMinutes: 12,
                status: 'active',
                delivery: { mode: 'full', totalQuestions: 1, totalGroups: 1 },
                compliance: {
                    ...createBaseCompliance(),
                    assessmentPurpose: 'research',
                    interpretationMode: 'self_assessment',
                    participantResultMode: 'instant_summary',
                    participantLimit: 100,
                },
            },
            questions: [
                { id: 401, code: 'CUSTOM_1', questionType: 'likert', dimensionKey: 'self_regulation', options: [{ id: 4001, key: '1', label: '1', value: 1 }, { id: 4002, key: '5', label: '5', value: 5 }] },
                { id: 402, code: 'CUSTOM_2', questionType: 'likert', dimensionKey: 'self_regulation', options: [{ id: 4003, key: '1', label: '1', value: 1 }, { id: 4004, key: '4', label: '4', value: 4 }] },
                { id: 403, code: 'CUSTOM_3', questionType: 'likert', dimensionKey: 'mental_fatigue', options: [{ id: 4005, key: '2', label: '2', value: 2 }, { id: 4006, key: '3', label: '3', value: 3 }] },
            ],
        },
        answers: [
            { questionId: 401, selectedOptionId: 4002, value: 5 },
            { questionId: 402, selectedOptionId: 4004, value: 4 },
            { questionId: 403, selectedOptionId: 4006, value: 3 },
        ],
    };
    const result = scoreAssessment(context);
    assert.equal(result.scoreTotal, 12);
    assert.equal(result.scoreBand, 'high_response');
    assert.equal(result.interpretationKey, 'custom_high_response');
    assert.equal(result.summaries.find((item) => item.metricKey === 'self_regulation')?.score, 9);
    assert.equal(result.summaries.at(-1)?.metricKey, 'overall_average');
}
function testPolicyValidation() {
    const parsed = parseTestSessionSettings({
        assessmentPurpose: 'research',
        administrationMode: 'remote_unsupervised',
        interpretationMode: 'professional_review',
        participantLimit: -5,
        consentStatement: 'Research consent.',
        privacyStatement: 'Research privacy.',
        contactPerson: 'Research desk',
        distributionPolicy: 'invalid_policy',
        protectedDeliveryMode: true,
        participantResultAccess: 'invalid_access',
        hrResultAccess: 'summary',
    });
    assert.equal(parsed.assessmentPurpose, 'research');
    assert.equal(parsed.participantLimit, 1);
    assert.equal(parsed.distributionPolicy, 'participant_summary');
    assert.equal(parsed.protectedDeliveryMode, true);
    assert.equal(parsed.participantResultAccess, 'summary');
    assert.equal(parsed.hrResultAccess, 'summary');
    assert.equal(getParticipantResultMode(parsed), 'review_required');
}
async function testSecurityUtilities() {
    const hashed = await hashPassword('StrongPassword123!');
    assert.match(hashed, /^scrypt\$/);
    assert.equal(await verifyPassword('StrongPassword123!', hashed), true);
    assert.equal(await verifyPassword('WrongPassword123!', hashed), false);
    const adminToken = createAdminSessionToken({
        adminId: 11,
        email: 'admin@example.com',
        role: 'super_admin',
        sessionVersion: 1,
    });
    const adminClaims = verifyAdminSessionToken(adminToken);
    assert.ok(adminClaims);
    assert.equal(adminClaims?.adminId, 11);
    assert.equal(adminClaims?.email, 'admin@example.com');
    assert.equal(adminClaims?.role, 'super_admin');
    assert.equal(verifyAdminSessionToken(`${adminToken}tampered`), null);
    const customerToken = createCustomerSessionToken({
        accountId: 5,
        actorId: 5,
        actorType: 'owner',
        email: 'owner@example.com',
        accountType: 'researcher',
        workspaceRole: 'owner',
        sessionVersion: 1,
    });
    const customerClaims = verifyCustomerSessionToken(customerToken);
    assert.ok(customerClaims);
    assert.equal(customerClaims?.accountId, 5);
    assert.equal(customerClaims?.accountType, 'researcher');
    const submissionToken = createSubmissionAccessToken({
        submissionId: 55,
        participantId: 77,
    });
    const submissionClaims = verifySubmissionAccessToken(submissionToken.token);
    assert.match(submissionToken.expiresAt, /^\d{4}-\d{2}-\d{2}T/);
    assert.ok(submissionClaims);
    assert.equal(submissionClaims?.submissionId, 55);
    assert.equal(submissionClaims?.participantId, 77);
}
async function main() {
    testIqScoring();
    testDiscScoring();
    testWorkloadScoring();
    testCustomResearchScoring();
    testPolicyValidation();
    await testSecurityUtilities();
    await runApiIntegrationTests();
    console.log('API tests passed');
}
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
