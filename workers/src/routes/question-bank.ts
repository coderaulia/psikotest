import { Hono } from 'hono';
import { z } from 'zod';
import { query, queryOne, run } from '../lib/db';
import {
  booleanToCsvFlag,
  csvEscape,
  ensureNumericOrEmpty,
  FLAT_QUESTION_BANK_CSV_HEADERS,
  formatQuestionImportTemplateRows,
  normalizeNullableString,
  parseCsvText,
  validateCanonicalCsvRows,
  validateHeaderContract,
} from '../lib/question-bank-csv';
import { requireAdmin } from '../middleware/auth';
import type { AdminJwtPayload, Env } from '../types';

const app = new Hono<{ Bindings: Env; Variables: { adminPayload: AdminJwtPayload } }>();

const testTypeEnum = z.enum(['iq', 'disc', 'workload', 'custom']);
const questionStatusEnum = z.enum(['draft', 'active', 'archived']);

const optionSchema = z.object({
  id: z.number().optional(),
  optionKey: z.string(),
  optionText: z.string(),
  dimensionKey: z.string().nullable().optional(),
  valueNumber: z.number().nullable().optional(),
  scoreValue: z.number().nullable().optional(),
  isCorrect: z.boolean().optional(),
  isActive: z.boolean().optional(),
  optionOrder: z.number(),
  scorePayload: z.record(z.unknown()).nullable().optional(),
});

const questionSchema = z.object({
  testType: testTypeEnum,
  questionCode: z.string(),
  instructionText: z.string().nullable().optional(),
  prompt: z.string().nullable().optional(),
  questionGroupKey: z.string().nullable().optional(),
  dimensionKey: z.string().nullable().optional(),
  categoryKey: z.string().nullable().optional(),
  scoringKey: z.string().nullable().optional(),
  isReverseScored: z.boolean().optional().default(false),
  weight: z.number().positive().optional().default(1),
  questionType: z.enum(['single_choice', 'forced_choice', 'likert']),
  questionOrder: z.number().int(),
  isRequired: z.boolean(),
  status: questionStatusEnum,
  questionMeta: z.record(z.unknown()).nullable().optional(),
  options: z.array(optionSchema).default([]),
});

app.use('*', requireAdmin);

const CSV_EXPORT_HEADERS = FLAT_QUESTION_BANK_CSV_HEADERS;

function parseSafe(val: any) {
  if (!val) return {};
  if (typeof val !== 'string') return val;
  try { return JSON.parse(val); } catch { return {}; }
}

const importPayloadSchema = z.object({
  csv: z.string().min(1, 'CSV content is required'),
  dryRun: z.boolean().optional().default(false),
  replaceAll: z.boolean().optional().default(false),
});

async function getQuestionById(db: any, id: number) {
  const qRows = await query(
    db,
    `SELECT
      q.id,
      tt.code AS test_type,
      q.question_code,
      q.instruction_text,
      q.prompt,
      q.question_group_key,
      q.dimension_key,
      q.category_key,
      q.scoring_key,
      q.is_reverse_scored,
      q.weight,
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
    GROUP BY q.id
    LIMIT 1`,
    [id]
  );
  
  if (!qRows.results || qRows.results.length === 0) return null;
  const row: any = qRows.results[0];
  
  const optRows = await query(
    db,
    `SELECT * FROM question_options WHERE question_id = ? ORDER BY option_order ASC`,
    [id]
  );

  return {
    id: Number(row.id),
    testType: row.test_type,
    questionCode: row.question_code,
    prompt: row.prompt,
    instructionText: row.instruction_text,
    questionGroupKey: row.question_group_key,
    dimensionKey: row.dimension_key,
    categoryKey: row.category_key,
    scoringKey: row.scoring_key,
    isReverseScored: Boolean(row.is_reverse_scored),
    weight: row.weight == null ? 1 : Number(row.weight),
    questionType: row.question_type,
    questionOrder: Number(row.question_order ?? 0),
    isRequired: Boolean(row.is_required),
    status: row.status,
    optionCount: Number(row.option_count ?? 0),
    updatedAt: row.updated_at ? String(row.updated_at) : new Date().toISOString(),
    questionMeta: row.question_meta_json ? parseSafe(row.question_meta_json) : {},
    options: (optRows.results ?? []).map((o: any) => ({
      id: o.id,
      optionKey: o.option_key,
      optionText: o.option_text,
      dimensionKey: o.dimension_key,
      valueNumber: o.value_number == null ? null : Number(o.value_number),
      scoreValue: o.score_value == null ? (o.value_number == null ? null : Number(o.value_number)) : Number(o.score_value),
      isCorrect: Boolean(o.is_correct),
      isActive: o.is_active == null ? true : Boolean(o.is_active),
      optionOrder: o.option_order,
      scorePayload: o.score_payload_json ? parseSafe(o.score_payload_json) : {},
    })),
  };
}

