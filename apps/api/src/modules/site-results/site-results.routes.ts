import { Router } from 'express';

import { asyncHandler } from '../../lib/async-handler.js';
import { HttpError } from '../../lib/http-error.js';
import { listCustomerWorkspaceResults } from './site-results.service.js';

export const siteResultsRoutes = Router();

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
