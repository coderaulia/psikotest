import { Hono } from 'hono';
import { z } from 'zod';
import { query, queryOne, run } from '../lib/db';
import {
  FLAT_QUESTION_BANK_CSV_HEADERS,
  parseCsvText,
  validateCsvHeaders,
  validateQuestionImportRows,
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
  isCorrect: z.boolean().optional(),
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

function csvEscape(value: unknown) {
  const serialized = value == null ? '' : String(value);
  const escaped = serialized.replace(/"/g, '""');
  return `"${escaped}"`;
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
      isCorrect: Boolean(o.is_correct),
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
      q.prompt,
      q.question_type,
      q.dimension_key,
      q.question_order,
      q.status,
      q.question_meta_json,
      tt.code AS test_type,
      qo.option_text,
      qo.value_number,
      qo.is_correct,
      qo.option_order
     FROM questions q
     INNER JOIN test_types tt ON tt.id = q.test_type_id
     LEFT JOIN question_options qo ON qo.question_id = q.id
     ORDER BY q.id ASC, qo.option_order ASC`
  );

  const grouped = new Map<number, {
    id: number;
    questionText: string;
    questionType: string;
    category: string;
    testType: string;
    dimension: string;
    difficulty: string;
    isActive: string;
    orderIndex: number;
    options: Array<{ text: string; value: string; isCorrect: string }>;
  }>();

  for (const entry of rows.results ?? []) {
    const row = entry as Record<string, unknown>;
    const id = Number(row.id);
    const current = grouped.get(id) ?? {
      id,
      questionText: String(row.prompt ?? ''),
      questionType: String(row.question_type ?? ''),
      category: String(row.test_type ?? ''),
      testType: String(row.test_type ?? ''),
      dimension: String(row.dimension_key ?? ''),
      difficulty: '',
      isActive: String(row.status) === 'active' ? '1' : '0',
      orderIndex: Number(row.question_order ?? 0),
      options: [],
    };

    if (current.difficulty === '' && row.question_meta_json) {
      const meta = parseSafe(row.question_meta_json);
      if (meta && typeof meta === 'object' && 'difficulty' in meta && meta.difficulty != null) {
        current.difficulty = String(meta.difficulty);
      }
    }

    if (row.option_text != null && current.options.length < 5) {
      current.options.push({
        text: String(row.option_text),
        value: row.value_number == null ? '' : String(row.value_number),
        isCorrect: Number(row.is_correct ?? 0) > 0 ? '1' : '0',
      });
    }

    grouped.set(id, current);
  }

  const lines: string[] = [CSV_EXPORT_HEADERS.join(',')];
  for (const question of grouped.values()) {
    const flatRow: string[] = [
      String(question.id),
      question.questionText,
      question.questionType,
      question.category,
      question.testType,
      question.dimension,
      question.difficulty,
      question.isActive,
      String(question.orderIndex),
    ];

    for (let index = 0; index < 5; index += 1) {
      const option = question.options[index];
      flatRow.push(option?.text ?? '');
      flatRow.push(option?.value ?? '');
      flatRow.push(option?.isCorrect ?? '');
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

  const headerValidation = validateCsvHeaders(parsed.headers);
  if (!headerValidation.valid) {
    return c.json({
      success: false,
      imported: 0,
      errors: headerValidation.missingHeaders.map((header) => ({
        row: 1,
        field: header,
        message: `Missing required header: ${header}`,
      })),
    }, 400);
  }

  const { validRows, issues } = validateQuestionImportRows(parsed.rows);
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

  const categories = Array.from(new Set(validRows.map((row) => row.test_type ?? row.category ?? ''))).filter(
    (value): value is 'iq' | 'disc' | 'workload' | 'custom' => value !== '',
  );

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

    const importBatchId = `${Date.now()}`;
    let codeOffset = 1;

    for (const row of validRows) {
      const testTypeId = testTypeMap.get(row.test_type ?? '');
      if (!testTypeId) {
        continue;
      }

      const existing = await queryOne<{ id: number }>(
        c.env.DB,
        `SELECT id FROM questions WHERE test_type_id = ? AND COALESCE(prompt, '') = ? LIMIT 1`,
        [testTypeId, row.question_text],
      );

      if (existing) {
        skipped += 1;
        continue;
      }

      const optionInputs = [
        { text: row.option_1_text ?? '', value: row.option_1_value ?? '', isCorrect: row.option_1_is_correct ?? 0 },
        { text: row.option_2_text ?? '', value: row.option_2_value ?? '', isCorrect: row.option_2_is_correct ?? 0 },
        { text: row.option_3_text ?? '', value: row.option_3_value ?? '', isCorrect: row.option_3_is_correct ?? 0 },
        { text: row.option_4_text ?? '', value: row.option_4_value ?? '', isCorrect: row.option_4_is_correct ?? 0 },
        { text: row.option_5_text ?? '', value: row.option_5_value ?? '', isCorrect: row.option_5_is_correct ?? 0 },
      ].filter((option) => option.text.trim().length > 0);

      const difficulty = row.difficulty ?? 2;
      const questionMeta = JSON.stringify({
        source: 'csv_import',
        difficulty,
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
          question_type,
          question_order,
          is_required,
          status,
          question_meta_json
        ) VALUES (?, ?, NULL, ?, NULL, ?, ?, ?, 1, ?, ?)`,
        [
          testTypeId,
          `${String(row.test_type).toUpperCase()}_IMP_${importBatchId}_${codeOffset}`,
          row.question_text,
          row.dimension?.trim() || null,
          row.question_type,
          row.order_index ?? codeOffset,
          row.is_active === 0 ? 'archived' : 'active',
          questionMeta,
        ],
      );

      const questionId = Number(questionInsert.meta.last_row_id ?? 0);
      codeOffset += 1;

      if (!questionId) {
        skipped += 1;
        continue;
      }

      for (let optionIndex = 0; optionIndex < optionInputs.length; optionIndex += 1) {
        const option = optionInputs[optionIndex];
        const parsedValue = option.value.trim() === '' ? null : Number(option.value);
        await run(
          c.env.DB,
          `INSERT INTO question_options (
            question_id,
            option_key,
            option_text,
            dimension_key,
            value_number,
            is_correct,
            option_order,
            score_payload_json
          ) VALUES (?, ?, ?, ?, ?, ?, ?, NULL)`,
          [
            questionId,
            String.fromCharCode(65 + optionIndex),
            option.text.trim(),
            row.dimension?.trim() || null,
            Number.isFinite(parsedValue) ? parsedValue : null,
            option.isCorrect ? 1 : 0,
            optionIndex + 1,
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
      `INSERT INTO questions (test_type_id, question_code, instruction_text, prompt, question_group_key, dimension_key, question_type, question_order, is_required, status, question_meta_json)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        tt.id, data.questionCode, data.instructionText || null, data.prompt || null, data.questionGroupKey || null, data.dimensionKey || null, data.questionType, data.questionOrder, data.isRequired ? 1 : 0, data.status, data.questionMeta ? JSON.stringify(data.questionMeta) : null
      ]
    );
    
    const newId = Number(res.meta.last_row_id);
    
    for (const opt of data.options) {
      await run(
        c.env.DB,
        `INSERT INTO question_options (question_id, option_key, option_text, dimension_key, value_number, is_correct, option_order, score_payload_json)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [newId, opt.optionKey, opt.optionText, opt.dimensionKey || null, opt.valueNumber ?? null, opt.isCorrect ? 1 : 0, opt.optionOrder, opt.scorePayload ? JSON.stringify(opt.scorePayload) : null]
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

  const testTypeId = ttId !== null ? ttId : existing.testType;
  const questionCode = data.questionCode !== undefined ? data.questionCode : existing.questionCode;
  const instructionText = data.instructionText !== undefined ? data.instructionText : existing.instructionText;
  const prompt = data.prompt !== undefined ? data.prompt : existing.prompt;
  const questionGroupKey = data.questionGroupKey !== undefined ? data.questionGroupKey : existing.questionGroupKey;
  const dimensionKey = data.dimensionKey !== undefined ? data.dimensionKey : existing.dimensionKey;
  const questionType = data.questionType !== undefined ? data.questionType : existing.questionType;
  const questionOrder = data.questionOrder !== undefined ? data.questionOrder : existing.questionOrder;
  const isRequired = data.isRequired !== undefined ? data.isRequired : existing.isRequired;
  const status = data.status !== undefined ? data.status : existing.status;
  const questionMeta = data.questionMeta !== undefined ? data.questionMeta : existing.questionMeta;

  await run(
    c.env.DB,
    `UPDATE questions SET
      test_type_id = COALESCE(?, test_type_id), question_code = ?, instruction_text = ?, prompt = ?, question_group_key = ?, dimension_key = ?, question_type = ?, question_order = ?, is_required = ?, status = ?, question_meta_json = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [
      ttId, questionCode, instructionText || null, prompt || null, questionGroupKey || null, dimensionKey || null, questionType, questionOrder, isRequired ? 1 : 0, status, questionMeta ? JSON.stringify(questionMeta) : null, id
    ]
  );
  
  if (data.options) {
    await run(c.env.DB, 'DELETE FROM question_options WHERE question_id = ?', [id]);
    
    for (const opt of data.options) {
      await run(
        c.env.DB,
        `INSERT INTO question_options (question_id, option_key, option_text, dimension_key, value_number, is_correct, option_order, score_payload_json)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, opt.optionKey, opt.optionText, opt.dimensionKey || null, opt.valueNumber ?? null, opt.isCorrect ? 1 : 0, opt.optionOrder, opt.scorePayload ? JSON.stringify(opt.scorePayload) : null]
      );
    }
  }

  const updated = await getQuestionById(c.env.DB, id);
  return c.json(updated);
});

export default app;
