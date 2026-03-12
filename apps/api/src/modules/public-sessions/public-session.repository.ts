import type { PoolConnection, RowDataPacket } from 'mysql2/promise';

import { getDbPool } from '../../database/mysql.js';
import { HttpError } from '../../lib/http-error.js';
import {
  getParticipantResultMode,
  parseTestSessionSettings,
} from '../test-sessions/session-settings.js';
import type {
  ParticipantIdentityInput,
  PublicSessionDefinition,
  PublicTestTypeCode,
  SubmissionAnswerInput,
} from './public-session.types.js';

interface SessionRow extends RowDataPacket {
  session_id: number;
  test_type_id: number;
  title: string;
  access_token: string;
  instructions: string | null;
  time_limit_minutes: number | null;
  settings_json: string | Record<string, unknown> | null;
  status: 'active';
  test_type_code: PublicTestTypeCode;
}

interface QuestionRow extends RowDataPacket {
  id: number;
  question_code: string;
  instruction_text: string | null;
  prompt: string | null;
  dimension_key: string | null;
  question_type: 'single_choice' | 'forced_choice' | 'likert';
}

interface OptionRow extends RowDataPacket {
  id: number;
  question_id: number;
  option_key: string;
  option_text: string;
  dimension_key: string | null;
  value_number: number | null;
  is_correct: number;
}

interface SubmissionContextRow extends RowDataPacket {
  submission_id: number;
  participant_id: number;
  participant_name: string;
  session_id: number;
  test_type_code: PublicTestTypeCode;
}

interface StoredAnswerRow extends RowDataPacket {
  question_id: number;
  answer_role: 'single' | 'most' | 'least' | 'scale';
  selected_option_id: number | null;
  value_number: number | null;
}

