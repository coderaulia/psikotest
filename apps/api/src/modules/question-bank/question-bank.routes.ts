import { Router } from 'express';
import { z } from 'zod';

import { asyncHandler } from '../../lib/async-handler.js';
import { HttpError } from '../../lib/http-error.js';
import { createAuditEvent } from '../../lib/audit-log.js';
import {
  createQuestionBankQuestion,
  getQuestionBankQuestionById,
  listQuestionBankQuestions,
  updateQuestionBankQuestion,
} from './question-bank.service.js';

const testTypeSchema = z.enum(['iq', 'disc', 'workload', 'custom']);
const questionTypeSchema = z.enum(['single_choice', 'forced_choice', 'likert']);

const querySchema = z.object({
  search: z.string().optional(),
  testType: testTypeSchema.optional(),
  status: z.enum(['draft', 'active', 'archived']).optional(),
});

const optionSchema = z.object({
  optionKey: z.string().min(1).max(20),
  optionText: z.string().min(1).max(500),
  dimensionKey: z.string().max(50).optional().nullable(),
  valueNumber: z.coerce.number().optional().nullable(),
  isCorrect: z.boolean().optional(),
  optionOrder: z.coerce.number().int().positive(),
  scorePayload: z.record(z.string(), z.unknown()).optional().nullable(),
});

const questionSchema = z.object({
  testType: testTypeSchema,
  questionCode: z.string().min(3).max(50),
  instructionText: z.string().max(2000).optional().nullable(),
  prompt: z.string().max(2000).optional().nullable(),
  questionGroupKey: z.string().max(50).optional().nullable(),
  dimensionKey: z.string().max(50).optional().nullable(),
  questionType: questionTypeSchema,
  questionOrder: z.coerce.number().int().positive(),
  isRequired: z.boolean().default(true),
  status: z.enum(['draft', 'active', 'archived']).default('active'),
  questionMeta: z.record(z.string(), z.unknown()).optional().nullable(),
  options: z.array(optionSchema).min(2).max(8),
});

export const questionBankRoutes = Router();

questionBankRoutes.get(
  '/questions',
  asyncHandler(async (request, response) => {
    const filters = querySchema.parse(request.query);
    response.json({ items: await listQuestionBankQuestions(filters) });
  }),
);

questionBankRoutes.get(
  '/questions/:id',
  asyncHandler(async (request, response) => {
    const question = await getQuestionBankQuestionById(Number(request.params.id));

    if (!question) {
      throw new HttpError(404, 'Question not found');
    }

    response.json(question);
  }),
);

questionBankRoutes.post(
  '/questions',
  asyncHandler(async (request, response) => {
    if (!request.adminSession) {
      throw new HttpError(401, 'Admin session is required');
    }

    const payload = questionSchema.parse(request.body);
    const question = await createQuestionBankQuestion(payload);

    await createAuditEvent({
      actorType: 'admin',
      actorAdminId: request.adminSession.adminId,
      entityType: 'question',
      entityId: question.id,
      action: 'question.created',
      metadata: { testType: question.testType, questionCode: question.questionCode },
    });

    response.status(201).json(question);
  }),
);

questionBankRoutes.patch(
  '/questions/:id',
  asyncHandler(async (request, response) => {
    if (!request.adminSession) {
      throw new HttpError(401, 'Admin session is required');
    }

    const payload = questionSchema.parse(request.body);
    const question = await updateQuestionBankQuestion(Number(request.params.id), payload);

    await createAuditEvent({
      actorType: 'admin',
      actorAdminId: request.adminSession.adminId,
      entityType: 'question',
      entityId: question.id,
      action: 'question.updated',
      metadata: { testType: question.testType, questionCode: question.questionCode },
    });

    response.json(question);
  }),
);
