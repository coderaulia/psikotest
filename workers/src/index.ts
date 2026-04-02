import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { Env } from './types';
import { securityHeaders } from './middleware/security-headers';

import authRoutes from './routes/auth';
import siteAuthRoutes from './routes/site-auth';
import siteBillingRoutes from './routes/site-billing';
import siteOnboardingRoutes from './routes/site-onboarding';
import siteResultsRoutes from './routes/site-results';
import siteWorkspaceRoutes from './routes/site-workspace';
import dashboardRoutes from './routes/dashboard';
import testSessionRoutes from './routes/test-sessions';
import customerRoutes from './routes/customers';
import publicSessionRoutes from './routes/public-sessions';
import settingsRoutes from './routes/settings';
import reportsRoutes from './routes/reports';
import participantsRoutes from './routes/participants';
import resultsRoutes from './routes/results';
import questionBankRoutes from './routes/question-bank';

const app = new Hono<{ Bindings: Env }>();

app.use('*', async (c, next) => {
  const origin = c.env.APP_ORIGIN ?? 'https://psikotest.vanaila.com';
  const corsMiddleware = cors({
    origin: [origin, 'http://localhost:5173', 'http://localhost:3000'],
    allowHeaders: ['Content-Type', 'Authorization', 'X-Submission-Token'],
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
    maxAge: 600,
  });
  return corsMiddleware(c, next);
});

app.use('*', securityHeaders);

app.get('/api/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    message: 'Psikotest API running on Cloudflare Workers',
    version: '2.2.0',
  });
});

app.route('/api/auth', authRoutes);
app.route('/api/site-auth', siteAuthRoutes);
app.route('/api/site-billing', siteBillingRoutes);
app.route('/api/site-onboarding', siteOnboardingRoutes);
app.route('/api/site-results', siteResultsRoutes);
app.route('/api/site-workspace', siteWorkspaceRoutes);
app.route('/api/dashboard', dashboardRoutes);
app.route('/api/sessions', testSessionRoutes);
app.route('/api/customers', customerRoutes);
app.route('/api/public', publicSessionRoutes);
app.route('/api/settings', settingsRoutes);
app.route('/api/reports', reportsRoutes);
app.route('/api/participants', participantsRoutes);
app.route('/api/results', resultsRoutes);
app.route('/api/test-sessions', testSessionRoutes);
app.route('/api/question-bank', questionBankRoutes);

app.notFound((c) => {
  return c.json({ error: 'Not Found', path: c.req.path }, 404);
});

app.onError((err, c) => {
  console.error('[worker] Unhandled error:', err.message, err.stack);
  const status = 'status' in err && typeof err.status === 'number' ? err.status : 500;
  return c.json(
    {
      error: status === 500 ? 'Internal Server Error' : err.message,
      message: err.message,
    },
    { status: status as 500 },
  );
});

export default app;
