import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { loadParticipantSession, saveParticipantResult } from '@/lib/participant-session';
import {
  fetchPublicSession,
  savePublicAnswers,
  submitPublicSubmission,
} from '@/services/public-sessions';
import type {
  AssessmentOption,
  AssessmentQuestion,
  PublicSessionResponse,
  SubmissionAnswerInput,
} from '@/types/assessment';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

function isQuestionAnswered(question: AssessmentQuestion, answer?: SubmissionAnswerInput) {
  if (!answer) {
    return false;
  }

  if (question.questionType === 'forced_choice') {
    return Boolean(answer.mostOptionId && answer.leastOptionId);
  }

  if (question.questionType === 'likert') {
    return typeof answer.value === 'number' || typeof answer.selectedOptionId === 'number';
  }

  return typeof answer.selectedOptionId === 'number';
}

function renderOptionLabel(option: AssessmentOption) {
  return option.value ? `${option.value}` : option.key;
}

export function ParticipantTestPage() {
  const { token = 'assessment-token' } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState<PublicSessionResponse | null>(null);
  const [answers, setAnswers] = useState<Record<number, SubmissionAnswerInput>>({});
  const [submissionId, setSubmissionId] = useState<number | null>(null);
  const [submissionAccessToken, setSubmissionAccessToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const storedSession = loadParticipantSession(token);

    if (!storedSession) {
      navigate(`/t/${token}`, { replace: true });
      return;
    }

    setSubmissionId(storedSession.submissionId);
    setSubmissionAccessToken(storedSession.submissionAccessToken);

    let isMounted = true;

    void fetchPublicSession(token)
      .then((payload) => {
        if (isMounted) {
          setSession(payload);
        }
      })
      .catch((requestError) => {
        if (isMounted) {
          setError(requestError instanceof Error ? requestError.message : 'Unable to load assessment');
        }
      });

    return () => {
      isMounted = false;
    };
  }, [navigate, token]);

  function upsertAnswer(questionId: number, next: Partial<SubmissionAnswerInput>) {
    setAnswers((current) => ({
      ...current,
      [questionId]: {
        ...current[questionId],
        ...next,
        questionId,
      },
    }));
  }

  function handleSingleChoice(questionId: number, optionId: number) {
    upsertAnswer(questionId, {
      selectedOptionId: optionId,
      value: undefined,
    });
  }

  function handleLikert(questionId: number, option: AssessmentOption) {
    upsertAnswer(questionId, {
      selectedOptionId: option.id,
      value: option.value,
    });
  }

  function handleDiscMost(questionId: number, optionId: number) {
    setAnswers((current) => {
      const existing = current[questionId] ?? { questionId };
      return {
        ...current,
        [questionId]: {
          ...existing,
          questionId,
          mostOptionId: optionId,
          leastOptionId: existing.leastOptionId === optionId ? undefined : existing.leastOptionId,
        },
      };
    });
  }

  function handleDiscLeast(questionId: number, optionId: number) {
    setAnswers((current) => {
      const existing = current[questionId] ?? { questionId };
      return {
        ...current,
        [questionId]: {
          ...existing,
          questionId,
          leastOptionId: optionId,
          mostOptionId: existing.mostOptionId === optionId ? undefined : existing.mostOptionId,
        },
      };
    });
  }

  async function handleSubmit() {
    if (!session || !submissionId || !submissionAccessToken) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const orderedAnswers = session.questions
      .map((question) => answers[question.id])
      .filter((answer): answer is SubmissionAnswerInput => Boolean(answer));

    try {
      await savePublicAnswers(submissionId, submissionAccessToken, orderedAnswers);
      const response = await submitPublicSubmission(submissionId, submissionAccessToken, orderedAnswers);
      saveParticipantResult(token, response.result);
      navigate(`/t/${token}/completed`);
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : 'Unable to submit assessment');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (error && !session) {
    return (
      <Card className="bg-white/82">
        <CardContent className="p-8 text-sm text-rose-600">{error}</CardContent>
      </Card>
    );
  }

  if (!session) {
    return (
      <Card className="bg-white/82">
        <CardContent className="p-8 text-sm text-slate-500">Loading assessment...</CardContent>
      </Card>
    );
  }

  const answeredCount = session.questions.filter((question) => isQuestionAnswered(question, answers[question.id])).length;
  const progressValue = session.questions.length === 0 ? 0 : (answeredCount / session.questions.length) * 100;
  const allAnswered = answeredCount === session.questions.length;

  return (
    <div className="space-y-6">
      <Card className="bg-white/82">
        <CardHeader>
          <CardTitle>{session.session.title}</CardTitle>
          <CardDescription>
            {session.session.testType.toUpperCase()} assessment • {answeredCount} of {session.questions.length} questions answered
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Progress value={progressValue} />
          <div className="flex items-center justify-between text-sm text-slate-500">
            <span>{Math.round(progressValue)}% complete</span>
            <span>Estimated {session.session.estimatedMinutes} minutes</span>
          </div>
        </CardContent>
      </Card>

      {session.questions.map((question, index) => {
        const answer = answers[question.id];

        return (
          <Card key={question.id} className="bg-white/82">
            <CardHeader>
              <CardTitle>Question {index + 1}</CardTitle>
              <CardDescription>{question.prompt ?? question.instructionText}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {question.questionType === 'forced_choice'
                ? question.options.map((option) => (
                    <div
                      key={option.id}
                      className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4 md:flex-row md:items-center md:justify-between"
                    >
                      <div>
                        <p className="text-sm font-medium text-slate-950">{option.label}</p>
                        <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-400">{option.key}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant={answer?.mostOptionId === option.id ? 'default' : 'secondary'}
                          onClick={() => handleDiscMost(question.id, option.id)}
                        >
                          Most
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant={answer?.leastOptionId === option.id ? 'default' : 'secondary'}
                          onClick={() => handleDiscLeast(question.id, option.id)}
                        >
                          Least
                        </Button>
                      </div>
                    </div>
                  ))
                : null}

              {question.questionType === 'single_choice'
                ? question.options.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => handleSingleChoice(question.id, option.id)}
                      className={`flex w-full items-center justify-between rounded-2xl border px-4 py-4 text-left text-sm transition ${
                        answer?.selectedOptionId === option.id
                          ? 'border-slate-950 bg-slate-950 text-white'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <span>{option.label}</span>
                      <span className="text-xs font-medium uppercase tracking-[0.2em] opacity-70">{option.key}</span>
                    </button>
                  ))
                : null}

              {question.questionType === 'likert' ? (
                <div className="grid gap-3 sm:grid-cols-5">
                  {question.options.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => handleLikert(question.id, option)}
                      className={`rounded-2xl border px-4 py-4 text-center text-sm transition ${
                        answer?.selectedOptionId === option.id
                          ? 'border-slate-950 bg-slate-950 text-white'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="text-base font-semibold">{renderOptionLabel(option)}</div>
                      <div className="mt-1 text-xs opacity-80">{option.label}</div>
                    </button>
                  ))}
                </div>
              ) : null}
            </CardContent>
          </Card>
        );
      })}

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
          {error}
        </div>
      ) : null}

      <div className="sticky bottom-4 flex justify-end">
        <Button size="lg" className="shadow-panel" disabled={!allAnswered || isSubmitting} onClick={handleSubmit}>
          {isSubmitting ? 'Submitting...' : 'Submit responses'}
        </Button>
      </div>
    </div>
  );
}

