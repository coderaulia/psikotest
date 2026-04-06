import { HttpError } from '../../lib/http-error.js';
import { createQuestionRecord, fetchQuestionBankQuestions, fetchQuestionById, updateQuestionRecord, } from './question-bank.repository.js';
export async function listQuestionBankQuestions(filters = {}) {
    return fetchQuestionBankQuestions(filters);
}
export async function getQuestionBankQuestionById(id) {
    return fetchQuestionById(id);
}
export async function createQuestionBankQuestion(input) {
    const question = await createQuestionRecord(input);
    if (!question) {
        throw new HttpError(500, 'Failed to create question');
    }
    return question;
}
export async function updateQuestionBankQuestion(id, input) {
    const question = await updateQuestionRecord(id, input);
    if (!question) {
        throw new HttpError(404, 'Question not found');
    }
    return question;
}
