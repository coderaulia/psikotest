import type mysql from 'mysql2/promise';

import type { DbPoolLike } from '../../database/mysql.js';

interface FakeAdmin {
  id: number;
  full_name: string;
  email: string;
  password_hash: string;
  role: 'super_admin' | 'admin' | 'psychologist_reviewer';
  status: 'active' | 'inactive';
  last_login_at: string | null;
  session_version: number;
}

interface FakeCustomerAccount {
  id: number;
  full_name: string;
  email: string;
  password_hash: string;
  account_type: 'business' | 'researcher';
  organization_name: string;
  settings_json: string | null;
  status: 'active' | 'inactive';
  last_login_at: string | null;
  session_version: number;
  created_at: string | null;
  updated_at: string | null;
}

interface FakeTestType {
  id: number;
  code: 'iq' | 'disc' | 'workload' | 'custom';
}

interface FakeSession {
  id: number;
  test_type_id: number;
  title: string;
  description: string | null;
  access_token: string;
  instructions: string | null;
  settings_json: string;
  time_limit_minutes: number | null;
  status: 'active' | 'draft' | 'completed' | 'archived';
  created_by_admin_id?: number;
  created_at?: string;
}

interface FakeCustomerAssessment {
  id: number;
  customer_account_id: number;
  test_session_id: number;
  organization_name_snapshot: string;
  onboarding_status: 'draft' | 'ready';
  plan_status: 'trial' | 'upgraded';
  created_at: string;
  updated_at?: string;
}

interface FakeWorkspaceSubscription {
  id: number;
  customer_account_id: number;
  plan_code: 'starter' | 'growth' | 'research';
  status: 'trial' | 'active' | 'past_due' | 'suspended';
  billing_cycle: 'monthly' | 'annual';
  assessment_limit: number;
  participant_limit: number;
  team_member_limit: number;
  started_at: string;
  trial_ends_at: string | null;
  renews_at: string | null;
  updated_at: string;
}

interface FakeCustomerAssessmentParticipant {
  id: number;
  customer_assessment_id: number;
  participant_id: number;
  invite_status: 'draft' | 'sent';
}

interface FakeWorkspaceMember {
  id: number;
  customer_account_id: number;
  full_name: string;
  email: string;
  password_hash: string | null;
  role: 'admin' | 'operator' | 'reviewer';
  invitation_status: 'active' | 'invited';
  activation_token: string | null;
  activation_expires_at: string | null;
  invited_at: string | null;
  activated_at: string | null;
  last_login_at: string | null;
  last_notified_at: string | null;
  session_version: number;
  created_at: string;
}

interface FakeQuestion {
  id: number;
  test_type_id: number;
  question_code: string;
  instruction_text: string | null;
  prompt: string | null;
  question_group_key: string | null;
  dimension_key: string | null;
  question_type: 'single_choice' | 'forced_choice' | 'likert';
  question_order: number;
  status: 'active' | 'draft' | 'archived';
}

interface FakeOption {
  id: number;
  question_id: number;
  option_key: string;
  option_text: string;
  dimension_key: string | null;
  value_number: number | null;
  is_correct: number;
  option_order: number;
}

interface FakeParticipant {
  id: number;
  full_name: string;
  email: string;
  employee_code: string | null;
  department: string | null;
  position_title: string | null;
  metadata_json: string | null;
}

interface FakeSubmission {
  id: number;
  test_session_id: number;
  participant_id: number;
  attempt_no: number;
  status: 'in_progress' | 'submitted' | 'scored';
  started_at: string | null;
  submitted_at: string | null;
  consent_given_at: string | null;
  consent_payload_json: string | null;
  identity_snapshot_json: string | null;
  answer_sequence: number;
  raw_score: number | null;
}

interface FakeAnswer {
  id: number;
  submission_id: number;
  question_id: number;
  answer_role: 'single' | 'most' | 'least' | 'scale';
  selected_option_id: number | null;
  value_number: number | null;
  answer_payload_json: string | null;
}

interface FakeResult {
  id: number;
  submission_id: number;
  test_type_id: number;
  score_total: number | null;
  score_band: string | null;
  primary_type: string | null;
  secondary_type: string | null;
  profile_code: string | null;
  interpretation_key: string | null;
  result_payload_json: string | null;
  created_at: string;
  updated_at: string;
}

interface FakeResultSummary {
  id: number;
  result_id: number;
  metric_key: string;
  metric_label: string;
  metric_type: string;
  score: number;
  band: string | null;
  sort_order: number;
}

interface FakeAuditLog {
  id: number;
  actor_type: 'admin' | 'participant' | 'system';
  actor_admin_id: number | null;
  entity_type: string;
  entity_id: number | null;
  action: string;
  metadata_json: string | null;
  created_at: string;
}

export interface FakeDbState {
  admins: FakeAdmin[];
  customerAccounts: FakeCustomerAccount[];
  customerAssessments: FakeCustomerAssessment[];
  workspaceSubscriptions: FakeWorkspaceSubscription[];
  customerAssessmentParticipants: FakeCustomerAssessmentParticipant[];
  workspaceMembers: FakeWorkspaceMember[];
  testTypes: FakeTestType[];
  sessions: FakeSession[];
  questions: FakeQuestion[];
  options: FakeOption[];
  participants: FakeParticipant[];
  submissions: FakeSubmission[];
  answers: FakeAnswer[];
  results: FakeResult[];
  resultSummaries: FakeResultSummary[];
  auditLogs: FakeAuditLog[];
}

function normalizeSql(sql: string) {
  return sql.replace(/\s+/g, ' ').trim().toLowerCase();
}

class FakeConnection {
  constructor(private readonly db: FakeDbPool) {}

  async beginTransaction() {}
  async commit() {}
  async rollback() {}
  release() {}

  async query(sql: string, values?: unknown[]) {
    return this.db.query(sql, values);
  }
}

export class FakeDbPool implements DbPoolLike {
  private nextCustomerAccountId = 10;
  private nextSessionId = 30;
  private nextCustomerAssessmentId = 40;
  private nextWorkspaceSubscriptionId = 60;
  private nextCustomerAssessmentParticipantId = 70;
  private nextWorkspaceMemberId = 80;
  private nextParticipantId = 100;
  private nextSubmissionId = 500;
  private nextAnswerId = 800;
  private nextResultId = 900;
  private nextResultSummaryId = 950;
  private nextAuditId = 1000;

