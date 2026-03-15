import { Router } from 'express';
import { z } from 'zod';

import { HttpError } from '../../lib/http-error.js';
import { asyncHandler } from '../../lib/async-handler.js';
import { createRateLimit } from '../../middleware/rate-limit.js';
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
  appliedPosition: z.string().optional(),
  age: z.number().int().min(10).max(100).optional(),
  educationLevel: z.string().max(120).optional(),
  consentAccepted: z.literal(true),
  consentAcceptedAt: z.string().datetime(),
});

const answersSchema = z.object({
  answers: z.array(answerItemSchema).max(500),
});

const submitSchema = z.object({
  answers: z.array(answerItemSchema).max(500).optional(),
});

const sessionLookupRateLimit = createRateLimit({
  keyPrefix: 'public-session-lookup',
  windowMs: 60 * 1000,
  maxRequests: 120,
  message: 'Too many session lookup requests. Please slow down.',
});

const sessionStartRateLimit = createRateLimit({
  keyPrefix: 'public-session-start',
  windowMs: 10 * 60 * 1000,
  maxRequests: 20,
  message: 'Too many session start requests. Please try again later.',
});

const submissionWriteRateLimit = createRateLimit({
  keyPrefix: 'public-submission-write',
  windowMs: 60 * 1000,
  maxRequests: 240,
  message: 'Too many answer save requests. Please slow down.',
});

const submissionFinalizeRateLimit = createRateLimit({
  keyPrefix: 'public-submission-finalize',
  windowMs: 10 * 60 * 1000,
  maxRequests: 20,
  message: 'Too many submission attempts. Please try again later.',
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
  sessionLookupRateLimit,
  asyncHandler(async (request, response) => {
    const token = String(request.params.token);
    response.json(await getPublicSession(token));
  }),
);

publicSessionRoutes.post(
  '/session/:token/start',
  sessionStartRateLimit,
  asyncHandler(async (request, response) => {
    const payload = startSchema.parse(request.body);
    const token = String(request.params.token);
    response.status(201).json(await startPublicSubmission(token, payload));
  }),
);

publicSessionRoutes.post(
  '/submissions/:submissionId/answers',
  submissionWriteRateLimit,
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
  submissionFinalizeRateLimit,
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
