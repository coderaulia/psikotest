import type mysql from 'mysql2/promise';

import type { DbPoolLike } from '../../database/mysql.js';

interface FakeAdmin {
  id: number;
  full_name: string;
  email: string;
  password_hash: string;
  role: 'super_admin' | 'admin';
  status: 'active' | 'inactive';
  last_login_at: string | null;
}

interface FakeCustomerAccount {
  id: number;
  full_name: string;
  email: string;
  password_hash: string;
  account_type: 'business' | 'researcher';
  organization_name: string;
  status: 'active' | 'inactive';
  last_login_at: string | null;
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
}

interface FakeQuestion {
  id: number;
  test_type_id: number;
  question_code: string;
  instruction_text: string | null;
  prompt: string | null;
  dimension_key: string | null;
  question_type: 'single_choice' | 'forced_choice' | 'likert';
}

interface FakeOption {
  id: number;
  question_id: number;
  option_key: string;
  option_text: string;
  dimension_key: string | null;
  value_number: number | null;
  is_correct: number;
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
  consent_given_at: string | null;
  consent_payload_json: string | null;
  identity_snapshot_json: string | null;
}

interface FakeAuditLog {
  id: number;
  actor_type: 'admin' | 'participant' | 'system';
  actor_admin_id: number | null;
  entity_type: string;
  entity_id: number | null;
  action: string;
  metadata_json: string | null;
}

export interface FakeDbState {
  admins: FakeAdmin[];
  customerAccounts: FakeCustomerAccount[];
  customerAssessments: FakeCustomerAssessment[];
  testTypes: FakeTestType[];
  sessions: FakeSession[];
  questions: FakeQuestion[];
  options: FakeOption[];
  participants: FakeParticipant[];
  submissions: FakeSubmission[];
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
  private nextParticipantId = 100;
  private nextSubmissionId = 500;
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

    if (state.participants.length > 0) {
      this.nextParticipantId = Math.max(...state.participants.map((item) => item.id)) + 1;
    }

    if (state.submissions.length > 0) {
      this.nextSubmissionId = Math.max(...state.submissions.map((item) => item.id)) + 1;
    }

