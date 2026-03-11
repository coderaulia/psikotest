import { HttpError } from '../../lib/http-error.js';
import {
  createQuestionRecord,
  fetchQuestionBankQuestions,
  fetchQuestionById,
  type QuestionBankListFilters,
  type QuestionBankQuestionInput,
  updateQuestionRecord,
} from './question-bank.repository.js';

export async function listQuestionBankQuestions(filters: QuestionBankListFilters = {}) {
  return fetchQuestionBankQuestions(filters);
}

export async function getQuestionBankQuestionById(id: number) {
  return fetchQuestionById(id);
}

export async function createQuestionBankQuestion(input: QuestionBankQuestionInput) {
  const question = await createQuestionRecord(input);

  if (!question) {
    throw new HttpError(500, 'Failed to create question');
  }

  return question;
}

export async function updateQuestionBankQuestion(id: number, input: QuestionBankQuestionInput) {
  const question = await updateQuestionRecord(id, input);

  if (!question) {
    throw new HttpError(404, 'Question not found');
  }

  return question;
}
