import assert from 'node:assert/strict';
import { once } from 'node:events';
import type { Server } from 'node:http';

import { createApp } from '../app/create-app.js';
import { setDbPoolForTests } from '../database/mysql.js';
import { hashPassword } from '../lib/password.js';
import { FakeDbPool, type FakeDbState } from './support/fake-db.js';

function createFakeState(passwordHash: string): FakeDbState {
  return {
    admins: [
      {
        id: 1,
        full_name: 'Admin User',
        email: 'admin@example.com',
        password_hash: passwordHash,
        role: 'super_admin',
        status: 'active',
        last_login_at: null,
      },
    ],
    customerAccounts: [],
    customerAssessments: [],
    testTypes: [
      { id: 1, code: 'disc' },
      { id: 2, code: 'custom' },
    ],
    sessions: [
      {
        id: 10,
        test_type_id: 1,
        title: 'DISC Hiring Session',
        description: null,
        access_token: 'disc-batch-a',
        instructions: 'Read carefully\nAnswer honestly',
        settings_json: JSON.stringify({
          assessmentPurpose: 'recruitment',
          administrationMode: 'remote_unsupervised',
          interpretationMode: 'professional_review',
          consentStatement: 'I agree to participate in this screening assessment.',
          privacyStatement: 'Only authorized reviewers can access my results.',
          contactPerson: 'HR Assessment Desk',
        }),
        time_limit_minutes: 15,
        status: 'active',
      },
      {
        id: 20,
        test_type_id: 2,
        title: 'Research Scale Pilot',
        description: null,
        access_token: 'research-scale-pilot',
        instructions: 'Rate each statement\nUse the full scale',
        settings_json: JSON.stringify({
          assessmentPurpose: 'research',
          administrationMode: 'remote_unsupervised',
          interpretationMode: 'self_assessment',
          participantLimit: 1,
          consentStatement: 'I agree to participate in this research questionnaire.',
          privacyStatement: 'Responses are stored as confidential research data.',
          contactPerson: 'Research coordinator',
        }),
        time_limit_minutes: 10,
        status: 'active',
      },
    ],
    questions: [
      {
        id: 100,
        test_type_id: 1,
        question_code: 'DISC_Q001',
        instruction_text: 'Choose the most and least descriptive statements.',
        prompt: null,
        dimension_key: null,
        question_type: 'forced_choice',
      },
      {
        id: 200,
        test_type_id: 2,
        question_code: 'CUSTOM_Q001',
        instruction_text: 'Rate the statement below.',
        prompt: 'I stay focused on academic tasks.',
        dimension_key: 'self_regulation',
        question_type: 'likert',
      },
    ],
    options: [
      { id: 1001, question_id: 100, option_key: 'A', option_text: 'Decisive', dimension_key: 'D', value_number: null, is_correct: 0 },
      { id: 1002, question_id: 100, option_key: 'B', option_text: 'Persuasive', dimension_key: 'I', value_number: null, is_correct: 0 },
      { id: 1003, question_id: 100, option_key: 'C', option_text: 'Steady', dimension_key: 'S', value_number: null, is_correct: 0 },
      { id: 1004, question_id: 100, option_key: 'D', option_text: 'Analytical', dimension_key: 'C', value_number: null, is_correct: 0 },
      { id: 2001, question_id: 200, option_key: '1', option_text: 'Strongly disagree', dimension_key: 'self_regulation', value_number: 1, is_correct: 0 },
      { id: 2002, question_id: 200, option_key: '5', option_text: 'Strongly agree', dimension_key: 'self_regulation', value_number: 5, is_correct: 0 },
    ],
    participants: [
      {
        id: 300,
        full_name: 'Existing Research Participant',
        email: 'existing@example.com',
        employee_code: null,
        department: 'Psychology',
        position_title: 'Student',
        metadata_json: null,
      },
    ],
    submissions: [
      {
        id: 400,
        test_session_id: 20,
        participant_id: 300,
        attempt_no: 1,
        status: 'submitted',
        consent_given_at: new Date().toISOString(),
        consent_payload_json: '{}',
        identity_snapshot_json: '{}',
      },
    ],
    auditLogs: [],
  };
}

