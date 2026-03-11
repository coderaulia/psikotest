import type { ResultSetHeader, RowDataPacket } from 'mysql2/promise';

import { getDbPool } from '../../database/mysql.js';
import type { PublicTestTypeCode } from '../public-sessions/public-session.types.js';

export type QuestionStatus = 'draft' | 'active' | 'archived';
export type QuestionType = 'single_choice' | 'forced_choice' | 'likert';

export interface QuestionBankOptionInput {
  optionKey: string;
  optionText: string;
  dimensionKey?: string | null;
  valueNumber?: number | null;
  isCorrect?: boolean;
  optionOrder: number;
  scorePayload?: Record<string, unknown> | null;
}

export interface QuestionBankQuestionInput {
  testType: PublicTestTypeCode;
  questionCode: string;
  instructionText?: string | null;
  prompt?: string | null;
  questionGroupKey?: string | null;
  dimensionKey?: string | null;
  questionType: QuestionType;
  questionOrder: number;
  isRequired: boolean;
  status: QuestionStatus;
  questionMeta?: Record<string, unknown> | null;
  options: QuestionBankOptionInput[];
}

export interface QuestionBankQuestionListItem {
  id: number;
  testType: PublicTestTypeCode;
  questionCode: string;
  prompt: string | null;
  instructionText: string | null;
  questionGroupKey: string | null;
  dimensionKey: string | null;
  questionType: QuestionType;
  questionOrder: number;
  isRequired: boolean;
  status: QuestionStatus;
  optionCount: number;
  updatedAt: string;
}

export interface QuestionBankQuestionDetail extends QuestionBankQuestionListItem {
  questionMeta: Record<string, unknown>;
  options: Array<{
    id: number;
    optionKey: string;
    optionText: string;
    dimensionKey: string | null;
    valueNumber: number | null;
    isCorrect: boolean;
    optionOrder: number;
    scorePayload: Record<string, unknown>;
  }>;
}

export interface QuestionBankListFilters {
  search?: string;
  testType?: PublicTestTypeCode;
  status?: QuestionStatus;
}

interface QuestionListRow extends RowDataPacket {
  id: number;
  test_type: PublicTestTypeCode;
  question_code: string;
  instruction_text: string | null;
  prompt: string | null;
  question_group_key: string | null;
  dimension_key: string | null;
  question_type: QuestionType;
  question_order: number;
  is_required: number;
  status: QuestionStatus;
  option_count: number;
  updated_at: Date | string;
  question_meta_json: string | Record<string, unknown> | null;
}

interface OptionRow extends RowDataPacket {
  id: number;
  question_id: number;
  option_key: string;
  option_text: string;
  dimension_key: string | null;
  value_number: number | null;
  is_correct: number;
  option_order: number;
  score_payload_json: string | Record<string, unknown> | null;
}

