import type { Request, Response } from 'express';
import { z } from 'zod';

import { HttpError } from '../../lib/http-error.js';
import { loginAdmin, logoutAdmin } from './auth.service.js';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export async function login(request: Request, response: Response) {
  const payload = loginSchema.parse(request.body);
  const result = await loginAdmin(payload.email, payload.password);

  if (!result) {
    throw new HttpError(401, 'Invalid admin credentials');
  }

  response.json(result);
}

export async function logout(request: Request, response: Response) {
  if (!request.adminSession) {
    throw new HttpError(401, 'Admin session is required');
  }

  await logoutAdmin(request.adminSession.adminId);
  response.status(204).send();
}
