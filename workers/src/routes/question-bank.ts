import { Hono } from 'hono';
import { z } from 'zod';
import { query, queryOne, run } from '../lib/db';
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

function parseSafe(val: any) {
  if (!val) return {};
  if (typeof val !== 'string') return val;
  try { return JSON.parse(val); } catch { return {}; }
}

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
