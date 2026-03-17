import cors from 'cors';
import express from 'express';
import helmet from 'helmet';

import { env } from '../config/env.js';
import { errorHandler } from '../middleware/error-handler.js';
import { notFoundHandler } from '../middleware/not-found.js';
import { requireAdminAuth } from '../middleware/require-admin-auth.js';
import { requireCustomerAuth } from '../middleware/require-customer-auth.js';
import { authRoutes } from '../modules/auth/auth.routes.js';
import { dashboardRoutes } from '../modules/dashboard/dashboard.routes.js';
import { healthRoutes } from '../modules/health/health.routes.js';
import { participantRoutes } from '../modules/participants/participants.routes.js';
import { publicSessionRoutes } from '../modules/public-sessions/public-session.routes.js';
import { questionBankRoutes } from '../modules/question-bank/question-bank.routes.js';
import { reportRoutes } from '../modules/reports/report.routes.js';
import { resultRoutes } from '../modules/results/result.routes.js';
import { settingsRoutes } from '../modules/settings/settings.routes.js';
import { siteAuthRoutes } from '../modules/site-auth/site-auth.routes.js';
import { siteOnboardingRoutes } from '../modules/site-onboarding/site-onboarding.routes.js';
import { siteWorkspaceRoutes } from '../modules/site-workspace/site-workspace.routes.js';
import { testSessionRoutes } from '../modules/test-sessions/test-session.routes.js';

const allowedOrigins = env.APP_ORIGIN
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

function applyApiNoStoreHeaders(res: express.Response) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
}

export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  app.disable('etag');
  app.set('trust proxy', 1);

  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
          return callback(null, true);
        }

        return callback(new Error('Origin is not allowed by CORS'));
      },
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Authorization', 'Content-Type', 'X-Submission-Token'],
      maxAge: 600,
    }),
  );

  app.use(
    helmet({
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: { policy: 'same-site' },
    }),
  );

  app.use('/api', (req, res, next) => {
    applyApiNoStoreHeaders(res);
    next();
  });

  app.use(express.json({ limit: '100kb', strict: true }));

  app.use('/api/health', healthRoutes);
  app.use('/api/auth', authRoutes);
  app.use('/api/site-auth', siteAuthRoutes);
  app.use('/api/site-onboarding', requireCustomerAuth, siteOnboardingRoutes);
  app.use('/api/site-workspace', requireCustomerAuth, siteWorkspaceRoutes);
  app.use('/api/dashboard', requireAdminAuth, dashboardRoutes);
  app.use('/api/participants', requireAdminAuth, participantRoutes);
  app.use('/api/test-sessions', requireAdminAuth, testSessionRoutes);
  app.use('/api/results', requireAdminAuth, resultRoutes);
  app.use('/api/reports', requireAdminAuth, reportRoutes);
  app.use('/api/question-bank', requireAdminAuth, questionBankRoutes);
  app.use('/api/settings', requireAdminAuth, settingsRoutes);
  app.use('/api/public', publicSessionRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}



