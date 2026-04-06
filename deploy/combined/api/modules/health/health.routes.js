import { Router } from 'express';
import { env } from '../../config/env.js';
export const healthRoutes = Router();
healthRoutes.get('/', (_request, response) => {
    response.json({
        app: 'psikotest-api',
        status: 'ok',
        port: env.API_PORT,
        timestamp: new Date().toISOString(),
    });
});