  constructor(public readonly state: FakeDbState) {
    if (state.customerAccounts.length > 0) {
      this.nextCustomerAccountId = Math.max(...state.customerAccounts.map((item) => item.id)) + 1;
    }

    if (state.sessions.length > 0) {
      this.nextSessionId = Math.max(...state.sessions.map((item) => item.id)) + 1;
    }

    if (state.customerAssessments.length > 0) {
      this.nextCustomerAssessmentId = Math.max(...state.customerAssessments.map((item) => item.id)) + 1;
    }

    if (state.workspaceSubscriptions.length > 0) {
      this.nextWorkspaceSubscriptionId = Math.max(...state.workspaceSubscriptions.map((item) => item.id)) + 1;
    }

    if (state.customerAssessmentParticipants.length > 0) {
      this.nextCustomerAssessmentParticipantId = Math.max(...state.customerAssessmentParticipants.map((item) => item.id)) + 1;
    }

    if (state.workspaceMembers.length > 0) {
      this.nextWorkspaceMemberId = Math.max(...state.workspaceMembers.map((item) => item.id)) + 1;
    }

    if (state.participants.length > 0) {
      this.nextParticipantId = Math.max(...state.participants.map((item) => item.id)) + 1;
    }

    if (state.submissions.length > 0) {
      this.nextSubmissionId = Math.max(...state.submissions.map((item) => item.id)) + 1;
    }

    if (state.answers.length > 0) {
      this.nextAnswerId = Math.max(...state.answers.map((item) => item.id)) + 1;
    }

    if (state.results.length > 0) {
      this.nextResultId = Math.max(...state.results.map((item) => item.id)) + 1;
    }

    if (state.resultSummaries.length > 0) {
      this.nextResultSummaryId = Math.max(...state.resultSummaries.map((item) => item.id)) + 1;
    }

    if (state.auditLogs.length > 0) {
      this.nextAuditId = Math.max(...state.auditLogs.map((item) => item.id)) + 1;
    }
  }

  async getConnection() {
    return new FakeConnection(this) as unknown as mysql.PoolConnection;
  }

  private buildCustomerAssessmentRow(assessment: FakeCustomerAssessment) {
    const session = this.state.sessions.find((item) => item.id === assessment.test_session_id);
    const testType = session ? this.state.testTypes.find((item) => item.id === session.test_type_id) : null;

    if (!session || !testType) {
      return null;
    }

    return {
      assessment_id: assessment.id,
      session_id: session.id,
      title: session.title,
      description: session.description,
      organization_name_snapshot: assessment.organization_name_snapshot,
      test_type: testType.code,
      time_limit_minutes: session.time_limit_minutes,
      settings_json: session.settings_json,
      instructions: session.instructions,
      session_status: session.status,
      plan_status: assessment.plan_status,
      access_token: session.access_token,
      created_at: assessment.created_at,
    };
  }

