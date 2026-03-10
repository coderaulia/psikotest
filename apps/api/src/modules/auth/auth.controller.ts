import type { Request, Response } from 'express';
import { z } from 'zod';

import { HttpError } from '../../lib/http-error.js';
import { loginAdmin } from './auth.service.js';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export function login(request: Request, response: Response) {
  const payload = loginSchema.parse(request.body);
  const result = loginAdmin(payload.email, payload.password);

  if (!result) {
    throw new HttpError(401, 'Invalid admin credentials');
  }

  response.json(result);
}

export function logout(_request: Request, response: Response) {
  response.status(204).send();
}
