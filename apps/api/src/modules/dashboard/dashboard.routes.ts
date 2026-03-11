import { Router } from 'express';

import { asyncHandler } from '../../lib/async-handler.js';
import { getDashboardSummary } from './dashboard.service.js';

export const dashboardRoutes = Router();

dashboardRoutes.get(
  '/summary',
  asyncHandler(async (_request, response) => {
    response.json(await getDashboardSummary());
  }),
);