  async query(sql: string, values?: unknown[]) {
    const normalized = normalizeSql(sql);
    const params = (values ?? []) as unknown[];

    if (normalized.includes('from admins') && normalized.includes('where email = ?')) {
      const email = String(params[0] ?? '').trim().toLowerCase();
      const admin = this.state.admins.find((item) => item.email === email);
      return [[admin].filter(Boolean), []] as unknown as [any, any];
    }

    if (normalized.startsWith('update admins set last_login_at = now()')) {
      const adminId = Number(params[0]);
      const admin = this.state.admins.find((item) => item.id === adminId);
      if (admin) {
        admin.last_login_at = new Date().toISOString();
      }
      return [[{ affectedRows: admin ? 1 : 0 }], []] as unknown as [any, any];
    }

    if (normalized.includes('select id from admins where status =')) {
      const admin = [...this.state.admins]
        .filter((item) => item.status === 'active')
        .sort((left, right) => {
          const leftRank = left.role === 'super_admin' ? 0 : 1;
          const rightRank = right.role === 'super_admin' ? 0 : 1;
          return leftRank - rightRank || left.id - right.id;
        })[0];
      return [[admin ? { id: admin.id } : undefined].filter(Boolean), []] as unknown as [any, any];
    }

    if (normalized.includes('from customer_accounts') && normalized.includes('where email = ?')) {
      const email = String(params[0] ?? '').trim().toLowerCase();
      const account = this.state.customerAccounts.find((item) => item.email === email);
      return [[account].filter(Boolean), []] as unknown as [any, any];
    }

    if (normalized.includes('from customer_accounts') && normalized.includes('where id = ?')) {
      const accountId = Number(params[0]);
      const account = this.state.customerAccounts.find((item) => item.id === accountId);
      return [[account].filter(Boolean), []] as unknown as [any, any];
    }

    if (normalized.startsWith('insert into customer_accounts')) {
      const now = new Date().toISOString();
      const account: FakeCustomerAccount = {
        id: this.nextCustomerAccountId++,
        full_name: String(params[0] ?? ''),
        email: String(params[1] ?? '').trim().toLowerCase(),
        password_hash: String(params[2] ?? ''),
        account_type: params[3] as FakeCustomerAccount['account_type'],
        organization_name: String(params[4] ?? ''),
        settings_json: null,
        status: 'active',
        last_login_at: now,
        session_version: 1,
        created_at: now,
        updated_at: now,
      };
      this.state.customerAccounts.push(account);
      return [{ insertId: account.id }, []] as unknown as [any, any];
    }

    if (normalized.startsWith('select id, customer_account_id, plan_code, status, billing_cycle, assessment_limit, participant_limit, team_member_limit, started_at, trial_ends_at, renews_at from workspace_subscriptions where customer_account_id = ? limit 1')) {
      const customerAccountId = Number(params[0]);
      const subscription = this.state.workspaceSubscriptions.find((item) => item.customer_account_id === customerAccountId);
      return [[subscription].filter(Boolean), []] as unknown as [any, any];
    }

    if (normalized.startsWith('insert into workspace_subscriptions')) {
      const now = new Date().toISOString();
      const subscription: FakeWorkspaceSubscription = {
        id: this.nextWorkspaceSubscriptionId++,
        customer_account_id: Number(params[0]),
        plan_code: params[1] as FakeWorkspaceSubscription['plan_code'],
        status: params[2] as FakeWorkspaceSubscription['status'],
        billing_cycle: params[3] as FakeWorkspaceSubscription['billing_cycle'],
        assessment_limit: Number(params[4]),
        participant_limit: Number(params[5]),
        team_member_limit: Number(params[6]),
        started_at: now,
        trial_ends_at: params[7] ? String(params[7]) : null,
        renews_at: params[8] ? String(params[8]) : null,
        updated_at: now,
      };
      this.state.workspaceSubscriptions.push(subscription);
      return [{ insertId: subscription.id }, []] as unknown as [any, any];
    }

    if (normalized.startsWith('update workspace_subscriptions set plan_code = ?, status = ?, billing_cycle = ?, assessment_limit = ?, participant_limit = ?, team_member_limit = ?, trial_ends_at = ?, renews_at = ?, updated_at = current_timestamp where customer_account_id = ?')) {
      const customerAccountId = Number(params[8]);
      const subscription = this.state.workspaceSubscriptions.find((item) => item.customer_account_id === customerAccountId);
      if (subscription) {
        subscription.plan_code = params[0] as FakeWorkspaceSubscription['plan_code'];
        subscription.status = params[1] as FakeWorkspaceSubscription['status'];
        subscription.billing_cycle = params[2] as FakeWorkspaceSubscription['billing_cycle'];
        subscription.assessment_limit = Number(params[3]);
        subscription.participant_limit = Number(params[4]);
        subscription.team_member_limit = Number(params[5]);
        subscription.trial_ends_at = params[6] ? String(params[6]) : null;
        subscription.renews_at = params[7] ? String(params[7]) : null;
        subscription.updated_at = new Date().toISOString();
      }
      return [[{ affectedRows: subscription ? 1 : 0 }], []] as unknown as [any, any];
    }

    if (normalized.startsWith('update customer_accounts set session_version = session_version + 1,')) {
      const accountId = Number(params[0]);
      const account = this.state.customerAccounts.find((item) => item.id === accountId);
      if (account) {
        account.session_version += 1;
        account.updated_at = new Date().toISOString();
      }
      return [[{ affectedRows: account ? 1 : 0 }], []] as unknown as [any, any];
    }

    if (normalized.startsWith('update customer_accounts set last_login_at = now()')) {
      const accountId = Number(params[0]);
      const account = this.state.customerAccounts.find((item) => item.id === accountId);
      if (account) {
        account.last_login_at = new Date().toISOString();
      }
      return [[{ affectedRows: account ? 1 : 0 }], []] as unknown as [any, any];
    }

    if (normalized.startsWith('update customer_accounts set organization_name = ?, settings_json = ?, updated_at = current_timestamp where id = ?')) {
      const organizationName = String(params[0] ?? '');
      const settingsJson = String(params[1] ?? '{}');
      const accountId = Number(params[2]);
      const account = this.state.customerAccounts.find((item) => item.id === accountId);
      if (account) {
        account.organization_name = organizationName;
        account.settings_json = settingsJson;
        account.updated_at = new Date().toISOString();
      }
      return [[{ affectedRows: account ? 1 : 0 }], []] as unknown as [any, any];
    }

    if (normalized.startsWith('update customer_accounts set organization_name = ?')) {
      const organizationName = String(params[0] ?? '');
      const accountId = Number(params[1]);
      const account = this.state.customerAccounts.find((item) => item.id === accountId);
      if (account) {
        account.organization_name = organizationName;
        account.updated_at = new Date().toISOString();
      }
      return [[{ affectedRows: account ? 1 : 0 }], []] as unknown as [any, any];
    }

    if (normalized.includes('select id from test_types where code = ?')) {
      const code = String(params[0] ?? '');
      const testType = this.state.testTypes.find((item) => item.code === code);
      return [[testType ? { id: testType.id } : undefined].filter(Boolean), []] as unknown as [any, any];
    }

    if (normalized.startsWith('insert into test_sessions')) {
      const now = new Date().toISOString();
      const session: FakeSession = {
        id: this.nextSessionId++,
        test_type_id: Number(params[0]),
        title: String(params[1] ?? ''),
        description: (params[2] as string | null) ?? null,
        access_token: String(params[3] ?? ''),
        instructions: (params[4] as string | null) ?? null,
        settings_json: String(params[5] ?? '{}'),
        time_limit_minutes: (params[6] as number | null) ?? null,
        status: 'draft',
        created_by_admin_id: Number(params[7] ?? 0),
        created_at: now,
      };
      this.state.sessions.push(session);
      return [{ insertId: session.id }, []] as unknown as [any, any];
    }

    if (normalized.startsWith('insert into customer_assessments')) {
      const now = new Date().toISOString();
      const assessment: FakeCustomerAssessment = {
        id: this.nextCustomerAssessmentId++,
        customer_account_id: Number(params[0]),
        test_session_id: Number(params[1]),
        organization_name_snapshot: String(params[2] ?? ''),
        onboarding_status: 'ready',
        plan_status: 'trial',
        created_at: now,
        updated_at: now,
      };
      this.state.customerAssessments.push(assessment);
      return [{ insertId: assessment.id }, []] as unknown as [any, any];
    }

    if (normalized.startsWith('select ts.id as session_id from customer_assessments ca inner join test_sessions ts on ts.id = ca.test_session_id where ca.customer_account_id = ? and ca.id = ? limit 1')) {
      const accountId = Number(params[0]);
      const assessmentId = Number(params[1]);
      const assessment = this.state.customerAssessments.find((item) => item.customer_account_id === accountId && item.id === assessmentId);
      if (!assessment) {
        return [[], []] as unknown as [any, any];
      }
      return [[{ session_id: assessment.test_session_id }], []] as unknown as [any, any];
    }

    if (normalized.startsWith('update customer_assessments set plan_status = \'upgraded\', updated_at = current_timestamp where customer_account_id = ? and id = ?')) {
      const accountId = Number(params[0]);
      const assessmentId = Number(params[1]);
      const assessment = this.state.customerAssessments.find((item) => item.customer_account_id === accountId && item.id === assessmentId);
      if (assessment) {
        assessment.plan_status = 'upgraded';
        assessment.updated_at = new Date().toISOString();
      }
      return [[{ affectedRows: assessment ? 1 : 0 }], []] as unknown as [any, any];
    }

    if (normalized.startsWith('update test_sessions set status = \'active\', updated_at = current_timestamp where id = ? and status = \'draft\'')) {
      const sessionId = Number(params[0]);
      const session = this.state.sessions.find((item) => item.id === sessionId && item.status === 'draft');
      if (session) {
        session.status = 'active';
      }
      return [[{ affectedRows: session ? 1 : 0 }], []] as unknown as [any, any];
    }

    if (normalized.includes('from customer_assessments ca inner join test_sessions ts on ts.id = ca.test_session_id inner join test_types tt on tt.id = ts.test_type_id where ca.customer_account_id = ? and ca.test_session_id = ? limit 1')) {
      const accountId = Number(params[0]);
      const sessionId = Number(params[1]);
      const assessment = this.state.customerAssessments.find((item) => item.customer_account_id === accountId && item.test_session_id === sessionId);
      const row = assessment ? this.buildCustomerAssessmentRow(assessment) : null;
      return [[row].filter(Boolean), []] as unknown as [any, any];
    }

    if (normalized.includes('from customer_assessments ca inner join test_sessions ts on ts.id = ca.test_session_id inner join test_types tt on tt.id = ts.test_type_id where ca.customer_account_id = ? and ca.id = ? limit 1')) {
      const accountId = Number(params[0]);
      const assessmentId = Number(params[1]);
      const assessment = this.state.customerAssessments.find((item) => item.customer_account_id === accountId && item.id === assessmentId);
      const row = assessment ? this.buildCustomerAssessmentRow(assessment) : null;
      return [[row].filter(Boolean), []] as unknown as [any, any];
    }

    if (normalized.startsWith("select count(*) as total from customer_assessments ca inner join test_sessions ts on ts.id = ca.test_session_id where ca.customer_account_id = ? and ts.status in ('draft', 'active')")) {
      const customerAccountId = Number(params[0]);
      const total = this.state.customerAssessments.filter((assessment) => {
        if (assessment.customer_account_id !== customerAccountId) {
          return false;
        }

        const session = this.state.sessions.find((item) => item.id === assessment.test_session_id);
        return session ? session.status === 'draft' || session.status === 'active' : false;
      }).length;
      return [[{ total }], []] as unknown as [any, any];
    }

    if (normalized.startsWith('select count(*) as total from customer_assessment_participants cap inner join customer_assessments ca on ca.id = cap.customer_assessment_id where ca.customer_account_id = ?')) {
      const customerAccountId = Number(params[0]);
      const total = this.state.customerAssessmentParticipants.filter((item) => {
        const assessment = this.state.customerAssessments.find((candidate) => candidate.id === item.customer_assessment_id);
        return assessment?.customer_account_id === customerAccountId;
      }).length;
      return [[{ total }], []] as unknown as [any, any];
    }

    if (normalized.startsWith('select count(*) as total from customer_workspace_members where customer_account_id = ?')) {
      const customerAccountId = Number(params[0]);
      const total = this.state.workspaceMembers.filter((item) => item.customer_account_id === customerAccountId).length;
      return [[{ total }], []] as unknown as [any, any];
    }

    if (normalized.includes('from customer_assessments ca inner join test_sessions ts on ts.id = ca.test_session_id inner join test_types tt on tt.id = ts.test_type_id where ca.customer_account_id = ? order by ca.created_at desc')) {
      const accountId = Number(params[0]);
      const rows = this.state.customerAssessments
        .filter((item) => item.customer_account_id === accountId)
        .sort((left, right) => {
          const timeDiff = new Date(right.created_at).getTime() - new Date(left.created_at).getTime();
          return timeDiff || right.id - left.id;
        })
        .map((assessment) => this.buildCustomerAssessmentRow(assessment))
        .filter(Boolean);
      return [rows, []] as unknown as [any, any];
    }

    if (normalized.includes('from test_sessions ts inner join test_types tt on tt.id = ts.test_type_id where ts.access_token = ? and ts.status =')) {
      const token = String(params[0] ?? '');
      const session = this.state.sessions.find((item) => item.access_token === token && item.status === 'active');
      if (!session) {
        return [[], []] as unknown as [any, any];
      }

      const testType = this.state.testTypes.find((item) => item.id === session.test_type_id)!;
      return [[{
        session_id: session.id,
        test_type_id: session.test_type_id,
        title: session.title,
        access_token: session.access_token,
        instructions: session.instructions,
        time_limit_minutes: session.time_limit_minutes,
        settings_json: session.settings_json,
        status: session.status,
        test_type_code: testType.code,
      }], []] as unknown as [any, any];
    }

    if (normalized.includes('from questions q where q.test_type_id = ?') && normalized.includes("q.status = 'active'") && normalized.includes('order by q.question_order asc')) {
      const testTypeId = Number(params[0]);
      const rows = this.state.questions
        .filter((item) => item.test_type_id === testTypeId && item.status === 'active')
        .sort((left, right) => left.question_order - right.question_order)
        .map((item) => ({
          id: item.id,
          question_code: item.question_code,
          instruction_text: item.instruction_text,
          prompt: item.prompt,
          question_group_key: item.question_group_key,
          dimension_key: item.dimension_key,
          question_type: item.question_type,
          question_order: item.question_order,
        }));
      return [rows, []] as unknown as [any, any];
    }

    if (normalized.includes('from question_options qo where qo.question_id in')) {
      const questionIds = params.map((item) => Number(item));
      const rows = this.state.options
        .filter((item) => questionIds.includes(item.question_id))
        .sort((left, right) => left.question_id - right.question_id || left.option_order - right.option_order)
        .map((item) => ({
          id: item.id,
          question_id: item.question_id,
          option_key: item.option_key,
          option_text: item.option_text,
          dimension_key: item.dimension_key,
          value_number: item.value_number,
          is_correct: item.is_correct,
        }));
      return [rows, []] as unknown as [any, any];
    }

    if (normalized.startsWith('select id, full_name, email, role, invitation_status, invited_at, last_notified_at, activation_expires_at, activated_at, last_login_at from customer_workspace_members where customer_account_id = ? order by created_at asc, id asc')) {
      const customerAccountId = Number(params[0]);
      const rows = this.state.workspaceMembers
        .filter((item) => item.customer_account_id === customerAccountId)
        .sort((left, right) => new Date(left.created_at).getTime() - new Date(right.created_at).getTime() || left.id - right.id)
        .map((item) => ({
          id: item.id,
          full_name: item.full_name,
          email: item.email,
          role: item.role,
          invitation_status: item.invitation_status,
          invited_at: item.invited_at,
          last_notified_at: item.last_notified_at,
          activation_expires_at: item.activation_expires_at,
          activated_at: item.activated_at,
          last_login_at: item.last_login_at,
        }));
      return [rows, []] as unknown as [any, any];
    }

    if (normalized.startsWith('select id, full_name, email, role, invitation_status, invited_at, last_notified_at, activation_expires_at, activated_at, last_login_at from customer_workspace_members where customer_account_id = ? and id = ? limit 1')) {
      const customerAccountId = Number(params[0]);
      const memberId = Number(params[1]);
      const member = this.state.workspaceMembers.find((item) => item.customer_account_id === customerAccountId && item.id === memberId);
      return [[member ? {
        id: member.id,
        full_name: member.full_name,
        email: member.email,
        role: member.role,
        invitation_status: member.invitation_status,
        invited_at: member.invited_at,
        last_notified_at: member.last_notified_at,
        activation_expires_at: member.activation_expires_at,
        activated_at: member.activated_at,
        last_login_at: member.last_login_at,
      } : undefined].filter(Boolean), []] as unknown as [any, any];
    }

    if (normalized.startsWith('select m.id, m.customer_account_id, m.full_name, m.email, m.password_hash, m.role, m.invitation_status, m.activation_token, m.activation_expires_at, m.activated_at, m.last_login_at, m.session_version, ca.account_type, ca.organization_name, ca.status as customer_status from customer_workspace_members m inner join customer_accounts ca on ca.id = m.customer_account_id where m.email = ?')) {
      const email = String(params[0] ?? '').trim().toLowerCase();
      const member = this.state.workspaceMembers.find((item) => item.email === email && item.invitation_status === 'active' && item.password_hash);
      if (!member) {
        return [[], []] as unknown as [any, any];
      }
      const account = this.state.customerAccounts.find((item) => item.id === member.customer_account_id)!;
      if (account.status !== 'active') {
        return [[], []] as unknown as [any, any];
      }
      return [[{
        id: member.id,
        customer_account_id: member.customer_account_id,
        full_name: member.full_name,
        email: member.email,
        password_hash: member.password_hash,
        role: member.role,
        invitation_status: member.invitation_status,
        activation_token: member.activation_token,
        activation_expires_at: member.activation_expires_at,
        activated_at: member.activated_at,
        last_login_at: member.last_login_at,
        session_version: member.session_version,
        account_type: account.account_type,
        organization_name: account.organization_name,
        customer_status: account.status,
      }], []] as unknown as [any, any];
    }

    if (normalized.startsWith('select m.id, m.customer_account_id, m.full_name, m.email, m.password_hash, m.role, m.invitation_status, m.activation_token, m.activation_expires_at, m.activated_at, m.last_login_at, m.session_version, ca.account_type, ca.organization_name, ca.status as customer_status from customer_workspace_members m inner join customer_accounts ca on ca.id = m.customer_account_id where m.customer_account_id = ? and m.id = ?')) {
      const customerAccountId = Number(params[0]);
      const memberId = Number(params[1]);
      const member = this.state.workspaceMembers.find((item) => item.customer_account_id === customerAccountId && item.id === memberId && item.invitation_status === 'active' && item.password_hash);
      if (!member) {
        return [[], []] as unknown as [any, any];
      }
      const account = this.state.customerAccounts.find((item) => item.id === member.customer_account_id)!;
      if (account.status !== 'active') {
        return [[], []] as unknown as [any, any];
      }
      return [[{
        id: member.id,
        customer_account_id: member.customer_account_id,
        full_name: member.full_name,
        email: member.email,
        password_hash: member.password_hash,
        role: member.role,
        invitation_status: member.invitation_status,
        activation_token: member.activation_token,
        activation_expires_at: member.activation_expires_at,
        activated_at: member.activated_at,
        last_login_at: member.last_login_at,
        session_version: member.session_version,
        account_type: account.account_type,
        organization_name: account.organization_name,
        customer_status: account.status,
      }], []] as unknown as [any, any];
    }

    if (normalized.startsWith('select m.id, m.customer_account_id, m.full_name, m.email, m.password_hash, m.role, m.invitation_status, m.activation_token, m.activation_expires_at, m.activated_at, m.last_login_at, m.session_version, ca.account_type, ca.organization_name, ca.status as customer_status from customer_workspace_members m inner join customer_accounts ca on ca.id = m.customer_account_id where m.activation_token = ?')) {
      const activationToken = String(params[0] ?? '');
      const member = this.state.workspaceMembers.find((item) => item.activation_token === activationToken && item.invitation_status === 'invited');
      if (!member) {
        return [[], []] as unknown as [any, any];
      }
      const account = this.state.customerAccounts.find((item) => item.id === member.customer_account_id)!;
      if (account.status !== 'active') {
        return [[], []] as unknown as [any, any];
      }
      return [[{
        id: member.id,
        customer_account_id: member.customer_account_id,
        full_name: member.full_name,
        email: member.email,
        password_hash: member.password_hash,
        role: member.role,
        invitation_status: member.invitation_status,
        activation_token: member.activation_token,
        activation_expires_at: member.activation_expires_at,
        activated_at: member.activated_at,
        last_login_at: member.last_login_at,
        session_version: member.session_version,
        account_type: account.account_type,
        organization_name: account.organization_name,
        customer_status: account.status,
      }], []] as unknown as [any, any];
    }

    if (normalized.startsWith('insert into customer_workspace_members')) {
      const now = new Date().toISOString();
      const customerAccountId = Number(params[0]);
      const email = String(params[2] ?? '').trim().toLowerCase();
      const existing = this.state.workspaceMembers.find((item) => item.customer_account_id === customerAccountId && item.email === email);

      if (existing) {
        existing.full_name = String(params[1] ?? existing.full_name);
        existing.role = params[3] as FakeWorkspaceMember['role'];
        return [{ insertId: existing.id }, []] as unknown as [any, any];
      }

      const member: FakeWorkspaceMember = {
        id: this.nextWorkspaceMemberId++,
        customer_account_id: customerAccountId,
        full_name: String(params[1] ?? ''),
        email,
        password_hash: null,
        role: params[3] as FakeWorkspaceMember['role'],
        invitation_status: 'invited',
        activation_token: null,
        activation_expires_at: null,
        invited_at: null,
        activated_at: null,
        last_login_at: null,
        last_notified_at: null,
        session_version: 1,
        created_at: now,
      };
      this.state.workspaceMembers.push(member);
      return [{ insertId: member.id }, []] as unknown as [any, any];
    }

    if (normalized.startsWith("update customer_workspace_members set invitation_status = 'invited', activation_token = ?, activation_expires_at = ?, invited_at = coalesce(invited_at, current_timestamp), last_notified_at = current_timestamp, updated_at = current_timestamp where id = ? and customer_account_id = ? and invitation_status = 'invited'")) {
      const activationToken = String(params[0] ?? '');
      const activationExpiresAt = String(params[1] ?? '');
      const memberId = Number(params[2]);
      const customerAccountId = Number(params[3]);
      const member = this.state.workspaceMembers.find((item) => item.id === memberId && item.customer_account_id === customerAccountId && item.invitation_status === 'invited');
      if (member) {
        const now = new Date().toISOString();
        member.activation_token = activationToken;
        member.activation_expires_at = activationExpiresAt;
        member.invited_at = member.invited_at ?? now;
        member.last_notified_at = now;
      }
      return [[{ affectedRows: member ? 1 : 0 }], []] as unknown as [any, any];
    }

    if (normalized.startsWith('update customer_workspace_members set last_notified_at = current_timestamp, updated_at = current_timestamp where id = ? and customer_account_id = ? and invitation_status = \'active\'')) {
      const memberId = Number(params[0]);
      const customerAccountId = Number(params[1]);
      const member = this.state.workspaceMembers.find((item) => item.id === memberId && item.customer_account_id === customerAccountId && item.invitation_status === 'active');
      if (member) {
        member.last_notified_at = new Date().toISOString();
      }
      return [[{ affectedRows: member ? 1 : 0 }], []] as unknown as [any, any];
    }

    if (normalized.startsWith('update customer_workspace_members set last_login_at = now() where customer_account_id = ? and id = ?')) {
      const customerAccountId = Number(params[0]);
      const memberId = Number(params[1]);
      const member = this.state.workspaceMembers.find((item) => item.customer_account_id === customerAccountId && item.id === memberId);
      if (member) {
        member.last_login_at = new Date().toISOString();
      }
      return [[{ affectedRows: member ? 1 : 0 }], []] as unknown as [any, any];
    }

    if (normalized.startsWith('update customer_workspace_members set session_version = session_version + 1,')) {
      const customerAccountId = Number(params[0]);
      const memberId = Number(params[1]);
      const member = this.state.workspaceMembers.find((item) => item.customer_account_id === customerAccountId && item.id === memberId);
      if (member) {
        member.session_version += 1;
      }
      return [[{ affectedRows: member ? 1 : 0 }], []] as unknown as [any, any];
    }

    if (normalized.startsWith("update customer_workspace_members set full_name = ?, password_hash = ?, invitation_status = 'active', activation_token = null, activation_expires_at = null, activated_at = current_timestamp, last_login_at = current_timestamp, session_version = session_version + 1, updated_at = current_timestamp where customer_account_id = ? and id = ? and invitation_status = 'invited'")) {
      const fullName = String(params[0] ?? '');
      const passwordHash = String(params[1] ?? '');
      const customerAccountId = Number(params[2]);
      const memberId = Number(params[3]);
      const member = this.state.workspaceMembers.find((item) => item.customer_account_id === customerAccountId && item.id === memberId && item.invitation_status === 'invited');
      if (member) {
        const now = new Date().toISOString();
        member.full_name = fullName;
        member.password_hash = passwordHash;
        member.invitation_status = 'active';
        member.activation_token = null;
        member.activation_expires_at = null;
        member.activated_at = now;
        member.last_login_at = now;
        member.session_version += 1;
      }
      return [[{ affectedRows: member ? 1 : 0 }], []] as unknown as [any, any];
    }

    if (normalized.includes('select id from participants where email = ?')) {
      const email = String(params[0] ?? '').trim().toLowerCase();
      const participant = this.state.participants.find((item) => item.email === email);
      return [[participant ? { id: participant.id } : undefined].filter(Boolean), []] as unknown as [any, any];
    }

    if (normalized.startsWith('update participants set')) {
      const participantId = Number(params[5]);
      const participant = this.state.participants.find((item) => item.id === participantId);
      if (participant) {
        participant.full_name = String(params[0] ?? participant.full_name);
        participant.employee_code = (params[1] as string | null) ?? null;
        participant.department = (params[2] as string | null) ?? null;
        participant.position_title = (params[3] as string | null) ?? null;
        participant.metadata_json = (params[4] as string | null) ?? null;
      }
      return [[{ affectedRows: participant ? 1 : 0 }], []] as unknown as [any, any];
    }

    if (normalized.startsWith('insert into participants')) {
      const participant: FakeParticipant = {
        id: this.nextParticipantId++,
        full_name: String(params[0] ?? ''),
        email: String(params[1] ?? '').trim().toLowerCase(),
        employee_code: (params[2] as string | null) ?? null,
        department: (params[3] as string | null) ?? null,
        position_title: (params[4] as string | null) ?? null,
        metadata_json: (params[5] as string | null) ?? null,
      };
      this.state.participants.push(participant);
      return [{ insertId: participant.id }, []] as unknown as [any, any];
    }

    if (normalized.includes('select coalesce(max(attempt_no), 0) + 1 as next_attempt from submissions')) {
      const sessionId = Number(params[0]);
      const participantId = Number(params[1]);
      const attempts = this.state.submissions
        .filter((item) => item.test_session_id === sessionId && item.participant_id === participantId)
        .map((item) => item.attempt_no);
      const nextAttempt = attempts.length === 0 ? 1 : Math.max(...attempts) + 1;
      return [[{ next_attempt: nextAttempt }], []] as unknown as [any, any];
    }

    if (normalized.includes('select count(distinct participant_id) as participant_count from submissions where test_session_id = ?')) {
      const sessionId = Number(params[0]);
      const participantIds = new Set(
        this.state.submissions
          .filter((item) => item.test_session_id === sessionId)
          .map((item) => item.participant_id),
      );
      return [[{ participant_count: participantIds.size }], []] as unknown as [any, any];
    }

    if (normalized.startsWith('insert into submissions')) {
      const submission: FakeSubmission = {
        id: this.nextSubmissionId++,
        test_session_id: Number(params[0]),
        participant_id: Number(params[1]),
        attempt_no: Number(params[2]),
        status: 'in_progress',
        started_at: new Date().toISOString(),
        submitted_at: null,
        consent_given_at: params[3] instanceof Date ? params[3].toISOString() : String(params[3] ?? ''),
        consent_payload_json: (params[4] as string | null) ?? null,
        identity_snapshot_json: (params[5] as string | null) ?? null,
        answer_sequence: 0,
        raw_score: null,
      };
      this.state.submissions.push(submission);
      return [{ insertId: submission.id }, []] as unknown as [any, any];
    }

    if (normalized.includes('from test_sessions ts inner join test_types tt on tt.id = ts.test_type_id where ts.id = ? limit 1')) {
      const sessionId = Number(params[0]);
      const session = this.state.sessions.find((item) => item.id === sessionId);
      if (!session) {
        return [[], []] as unknown as [any, any];
      }

      const testType = this.state.testTypes.find((item) => item.id === session.test_type_id)!;
      return [[{
        session_id: session.id,
        test_type_id: session.test_type_id,
        title: session.title,
        access_token: session.access_token,
        instructions: session.instructions,
        time_limit_minutes: session.time_limit_minutes,
        settings_json: session.settings_json,
        status: session.status,
        test_type_code: testType.code,
      }], []] as unknown as [any, any];
    }

    if (normalized.includes('from submissions s inner join participants p on p.id = s.participant_id inner join test_sessions ts on ts.id = s.test_session_id inner join test_types tt on tt.id = ts.test_type_id where s.id = ? limit 1')) {
      const submissionId = Number(params[0]);
      const submission = this.state.submissions.find((item) => item.id === submissionId);
      if (!submission) {
        return [[], []] as unknown as [any, any];
      }

      const participant = this.state.participants.find((item) => item.id === submission.participant_id)!;
      const session = this.state.sessions.find((item) => item.id === submission.test_session_id)!;
      const testType = this.state.testTypes.find((item) => item.id === session.test_type_id)!;
      return [[{
        submission_id: submission.id,
        participant_id: participant.id,
        participant_name: participant.full_name,
        session_id: session.id,
        access_token: session.access_token,
        test_type_code: testType.code,
        submission_status: submission.status,
        answer_sequence: submission.answer_sequence,
      }], []] as unknown as [any, any];
    }

    if (normalized.startsWith('select s.id, s.status, ts.test_type_id, s.answer_sequence from submissions s inner join test_sessions ts on ts.id = s.test_session_id where s.id = ? limit 1')) {
      const submissionId = Number(params[0]);
      const submission = this.state.submissions.find((item) => item.id === submissionId);
      if (!submission) {
        return [[], []] as unknown as [any, any];
      }

      const session = this.state.sessions.find((item) => item.id === submission.test_session_id)!;
      return [[{ id: submission.id, status: submission.status, test_type_id: session.test_type_id, answer_sequence: submission.answer_sequence }], []] as unknown as [any, any];
    }

    if (normalized.startsWith('select question_id, answer_role, selected_option_id, value_number from answers where submission_id = ?')) {
      const submissionId = Number(params[0]);
      const rows = this.state.answers
        .filter((item) => item.submission_id === submissionId)
        .sort((left, right) => left.question_id - right.question_id || left.id - right.id)
        .map((item) => ({
          question_id: item.question_id,
          answer_role: item.answer_role,
          selected_option_id: item.selected_option_id,
          value_number: item.value_number,
        }));
      return [rows, []] as unknown as [any, any];
    }

    if (normalized.startsWith('delete from answers where submission_id = ? and question_id in')) {
      const submissionId = Number(params[0]);
      const questionIds = params.slice(1).map((item) => Number(item));
      this.state.answers = this.state.answers.filter((item) => !(item.submission_id === submissionId && questionIds.includes(item.question_id)));
      return [[{ affectedRows: 1 }], []] as unknown as [any, any];
    }

    if (normalized.startsWith('insert into answers')) {
      let answer: FakeAnswer;

      if (normalized.includes("values (?, ?, 'most'")) {
        answer = {
          id: this.nextAnswerId++,
          submission_id: Number(params[0]),
          question_id: Number(params[1]),
          answer_role: 'most',
          selected_option_id: Number(params[2]),
          value_number: null,
          answer_payload_json: (params[3] as string | null) ?? null,
        };
      } else if (normalized.includes("values (?, ?, 'least'")) {
        answer = {
          id: this.nextAnswerId++,
          submission_id: Number(params[0]),
          question_id: Number(params[1]),
          answer_role: 'least',
          selected_option_id: Number(params[2]),
          value_number: null,
          answer_payload_json: (params[3] as string | null) ?? null,
        };
      } else {
        answer = {
          id: this.nextAnswerId++,
          submission_id: Number(params[0]),
          question_id: Number(params[1]),
          answer_role: params[2] as FakeAnswer['answer_role'],
          selected_option_id: params[3] === null || params[3] === undefined ? null : Number(params[3]),
          value_number: (params[4] as number | null) ?? null,
          answer_payload_json: (params[5] as string | null) ?? null,
        };
      }

      this.state.answers.push(answer);
      return [{ insertId: answer.id }, []] as unknown as [any, any];
    }

    if (normalized.startsWith('update submissions set answer_sequence = ?, updated_at = current_timestamp where id = ?')) {
      const answerSequence = Number(params[0]);
      const submissionId = Number(params[1]);
      const submission = this.state.submissions.find((item) => item.id === submissionId);
      if (submission) {
        submission.answer_sequence = answerSequence;
      }
      return [[{ affectedRows: submission ? 1 : 0 }], []] as unknown as [any, any];
    }

    if (normalized.includes('select count(distinct question_id) as answered_question_count from answers where submission_id = ?')) {
      const submissionId = Number(params[0]);
      const count = new Set(this.state.answers.filter((item) => item.submission_id === submissionId).map((item) => item.question_id)).size;
      return [[{ answered_question_count: count }], []] as unknown as [any, any];
    }

    if (normalized.startsWith('select id, result_payload_json from results where submission_id = ? limit 1')) {
      const submissionId = Number(params[0]);
      const result = this.state.results.find((item) => item.submission_id === submissionId);
      return [[result ? { id: result.id, result_payload_json: result.result_payload_json } : undefined].filter(Boolean), []] as unknown as [any, any];
    }

    if (normalized.startsWith('insert into results')) {
      const submissionId = Number(params[0]);
      const existing = this.state.results.find((item) => item.submission_id === submissionId);
      const now = new Date().toISOString();

      if (existing) {
        existing.test_type_id = Number(params[1]);
        existing.score_total = (params[2] as number | null) ?? null;
        existing.score_band = (params[3] as string | null) ?? null;
        existing.primary_type = (params[4] as string | null) ?? null;
        existing.secondary_type = (params[5] as string | null) ?? null;
        existing.profile_code = (params[6] as string | null) ?? null;
        existing.interpretation_key = (params[7] as string | null) ?? null;
        existing.result_payload_json = String(params[8] ?? '{}');
        existing.updated_at = now;
        return [{ insertId: existing.id }, []] as unknown as [any, any];
      }

      const result: FakeResult = {
        id: this.nextResultId++,
        submission_id: submissionId,
        test_type_id: Number(params[1]),
        score_total: (params[2] as number | null) ?? null,
        score_band: (params[3] as string | null) ?? null,
        primary_type: (params[4] as string | null) ?? null,
        secondary_type: (params[5] as string | null) ?? null,
        profile_code: (params[6] as string | null) ?? null,
        interpretation_key: (params[7] as string | null) ?? null,
        result_payload_json: String(params[8] ?? '{}'),
        created_at: now,
        updated_at: now,
      };
      this.state.results.push(result);
      return [{ insertId: result.id }, []] as unknown as [any, any];
    }

    if (normalized.startsWith('select id from results where submission_id = ? limit 1')) {
      const submissionId = Number(params[0]);
      const result = this.state.results.find((item) => item.submission_id === submissionId);
      return [[result ? { id: result.id } : undefined].filter(Boolean), []] as unknown as [any, any];
    }

    if (normalized.startsWith('delete from result_summaries where result_id = ?')) {
      const resultId = Number(params[0]);
      this.state.resultSummaries = this.state.resultSummaries.filter((item) => item.result_id !== resultId);
      return [[{ affectedRows: 1 }], []] as unknown as [any, any];
    }

    if (normalized.startsWith('insert into result_summaries')) {
      const summary: FakeResultSummary = {
        id: this.nextResultSummaryId++,
        result_id: Number(params[0]),
        metric_key: String(params[1] ?? ''),
        metric_label: String(params[2] ?? ''),
        metric_type: String(params[3] ?? ''),
        score: Number(params[4] ?? 0),
        band: (params[5] as string | null) ?? null,
        sort_order: Number(params[6] ?? 0),
      };
      this.state.resultSummaries.push(summary);
      return [{ insertId: summary.id }, []] as unknown as [any, any];
    }

    if (normalized.includes('from results r inner join submissions s on s.id = r.submission_id inner join participants p on p.id = s.participant_id inner join test_sessions ts on ts.id = s.test_session_id inner join test_types tt on tt.id = r.test_type_id where r.submission_id = ? limit 1')) {
      const submissionId = Number(params[0]);
      const result = this.state.results.find((item) => item.submission_id === submissionId);
      if (!result) {
        return [[], []] as unknown as [any, any];
      }

      const submission = this.state.submissions.find((item) => item.id === result.submission_id)!;
      const participant = this.state.participants.find((item) => item.id === submission.participant_id)!;
      const session = this.state.sessions.find((item) => item.id === submission.test_session_id)!;
      const testType = this.state.testTypes.find((item) => item.id === session.test_type_id)!;
      return [[{
        id: result.id,
        submission_id: submission.id,
        participant_id: participant.id,
        participant_name: participant.full_name,
        participant_email: participant.email,
        employee_code: participant.employee_code,
        department: participant.department,
        position_title: participant.position_title,
        session_id: session.id,
        session_title: session.title,
        access_token: session.access_token,
        test_type: testType.code,
        submitted_at: submission.submitted_at ?? result.created_at,
        score_total: result.score_total,
        score_band: result.score_band,
        primary_type: result.primary_type,
        secondary_type: result.secondary_type,
        profile_code: result.profile_code,
        interpretation_key: result.interpretation_key,
        result_payload_json: result.result_payload_json,
        settings_json: session.settings_json,
      }], []] as unknown as [any, any];
    }

    if (normalized.includes('from results r inner join submissions s on s.id = r.submission_id inner join participants p on p.id = s.participant_id inner join test_sessions ts on ts.id = s.test_session_id inner join test_types tt on tt.id = r.test_type_id where r.id = ? limit 1')) {
      const resultId = Number(params[0]);
      const result = this.state.results.find((item) => item.id === resultId);
      if (!result) {
        return [[], []] as unknown as [any, any];
      }

      const submission = this.state.submissions.find((item) => item.id === result.submission_id)!;
      const participant = this.state.participants.find((item) => item.id === submission.participant_id)!;
      const session = this.state.sessions.find((item) => item.id === submission.test_session_id)!;
      const testType = this.state.testTypes.find((item) => item.id === session.test_type_id)!;
      return [[{
        id: result.id,
        submission_id: submission.id,
        participant_id: participant.id,
        participant_name: participant.full_name,
        participant_email: participant.email,
        employee_code: participant.employee_code,
        department: participant.department,
        position_title: participant.position_title,
        session_id: session.id,
        session_title: session.title,
        access_token: session.access_token,
        test_type: testType.code,
        submitted_at: submission.submitted_at ?? result.created_at,
        score_total: result.score_total,
        score_band: result.score_band,
        primary_type: result.primary_type,
        secondary_type: result.secondary_type,
        profile_code: result.profile_code,
        interpretation_key: result.interpretation_key,
        result_payload_json: result.result_payload_json,
        settings_json: session.settings_json,
      }], []] as unknown as [any, any];
    }

    if (normalized.startsWith('select result_id, metric_key, metric_label, score, band from result_summaries where result_id in')) {
      const resultIds = params.map((item) => Number(item));
      const rows = this.state.resultSummaries
        .filter((item) => resultIds.includes(item.result_id))
        .sort((left, right) => left.sort_order - right.sort_order || left.id - right.id)
        .map((item) => ({
          result_id: item.result_id,
          metric_key: item.metric_key,
          metric_label: item.metric_label,
          score: item.score,
          band: item.band,
        }));
      return [rows, []] as unknown as [any, any];
    }

    if (normalized.startsWith("update submissions set status = 'scored', submitted_at = ?, raw_score = ? where id = ?")) {
      const submittedAt = String(params[0] ?? new Date().toISOString());
      const rawScore = Number(params[1] ?? 0);
      const submissionId = Number(params[2]);
      const submission = this.state.submissions.find((item) => item.id === submissionId);
      if (submission) {
        submission.status = 'scored';
        submission.submitted_at = submittedAt;
        submission.raw_score = rawScore;
      }
      return [[{ affectedRows: submission ? 1 : 0 }], []] as unknown as [any, any];
    }

    if (normalized.includes('from audit_logs al') && normalized.includes("json_extract(al.metadata_json, '$.customeraccountid')")) {
      const customerAccountId = Number(params[0]);
      const rows = this.state.auditLogs
        .filter((item) => {
          if (!item.metadata_json) {
            return false;
          }

          try {
            const metadata = JSON.parse(item.metadata_json) as Record<string, unknown>;
            return Number(metadata.customerAccountId ?? -1) === customerAccountId;
          } catch {
            return false;
          }
        })
        .sort((left, right) => {
          const createdAtDelta = new Date(right.created_at).getTime() - new Date(left.created_at).getTime();
          return createdAtDelta || right.id - left.id;
        })
        .map((item) => ({
          ...item,
          actor_name: this.state.admins.find((admin) => admin.id === item.actor_admin_id)?.full_name ?? null,
        }));
      return [rows, []] as unknown as [any, any];
    }
    if (normalized.startsWith('insert into audit_logs')) {
      const auditLog: FakeAuditLog = {
        id: this.nextAuditId++,
        actor_type: params[0] as FakeAuditLog['actor_type'],
        actor_admin_id: (params[1] as number | null) ?? null,
        entity_type: String(params[2] ?? ''),
        entity_id: (params[3] as number | null) ?? null,
        action: String(params[4] ?? ''),
        metadata_json: (params[5] as string | null) ?? null,
        created_at: new Date().toISOString(),
      };
      this.state.auditLogs.push(auditLog);
      return [{ insertId: auditLog.id }, []] as unknown as [any, any];
    }

    throw new Error(`Unsupported fake DB query: ${sql}`);
  }
}










