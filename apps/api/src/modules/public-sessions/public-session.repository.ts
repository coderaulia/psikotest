import type { PoolConnection, RowDataPacket } from 'mysql2/promise';

import { getDbPool } from '../../database/mysql.js';
import { HttpError } from '../../lib/http-error.js';
import { fetchResultBySubmissionId } from '../results/result.repository.js';
import {
  getParticipantResultMode,
  parseTestSessionSettings,
} from '../test-sessions/session-settings.js';
import type {
  AssessmentQuestion,
  ParticipantIdentityInput,
  ProgressiveQuestionWindow,
  PublicSessionDefinition,
  PublicTestTypeCode,
  SaveSubmissionAnswersResponse,
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
  question_group_key: string | null;
  dimension_key: string | null;
  question_type: 'single_choice' | 'forced_choice' | 'likert';
  question_order: number;
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
  access_token: string;
  test_type_code: PublicTestTypeCode;
  submission_status: 'not_started' | 'in_progress' | 'submitted' | 'scored';
  answer_sequence: number;
}

interface SubmissionStatusRow extends RowDataPacket {
  id: number;
  status: 'not_started' | 'in_progress' | 'submitted' | 'scored';
  test_type_id: number;
  answer_sequence: number;
}

interface StoredAnswerRow extends RowDataPacket {
  question_id: number;
  answer_role: 'single' | 'most' | 'least' | 'scale';
  selected_option_id: number | null;
  value_number: number | null;
}

interface AnswerCountRow extends RowDataPacket {
  answered_question_count: number;
}

interface QuestionGroup {
  key: string;
  questions: AssessmentQuestion[];
}

function parseInstructions(instructions: string | null) {
  return (instructions ?? '')
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function buildQuestionGroups(questions: AssessmentQuestion[]) {
  const groups = new Map<string, AssessmentQuestion[]>();

  for (const question of questions) {
    const key = question.questionGroupKey?.trim() || `question-${question.id}`;
    const existing = groups.get(key) ?? [];
    existing.push(question);
    groups.set(key, existing);
  }

  return [...groups.entries()].map(([key, groupedQuestions]) => ({
    key,
    questions: groupedQuestions,
  })) satisfies QuestionGroup[];
}

function validateSubmissionAnswers(
  questions: Awaited<ReturnType<typeof loadQuestionsByTestType>>,
  answers: SubmissionAnswerInput[],
) {
  if (answers.length > questions.length) {
    throw new HttpError(400, 'Answer payload exceeds available questions for this session');
  }

  const questionMap = new Map(questions.map((question) => [question.id, question]));
  const seenQuestionIds = new Set<number>();

  for (const answer of answers) {
    if (seenQuestionIds.has(answer.questionId)) {
      throw new HttpError(400, 'Duplicate answers for the same question are not allowed');
    }

    seenQuestionIds.add(answer.questionId);
    const question = questionMap.get(answer.questionId);

    if (!question) {
      throw new HttpError(400, 'Answer contains an invalid question reference');
    }

    const allowedOptionIds = new Set(question.options.map((option) => option.id));
    const assertOptionId = (optionId: number | undefined, label: string) => {
      if (optionId !== undefined && !allowedOptionIds.has(optionId)) {
        throw new HttpError(400, `Answer contains an invalid ${label} option reference`);
      }
    };

    assertOptionId(answer.selectedOptionId, 'selected');
    assertOptionId(answer.mostOptionId, 'most');
    assertOptionId(answer.leastOptionId, 'least');

    if (question.questionType !== 'forced_choice' && (answer.mostOptionId !== undefined || answer.leastOptionId !== undefined)) {
      throw new HttpError(400, 'Forced-choice answers are only allowed for DISC-style questions');
    }

    if (question.questionType === 'forced_choice' && answer.mostOptionId !== undefined && answer.mostOptionId === answer.leastOptionId) {
      throw new HttpError(400, 'The same option cannot be selected as both most and least representative');
    }

    if (question.questionType === 'likert' && answer.value !== undefined && answer.selectedOptionId === undefined) {
      throw new HttpError(400, 'Scale answers must reference a valid option');
    }
  }
}

async function countAnsweredQuestions(executor: Pick<PoolConnection, 'query'>, submissionId: number) {
  const [rows] = await executor.query<AnswerCountRow[]>(
    `
      SELECT COUNT(DISTINCT question_id) AS answered_question_count
      FROM answers
      WHERE submission_id = ?
    `,
    [submissionId],
  );

  return Number(rows[0]?.answered_question_count ?? 0);
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
        q.question_group_key,
        q.dimension_key,
        q.question_type,
        q.question_order
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
    questionGroupKey: question.question_group_key ?? undefined,
    dimensionKey: question.dimension_key ?? undefined,
    orderIndex: question.question_order,
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

function buildSessionDefinition(sessionRow: SessionRow, questions: AssessmentQuestion[]): PublicSessionDefinition {
  const settings = parseTestSessionSettings(sessionRow.settings_json);
  const questionGroups = buildQuestionGroups(questions);

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
      delivery: {
        mode: settings.protectedDeliveryMode ? 'progressive' : 'full',
        totalQuestions: questions.length,
        totalGroups: questionGroups.length,
      },
    },
    questions,
  };
}

