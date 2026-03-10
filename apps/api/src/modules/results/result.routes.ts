import { Router } from 'express';

import { HttpError } from '../../lib/http-error.js';
import { getResultById, listResults } from './result.service.js';

export const resultRoutes = Router();

resultRoutes.get('/', (_request, response) => {
  response.json({ items: listResults() });
});

resultRoutes.get('/:id', (request, response) => {
  const result = getResultById(Number(request.params.id));

  if (!result) {
    throw new HttpError(404, 'Result not found');
  }

  response.json(result);
});
