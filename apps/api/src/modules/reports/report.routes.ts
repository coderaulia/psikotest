import { Router } from 'express';

import { asyncHandler } from '../../lib/async-handler.js';
import { getReportsSummary } from './report.service.js';

export const reportRoutes = Router();

reportRoutes.get(
  '/summary',
  asyncHandler(async (_request, response) => {
    response.json(await getReportsSummary());
  }),
);