app.get('/questions', async (c) => {
  const url = new URL(c.req.url);
  const search = url.searchParams.get('search');
  const testType = url.searchParams.get('testType');
  const status = url.searchParams.get('status');

  const conditions: string[] = [];
  const params: unknown[] = [];

  if (search) {
    conditions.push('(q.question_code LIKE ? OR q.prompt LIKE ? OR q.instruction_text LIKE ?)');
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }
  if (testType && testType !== 'all') {
    conditions.push('tt.code = ?');
    params.push(testType);
  }
  if (status && status !== 'all') {
    conditions.push('q.status = ?');
    params.push(status);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  try {
    const rows = await query(
      c.env.DB,
      `SELECT
        q.id,
        tt.code AS test_type,
        q.question_code,
        q.instruction_text,
        q.prompt,
        q.question_group_key,
        q.dimension_key,
        q.category_key,
        q.scoring_key,
        q.is_reverse_scored,
        q.weight,
        q.question_type,
        q.question_order,
        q.is_required,
        q.status,
        q.updated_at,
        COUNT(qo.id) AS option_count
      FROM questions q
      INNER JOIN test_types tt ON tt.id = q.test_type_id
      LEFT JOIN question_options qo ON qo.question_id = q.id
      ${where}
      GROUP BY q.id
      ORDER BY tt.code ASC, q.question_order ASC, q.id ASC
      LIMIT 100`,
      params,
    );

    const items = (rows.results ?? []).map((r: any) => ({
      id: Number(r.id),
      testType: r.test_type,
      questionCode: r.question_code,
      prompt: r.prompt,
      instructionText: r.instruction_text,
      questionGroupKey: r.question_group_key,
      dimensionKey: r.dimension_key,
      categoryKey: r.category_key,
      scoringKey: r.scoring_key,
      isReverseScored: Boolean(r.is_reverse_scored),
      weight: r.weight == null ? 1 : Number(r.weight),
      questionType: r.question_type,
      questionOrder: Number(r.question_order ?? 0),
      isRequired: Boolean(r.is_required),
      status: r.status,
      optionCount: Number(r.option_count ?? 0),
      updatedAt: r.updated_at ? String(r.updated_at) : new Date().toISOString(),
    }));

    return c.json({ items });
  } catch (error) {
    console.error('Error fetching questions:', error);
    return c.json({ items: [] });
  }
});

app.get('/questions/export', async (c) => {
  const rows = await query(
    c.env.DB,
    `SELECT
      q.id,
      q.question_code,
      q.prompt,
      q.question_type,
      q.dimension_key,
      q.category_key,
      q.scoring_key,
      q.is_reverse_scored,
      q.weight,
      q.question_order,
      q.status,
      tt.code AS test_type,
      qo.option_key,
      qo.option_text,
      qo.dimension_key AS option_dimension_key,
      qo.value_number,
      qo.score_value,
      qo.is_correct,
      qo.is_active,
      qo.option_order
     FROM questions q
     INNER JOIN test_types tt ON tt.id = q.test_type_id
     LEFT JOIN question_options qo ON qo.question_id = q.id
     ORDER BY q.id ASC, qo.option_order ASC`
  );

  const grouped = new Map<number, {
    testType: string;
    questionCode: string;
    questionType: string;
    questionOrder: number;
    prompt: string;
    dimensionKey: string;
    categoryKey: string;
    scoringKey: string;
    isReverseScored: string;
    weight: string;
    status: string;
    options: Array<{ order: number; label: string; score: string; isCorrect: string; dimensionKey: string }>;
  }>();

  for (const entry of rows.results ?? []) {
    const row = entry as Record<string, unknown>;
    const id = Number(row.id);
    const current = grouped.get(id) ?? {
      testType: String(row.test_type ?? ''),
      questionCode: String(row.question_code ?? ''),
      questionType: String(row.question_type ?? ''),
      questionOrder: Number(row.question_order ?? 0),
      prompt: String(row.prompt ?? ''),
      dimensionKey: normalizeNullableString(row.dimension_key),
      categoryKey: normalizeNullableString(row.category_key),
      scoringKey: normalizeNullableString(row.scoring_key),
      isReverseScored: booleanToCsvFlag(row.is_reverse_scored as number | boolean | null | undefined),
      weight: ensureNumericOrEmpty(row.weight),
      status: normalizeNullableString(row.status || 'active') || 'active',
      options: [],
    };

    if (row.option_text != null) {
      const optionOrder = Number(row.option_order ?? current.options.length + 1);
      current.options.push({
        order: optionOrder,
        label: String(row.option_text),
        score: ensureNumericOrEmpty(row.score_value ?? row.value_number),
        isCorrect: booleanToCsvFlag(Number(row.is_correct ?? 0) > 0),
        dimensionKey: normalizeNullableString(row.option_dimension_key),
      });
    }

    grouped.set(id, current);
  }

  const lines: string[] = [CSV_EXPORT_HEADERS.join(',')];
  for (const question of grouped.values()) {
    const flatRow: string[] = [
      question.testType,
      question.questionCode,
      question.questionType,
      String(question.questionOrder),
      question.prompt,
      question.dimensionKey,
      question.categoryKey,
      question.scoringKey,
      question.isReverseScored,
      question.weight || '1',
      question.status,
    ];

    for (let index = 0; index < 5; index += 1) {
      const slot = index + 1;
      const option = question.options.find((item) => item.order === slot) ?? question.options[index];
      flatRow.push(option?.label ?? '');
      flatRow.push(option?.score ?? '');
      flatRow.push(option?.isCorrect ?? '');
      flatRow.push(option?.dimensionKey ?? '');
    }

    lines.push(flatRow.map(csvEscape).join(','));
  }

  const csv = `${lines.join('\n')}\n`;
  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="questions-export.csv"',
      'Cache-Control': 'no-store',
    },
  });
});

