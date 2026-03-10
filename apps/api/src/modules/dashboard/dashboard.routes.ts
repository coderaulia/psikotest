import { Router } from 'express';

import { getDashboardSummary } from './dashboard.service.js';

export const dashboardRoutes = Router();

dashboardRoutes.get('/summary', (_request, response) => {
  response.json(getDashboardSummary());
});
