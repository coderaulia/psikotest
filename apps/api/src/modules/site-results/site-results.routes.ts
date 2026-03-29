import { Router } from 'express';
import { z } from 'zod';

import { asyncHandler } from '../../lib/async-handler.js';
import { HttpError } from '../../lib/http-error.js';
import { exportCustomerWorkspaceResultsCsv, getCustomerWorkspaceResultDetail, listCustomerWorkspaceResults } from './site-results.service.js';

const resultParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

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
  '/:id',
  asyncHandler(async (request, response) => {
    if (!request.customerSession) {
      throw new HttpError(401, 'Customer session is required');
    }

    const { id } = resultParamsSchema.parse(request.params);
    const result = await getCustomerWorkspaceResultDetail(request.customerSession.accountId, id);
    response.json(result);
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


