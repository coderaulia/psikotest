import cors from 'cors';
import express from 'express';
import helmet from 'helmet';

import { env } from '../config/env.js';
import { errorHandler } from '../middleware/error-handler.js';
import { notFoundHandler } from '../middleware/not-found.js';
import { requireAdminAuth } from '../middleware/require-admin-auth.js';
import { authRoutes } from '../modules/auth/auth.routes.js';
import { dashboardRoutes } from '../modules/dashboard/dashboard.routes.js';
import { healthRoutes } from '../modules/health/health.routes.js';
import { participantRoutes } from '../modules/participants/participants.routes.js';
import { publicSessionRoutes } from '../modules/public-sessions/public-session.routes.js';
import { resultRoutes } from '../modules/results/result.routes.js';
import { testSessionRoutes } from '../modules/test-sessions/test-session.routes.js';

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: env.APP_ORIGIN,
      credentials: true,
    }),
  );
  app.use(helmet());
  app.use(express.json());

  app.use('/api/health', healthRoutes);
  app.use('/api/auth', authRoutes);
  app.use('/api/dashboard', requireAdminAuth, dashboardRoutes);
  app.use('/api/participants', requireAdminAuth, participantRoutes);
  app.use('/api/test-sessions', requireAdminAuth, testSessionRoutes);
  app.use('/api/results', requireAdminAuth, resultRoutes);
  app.use('/api/public', publicSessionRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