app.post('/questions/import', async (c) => {
  const payload = importPayloadSchema.parse(await c.req.json());
  const parsed = parseCsvText(payload.csv);

  if (parsed.headers.length === 0) {
    return c.json({ success: false, imported: 0, errors: [{ row: 1, field: 'csv', message: 'CSV is empty' }] }, 400);
  }

  const headerValidation = validateHeaderContract(parsed.headers);
  if (!headerValidation.valid) {
    const headerIssues = headerValidation.missingHeaders.map((header) => ({
      row: 1,
      field: header,
      message: `Missing required header: ${header}`,
    }));

    if (headerValidation.legacyDetected) {
      headerIssues.unshift({
        row: 1,
        field: 'csv',
        message: 'Legacy CSV contract detected. Download the validated template before importing.',
      });
    }

    return c.json({
      success: false,
      imported: 0,
      errors: headerIssues,
    }, 400);
  }

  const { validRows, issues } = validateCanonicalCsvRows(parsed.rows);
  if (issues.length > 0) {
    return c.json({ success: false, imported: 0, errors: issues }, 400);
  }

  if (validRows.length === 0) {
    return c.json({
      success: false,
      imported: 0,
      errors: [{ row: 2, field: 'csv', message: 'No valid data rows found in CSV file' }],
    }, 400);
  }

  const categories = Array.from(new Set(validRows.map((row) => row.testType)));

  if (payload.dryRun) {
    return c.json({
      success: true,
      preview: validRows.length,
      categories,
      replaceAll: payload.replaceAll,
      dryRun: true,
    });
  }

  const testTypeRows = await query(
    c.env.DB,
    `SELECT id, code FROM test_types WHERE code IN (${categories.map(() => '?').join(', ')})`,
    categories,
  );

  const testTypeMap = new Map<string, number>();
  for (const entry of testTypeRows.results ?? []) {
    const row = entry as Record<string, unknown>;
    testTypeMap.set(String(row.code), Number(row.id));
  }

  const unknownCategories = categories.filter((category) => !testTypeMap.has(category));
  if (unknownCategories.length > 0) {
    return c.json({
      success: false,
      imported: 0,
      errors: unknownCategories.map((category) => ({
        row: 1,
        field: 'test_type',
        message: `Unknown test type in database: ${category}`,
      })),
    }, 400);
  }

  let imported = 0;
  let skipped = 0;

  await run(c.env.DB, 'BEGIN IMMEDIATE TRANSACTION');

  try {
    if (payload.replaceAll && categories.length > 0) {
      const placeholders = categories.map(() => '?').join(', ');
      await run(
        c.env.DB,
        `DELETE FROM question_options
         WHERE question_id IN (
           SELECT q.id
           FROM questions q
           INNER JOIN test_types tt ON tt.id = q.test_type_id
           WHERE tt.code IN (${placeholders})
         )`,
        categories,
      );

      await run(
        c.env.DB,
        `DELETE FROM questions
         WHERE test_type_id IN (
           SELECT id FROM test_types WHERE code IN (${placeholders})
         )`,
        categories,
      );
    }

    for (const row of validRows) {
      const testTypeId = testTypeMap.get(row.testType ?? '');
      if (!testTypeId) {
        continue;
      }

      const existing = await queryOne<{ id: number }>(
        c.env.DB,
        `SELECT id FROM questions WHERE test_type_id = ? AND question_code = ? LIMIT 1`,
        [testTypeId, row.questionCode],
      );

      if (existing) {
        skipped += 1;
        continue;
      }

      const questionMeta = JSON.stringify({
        source: 'validated_csv_import',
        categoryKey: row.categoryKey,
        scoringKey: row.scoringKey,
        isReverseScored: row.isReverseScored,
        weight: row.weight,
      });

      const questionInsert = await run(
        c.env.DB,
        `INSERT INTO questions (
          test_type_id,
          question_code,
          instruction_text,
          prompt,
          question_group_key,
          dimension_key,
          category_key,
          scoring_key,
          is_reverse_scored,
          weight,
          question_type,
          question_order,
          is_required,
          status,
          question_meta_json
        ) VALUES (?, ?, NULL, ?, NULL, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
        [
          testTypeId,
          row.questionCode,
          row.prompt,
          row.dimensionKey,
          row.categoryKey,
          row.scoringKey,
          row.isReverseScored ? 1 : 0,
          row.weight,
          row.questionType,
          row.questionOrder,
          row.status,
          questionMeta,
        ],
      );

      const questionId = Number(questionInsert.meta.last_row_id ?? 0);

      if (!questionId) {
        skipped += 1;
        continue;
      }

      for (let optionIndex = 0; optionIndex < row.options.length; optionIndex += 1) {
        const option = row.options[optionIndex];
        await run(
          c.env.DB,
          `INSERT INTO question_options (
            question_id,
            option_key,
            option_text,
            dimension_key,
            value_number,
            score_value,
            is_correct,
            is_active,
            option_order,
            score_payload_json,
            created_at,
            updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
          [
            questionId,
            option.optionKey,
            option.optionLabel,
            option.dimensionKey ?? row.dimensionKey,
            option.scoreValue,
            option.scoreValue,
            option.isCorrect,
            1,
            option.optionOrder,
            JSON.stringify({
              source: 'validated_csv_import',
              scoreValue: option.scoreValue,
            }),
          ],
        );
      }

      imported += 1;
    }

    await run(c.env.DB, 'COMMIT');
  } catch (error) {
    await run(c.env.DB, 'ROLLBACK');
    throw error;
  }

  return c.json({
    success: true,
    preview: validRows.length,
    imported,
    skipped,
    totalRows: validRows.length,
    categories,
    replaceAll: payload.replaceAll,
    dryRun: false,
  });
});

