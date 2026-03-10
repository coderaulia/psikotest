import { Router } from 'express';
import { z } from 'zod';

import { HttpError } from '../../lib/http-error.js';
import {
  getPublicSession,
  saveSubmissionAnswers,
  startPublicSubmission,
  submitPublicSubmission,
} from './public-session.service.js';

const startSchema = z.object({
  fullName: z.string().min(3),
  email: z.string().email(),
  employeeCode: z.string().optional(),
  department: z.string().optional(),
  position: z.string().optional(),
});

const answersSchema = z.object({
  answers: z.array(
    z.object({
      questionId: z.number(),
      mostOptionId: z.number().optional(),
      leastOptionId: z.number().optional(),
      selectedOptionId: z.number().optional(),
      value: z.number().optional(),
    }),
  ),
});

export const publicSessionRoutes = Router();

publicSessionRoutes.get('/session/:token', (request, response) => {
  const session = getPublicSession(request.params.token);

  if (!session) {
    throw new HttpError(404, 'Public session not found');
  }

  response.json(session);
});

publicSessionRoutes.post('/session/:token/start', (request, response) => {
  const payload = startSchema.parse(request.body);
  response.status(201).json(startPublicSubmission(request.params.token, payload));
});

publicSessionRoutes.post('/submissions/:submissionId/answers', (request, response) => {
  const payload = answersSchema.parse(request.body);
  const submissionId = Number(request.params.submissionId);

  response.json(saveSubmissionAnswers(submissionId, payload.answers));
});

publicSessionRoutes.post('/submissions/:submissionId/submit', (request, response) => {
  const submissionId = Number(request.params.submissionId);
  response.json(submitPublicSubmission(submissionId));
});
