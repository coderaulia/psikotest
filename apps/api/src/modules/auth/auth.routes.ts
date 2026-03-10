import { Router } from 'express';

import { asyncHandler } from '../../lib/async-handler.js';
import { login, logout } from './auth.controller.js';

export const authRoutes = Router();

authRoutes.post('/login', asyncHandler(async (request, response) => login(request, response)));
authRoutes.post('/logout', asyncHandler(async (request, response) => logout(request, response)));