app.get('/questions/import/template', async () => {
  const sampleRows = formatQuestionImportTemplateRows();

  const lines = [CSV_EXPORT_HEADERS.join(',')];
  for (const row of sampleRows) {
    lines.push(row.map(csvEscape).join(','));
  }

  const csv = `${lines.join('\n')}\n`;
  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="question-bank-import-template.csv"',
      'Cache-Control': 'no-store',
    },
  });
});

app.get('/questions/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  const question = await getQuestionById(c.env.DB, id);
  if (!question) return c.json({ error: 'Question not found' }, 404);
  return c.json(question);
});

app.post('/questions', async (c) => {
  try {
    const body = await c.req.json();
    const data = questionSchema.parse(body);

    const tt = await queryOne<{id: number}>(c.env.DB, 'SELECT id FROM test_types WHERE code = ? LIMIT 1', [data.testType]);
    if (!tt) return c.json({ error: 'Unknown test type' }, 400);

    const res = await run(
      c.env.DB,
      `INSERT INTO questions (
        test_type_id,
        question_code,
        instruction_text,
        prompt,
        question_group_key,
        dimension_key,
        category_key,
        scoring_key,
        is_reverse_scored,
        weight,
        question_type,
        question_order,
        is_required,
        status,
        question_meta_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        tt.id,
        data.questionCode,
        data.instructionText || null,
        data.prompt || null,
        data.questionGroupKey || null,
        data.dimensionKey || null,
        data.categoryKey || null,
        data.scoringKey || null,
        data.isReverseScored ? 1 : 0,
        data.weight ?? 1,
        data.questionType,
        data.questionOrder,
        data.isRequired ? 1 : 0,
        data.status,
        data.questionMeta ? JSON.stringify(data.questionMeta) : null,
      ]
    );
    
    const newId = Number(res.meta.last_row_id);
    
    for (const opt of data.options) {
      await run(
        c.env.DB,
        `INSERT INTO question_options (
          question_id,
          option_key,
          option_text,
          dimension_key,
          value_number,
          score_value,
          is_correct,
          is_active,
          option_order,
          score_payload_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          newId,
          opt.optionKey,
          opt.optionText,
          opt.dimensionKey || null,
          opt.valueNumber ?? null,
          opt.scoreValue ?? opt.valueNumber ?? null,
          opt.isCorrect ? 1 : 0,
          opt.isActive === false ? 0 : 1,
          opt.optionOrder,
          opt.scorePayload ? JSON.stringify(opt.scorePayload) : null,
        ]
      );
    }

    const created = await getQuestionById(c.env.DB, newId);
    return c.json(created, 201);
  } catch (error) {
    if (error instanceof z.ZodError) return c.json({ error: error.errors[0].message }, 400);
    throw error;
  }
});