async function loadSubmissionContextRow(submissionId: number) {
  const pool = getDbPool();
  const [rows] = await pool.query<SubmissionContextRow[]>(
    `
      SELECT
        s.id AS submission_id,
        s.participant_id,
        p.full_name AS participant_name,
        ts.id AS session_id,
        ts.access_token,
        tt.code AS test_type_code,
        s.status AS submission_status,
        s.answer_sequence
      FROM submissions s
      INNER JOIN participants p ON p.id = s.participant_id
      INNER JOIN test_sessions ts ON ts.id = s.test_session_id
      INNER JOIN test_types tt ON tt.id = ts.test_type_id
      WHERE s.id = ?
      LIMIT 1
    `,
    [submissionId],
  );

  return rows[0] ?? null;
}

async function loadStoredAnswers(submissionId: number) {
  const pool = getDbPool();
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

  return answerMap;
}

export async function findPublicSessionByToken(token: string): Promise<PublicSessionDefinition | null> {
  const sessionRow = await loadSessionRowByToken(token);

  if (!sessionRow) {
    return null;
  }

  const questions = await loadQuestionsByTestType(sessionRow.test_type_id);
  return buildSessionDefinition(sessionRow, questions);
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
          identity_snapshot_json,
          answer_sequence
        )
        VALUES (?, ?, ?, 'in_progress', NOW(), ?, ?, ?, 0)
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
      answerSequence: 0,
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

export async function replaceSubmissionAnswers(
  submissionId: number,
  answers: SubmissionAnswerInput[],
  answerSequence: number,
): Promise<SaveSubmissionAnswersResponse> {
  const pool = getDbPool();
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [submissionRows] = await connection.query<SubmissionStatusRow[]>(
      `
        SELECT s.id, s.status, ts.test_type_id, s.answer_sequence
        FROM submissions s
        INNER JOIN test_sessions ts ON ts.id = s.test_session_id
        WHERE s.id = ?
        LIMIT 1
      `,
      [submissionId],
    );

    const submissionRow = submissionRows[0];
    if (!submissionRow) {
      throw new HttpError(404, 'Submission not found');
    }

    if (submissionRow.status !== 'in_progress') {
      throw new HttpError(409, 'Submission is already finalized');
    }

    const currentSequence = Number(submissionRow.answer_sequence ?? 0);
    if (answerSequence <= currentSequence) {
      throw new HttpError(409, 'Stale or replayed answer sequence');
    }

    if (answerSequence !== currentSequence + 1) {
      throw new HttpError(409, 'Answer sequence is out of order');
    }

    if (answers.length === 0) {
      throw new HttpError(400, 'Cannot save an empty answer set');
    }

    const questions = await loadQuestionsByTestType(Number(submissionRow.test_type_id));
    validateSubmissionAnswers(questions, answers);

    const answeredQuestionIds = answers.map((answer) => answer.questionId);
    const placeholders = answeredQuestionIds.map(() => '?').join(', ');
    await connection.query(
      `DELETE FROM answers WHERE submission_id = ? AND question_id IN (${placeholders})`,
      [submissionId, ...answeredQuestionIds],
    );

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
          [submissionId, answer.questionId, answer.mostOptionId, JSON.stringify({ source: 'api', answerSequence })],
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
          [submissionId, answer.questionId, answer.leastOptionId, JSON.stringify({ source: 'api', answerSequence })],
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
            JSON.stringify({ source: 'api', answerSequence }),
          ],
        );
      }
    }

    await connection.query(
      `
        UPDATE submissions
        SET answer_sequence = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `,
      [answerSequence, submissionId],
    );

    const answeredQuestionCount = await countAnsweredQuestions(connection, submissionId);

    await connection.commit();
    return {
      submissionId,
      saved: true,
      answerSequence,
      answeredQuestionCount,
      status: 'in_progress',
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function loadSubmissionQuestionWindow(submissionId: number, groupIndex: number): Promise<ProgressiveQuestionWindow | null> {
  const contextRow = await loadSubmissionContextRow(submissionId);

  if (!contextRow) {
    return null;
  }

  if (contextRow.submission_status !== 'in_progress') {
    throw new HttpError(409, 'Submission is already finalized');
  }

  const sessionRow = await loadSessionRowById(contextRow.session_id);
  if (!sessionRow) {
    return null;
  }

  const questions = await loadQuestionsByTestType(sessionRow.test_type_id);
  const groups = buildQuestionGroups(questions);

  if (groups.length === 0) {
    throw new HttpError(404, 'This session has no active questions');
  }

  const normalizedGroupIndex = Math.max(0, Math.min(groupIndex, groups.length - 1));
  const group = groups[normalizedGroupIndex];
  const storedAnswers = await loadStoredAnswers(submissionId);
  const savedAnswers = group.questions
    .map((question) => storedAnswers.get(question.id))
    .filter((answer): answer is SubmissionAnswerInput => Boolean(answer));

  return {
    submissionId,
    status: 'in_progress',
    answerSequence: contextRow.answer_sequence,
    groupIndex: normalizedGroupIndex,
    totalGroups: groups.length,
    totalQuestions: questions.length,
    answeredQuestionCount: storedAnswers.size,
    groupKey: group.key,
    questions: group.questions,
    savedAnswers,
  };
}

export async function loadSubmissionScoringContext(submissionId: number) {
  const contextRow = await loadSubmissionContextRow(submissionId);

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

  const existingResult = await fetchResultBySubmissionId(submissionId);
  const answerMap = await loadStoredAnswers(submissionId);

  return {
    submissionId: contextRow.submission_id,
    participantId: contextRow.participant_id,
    participantName: contextRow.participant_name,
    testType: contextRow.test_type_code,
    status: contextRow.submission_status,
    answerSequence: contextRow.answer_sequence,
    definition,
    answers: [...answerMap.values()],
    existingResult,
  };
}