function toIsoString(value: string | Date) {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function normalizeJson(value: string | Record<string, unknown> | null) {
  if (!value) {
    return {};
  }

  return typeof value === 'string' ? (JSON.parse(value) as Record<string, unknown>) : value;
}

function mapQuestion(row: QuestionListRow): QuestionBankQuestionListItem {
  return {
    id: row.id,
    testType: row.test_type,
    questionCode: row.question_code,
    prompt: row.prompt,
    instructionText: row.instruction_text,
    questionGroupKey: row.question_group_key,
    dimensionKey: row.dimension_key,
    questionType: row.question_type,
    questionOrder: row.question_order,
    isRequired: Boolean(row.is_required),
    status: row.status,
    optionCount: Number(row.option_count ?? 0),
    updatedAt: toIsoString(row.updated_at),
  };
}

async function resolveTestTypeId(testType: PublicTestTypeCode) {
  const pool = getDbPool();
  const [rows] = await pool.query<RowDataPacket[]>('SELECT id FROM test_types WHERE code = ? LIMIT 1', [testType]);
  return Number(rows[0]?.id ?? 0);
}

async function loadQuestionOptions(questionIds: number[]) {
  if (questionIds.length === 0) {
    return [] as OptionRow[];
  }

  const pool = getDbPool();
  const placeholders = questionIds.map(() => '?').join(', ');
  const [rows] = await pool.query<OptionRow[]>(
    `
      SELECT
        id,
        question_id,
        option_key,
        option_text,
        dimension_key,
        value_number,
        is_correct,
        option_order,
        score_payload_json
      FROM question_options
      WHERE question_id IN (${placeholders})
      ORDER BY question_id ASC, option_order ASC, id ASC
    `,
    questionIds,
  );

  return rows;
}

export async function fetchQuestionBankQuestions(filters: QuestionBankListFilters = {}) {
  const pool = getDbPool();
  const conditions: string[] = [];
  const params: string[] = [];

  const search = filters.search?.trim();
  if (search) {
    const like = `%${search}%`;
    conditions.push('(q.question_code LIKE ? OR COALESCE(q.prompt, \"\") LIKE ? OR COALESCE(q.instruction_text, \"\") LIKE ?)');
    params.push(like, like, like);
  }

  if (filters.testType) {
    conditions.push('tt.code = ?');
    params.push(filters.testType);
  }

  if (filters.status) {
    conditions.push('q.status = ?');
    params.push(filters.status);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const [rows] = await pool.query<QuestionListRow[]>(
    `
      SELECT
        q.id,
        tt.code AS test_type,
        q.question_code,
        q.instruction_text,
        q.prompt,
        q.question_group_key,
        q.dimension_key,
        q.question_type,
        q.question_order,
        q.is_required,
        q.status,
        q.question_meta_json,
        q.updated_at,
        COUNT(qo.id) AS option_count
      FROM questions q
      INNER JOIN test_types tt ON tt.id = q.test_type_id
      LEFT JOIN question_options qo ON qo.question_id = q.id
      ${whereClause}
      GROUP BY
        q.id,
        tt.code,
        q.question_code,
        q.instruction_text,
        q.prompt,
        q.question_group_key,
        q.dimension_key,
        q.question_type,
        q.question_order,
        q.is_required,
        q.status,
        q.question_meta_json,
        q.updated_at
      ORDER BY tt.code ASC, q.question_order ASC, q.id ASC
      LIMIT 300
    `,
    params,
  );

  return rows.map(mapQuestion);
}

export async function fetchQuestionById(id: number) {
  const pool = getDbPool();
  const [rows] = await pool.query<QuestionListRow[]>(
    `
      SELECT
        q.id,
        tt.code AS test_type,
        q.question_code,
        q.instruction_text,
        q.prompt,
        q.question_group_key,
        q.dimension_key,
        q.question_type,
        q.question_order,
        q.is_required,
        q.status,
        q.question_meta_json,
        q.updated_at,
        COUNT(qo.id) AS option_count
      FROM questions q
      INNER JOIN test_types tt ON tt.id = q.test_type_id
      LEFT JOIN question_options qo ON qo.question_id = q.id
      WHERE q.id = ?
      GROUP BY
        q.id,
        tt.code,
        q.question_code,
        q.instruction_text,
        q.prompt,
        q.question_group_key,
        q.dimension_key,
        q.question_type,
        q.question_order,
        q.is_required,
        q.status,
        q.question_meta_json,
        q.updated_at
      LIMIT 1
    `,
    [id],
  );

  const row = rows[0];
  if (!row) {
    return null;
  }

  const options = await loadQuestionOptions([id]);
  return {
    ...mapQuestion(row),
    questionMeta: normalizeJson(row.question_meta_json),
    options: options.map((option) => ({
      id: option.id,
      optionKey: option.option_key,
      optionText: option.option_text,
      dimensionKey: option.dimension_key,
      valueNumber: option.value_number == null ? null : Number(option.value_number),
      isCorrect: Boolean(option.is_correct),
      optionOrder: option.option_order,
      scorePayload: normalizeJson(option.score_payload_json),
    })),
  } satisfies QuestionBankQuestionDetail;
}

export async function createQuestionRecord(input: QuestionBankQuestionInput) {
  const pool = getDbPool();
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const testTypeId = await resolveTestTypeId(input.testType);
    if (!testTypeId) {
      throw new Error(`Unknown test type: ${input.testType}`);
    }

    const [questionInsert] = await connection.query<ResultSetHeader>(
      `
        INSERT INTO questions (
          test_type_id,
          question_code,
          instruction_text,
          prompt,
          question_group_key,
          dimension_key,
          question_type,
          question_order,
          is_required,
          status,
          question_meta_json
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        testTypeId,
        input.questionCode.trim(),
        input.instructionText?.trim() || null,
        input.prompt?.trim() || null,
        input.questionGroupKey?.trim() || null,
        input.dimensionKey?.trim() || null,
        input.questionType,
        input.questionOrder,
        input.isRequired ? 1 : 0,
        input.status,
        input.questionMeta ? JSON.stringify(input.questionMeta) : null,
      ],
    );

    const questionId = questionInsert.insertId;

    for (const option of input.options) {
      await connection.query(
        `
          INSERT INTO question_options (
            question_id,
            option_key,
            option_text,
            dimension_key,
            value_number,
            is_correct,
            option_order,
            score_payload_json
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          questionId,
          option.optionKey.trim(),
          option.optionText.trim(),
          option.dimensionKey?.trim() || null,
          option.valueNumber ?? null,
          option.isCorrect ? 1 : 0,
          option.optionOrder,
          option.scorePayload ? JSON.stringify(option.scorePayload) : null,
        ],
      );
    }

    await connection.commit();
    return fetchQuestionById(questionId);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function updateQuestionRecord(id: number, input: QuestionBankQuestionInput) {
  const pool = getDbPool();
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const testTypeId = await resolveTestTypeId(input.testType);
    if (!testTypeId) {
      throw new Error(`Unknown test type: ${input.testType}`);
    }

    await connection.query<ResultSetHeader>(
      `
        UPDATE questions
        SET
          test_type_id = ?,
          question_code = ?,
          instruction_text = ?,
          prompt = ?,
          question_group_key = ?,
          dimension_key = ?,
          question_type = ?,
          question_order = ?,
          is_required = ?,
          status = ?,
          question_meta_json = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `,
      [
        testTypeId,
        input.questionCode.trim(),
        input.instructionText?.trim() || null,
        input.prompt?.trim() || null,
        input.questionGroupKey?.trim() || null,
        input.dimensionKey?.trim() || null,
        input.questionType,
        input.questionOrder,
        input.isRequired ? 1 : 0,
        input.status,
        input.questionMeta ? JSON.stringify(input.questionMeta) : null,
        id,
      ],
    );

    await connection.query('DELETE FROM question_options WHERE question_id = ?', [id]);

    for (const option of input.options) {
      await connection.query(
        `
          INSERT INTO question_options (
            question_id,
            option_key,
            option_text,
            dimension_key,
            value_number,
            is_correct,
            option_order,
            score_payload_json
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          id,
          option.optionKey.trim(),
          option.optionText.trim(),
          option.dimensionKey?.trim() || null,
          option.valueNumber ?? null,
          option.isCorrect ? 1 : 0,
          option.optionOrder,
          option.scorePayload ? JSON.stringify(option.scorePayload) : null,
        ],
      );
    }

    await connection.commit();
    return fetchQuestionById(id);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
