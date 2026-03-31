import { Hono } from 'hono';
import type { Env } from '../index';

const app = new Hono<{ Bindings: Env }>();

// Get public session by token
app.get('/session/:token', async (c) => {
  const token = c.req.param('token');
  
  // TODO: Fetch from D1 database
  return c.json({
    session: {
      id: 1,
      title: 'Sample Assessment',
      testType: 'iq',
      instructions: ['Read carefully', 'Answer all questions'],
      estimatedMinutes: 30,
      status: 'active',
    },
    questions: [],
  });
});

// Start submission
app.post('/session/:token/start', async (c) => {
  const token = c.req.param('token');
  const body = await c.req.json();
  
  // TODO: Create submission in database
  return c.json({
    submissionId: 1,
    participantId: 1,
    token: 'submission-token-123',
    submissionAccessToken: 'access-token-456',
    status: 'in_progress',
  });
});

// Get questions for submission
app.get('/submissions/:id/questions', async (c) => {
  const submissionId = c.req.param('id');
  const groupIndex = c.req.query('groupIndex') || '0';
  
  // TODO: Fetch from database
  return c.json({
    submissionId: parseInt(submissionId),
    questions: [],
  });
});

// Save answers
app.post('/submissions/:id/answers', async (c) => {
  const submissionId = c.req.param('id');
  const body = await c.req.json();
  
  // TODO: Save to database
  return c.json({
    submissionId: parseInt(submissionId),
    saved: true,
  });
});

// Submit test
app.post('/submissions/:id/submit', async (c) => {
  const submissionId = c.req.param('id');
  
  // TODO: Process submission and calculate results
  return c.json({
    submissionId: parseInt(submissionId),
    status: 'scored',
    resultId: 1,
  });
});

export default app;