    if (state.auditLogs.length > 0) {
      this.nextAuditId = Math.max(...state.auditLogs.map((item) => item.id)) + 1;
    }
  }

  async getConnection() {
    return new FakeConnection(this) as unknown as mysql.PoolConnection;
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
        status: 'active',
        last_login_at: now,
        created_at: now,
        updated_at: now,
      };
      this.state.customerAccounts.push(account);
      return [{ insertId: account.id }, []] as unknown as [any, any];
    }

    if (normalized.startsWith('update customer_accounts set last_login_at = now()')) {
      const accountId = Number(params[0]);
      const account = this.state.customerAccounts.find((item) => item.id === accountId);
      if (account) {
        account.last_login_at = new Date().toISOString();
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
      const isCustomerInsert = normalized.includes("values (?, ?, ?, ?, ?, ?, ?, 'draft', null, null, ?)");
      const session: FakeSession = {
        id: this.nextSessionId++,
        test_type_id: Number(params[0]),
        title: String(params[1] ?? ''),
        description: (params[2] as string | null) ?? null,
        access_token: String(params[3] ?? ''),
        instructions: (params[4] as string | null) ?? null,
        settings_json: String(params[5] ?? '{}'),
        time_limit_minutes: (params[6] as number | null) ?? null,
        status: isCustomerInsert ? 'draft' : (params[7] as FakeSession['status']),
        created_by_admin_id: Number(isCustomerInsert ? params[7] : params[10] ?? 0),
        created_at: now,
      };
      this.state.sessions.push(session);
      return [{ insertId: session.id }, []] as unknown as [any, any];
    }

    if (normalized.startsWith('insert into customer_assessments')) {
      const assessment: FakeCustomerAssessment = {
        id: this.nextCustomerAssessmentId++,
        customer_account_id: Number(params[0]),
        test_session_id: Number(params[1]),
        organization_name_snapshot: String(params[2] ?? ''),
        onboarding_status: 'ready',
        plan_status: 'trial',
        created_at: new Date().toISOString(),
      };
      this.state.customerAssessments.push(assessment);
      return [{ insertId: assessment.id }, []] as unknown as [any, any];
    }

    if (normalized.includes('from customer_assessments ca inner join test_sessions ts on ts.id = ca.test_session_id inner join test_types tt on tt.id = ts.test_type_id where ca.customer_account_id = ? and ca.test_session_id = ?')) {
      const accountId = Number(params[0]);
      const sessionId = Number(params[1]);
      const assessment = this.state.customerAssessments.find((item) => item.customer_account_id === accountId && item.test_session_id === sessionId);
      if (!assessment) {
        return [[], []] as unknown as [any, any];
      }
      const session = this.state.sessions.find((item) => item.id === assessment.test_session_id)!;
      const testType = this.state.testTypes.find((item) => item.id === session.test_type_id)!;
      return [[{
        assessment_id: assessment.id,
        session_id: session.id,
        title: session.title,
        organization_name_snapshot: assessment.organization_name_snapshot,
        test_type: testType.code,
        time_limit_minutes: session.time_limit_minutes,
        settings_json: session.settings_json,
        session_status: session.status,
        plan_status: assessment.plan_status,
        access_token: session.access_token,
        created_at: assessment.created_at,
      }], []] as unknown as [any, any];
    }

    if (normalized.includes('from customer_assessments ca inner join test_sessions ts on ts.id = ca.test_session_id inner join test_types tt on tt.id = ts.test_type_id where ca.customer_account_id = ? order by ca.created_at desc')) {
      const accountId = Number(params[0]);
      const rows = this.state.customerAssessments
        .filter((item) => item.customer_account_id === accountId)
        .sort((left, right) => right.id - left.id)
        .map((assessment) => {
          const session = this.state.sessions.find((item) => item.id === assessment.test_session_id)!;
          const testType = this.state.testTypes.find((item) => item.id === session.test_type_id)!;
          return {
            assessment_id: assessment.id,
            session_id: session.id,
            title: session.title,
            organization_name_snapshot: assessment.organization_name_snapshot,
            test_type: testType.code,
            time_limit_minutes: session.time_limit_minutes,
            settings_json: session.settings_json,
            session_status: session.status,
            plan_status: assessment.plan_status,
            access_token: session.access_token,
            created_at: assessment.created_at,
          };
        });
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

    if (normalized.includes('from questions q where q.test_type_id = ?') && normalized.includes('order by q.question_order asc')) {
      const testTypeId = Number(params[0]);
      const rows = this.state.questions
        .filter((item) => item.test_type_id === testTypeId)
        .map((item) => ({
          id: item.id,
          question_code: item.question_code,
          instruction_text: item.instruction_text,
          prompt: item.prompt,
          dimension_key: item.dimension_key,
          question_type: item.question_type,
        }));
      return [rows, []] as unknown as [any, any];
    }

    if (normalized.includes('from question_options qo where qo.question_id in')) {
      const questionIds = params.map((item) => Number(item));
      const rows = this.state.options
        .filter((item) => questionIds.includes(item.question_id))
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
        consent_given_at: params[3] instanceof Date ? params[3].toISOString() : String(params[3] ?? ''),
        consent_payload_json: (params[4] as string | null) ?? null,
        identity_snapshot_json: (params[5] as string | null) ?? null,
      };
      this.state.submissions.push(submission);
      return [{ insertId: submission.id }, []] as unknown as [any, any];
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
      };
      this.state.auditLogs.push(auditLog);
      return [{ insertId: auditLog.id }, []] as unknown as [any, any];
    }

    throw new Error(`Unsupported fake DB query: ${sql}`);
  }
}
