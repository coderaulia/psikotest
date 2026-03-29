import { Router } from 'express';

import { asyncHandler } from '../../lib/async-handler.js';
import { HttpError } from '../../lib/http-error.js';
import { exportCustomerWorkspaceResultsCsv, listCustomerWorkspaceResults } from './site-results.service.js';

export const siteResultsRoutes = Router();

siteResultsRoutes.get(
  '/export.csv',
  asyncHandler(async (request, response) => {
    if (!request.customerSession) {
      throw new HttpError(401, 'Customer session is required');
    }

    const csv = await exportCustomerWorkspaceResultsCsv(request.customerSession.accountId);
    response.setHeader('Content-Type', 'text/csv; charset=utf-8');
    response.setHeader('Content-Disposition', 'attachment; filename="workspace-results.csv"');
    response.send(csv);
  }),
);

siteResultsRoutes.get(
  '/',
  asyncHandler(async (request, response) => {
    if (!request.customerSession) {
      throw new HttpError(401, 'Customer session is required');
    }

    const results = await listCustomerWorkspaceResults(request.customerSession.accountId);
    response.json(results);
  }),
);
