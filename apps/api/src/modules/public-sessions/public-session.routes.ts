import { Router } from 'express';
import { z } from 'zod';

import {
  getPublicSession,
  saveSubmissionAnswers,
  startPublicSubmission,
  submitPublicSubmission,
} from './public-session.service.js';

const answerItemSchema = z.object({
  questionId: z.number(),
  mostOptionId: z.number().optional(),
  leastOptionId: z.number().optional(),
  selectedOptionId: z.number().optional(),
  value: z.number().optional(),
});

const startSchema = z.object({
  fullName: z.string().min(3),
  email: z.string().email(),
  employeeCode: z.string().optional(),
  department: z.string().optional(),
  position: z.string().optional(),
});

const answersSchema = z.object({
  answers: z.array(answerItemSchema),
});

const submitSchema = z.object({
  answers: z.array(answerItemSchema).optional(),
});

export const publicSessionRoutes = Router();

publicSessionRoutes.get('/session/:token', (request, response) => {
  response.json(getPublicSession(request.params.token));
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
  const payload = submitSchema.parse(request.body ?? {});
  const submissionId = Number(request.params.submissionId);

  response.json(submitPublicSubmission(submissionId, payload.answers));
});
