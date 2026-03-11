import { Router } from 'express';
import { z } from 'zod';

import { HttpError } from '../../lib/http-error.js';
import { asyncHandler } from '../../lib/async-handler.js';
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

function readSubmissionAccessToken(authorizationHeader: string | undefined, customHeader: string | undefined) {
  if (customHeader?.trim()) {
    return customHeader.trim();
  }

  if (authorizationHeader?.startsWith('Bearer ')) {
    return authorizationHeader.slice('Bearer '.length).trim();
  }

  throw new HttpError(401, 'Missing submission access token');
}

export const publicSessionRoutes = Router();

publicSessionRoutes.get(
  '/session/:token',
  asyncHandler(async (request, response) => {
    const token = String(request.params.token);
    response.json(await getPublicSession(token));
  }),
);

publicSessionRoutes.post(
  '/session/:token/start',
  asyncHandler(async (request, response) => {
    const payload = startSchema.parse(request.body);
    const token = String(request.params.token);
    response.status(201).json(await startPublicSubmission(token, payload));
  }),
);

publicSessionRoutes.post(
  '/submissions/:submissionId/answers',
  asyncHandler(async (request, response) => {
    const payload = answersSchema.parse(request.body);
    const submissionId = Number(request.params.submissionId);
    const submissionAccessToken = readSubmissionAccessToken(
      request.header('Authorization') ?? undefined,
      request.header('X-Submission-Token') ?? undefined,
    );

    response.json(await saveSubmissionAnswers(submissionId, submissionAccessToken, payload.answers));
  }),
);

publicSessionRoutes.post(
  '/submissions/:submissionId/submit',
  asyncHandler(async (request, response) => {
    const payload = submitSchema.parse(request.body ?? {});
    const submissionId = Number(request.params.submissionId);
    const submissionAccessToken = readSubmissionAccessToken(
      request.header('Authorization') ?? undefined,
      request.header('X-Submission-Token') ?? undefined,
    );

    response.json(await submitPublicSubmission(submissionId, submissionAccessToken, payload.answers));
  }),
);
