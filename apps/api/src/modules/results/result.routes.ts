import { Router } from 'express';
import { z } from 'zod';

import { asyncHandler } from '../../lib/async-handler.js';
import { HttpError } from '../../lib/http-error.js';
import { getResultById, listResults } from './result.service.js';

const querySchema = z.object({
  search: z.string().optional(),
  testType: z.enum(['iq', 'disc', 'workload']).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

export const resultRoutes = Router();

resultRoutes.get(
  '/',
  asyncHandler(async (request, response) => {
    const filters = querySchema.parse(request.query);
    response.json({ items: await listResults(filters) });
  }),
);

resultRoutes.get(
  '/:id',
  asyncHandler(async (request, response) => {
    const result = await getResultById(Number(request.params.id));

    if (!result) {
      throw new HttpError(404, 'Result not found');
    }

    response.json(result);
  }),
);
