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
        session_version: 1,
      },
      {
        id: 2,
        full_name: 'Operations Admin',
        email: 'ops@example.com',
        password_hash: passwordHash,
        role: 'admin',
        status: 'active',
        last_login_at: null,
        session_version: 1,
      },
    ],
    customerAccounts: [],
    customerAssessments: [],
    workspaceSubscriptions: [],
    customerAssessmentParticipants: [],
    workspaceMembers: [],
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
          participantLimit: null,
          consentStatement: 'I agree to participate in this screening assessment.',
          privacyStatement: 'Only authorized reviewers can access my results.',
          contactPerson: 'HR Assessment Desk',
          distributionPolicy: 'full_report_with_consent',
          protectedDeliveryMode: true,
          participantResultAccess: 'full_released',
          hrResultAccess: 'full',
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
          distributionPolicy: 'participant_summary',
          protectedDeliveryMode: false,
          participantResultAccess: 'none',
          hrResultAccess: 'full',
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
        question_group_key: 'group-1',
        dimension_key: null,
        question_type: 'forced_choice',
        question_order: 1,
        status: 'active',
      },
      {
        id: 101,
        test_type_id: 1,
        question_code: 'DISC_Q002',
        instruction_text: 'Choose the most and least descriptive statements.',
        prompt: null,
        question_group_key: 'group-2',
        dimension_key: null,
        question_type: 'forced_choice',
        question_order: 2,
        status: 'active',
      },
      {
        id: 200,
        test_type_id: 2,
        question_code: 'CUSTOM_Q001',
        instruction_text: 'Rate the statement below.',
        prompt: 'I stay focused on academic tasks.',
        question_group_key: 'custom-1',
        dimension_key: 'self_regulation',
        question_type: 'likert',
        question_order: 1,
        status: 'active',
      },
    ],
    options: [
      { id: 1001, question_id: 100, option_key: 'A', option_text: 'Decisive', dimension_key: 'D', value_number: null, is_correct: 0, option_order: 1 },
      { id: 1002, question_id: 100, option_key: 'B', option_text: 'Persuasive', dimension_key: 'I', value_number: null, is_correct: 0, option_order: 2 },
      { id: 1003, question_id: 100, option_key: 'C', option_text: 'Steady', dimension_key: 'S', value_number: null, is_correct: 0, option_order: 3 },
      { id: 1004, question_id: 100, option_key: 'D', option_text: 'Analytical', dimension_key: 'C', value_number: null, is_correct: 0, option_order: 4 },
      { id: 1011, question_id: 101, option_key: 'A', option_text: 'Direct', dimension_key: 'D', value_number: null, is_correct: 0, option_order: 1 },
      { id: 1012, question_id: 101, option_key: 'B', option_text: 'Enthusiastic', dimension_key: 'I', value_number: null, is_correct: 0, option_order: 2 },
      { id: 1013, question_id: 101, option_key: 'C', option_text: 'Patient', dimension_key: 'S', value_number: null, is_correct: 0, option_order: 3 },
      { id: 1014, question_id: 101, option_key: 'D', option_text: 'Precise', dimension_key: 'C', value_number: null, is_correct: 0, option_order: 4 },
      { id: 2001, question_id: 200, option_key: '1', option_text: 'Strongly disagree', dimension_key: 'self_regulation', value_number: 1, is_correct: 0, option_order: 1 },
      { id: 2002, question_id: 200, option_key: '5', option_text: 'Strongly agree', dimension_key: 'self_regulation', value_number: 5, is_correct: 0, option_order: 2 },
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
        started_at: new Date().toISOString(),
        submitted_at: new Date().toISOString(),
        consent_given_at: new Date().toISOString(),
        consent_payload_json: '{}',
        identity_snapshot_json: '{}',
        answer_sequence: 0,
        raw_score: null,
      },
    ],
    answers: [],
    results: [],
    resultSummaries: [],
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
    assert.equal(loginResponse.headers.get('cache-control'), 'no-store, no-cache, must-revalidate, private');
    assert.equal(loginResponse.headers.get('x-powered-by'), null);
    assert.ok(state.admins[0]?.last_login_at);

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
    const customerToken = String(signupPayload?.token ?? '');
    assert.ok(customerToken.length > 10);

    const billingOverviewResponse = await fetch(`${baseUrl}/api/site-billing/overview`, {
      headers: {
        Authorization: `Bearer ${customerToken}`,
      },
    });
    assert.equal(billingOverviewResponse.status, 200);
    const billingOverviewPayload = await readJson(billingOverviewResponse);
    assert.equal(billingOverviewPayload?.subscription && typeof billingOverviewPayload.subscription === 'object' ? (billingOverviewPayload.subscription as Record<string, unknown>).planCode : null, 'research');
    assert.equal(billingOverviewPayload?.usage && typeof billingOverviewPayload.usage === 'object' ? (billingOverviewPayload.usage as Record<string, unknown>).teamSeatCount : null, 1);

    const billingUpdateResponse = await fetch(`${baseUrl}/api/site-billing/subscription`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken}`,
      },
      body: JSON.stringify({
        selectedPlan: 'starter',
        billingCycle: 'monthly',
      }),
    });
    assert.equal(billingUpdateResponse.status, 200);
    const billingUpdatePayload = await readJson(billingUpdateResponse);
    assert.equal(billingUpdatePayload?.subscription && typeof billingUpdatePayload.subscription === 'object' ? (billingUpdatePayload.subscription as Record<string, unknown>).planCode : null, 'starter');

    const workspaceUpdateResponse = await fetch(`${baseUrl}/api/site-workspace/settings`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken}`,
      },
      body: JSON.stringify({
        organizationName: 'Vanaila Research Lab',
        brandName: 'Vanaila Research Lab',
        brandTagline: 'Structured behavior science studies',
        supportEmail: 'support@vanaila.test',
        contactPerson: 'Research Desk',
        defaultAssessmentPurpose: 'research',
        defaultAdministrationMode: 'remote_unsupervised',
        defaultResultVisibility: 'participant_summary',
        defaultParticipantLimit: 48,
        defaultTimeLimitMinutes: 22,
        defaultConsentStatement: 'I agree to participate in studies managed by {{organizationName}}. Please contact {{supportEmail}} for support.',
        defaultPrivacyStatement: 'Responses for {{organizationName}} are stored as confidential research data. Contact {{contactPerson}} if you need assistance.',
      }),
    });
    assert.equal(workspaceUpdateResponse.status, 200);

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
        organizationName: 'Vanaila Research Lab',
        administrationMode: 'remote_unsupervised',
        timeLimitMinutes: null,
        participantLimit: null,
        resultVisibility: 'participant_summary',
      }),
    });
    assert.equal(onboardingCreateResponse.status, 201);
    const onboardingCreatePayload = await readJson(onboardingCreateResponse);
    const createdAssessmentId = Number(onboardingCreatePayload?.assessmentId ?? 0);
    assert.ok(createdAssessmentId > 0);

    const activateAssessmentResponse = await fetch(`${baseUrl}/api/site-onboarding/assessments/${createdAssessmentId}/activate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${customerToken}`,
      },
    });
    assert.equal(activateAssessmentResponse.status, 200);

    const secondAssessmentResponse = await fetch(`${baseUrl}/api/site-onboarding/assessments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken}`,
      },
      body: JSON.stringify({
        testType: 'custom',
        title: 'Study Pilot B',
        purpose: 'research',
        organizationName: 'Vanaila Research Lab',
        administrationMode: 'remote_unsupervised',
        timeLimitMinutes: null,
        participantLimit: null,
        resultVisibility: 'participant_summary',
      }),
    });
    assert.equal(secondAssessmentResponse.status, 201);

    const thirdAssessmentResponse = await fetch(`${baseUrl}/api/site-onboarding/assessments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken}`,
      },
      body: JSON.stringify({
        testType: 'custom',
        title: 'Study Pilot C',
        purpose: 'research',
        organizationName: 'Vanaila Research Lab',
        administrationMode: 'remote_unsupervised',
        timeLimitMinutes: null,
        participantLimit: null,
        resultVisibility: 'participant_summary',
      }),
    });
    assert.equal(thirdAssessmentResponse.status, 201);

    const overLimitAssessmentResponse = await fetch(`${baseUrl}/api/site-onboarding/assessments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken}`,
      },
      body: JSON.stringify({
        testType: 'custom',
        title: 'Study Pilot D',
        purpose: 'research',
        organizationName: 'Vanaila Research Lab',
        administrationMode: 'remote_unsupervised',
        timeLimitMinutes: null,
        participantLimit: null,
        resultVisibility: 'participant_summary',
      }),
    });
    assert.equal(overLimitAssessmentResponse.status, 409);
    const overLimitAssessmentPayload = await readJson(overLimitAssessmentResponse);
    assert.equal(overLimitAssessmentPayload?.error, 'Assessment limit reached for this workspace plan');

    const firstMemberResponse = await fetch(`${baseUrl}/api/site-workspace/team`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken}`,
      },
      body: JSON.stringify({
        fullName: 'Workspace Admin',
        email: 'member.one@example.com',
        role: 'admin',
      }),
    });
    assert.equal(firstMemberResponse.status, 201);

    const secondMemberResponse = await fetch(`${baseUrl}/api/site-workspace/team`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken}`,
      },
      body: JSON.stringify({
        fullName: 'Workspace Reviewer',
        email: 'member.two@example.com',
        role: 'reviewer',
      }),
    });
    assert.equal(secondMemberResponse.status, 201);

    const overSeatResponse = await fetch(`${baseUrl}/api/site-workspace/team`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken}`,
      },
      body: JSON.stringify({
        fullName: 'Workspace Operator',
        email: 'member.three@example.com',
        role: 'operator',
      }),
    });
    assert.equal(overSeatResponse.status, 409);
    const overSeatPayload = await readJson(overSeatResponse);
    assert.equal(overSeatPayload?.error, 'Team member limit reached for this workspace plan');

    const sessionResponse = await fetch(`${baseUrl}/api/public/session/disc-batch-a`);
    assert.equal(sessionResponse.status, 200);
    const sessionPayload = await readJson(sessionResponse);
    assert.equal(sessionPayload?.session && typeof sessionPayload.session === 'object' ? (sessionPayload.session as Record<string, unknown>).title : null, 'DISC Hiring Session');
    assert.equal(sessionResponse.headers.get('cache-control'), 'no-store, no-cache, must-revalidate, private');
    assert.equal(Array.isArray(sessionPayload?.questions) ? (sessionPayload?.questions as unknown[]).length : -1, 0);
    assert.equal(sessionPayload?.session && typeof sessionPayload.session === 'object' ? ((sessionPayload.session as Record<string, unknown>).delivery as Record<string, unknown>).mode : null, 'progressive');

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
    assert.equal(startPayload?.answerSequence, 0);
    assert.equal(typeof startPayload?.submissionAccessExpiresAt, 'string');
    assert.equal(state.participants.length, 2);

    const submissionId = Number(startPayload?.submissionId ?? 0);
    const submissionToken = String(startPayload?.submissionAccessToken ?? '');
    assert.ok(submissionId > 0);

    const questionWindowResponse = await fetch(`${baseUrl}/api/public/submissions/${submissionId}/questions?groupIndex=0`, {
      headers: {
        'X-Submission-Token': submissionToken,
      },
    });
    assert.equal(questionWindowResponse.status, 200);
    const questionWindowPayload = await readJson(questionWindowResponse);
    assert.equal(questionWindowPayload?.groupIndex, 0);
    assert.equal(questionWindowPayload?.totalGroups, 2);
    const windowQuestions = Array.isArray(questionWindowPayload?.questions) ? (questionWindowPayload.questions as Array<Record<string, unknown>>) : [];
    const windowOptions = windowQuestions[0] && Array.isArray(windowQuestions[0].options) ? (windowQuestions[0].options as Array<Record<string, unknown>>) : [];
    assert.equal(windowOptions.some((option) => Object.hasOwn(option, 'isCorrect')), false);

    const missingTokenAnswerResponse = await fetch(`${baseUrl}/api/public/submissions/${submissionId}/answers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        answerSequence: 1,
        answers: [{ questionId: 100, mostOptionId: 1002, leastOptionId: 1004 }],
      }),
    });
    assert.equal(missingTokenAnswerResponse.status, 401);

    const saveAnswerResponse = await fetch(`${baseUrl}/api/public/submissions/${submissionId}/answers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Submission-Token': submissionToken,
      },
      body: JSON.stringify({
        answerSequence: 1,
        answers: [{ questionId: 100, mostOptionId: 1002, leastOptionId: 1004 }],
      }),
    });
    assert.equal(saveAnswerResponse.status, 200);
    const saveAnswerPayload = await readJson(saveAnswerResponse);
    assert.equal(saveAnswerPayload?.answerSequence, 1);
    assert.equal(saveAnswerPayload?.answeredQuestionCount, 1);

    const replayAnswerResponse = await fetch(`${baseUrl}/api/public/submissions/${submissionId}/answers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Submission-Token': submissionToken,
      },
      body: JSON.stringify({
        answerSequence: 1,
        answers: [{ questionId: 100, mostOptionId: 1002, leastOptionId: 1004 }],
      }),
    });
    assert.equal(replayAnswerResponse.status, 409);

    const nextWindowResponse = await fetch(`${baseUrl}/api/public/submissions/${submissionId}/questions?groupIndex=1`, {
      headers: {
        'X-Submission-Token': submissionToken,
      },
    });
    assert.equal(nextWindowResponse.status, 200);
    const nextWindowPayload = await readJson(nextWindowResponse);
    assert.equal(nextWindowPayload?.groupIndex, 1);

    const submitResponse = await fetch(`${baseUrl}/api/public/submissions/${submissionId}/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Submission-Token': submissionToken,
      },
      body: JSON.stringify({
        answerSequence: 2,
        answers: [{ questionId: 101, mostOptionId: 1011, leastOptionId: 1013 }],
      }),
    });
    assert.equal(submitResponse.status, 200);
    const submitPayload = await readJson(submitResponse);
    const result = submitPayload?.result as Record<string, unknown>;
    assert.equal(submitPayload?.status, 'scored');
    assert.equal(typeof submitPayload?.resultId, 'number');
    assert.equal(result?.scoreTotal ?? null, null);
    assert.equal(typeof (result?.resultPayload as Record<string, unknown>)?.note, 'string');
    assert.equal(result?.reviewStatus, 'scored_preliminary');

    const duplicateSubmitResponse = await fetch(`${baseUrl}/api/public/submissions/${submissionId}/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Submission-Token': submissionToken,
      },
      body: JSON.stringify({}),
    });
    assert.equal(duplicateSubmitResponse.status, 200);
    const duplicateSubmitPayload = await readJson(duplicateSubmitResponse);
    assert.equal(duplicateSubmitPayload?.resultId, submitPayload?.resultId);

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