async function startServer() {
  const app = createApp();
  const server = app.listen(0);
  await once(server, 'listening');
  const address = server.address();

  if (!address || typeof address === 'string') {
    throw new Error('Unable to resolve test server address');
  }

  return {
    server,
    baseUrl: `http://127.0.0.1:${address.port}`,
  };
}

async function stopServer(server: Server) {
  server.close();
  await once(server, 'close').catch(() => undefined);
}

async function readJson(response: Response) {
  return (await response.json().catch(() => null)) as Record<string, unknown> | null;
}

export async function runApiIntegrationTests() {
  const passwordHash = await hashPassword('StrongPassword123!');
  const state = createFakeState(passwordHash);
  const fakeDb = new FakeDbPool(state);
  setDbPoolForTests(fakeDb);

  const { server, baseUrl } = await startServer();

  try {
    const invalidLogin = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'bad', password: 'short' }),
    });
    assert.equal(invalidLogin.status, 400);

    const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@example.com', password: 'StrongPassword123!' }),
    });
    assert.equal(loginResponse.status, 200);
    const loginPayload = await readJson(loginResponse);
    assert.equal(typeof loginPayload?.token, 'string');
    assert.equal(loginPayload?.admin && typeof loginPayload.admin === 'object' ? (loginPayload.admin as Record<string, unknown>).email : null, 'admin@example.com');
    assert.ok(state.admins[0]?.last_login_at);

    const protectedResponse = await fetch(`${baseUrl}/api/dashboard/summary`);
    assert.equal(protectedResponse.status, 401);

    const signupResponse = await fetch(`${baseUrl}/api/site-auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Research Owner',
        email: 'owner@example.com',
        password: 'StrongPassword123!',
        accountType: 'researcher',
        organizationName: 'Psych Lab',
      }),
    });
    assert.equal(signupResponse.status, 201);
    const signupPayload = await readJson(signupResponse);
    assert.equal(signupPayload?.account && typeof signupPayload.account === 'object' ? (signupPayload.account as Record<string, unknown>).organizationName : null, 'Psych Lab');
    assert.equal(state.customerAccounts.length, 1);

    const customerToken = String(signupPayload?.token ?? '');
    assert.ok(customerToken.length > 10);

    const customerLoginResponse = await fetch(`${baseUrl}/api/site-auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'owner@example.com', password: 'StrongPassword123!' }),
    });
    assert.equal(customerLoginResponse.status, 200);

    const onboardingCreateResponse = await fetch(`${baseUrl}/api/site-onboarding/assessments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken}`,
      },
      body: JSON.stringify({
        testType: 'custom',
        title: 'Study Pilot A',
        purpose: 'research',
        organizationName: 'Psych Lab',
        administrationMode: 'remote_unsupervised',
        timeLimitMinutes: 18,
        participantLimit: 60,
        resultVisibility: 'participant_summary',
      }),
    });
    assert.equal(onboardingCreateResponse.status, 201);
    const onboardingCreatePayload = await readJson(onboardingCreateResponse);
    assert.equal(onboardingCreatePayload?.title, 'Study Pilot A');
    assert.equal(onboardingCreatePayload?.sessionStatus, 'draft');
    assert.equal(typeof onboardingCreatePayload?.participantLink, 'string');
    assert.equal(state.customerAssessments.length, 1);
    assert.equal(state.sessions.some((item) => item.title === 'Study Pilot A' && item.status === 'draft'), true);

    const onboardingListResponse = await fetch(`${baseUrl}/api/site-onboarding/assessments`, {
      headers: {
        Authorization: `Bearer ${customerToken}`,
      },
    });
    assert.equal(onboardingListResponse.status, 200);
    const onboardingListPayload = await readJson(onboardingListResponse);
    assert.equal(Array.isArray(onboardingListPayload?.items), true);
    assert.equal((onboardingListPayload?.items as unknown[]).length, 1);
    assert.equal(state.auditLogs.some((item) => item.action === 'customer_assessment.created'), true);

    const createdAssessmentId = Number(onboardingCreatePayload?.assessmentId ?? 0);
    assert.ok(createdAssessmentId > 0);

    const onboardingDetailResponse = await fetch(`${baseUrl}/api/site-onboarding/assessments/${createdAssessmentId}`, {
      headers: {
        Authorization: `Bearer ${customerToken}`,
      },
    });
    assert.equal(onboardingDetailResponse.status, 200);
    const onboardingDetailPayload = await readJson(onboardingDetailResponse);
    assert.equal(onboardingDetailPayload?.description, 'Draft CUSTOM assessment for Psych Lab (research).');
    assert.equal(Array.isArray(onboardingDetailPayload?.instructions), true);
    assert.equal(onboardingDetailPayload?.canActivateSharing, true);

    const activateAssessmentResponse = await fetch(`${baseUrl}/api/site-onboarding/assessments/${createdAssessmentId}/activate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${customerToken}`,
      },
    });
    assert.equal(activateAssessmentResponse.status, 200);
    const activateAssessmentPayload = await readJson(activateAssessmentResponse);
    assert.equal(activateAssessmentPayload?.sessionStatus, 'active');
    assert.equal(activateAssessmentPayload?.planStatus, 'upgraded');
    assert.equal(activateAssessmentPayload?.canActivateSharing, false);
    assert.equal(state.customerAssessments[0]?.plan_status, 'upgraded');
    assert.equal(state.sessions.some((item) => item.title === 'Study Pilot A' && item.status === 'active'), true);
    assert.equal(state.auditLogs.some((item) => item.action === 'customer_assessment.activated'), true);

    const sessionResponse = await fetch(`${baseUrl}/api/public/session/disc-batch-a`);
    assert.equal(sessionResponse.status, 200);
    const sessionPayload = await readJson(sessionResponse);
    assert.equal(sessionPayload?.session && typeof sessionPayload.session === 'object' ? (sessionPayload.session as Record<string, unknown>).title : null, 'DISC Hiring Session');

    const invalidStart = await fetch(`${baseUrl}/api/public/session/disc-batch-a/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Nadia Pratama',
        email: 'nadia@example.com',
        consentAccepted: false,
      }),
    });
    assert.equal(invalidStart.status, 400);

    const startResponse = await fetch(`${baseUrl}/api/public/session/disc-batch-a/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Nadia Pratama',
        email: 'nadia@example.com',
        employeeCode: 'EMP-001',
        department: 'People Ops',
        position: 'Recruiter',
        appliedPosition: 'Team Lead',
        age: 29,
        educationLevel: 'Bachelor',
        consentAccepted: true,
        consentAcceptedAt: new Date().toISOString(),
      }),
    });
    assert.equal(startResponse.status, 201);
    const startPayload = await readJson(startResponse);
    assert.equal(typeof startPayload?.submissionAccessToken, 'string');
    assert.equal(state.participants.length, 2);
    assert.equal(state.submissions.length, 2);
    assert.equal(state.auditLogs.length, 3);
    assert.equal(state.auditLogs.at(-1)?.action, 'submission.started');

    const answerResponse = await fetch(`${baseUrl}/api/public/submissions/500/answers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers: [] }),
    });
    assert.equal(answerResponse.status, 401);

    const limitResponse = await fetch(`${baseUrl}/api/public/session/research-scale-pilot/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'New Research Participant',
        email: 'researcher@example.com',
        consentAccepted: true,
        consentAcceptedAt: new Date().toISOString(),
      }),
    });
    assert.equal(limitResponse.status, 409);
    const limitPayload = await readJson(limitResponse);
    assert.equal(limitPayload?.error, 'Participant limit reached for this session');
  } finally {
    await stopServer(server);
    setDbPoolForTests(null);
  }
}