function parseInstructions(instructions: string | null) {
  return (instructions ?? '')
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

async function loadSessionRowByToken(token: string) {
  const pool = getDbPool();
  const [rows] = await pool.query<SessionRow[]>(
    `
      SELECT
        ts.id AS session_id,
        ts.test_type_id,
        ts.title,
        ts.access_token,
        ts.instructions,
        ts.time_limit_minutes,
        ts.settings_json,
        ts.status,
        tt.code AS test_type_code
      FROM test_sessions ts
      INNER JOIN test_types tt ON tt.id = ts.test_type_id
      WHERE ts.access_token = ?
        AND ts.status = 'active'
      LIMIT 1
    `,
    [token],
  );

  return rows[0] ?? null;
}

async function loadSessionRowById(sessionId: number) {
  const pool = getDbPool();
  const [rows] = await pool.query<SessionRow[]>(
    `
      SELECT
        ts.id AS session_id,
        ts.test_type_id,
        ts.title,
        ts.access_token,
        ts.instructions,
        ts.time_limit_minutes,
        ts.settings_json,
        ts.status,
        tt.code AS test_type_code
      FROM test_sessions ts
      INNER JOIN test_types tt ON tt.id = ts.test_type_id
      WHERE ts.id = ?
      LIMIT 1
    `,
    [sessionId],
  );

  return rows[0] ?? null;
}

async function loadQuestionsByTestType(testTypeId: number) {
  const pool = getDbPool();
  const [questionRows] = await pool.query<QuestionRow[]>(
    `
      SELECT
        q.id,
        q.question_code,
        q.instruction_text,
        q.prompt,
        q.dimension_key,
        q.question_type
      FROM questions q
      WHERE q.test_type_id = ?
        AND q.status = 'active'
      ORDER BY q.question_order ASC
    `,
    [testTypeId],
  );

  if (questionRows.length === 0) {
    return [];
  }

  const questionIds = questionRows.map((question) => question.id);
  const placeholders = questionIds.map(() => '?').join(', ');
  const [optionRows] = await pool.query<OptionRow[]>(
    `
      SELECT
        qo.id,
        qo.question_id,
        qo.option_key,
        qo.option_text,
        qo.dimension_key,
        qo.value_number,
        qo.is_correct
      FROM question_options qo
      WHERE qo.question_id IN (${placeholders})
      ORDER BY qo.question_id ASC, qo.option_order ASC
    `,
    questionIds,
  );

  return questionRows.map((question) => ({
    id: question.id,
    code: question.question_code,
    questionType: question.question_type,
    instructionText: question.instruction_text ?? undefined,
    prompt: question.prompt ?? undefined,
    dimensionKey: question.dimension_key ?? undefined,
    options: optionRows
      .filter((option) => option.question_id === question.id)
      .map((option) => ({
        id: option.id,
        key: option.option_key,
        label: option.option_text,
        dimensionKey: option.dimension_key ?? undefined,
        value: option.value_number ?? undefined,
        isCorrect: Boolean(option.is_correct),
      })),
  }));
}

export async function findPublicSessionByToken(token: string): Promise<PublicSessionDefinition | null> {
  const sessionRow = await loadSessionRowByToken(token);

  if (!sessionRow) {
    return null;
  }

  const settings = parseTestSessionSettings(sessionRow.settings_json);
  const questions = await loadQuestionsByTestType(sessionRow.test_type_id);

  return {
    session: {
      id: sessionRow.session_id,
      title: sessionRow.title,
      testType: sessionRow.test_type_code,
      instructions: parseInstructions(sessionRow.instructions),
      estimatedMinutes: sessionRow.time_limit_minutes ?? 15,
      status: sessionRow.status,
      compliance: {
        ...settings,
        participantResultMode: getParticipantResultMode(settings),
      },
    },
    questions,
  };
}

async function resolveParticipantId(
  connection: PoolConnection,
  participant: ParticipantIdentityInput,
): Promise<number> {
  const [existingRows] = await connection.query<RowDataPacket[]>(
    `
      SELECT id
      FROM participants
      WHERE email = ?
      ORDER BY id DESC
      LIMIT 1
    `,
    [participant.email],
  );

  const metadata = JSON.stringify({
    source: 'public_session',
    age: participant.age ?? null,
    educationLevel: participant.educationLevel ?? null,
    appliedPosition: participant.appliedPosition ?? null,
    currentPosition: participant.position ?? null,
    latestConsentAcceptedAt: participant.consentAcceptedAt,
  });

  if (existingRows[0]) {
    const participantId = Number(existingRows[0].id);
    await connection.query(
      `
        UPDATE participants
        SET
          full_name = ?,
          employee_code = ?,
          department = ?,
          position_title = ?,
          metadata_json = ?
        WHERE id = ?
      `,
      [
        participant.fullName,
        participant.employeeCode ?? null,
        participant.department ?? null,
        participant.position ?? participant.appliedPosition ?? null,
        metadata,
        participantId,
      ],
    );

    return participantId;
  }

  const [insertResult] = await connection.query(
    `
      INSERT INTO participants (
        full_name,
        email,
        employee_code,
        department,
        position_title,
        metadata_json
      )
      VALUES (?, ?, ?, ?, ?, ?)
    `,
    [
      participant.fullName,
      participant.email,
      participant.employeeCode ?? null,
      participant.department ?? null,
      participant.position ?? participant.appliedPosition ?? null,
      metadata,
    ],
  );

  return Number((insertResult as { insertId: number }).insertId);
}

export async function createSubmissionForToken(token: string, participant: ParticipantIdentityInput) {
  const sessionRow = await loadSessionRowByToken(token);

  if (!sessionRow) {
    return null;
  }

  const settings = parseTestSessionSettings(sessionRow.settings_json);
  const participantResultMode = getParticipantResultMode(settings);
  const pool = getDbPool();
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const participantId = await resolveParticipantId(connection, participant);
    const [attemptRows] = await connection.query<RowDataPacket[]>(
      `
        SELECT COALESCE(MAX(attempt_no), 0) + 1 AS next_attempt
        FROM submissions
        WHERE test_session_id = ?
          AND participant_id = ?
      `,
      [sessionRow.session_id, participantId],
    );

    const attemptNo = Number(attemptRows[0]?.next_attempt ?? 1);

    if (settings.participantLimit && attemptNo === 1) {
      const [participantCountRows] = await connection.query<RowDataPacket[]>(
        `
          SELECT COUNT(DISTINCT participant_id) AS participant_count
          FROM submissions
          WHERE test_session_id = ?
        `,
        [sessionRow.session_id],
      );

      const participantCount = Number(participantCountRows[0]?.participant_count ?? 0);
      if (participantCount >= settings.participantLimit) {
        throw new HttpError(409, 'Participant limit reached for this session');
      }
    }

    const identitySnapshot = JSON.stringify({
      fullName: participant.fullName,
      email: participant.email,
      employeeCode: participant.employeeCode ?? null,
      department: participant.department ?? null,
      position: participant.position ?? null,
      appliedPosition: participant.appliedPosition ?? null,
      age: participant.age ?? null,
      educationLevel: participant.educationLevel ?? null,
    });
    const consentPayload = JSON.stringify({
      accepted: participant.consentAccepted,
      acceptedAt: participant.consentAcceptedAt,
      assessmentPurpose: settings.assessmentPurpose,
      administrationMode: settings.administrationMode,
      contactPerson: settings.contactPerson,
    });

    const [insertResult] = await connection.query(
      `
        INSERT INTO submissions (
          test_session_id,
          participant_id,
          attempt_no,
          status,
          started_at,
          consent_given_at,
          consent_payload_json,
          identity_snapshot_json
        )
        VALUES (?, ?, ?, 'in_progress', NOW(), ?, ?, ?)
      `,
      [
        sessionRow.session_id,
        participantId,
        attemptNo,
        new Date(participant.consentAcceptedAt),
        consentPayload,
        identitySnapshot,
      ],
    );

    await connection.commit();

    return {
      submissionId: Number((insertResult as { insertId: number }).insertId),
      participantId,
      token,
      status: 'in_progress' as const,
      testType: sessionRow.test_type_code,
      participantResultMode,
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function replaceSubmissionAnswers(submissionId: number, answers: SubmissionAnswerInput[]) {
  const pool = getDbPool();
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [submissionRows] = await connection.query<RowDataPacket[]>(
      'SELECT id FROM submissions WHERE id = ? LIMIT 1',
      [submissionId],
    );

    if (!submissionRows[0]) {
      throw new Error('Submission not found');
    }

    await connection.query('DELETE FROM answers WHERE submission_id = ?', [submissionId]);

    for (const answer of answers) {
      if (answer.mostOptionId) {
        await connection.query(
          `
            INSERT INTO answers (
              submission_id,
              question_id,
              answer_role,
              selected_option_id,
              answer_payload_json
            )
            VALUES (?, ?, 'most', ?, ?)
          `,
          [submissionId, answer.questionId, answer.mostOptionId, JSON.stringify({ source: 'api' })],
        );
      }

      if (answer.leastOptionId) {
        await connection.query(
          `
            INSERT INTO answers (
              submission_id,
              question_id,
              answer_role,
              selected_option_id,
              answer_payload_json
            )
            VALUES (?, ?, 'least', ?, ?)
          `,
          [submissionId, answer.questionId, answer.leastOptionId, JSON.stringify({ source: 'api' })],
        );
      }

      if (answer.selectedOptionId) {
        const answerRole = typeof answer.value === 'number' ? 'scale' : 'single';
        await connection.query(
          `
            INSERT INTO answers (
              submission_id,
              question_id,
              answer_role,
              selected_option_id,
              value_number,
              answer_payload_json
            )
            VALUES (?, ?, ?, ?, ?, ?)
          `,
          [
            submissionId,
            answer.questionId,
            answerRole,
            answer.selectedOptionId,
            answer.value ?? null,
            JSON.stringify({ source: 'api' }),
          ],
        );
      }
    }

    await connection.commit();
    return { submissionId, saved: true, answerCount: answers.length, status: 'in_progress' as const };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function loadSubmissionScoringContext(submissionId: number) {
  const pool = getDbPool();
  const [contextRows] = await pool.query<SubmissionContextRow[]>(
    `
      SELECT
        s.id AS submission_id,
        s.participant_id,
        p.full_name AS participant_name,
        ts.id AS session_id,
        tt.code AS test_type_code
      FROM submissions s
      INNER JOIN participants p ON p.id = s.participant_id
      INNER JOIN test_sessions ts ON ts.id = s.test_session_id
      INNER JOIN test_types tt ON tt.id = ts.test_type_id
      WHERE s.id = ?
      LIMIT 1
    `,
    [submissionId],
  );

  const contextRow = contextRows[0];
  if (!contextRow) {
    return null;
  }

  const sessionRow = await loadSessionRowById(contextRow.session_id);
  if (!sessionRow) {
    return null;
  }

  const definition = await findPublicSessionByToken(sessionRow.access_token);
  if (!definition) {
    return null;
  }

  const [answerRows] = await pool.query<StoredAnswerRow[]>(
    `
      SELECT
        question_id,
        answer_role,
        selected_option_id,
        value_number
      FROM answers
      WHERE submission_id = ?
      ORDER BY question_id ASC, id ASC
    `,
    [submissionId],
  );

  const answerMap = new Map<number, SubmissionAnswerInput>();

  for (const row of answerRows) {
    const current: SubmissionAnswerInput = answerMap.get(row.question_id) ?? { questionId: row.question_id };

    if (row.answer_role === 'most') {
      current.mostOptionId = row.selected_option_id ?? undefined;
    }

    if (row.answer_role === 'least') {
      current.leastOptionId = row.selected_option_id ?? undefined;
    }

    if (row.answer_role === 'single') {
      current.selectedOptionId = row.selected_option_id ?? undefined;
    }

    if (row.answer_role === 'scale') {
      current.selectedOptionId = row.selected_option_id ?? undefined;
      current.value = row.value_number ?? undefined;
    }

    answerMap.set(row.question_id, current);
  }

  return {
    submissionId: contextRow.submission_id,
    participantId: contextRow.participant_id,
    participantName: contextRow.participant_name,
    testType: contextRow.test_type_code,
    definition,
    answers: [...answerMap.values()],
  };
}

