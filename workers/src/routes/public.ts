import { Hono } from 'hono';
import type { Env } from '../index';

const app = new Hono<{ Bindings: Env }>();

app.get('/session/:token', async (c) => {
  const db = c.env.DB;
  const token = c.req.param('token');
  
  const session = await db.prepare(`
    SELECT ts.id, ts.test_type_id, tt.code as test_type, ts.title, ts.description, ts.instructions, ts.status, ts.time_limit_minutes, ts.settings_json
    FROM test_sessions ts
    LEFT JOIN test_types tt ON ts.test_type_id = tt.id
    WHERE ts.access_token = ? AND ts.status = 'active'
  `).bind(token).first();
  
  if (!session) {
    return c.json({ error: 'Session not found or inactive' }, 404);
  }
  
  const questions = await db.prepare(`
    SELECT q.id, q.question_code, q.prompt, q.instruction_text, q.question_type, q.question_order, q.is_required, q.metadata_json as question_meta
    FROM questions q
    WHERE q.test_type_id = ? AND q.status = 'active'
    ORDER BY q.question_order
  `).bind((session as any).test_type_id).all();
  
  const questionsWithOptions = [];
  for (const q of (questions.results || [])) {
    const options = await db.prepare(`
      SELECT id, option_key, option_text, dimension_key, value_number, option_order
      FROM question_options
      WHERE question_id = ?
      ORDER BY option_order
    `).bind((q as any).id).all();
    
    questionsWithOptions.push({
      ...q,
      options: options.results || [],
    });
  }
  
  return c.json({
    session: {
      id: (session as any).id,
      title: (session as any).title,
      testType: (session as any).test_type,
      instructions: ((session as any).instructions || '').split('\n').filter((i: string) => i),
      estimatedMinutes: (session as any).time_limit_minutes,
      status: (session as any).status,
    },
    questions: questionsWithOptions,
  });
});

app.post('/session/:token/start', async (c) => {
  const db = c.env.DB;
  const token = c.req.param('token');
  const body = await c.req.json();
  
  const session = await db.prepare(`
    SELECT ts.id, ts.test_type_id FROM test_sessions ts WHERE ts.access_token = ? AND ts.status = 'active'
  `).bind(token).first();
  
  if (!session) {
    return c.json({ error: 'Session not found or inactive' }, 404);
  }
  
  let participantId: number;
  if (body.participantId) {
    participantId = body.participantId;
  } else {
    const result = await db.prepare(`
      INSERT INTO participants (full_name, email, employee_code, department, position_title, metadata_json, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).bind(
      body.fullName || '',
      body.email || '',
      body.employeeCode || null,
      body.department || null,
      body.positionTitle || null,
      JSON.stringify(body.metadata || {})
    ).run();
    participantId = result.meta.last_row_id;
  }
  
  const submissionResult = await db.prepare(`
    INSERT INTO submissions (test_session_id, participant_id, status, started_at, created_at, updated_at)
    VALUES (?, ?, 'in_progress', datetime('now'), datetime('now'), datetime('now'))
  `).bind((session as any).id, participantId).run();
  
  const submissionId = submissionResult.meta.last_row_id;
  const accessToken = `sub-${submissionId}-${Math.random().toString(36).substring(2, 15)}`;
  
  return c.json({
    submissionId,
    participantId,
    submissionAccessToken: accessToken,
    status: 'in_progress',
  });
});

app.get('/submissions/:id/questions', async (c) => {
  const db = c.env.DB;
  const submissionId = c.req.param('id');
  const groupIndex = parseInt(c.req.query('groupIndex') || '0', 10);
  
  const submission = await db.prepare(`
    SELECT s.id, s.test_session_id, ts.test_type_id
    FROM submissions s
    JOIN test_sessions ts ON s.test_session_id = ts.id
    WHERE s.id = ?
  `).bind(submissionId).first();
  
  if (!submission) {
    return c.json({ error: 'Submission not found' }, 404);
  }
  
  const questions = await db.prepare(`
    SELECT q.id, q.question_code, q.prompt, q.question_type, q.question_order
    FROM questions q
    WHERE q.test_type_id = ? AND q.status = 'active'
    ORDER BY q.question_order
    LIMIT 10 OFFSET ?
  `).bind((submission as any).test_type_id, groupIndex * 10).all();
  
  return c.json({
    submissionId: parseInt(submissionId),
    groupIndex,
    questions: questions.results || [],
  });
});

app.post('/submissions/:id/answers', async (c) => {
  const db = c.env.DB;
  const submissionId = c.req.param('id');
  const body = await c.req.json();
  
  for (const answer of (body.answers || [])) {
    await db.prepare(`
      INSERT INTO answers (submission_id, question_id, answer_role, selected_option_id, value_number, value_text, answer_payload_json, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).bind(
      submissionId,
      answer.questionId,
      answer.answerRole || 'single',
      answer.selectedOptionId || null,
      answer.valueNumber || null,
      answer.valueText || null,
      answer.payload ? JSON.stringify(answer.payload) : null
    ).run();
  }
  
  return c.json({ submissionId: parseInt(submissionId), saved: true });
});

app.post('/submissions/:id/submit', async (c) => {
  const db = c.env.DB;
  const submissionId = c.req.param('id');
  
  await db.prepare(`
    UPDATE submissions SET status = 'completed', submitted_at = datetime('now'), updated_at = datetime('now') WHERE id = ?
  `).bind(submissionId).run();
  
  const result = await db.prepare(`
    INSERT INTO results (submission_id, test_type_id, created_at, updated_at)
    SELECT s.id, ts.test_type_id, datetime('now'), datetime('now')
    FROM submissions s
    JOIN test_sessions ts ON s.test_session_id = ts.id
    WHERE s.id = ?
  `).bind(submissionId).run();
  
  return c.json({
    submissionId: parseInt(submissionId),
    status: 'completed',
    resultId: result.meta.last_row_id || null,
  });
});

export default app;