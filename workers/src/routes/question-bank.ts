import { Hono } from 'hono';
import { z } from 'zod';
import { query, queryOne, run } from '../lib/db';
import { requireAdmin } from '../middleware/auth';
import type { AdminJwtPayload, Env } from '../types';

const app = new Hono<{ Bindings: Env; Variables: { adminPayload: AdminJwtPayload } }>();

// Test types supported
const testTypeEnum = z.enum(['iq', 'disc', 'workload', 'custom']);
const questionStatusEnum = z.enum(['draft', 'active', 'archived']);

// Question option schema
const optionSchema = z.object({
  id: z.string().optional(),
  label: z.string().min(1),
  value: z.union([z.string(), z.number()]),
  score: z.number().optional(),
});

// Question schema for create/update
const questionSchema = z.object({
  testType: testTypeEnum,
  questionText: z.string().min(5),
  questionType: z.enum(['single_choice', 'multiple_choice', 'text', 'scale']),
  options: z.array(optionSchema).optional(),
  category: z.string().optional(),
  subcategory: z.string().optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
  timeEstimateSeconds: z.number().int().positive().optional(),
  status: questionStatusEnum.default('draft'),
  orderIndex: z.number().int().default(0),
  metadata: z.record(z.unknown()).optional(),
});

// Query schema for listing
const listQuerySchema = z.object({
  search: z.string().optional(),
  testType: testTypeEnum.optional(),
  status: z.enum(['draft', 'active', 'archived', 'all']).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
});

app.use('*', requireAdmin);

// GET /api/question-bank/questions
app.get('/questions', async (c) => {
  const filters = listQuerySchema.parse(c.req.query());

  const conditions: string[] = [];
  const params: unknown[] = [];

  if (filters.search) {
    const like = `%${filters.search}%`;
    conditions.push('(question_text LIKE ? OR category LIKE ? OR subcategory LIKE ?)');
    params.push(like, like, like);
  }

  if (filters.testType) {
    conditions.push('test_type = ?');
    params.push(filters.testType);
  }

  if (filters.status && filters.status !== 'all') {
    conditions.push('status = ?');
    params.push(filters.status);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const rows = await query(
    c.env.DB,
    `SELECT
      id,
      test_type,
      question_text,
      question_type,
      options_json,
      category,
      subcategory,
      difficulty,
      time_estimate_seconds,
      status,
      order_index,
      metadata_json,
      created_at,
      updated_at
    FROM question_bank
    ${where}
    ORDER BY order_index ASC, created_at DESC
    LIMIT ?`,
    [...params, filters.limit],
  );

  const items = (rows.results ?? []).map((r) => {
    const row = r as Record<string, unknown>;
    return {
      id: Number(row.id),
      testType: row.test_type as string,
      questionText: String(row.question_text ?? ''),
      questionType: row.question_type as string,
      options: row.options_json ? JSON.parse(String(row.options_json)) : [],
      category: row.category ? String(row.category) : null,
      subcategory: row.subcategory ? String(row.subcategory) : null,
      difficulty: row.difficulty as string | null,
      timeEstimateSeconds: row.time_estimate_seconds ? Number(row.time_estimate_seconds) : null,
      status: row.status as string,
      orderIndex: Number(row.order_index ?? 0),
      metadata: row.metadata_json ? JSON.parse(String(row.metadata_json)) : {},
      createdAt: row.created_at ? String(row.created_at) : null,
      updatedAt: row.updated_at ? String(row.updated_at) : null,
    };
  });

  return c.json({ items });
});

// GET /api/question-bank/questions/:id
app.get('/questions/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  if (!Number.isFinite(id) || id < 1) {
    return c.json({ error: 'Invalid question id' }, 400);
  }

  const row = await queryOne<Record<string, unknown>>(
    c.env.DB,
    `SELECT
      id,
      test_type,
      question_text,
      question_type,
      options_json,
      category,
      subcategory,
      difficulty,
      time_estimate_seconds,
      status,
      order_index,
      metadata_json,
      created_at,
      updated_at
    FROM question_bank
    WHERE id = ?
    LIMIT 1`,
    [id],
  );

  if (!row) {
    return c.json({ error: 'Question not found' }, 404);
  }

  return c.json({
    id: Number(row.id),
    testType: row.test_type as string,
    questionText: String(row.question_text ?? ''),
    questionType: row.question_type as string,
    options: row.options_json ? JSON.parse(String(row.options_json)) : [],
    category: row.category ? String(row.category) : null,
    subcategory: row.subcategory ? String(row.subcategory) : null,
    difficulty: row.difficulty as string | null,
    timeEstimateSeconds: row.time_estimate_seconds ? Number(row.time_estimate_seconds) : null,
    status: row.status as string,
    orderIndex: Number(row.order_index ?? 0),
    metadata: row.metadata_json ? JSON.parse(String(row.metadata_json)) : {},
    createdAt: row.created_at ? String(row.created_at) : null,
    updatedAt: row.updated_at ? String(row.updated_at) : null,
  });
});