app.patch('/questions/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  const body = await c.req.json();
  const data = questionSchema.partial().parse(body);

  const existing = await getQuestionById(c.env.DB, id);
  if (!existing) return c.json({ error: 'Question not found' }, 404);

  let ttId = null;
  if (data.testType) {
    const tt = await queryOne<{id: number}>(c.env.DB, 'SELECT id FROM test_types WHERE code = ? LIMIT 1', [data.testType]);
    if (!tt) return c.json({ error: 'Unknown test type' }, 400);
    ttId = tt.id;
  }

  const questionCode = data.questionCode !== undefined ? data.questionCode : existing.questionCode;
  const instructionText = data.instructionText !== undefined ? data.instructionText : existing.instructionText;
  const prompt = data.prompt !== undefined ? data.prompt : existing.prompt;
  const questionGroupKey = data.questionGroupKey !== undefined ? data.questionGroupKey : existing.questionGroupKey;
  const dimensionKey = data.dimensionKey !== undefined ? data.dimensionKey : existing.dimensionKey;
  const categoryKey = data.categoryKey !== undefined ? data.categoryKey : existing.categoryKey;
  const scoringKey = data.scoringKey !== undefined ? data.scoringKey : existing.scoringKey;
  const isReverseScored = data.isReverseScored !== undefined ? data.isReverseScored : existing.isReverseScored;
  const weight = data.weight !== undefined ? data.weight : existing.weight;
  const questionType = data.questionType !== undefined ? data.questionType : existing.questionType;
  const questionOrder = data.questionOrder !== undefined ? data.questionOrder : existing.questionOrder;
  const isRequired = data.isRequired !== undefined ? data.isRequired : existing.isRequired;
  const status = data.status !== undefined ? data.status : existing.status;
  const questionMeta = data.questionMeta !== undefined ? data.questionMeta : existing.questionMeta;

  await run(
    c.env.DB,
    `UPDATE questions SET
      test_type_id = COALESCE(?, test_type_id),
      question_code = ?,
      instruction_text = ?,
      prompt = ?,
      question_group_key = ?,
      dimension_key = ?,
      category_key = ?,
      scoring_key = ?,
      is_reverse_scored = ?,
      weight = ?,
      question_type = ?,
      question_order = ?,
      is_required = ?,
      status = ?,
      question_meta_json = ?,
      updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [
      ttId,
      questionCode,
      instructionText || null,
      prompt || null,
      questionGroupKey || null,
      dimensionKey || null,
      categoryKey || null,
      scoringKey || null,
      isReverseScored ? 1 : 0,
      weight ?? 1,
      questionType,
      questionOrder,
      isRequired ? 1 : 0,
      status,
      questionMeta ? JSON.stringify(questionMeta) : null,
      id,
    ]
  );
  
  if (data.options) {
    await run(c.env.DB, 'DELETE FROM question_options WHERE question_id = ?', [id]);
    
    for (const opt of data.options) {
      await run(
        c.env.DB,
        `INSERT INTO question_options (
          question_id,
          option_key,
          option_text,
          dimension_key,
          value_number,
          score_value,
          is_correct,
          is_active,
          option_order,
          score_payload_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          opt.optionKey,
          opt.optionText,
          opt.dimensionKey || null,
          opt.valueNumber ?? null,
          opt.scoreValue ?? opt.valueNumber ?? null,
          opt.isCorrect ? 1 : 0,
          opt.isActive === false ? 0 : 1,
          opt.optionOrder,
          opt.scorePayload ? JSON.stringify(opt.scorePayload) : null,
        ]
      );
    }
  }

  const updated = await getQuestionById(c.env.DB, id);
  return c.json(updated);
});

export default app;
