import { Hono } from 'hono';
import { cors } from 'hono/cors';
import authRoutes from './routes/auth';
import siteAuthRoutes from './routes/site-auth';
import publicRoutes from './routes/public';
import dashboardRoutes from './routes/dashboard';
import participantsRoutes from './routes/participants';
import testSessionsRoutes from './routes/test-sessions';
import resultsRoutes from './routes/results';
import questionBankRoutes from './routes/question-bank';
import settingsRoutes from './routes/settings';
import customersRoutes from './routes/customers';
import reportsRoutes from './routes/reports';
import siteWorkspaceRoutes from './routes/site-workspace';
import siteOnboardingRoutes from './routes/site-onboarding';
import siteResultsRoutes from './routes/site-results';
import siteBillingRoutes from './routes/site-billing';

export type Env = {
  DB: D1Database;
  JWT_SECRET: string;
  NODE_ENV: string;
  APP_ORIGIN: string;
};

const app = new Hono<{ Bindings: Env }>();

app.use('*', cors({
  origin: ['https://psikotest.vanaila.com', 'http://localhost:5173', 'http://localhost:3000'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Submission-Token'],
  exposeHeaders: ['Content-Length', 'X-Request-Id'],
  credentials: true,
  maxAge: 86400,
}));

app.get('/api/health', (c) => {
  return c.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    message: 'Psikotest API is running on Workers'
  });
});

app.get('/api/debug/token', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'No token provided' }, 400);
  }
  const token = authHeader.substring(7);
  try {
    const { verify } = await import('hono/jwt');
    const payload = await verify(token, c.env.JWT_SECRET, 'HS256');
    return c.json({ 
      valid: true, 
      payload,
      tokenLength: token.length 
    });
  } catch (e: any) {
    return c.json({ 
      valid: false, 
      error: e.message,
      tokenLength: token.length 
    });
  }
});

app.route('/api/auth', authRoutes);
app.route('/api/site-auth', siteAuthRoutes);
app.route('/api/public', publicRoutes);
app.route('/api/dashboard', dashboardRoutes);
app.route('/api/participants', participantsRoutes);
app.route('/api/test-sessions', testSessionsRoutes);
app.route('/api/results', resultsRoutes);
app.route('/api/question-bank', questionBankRoutes);
app.route('/api/settings', settingsRoutes);
app.route('/api/customers', customersRoutes);
app.route('/api/reports', reportsRoutes);
app.route('/api/site-workspace', siteWorkspaceRoutes);
app.route('/api/site-onboarding', siteOnboardingRoutes);
app.route('/api/site-results', siteResultsRoutes);
app.route('/api/site-billing', siteBillingRoutes);

app.notFound((c) => {
  return c.json({ error: 'Not Found', path: c.req.path }, 404);
});

app.onError((err, c) => {
  console.error('Error:', err);
  return c.json({ 
    error: 'Internal Server Error',
    message: err.message 
  }, 500);
});

export default app;