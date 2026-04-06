import { createAuditEvent } from '../../lib/audit-log.js';
import { HttpError } from '../../lib/http-error.js';
import { createSubmissionAccessToken, verifySubmissionAccessToken } from '../../lib/signed-token.js';
import { storeResult } from '../results/result.service.js';
import { scoreAssessment } from '../scoring/score-assessment.js';
import { createSubmissionForToken, findPublicSessionByToken, loadSubmissionQuestionWindow, loadSubmissionScoringContext, replaceSubmissionAnswers, } from './public-session.repository.js';
function assertSubmissionAccess(submissionId, submissionAccessToken) {
    const claims = verifySubmissionAccessToken(submissionAccessToken);
    if (!claims || claims.submissionId !== submissionId) {
        throw new HttpError(403, 'Invalid or expired submission access token');
    }
    return claims;
}
function sanitizeQuestions(questions) {
    return questions.map((question) => ({
        ...question,
        options: question.options.map(({ isCorrect: _isCorrect, ...option }) => option),
    }));
}
function sanitizePublicSessionDefinition(definition) {
    if (!definition) {
        return null;
    }
    const questions = definition.session.delivery.mode === 'progressive'
        ? []
        : sanitizeQuestions(definition.questions);
    return {
        ...definition,
        questions,
    };
}
function sanitizeQuestionWindow(window) {
    if (!window) {
        return null;
    }
    return {
        ...window,
        questions: sanitizeQuestions(window.questions),
    };
}
function createReviewNote(reviewStatus) {
    if (reviewStatus === 'released') {
        return null;
    }
    if (reviewStatus === 'reviewed') {
        return 'Your responses have been reviewed and are awaiting authorized release.';
    }
    if (reviewStatus === 'in_review') {
        return 'Your responses are currently being reviewed by an authorized psychologist or reviewer.';
    }
    return 'Your responses have been recorded. Final interpretation will be available after professional review.';
}
function sanitizeParticipantResult(result, participantResultMode, participantResultAccess = 'summary') {
    if (participantResultAccess === 'none') {
        return {
            ...result,
            scoreTotal: null,
            scoreBand: null,
            primaryType: null,
            secondaryType: null,
            profileCode: null,
            interpretationKey: null,
            professionalSummary: null,
            recommendation: null,
            limitations: null,
            reviewerNotes: null,
            summaries: [],
            resultPayload: {
                reviewStatus: result.reviewStatus,
                note: 'Your response has been recorded. Thank you for participating.',
            },
        };
    }
    if (participantResultAccess === 'full_released' && result.reviewStatus === 'released') {
        return result;
    }
    if (participantResultAccess === 'full_released' && result.reviewStatus !== 'released') {
        return {
            ...result,
            scoreTotal: null,
            scoreBand: null,
            primaryType: null,
            secondaryType: null,
            profileCode: null,
            interpretationKey: null,
            professionalSummary: null,
            recommendation: null,
            limitations: null,
            reviewerNotes: null,
            summaries: [],
            resultPayload: {
                reviewStatus: result.reviewStatus,
                note: createReviewNote(result.reviewStatus),
            },
        };
    }
    if (participantResultMode === 'instant_summary' || result.reviewStatus === 'released') {
        return {
            ...result,
            professionalSummary: result.reviewStatus === 'released' ? result.professionalSummary : null,
            recommendation: result.reviewStatus === 'released' ? result.recommendation : null,
            limitations: null,
            reviewerNotes: null,
            resultPayload: {
                reviewStatus: result.reviewStatus,
            },
        };
    }
    return {
        ...result,
        scoreTotal: null,
        scoreBand: null,
        primaryType: null,
        secondaryType: null,
        profileCode: null,
        interpretationKey: null,
        professionalSummary: null,
        recommendation: null,
        limitations: null,
        reviewerNotes: null,
        summaries: [],
        resultPayload: {
            reviewStatus: result.reviewStatus,
            note: createReviewNote(result.reviewStatus),
        },
    };
}
export async function getPublicSession(token) {
    const session = await findPublicSessionByToken(token);
    if (!session) {
        throw new HttpError(404, 'Public session not found');
    }
    return sanitizePublicSessionDefinition(session);
}
export async function startPublicSubmission(token, participant) {
    const submission = await createSubmissionForToken(token, participant);
    if (!submission) {
        throw new HttpError(404, 'Public session not found');
    }
    await createAuditEvent({
        actorType: 'participant',
        entityType: 'submission',
        entityId: submission.submissionId,
        action: 'submission.started',
        metadata: {
            participantId: submission.participantId,
            testType: submission.testType,
            token,
        },
    });
    const accessToken = createSubmissionAccessToken({
        submissionId: submission.submissionId,
        participantId: submission.participantId,
    });
    return {
        ...submission,
        submissionAccessToken: accessToken.token,
        submissionAccessExpiresAt: accessToken.expiresAt,
    };
}
export async function getSubmissionQuestionWindow(submissionId, submissionAccessToken, groupIndex) {
    assertSubmissionAccess(submissionId, submissionAccessToken);
    const window = await loadSubmissionQuestionWindow(submissionId, groupIndex);
    if (!window) {
        throw new HttpError(404, 'Submission not found');
    }
    return sanitizeQuestionWindow(window);
}
export async function saveSubmissionAnswers(submissionId, submissionAccessToken, answerSequence, answers) {
    assertSubmissionAccess(submissionId, submissionAccessToken);
    return replaceSubmissionAnswers(submissionId, answers, answerSequence);
}
export async function submitPublicSubmission(submissionId, submissionAccessToken, answerSequence, answers) {
    assertSubmissionAccess(submissionId, submissionAccessToken);
    let context = await loadSubmissionScoringContext(submissionId);
    if (!context) {
        throw new HttpError(404, 'Submission not found');
    }
    if (context.status === 'scored' && context.existingResult) {
        return {
            submissionId: context.submissionId,
            participantId: context.participantId,
            status: 'scored',
            resultId: context.existingResult.id,
            result: sanitizeParticipantResult(context.existingResult, context.definition.session.compliance.participantResultMode, context.definition.session.compliance.participantResultAccess),
        };
    }
    if (answers && answers.length > 0) {
        if (typeof answerSequence !== 'number') {
            throw new HttpError(400, 'Answer sequence is required when submitting new answers');
        }
        await replaceSubmissionAnswers(submissionId, answers, answerSequence);
        context = await loadSubmissionScoringContext(submissionId);
        if (!context) {
            throw new HttpError(404, 'Submission not found');
        }
        if (context.status === 'scored' && context.existingResult) {
            return {
                submissionId: context.submissionId,
                participantId: context.participantId,
                status: 'scored',
                resultId: context.existingResult.id,
                result: sanitizeParticipantResult(context.existingResult, context.definition.session.compliance.participantResultMode, context.definition.session.compliance.participantResultAccess),
            };
        }
    }
    if (context.status !== 'in_progress') {
        throw new HttpError(409, 'Submission is already finalized');
    }
    if (context.answers.length === 0) {
        throw new HttpError(400, 'Cannot submit without answers');
    }
    const submittedAt = new Date().toISOString();
    const scoredResult = scoreAssessment({
        participantId: context.participantId,
        definition: context.definition,
        answers: context.answers,
    });
    const storedResult = await storeResult({
        submissionId: context.submissionId,
        participantId: context.participantId,
        participantName: context.participantName,
        testType: context.testType,
        submittedAt,
        scoredResult,
    });
    await createAuditEvent({
        actorType: 'participant',
        entityType: 'submission',
        entityId: context.submissionId,
        action: 'submission.submitted',
        metadata: {
            resultId: storedResult.id,
            testType: context.testType,
            reviewStatus: storedResult.reviewStatus,
        },
    });
    await createAuditEvent({
        actorType: 'system',
        entityType: 'result',
        entityId: storedResult.id,
        action: 'result.scored',
        metadata: {
            submissionId: context.submissionId,
            testType: context.testType,
            reviewStatus: storedResult.reviewStatus,
        },
    });
    return {
        submissionId: context.submissionId,
        participantId: context.participantId,
        status: 'scored',
        resultId: storedResult.id,
        result: sanitizeParticipantResult(storedResult, context.definition.session.compliance.participantResultMode, context.definition.session.compliance.participantResultAccess),
    };
}
