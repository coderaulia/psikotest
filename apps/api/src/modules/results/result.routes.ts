import { Router } from 'express';

import { asyncHandler } from '../../lib/async-handler.js';
import { HttpError } from '../../lib/http-error.js';
import { getResultById, listResults } from './result.service.js';

export const resultRoutes = Router();

resultRoutes.get(
  '/',
  asyncHandler(async (_request, response) => {
    response.json({ items: await listResults() });
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