// POST /api/question-bank/questions
app.post('/questions', async (c) => {
  try {
    const body = await c.req.json();
    const data = questionSchema.parse(body);

    const result = await run(
      c.env.DB,
      `INSERT INTO question_bank (
        test_type, question_text, question_type, options_json,
        category, subcategory, difficulty, time_estimate_seconds,
        status, order_index, metadata_json, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [
        data.testType,
        data.questionText.trim(),
        data.questionType,
        data.options ? JSON.stringify(data.options) : null,
        data.category?.trim() || null,
        data.subcategory?.trim() || null,
        data.difficulty || null,
        data.timeEstimateSeconds || null,
        data.status,
        data.orderIndex,
        data.metadata ? JSON.stringify(data.metadata) : null,
      ],
    );

    const newId = result.meta.last_row_id as number;
    
    const row = await queryOne<Record<string, unknown>>(
      c.env.DB,
      `SELECT * FROM question_bank WHERE id = ? LIMIT 1`,
      [newId],
    );

    if (!row) {
      return c.json({ error: 'Failed to create question' }, 500);
    }

    return c.json({
      id: Number(row.id),
      testType: row.test_type as string,
      questionText: String(row.question_text ?? ''),
      questionType: row.question_type as string,
      options: row.options_json ? JSON.parse(String(row.options_json)) : [],
      category: row.category ? String(row.category) : null,
      subcategory: row.subcategory ? String(row.subcategory) : null,
      difficulty: row.difficulty as string | null,
      timeEstimateSeconds: row.time_estimate_seconds ? Number(row.time_estimate_seconds) : null,
      status: row.status as string,
      orderIndex: Number(row.order_index ?? 0),
      metadata: row.metadata_json ? JSON.parse(String(row.metadata_json)) : {},
      createdAt: row.created_at ? String(row.created_at) : null,
      updatedAt: row.updated_at ? String(row.updated_at) : null,
    }, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: error.errors[0].message }, 400);
    }
    throw error;
  }
});

// PATCH /api/question-bank/questions/:id
app.patch('/questions/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  if (!Number.isFinite(id) || id < 1) {
    return c.json({ error: 'Invalid question id' }, 400);
  }

  try {
    const body = await c.req.json();
    const data = questionSchema.partial().parse(body);

    const existing = await queryOne<{ id: number }>(
      c.env.DB,
      'SELECT id FROM question_bank WHERE id = ? LIMIT 1',
      [id],
    );

    if (!existing) {
      return c.json({ error: 'Question not found' }, 404);
    }

    const setClauses: string[] = [];
    const params: unknown[] = [];

    if (data.testType !== undefined) {
      setClauses.push('test_type = ?');
      params.push(data.testType);
    }
    if (data.questionText !== undefined) {
      setClauses.push('question_text = ?');
      params.push(data.questionText.trim());
    }
    if (data.questionType !== undefined) {
      setClauses.push('question_type = ?');
      params.push(data.questionType);
    }
    if (data.options !== undefined) {
      setClauses.push('options_json = ?');
      params.push(JSON.stringify(data.options));
    }
    if (data.category !== undefined) {
      setClauses.push('category = ?');
      params.push(data.category?.trim() || null);
    }
    if (data.subcategory !== undefined) {
      setClauses.push('subcategory = ?');
      params.push(data.subcategory?.trim() || null);
    }
    if (data.difficulty !== undefined) {
      setClauses.push('difficulty = ?');
      params.push(data.difficulty);
    }
    if (data.timeEstimateSeconds !== undefined) {
      setClauses.push('time_estimate_seconds = ?');
      params.push(data.timeEstimateSeconds);
    }
    if (data.status !== undefined) {
      setClauses.push('status = ?');
      params.push(data.status);
    }
    if (data.orderIndex !== undefined) {
      setClauses.push('order_index = ?');
      params.push(data.orderIndex);
    }
    if (data.metadata !== undefined) {
      setClauses.push('metadata_json = ?');
      params.push(JSON.stringify(data.metadata));
    }

    if (setClauses.length === 0) {
      return c.json({ error: 'No fields to update' }, 400);
    }

    setClauses.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    await run(
      c.env.DB,
      `UPDATE question_bank SET ${setClauses.join(', ')} WHERE id = ?`,
      params,
    );

    const row = await queryOne<Record<string, unknown>>(
      c.env.DB,
      `SELECT * FROM question_bank WHERE id = ? LIMIT 1`,
      [id],
    );

    if (!row) {
      return c.json({ error: 'Question not found after update' }, 500);
    }

    return c.json({
      id: Number(row.id),
      testType: row.test_type as string,
      questionText: String(row.question_text ?? ''),
      questionType: row.question_type as string,
      options: row.options_json ? JSON.parse(String(row.options_json)) : [],
      category: row.category ? String(row.category) : null,
      subcategory: row.subcategory ? String(row.subcategory) : null,
      difficulty: row.difficulty as string | null,
      timeEstimateSeconds: row.time_estimate_seconds ? Number(row.time_estimate_seconds) : null,
      status: row.status as string,
      orderIndex: Number(row.order_index ?? 0),
      metadata: row.metadata_json ? JSON.parse(String(row.metadata_json)) : {},
      createdAt: row.created_at ? String(row.created_at) : null,
      updatedAt: row.updated_at ? String(row.updated_at) : null,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: error.errors[0].message }, 400);
    }
    throw error;
  }
});

export default app;
