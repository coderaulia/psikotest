import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { env } from 'hono/adapter';

import { healthRoutes } from './routes/health';
import { authRoutes } from './routes/auth';
import { siteAuthRoutes } from './routes/site-auth';
import { publicSessionRoutes } from './routes/public-sessions';
import { dashboardRoutes } from './routes/dashboard';
import { errorHandler } from './middleware/error-handler';

export interface Env {
  DB: D1Database;
  JWT_SECRET: string;
  APP_ORIGIN: string;
}

const app = new Hono<{ Bindings: Env }>();

// CORS middleware
app.use('*', cors({
  origin: (origin) => {
    const allowedOrigins = ['https://psikotest.vanaila.com', 'http://localhost:5173'];
    return allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
  },
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Authorization', 'Content-Type', 'X-Submission-Token'],
  credentials: true,
}));

// Logger
app.use('*', logger());

// API routes
app.route('/api/health', healthRoutes);
app.route('/api/auth', authRoutes);
app.route('/api/site-auth', siteAuthRoutes);
app.route('/api/public', publicSessionRoutes);
app.route('/api/dashboard', dashboardRoutes);

// Error handler
app.onError(errorHandler);

// 404 handler
app.notFound((c) => {
  return c.json({ error: 'Not Found' }, 404);
});

export default app;