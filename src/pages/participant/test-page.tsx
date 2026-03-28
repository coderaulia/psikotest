import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import {
  loadParticipantSession,
  saveParticipantResult,
  updateParticipantSession,
} from '@/lib/participant-session';
import {
  fetchPublicSession,
  fetchSubmissionQuestionWindow,
  submitPublicSubmission,
} from '@/services/public-sessions';
import type {
  AssessmentOption,
  AssessmentQuestion,
  ProgressiveQuestionWindow,
  PublicSessionResponse,
  SubmissionAnswerInput,
} from '@/types/assessment';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { formatTestTypeLabel } from '@/lib/formatters';

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
  const [questionWindow, setQuestionWindow] = useState<ProgressiveQuestionWindow | null>(null);
  const [answers, setAnswers] = useState<Record<number, SubmissionAnswerInput>>({});
  const [submissionId, setSubmissionId] = useState<number | null>(null);
  const [submissionAccessToken, setSubmissionAccessToken] = useState<string | null>(null);
  const [answerSequence, setAnswerSequence] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingWindow, setIsLoadingWindow] = useState(false);

  useEffect(() => {
    const storedSession = loadParticipantSession(token);

    if (!storedSession) {
      navigate(`/t/${token}`, { replace: true });
      return;
    }

    setSubmissionId(storedSession.submissionId);
    setSubmissionAccessToken(storedSession.submissionAccessToken);
    setAnswerSequence(storedSession.answerSequence);

    let isMounted = true;

    void fetchPublicSession(token)
      .then(async (payload) => {
        if (!isMounted) {
          return;
        }

        setSession(payload);

        if (payload.session.delivery.mode === 'progressive') {
          setIsLoadingWindow(true);
          try {
            const initialWindow = await fetchSubmissionQuestionWindow(
              storedSession.submissionId,
              storedSession.submissionAccessToken,
              0,
            );
            if (!isMounted) {
              return;
            }
            setQuestionWindow(initialWindow);
            setAnswerSequence(initialWindow.answerSequence);
            updateParticipantSession(token, { answerSequence: initialWindow.answerSequence });
            setAnswers((current) => {
              const next = { ...current };
              for (const answer of initialWindow.savedAnswers) {
                next[answer.questionId] = answer;
              }
              return next;
            });
          } catch (requestError) {
            if (isMounted) {
              setError(requestError instanceof Error ? requestError.message : 'Unable to load protected assessment questions');
            }
          } finally {
            if (isMounted) {
              setIsLoadingWindow(false);
            }
          }
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

  const isProtectedMode = session?.session.delivery.mode === 'progressive';
  const activeQuestions = isProtectedMode ? (questionWindow?.questions ?? []) : (session?.questions ?? []);

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

  async function loadGroup(groupIndex: number) {
    if (!submissionId || !submissionAccessToken) {
      return;
    }

    setIsLoadingWindow(true);
    try {
      const nextWindow = await fetchSubmissionQuestionWindow(submissionId, submissionAccessToken, groupIndex);
      setQuestionWindow(nextWindow);
      setAnswerSequence(nextWindow.answerSequence);
      updateParticipantSession(token, { answerSequence: nextWindow.answerSequence });
      setAnswers((current) => {
        const next = { ...current };
        for (const answer of nextWindow.savedAnswers) {
          next[answer.questionId] = answer;
        }
        return next;
      });
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to load the next question group');
    } finally {
      setIsLoadingWindow(false);
    }
  }

  async function saveCurrentGroupAndMove(targetGroupIndex: number) {
    if (!questionWindow || !submissionId || !submissionAccessToken) {
      return;
    }

    const groupAnswers = questionWindow.questions
      .map((question) => answers[question.id])
      .filter((answer): answer is SubmissionAnswerInput => Boolean(answer));

    const movingForward = targetGroupIndex > questionWindow.groupIndex;
    const allGroupAnswered = questionWindow.questions.every((question) => isQuestionAnswered(question, answers[question.id]));

    if (movingForward && !allGroupAnswered) {
      setError('Please answer all questions in this section before continuing.');
      return;
    }

    setIsLoadingWindow(true);
    setError(null);

    try {
      if (groupAnswers.length > 0) {
        const nextSequence = answerSequence + 1;
        const saveResponse = await import('@/services/public-sessions').then(({ savePublicAnswers }) =>
          savePublicAnswers(submissionId, submissionAccessToken, nextSequence, groupAnswers),
        );
        setAnswerSequence(saveResponse.answerSequence);
        updateParticipantSession(token, { answerSequence: saveResponse.answerSequence });
      }

      await loadGroup(targetGroupIndex);
    } finally {
      setIsLoadingWindow(false);
    }
  }

  async function handleSubmit() {
    if (!session || !submissionId || !submissionAccessToken) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      if (isProtectedMode) {
        if (!questionWindow) {
          throw new Error('Protected question window is unavailable');
        }

        const groupAnswers = questionWindow.questions
          .map((question) => answers[question.id])
          .filter((answer): answer is SubmissionAnswerInput => Boolean(answer));

        const allGroupAnswered = questionWindow.questions.every((question) => isQuestionAnswered(question, answers[question.id]));
        if (!allGroupAnswered) {
          throw new Error('Please answer all questions in this section before submitting.');
        }

        const response = await submitPublicSubmission(
          submissionId,
          submissionAccessToken,
          answerSequence + 1,
          groupAnswers,
        );
        updateParticipantSession(token, { answerSequence: answerSequence + 1 });
        saveParticipantResult(token, response.result);
        navigate(`/t/${token}/completed`);
        return;
      }

      const orderedAnswers = session.questions
        .map((question) => answers[question.id])
        .filter((answer): answer is SubmissionAnswerInput => Boolean(answer));

      const allAnswered = session.questions.every((question) => isQuestionAnswered(question, answers[question.id]));
      if (!allAnswered) {
        throw new Error('Please answer all questions before submitting.');
      }

      const response = await submitPublicSubmission(
        submissionId,
        submissionAccessToken,
        answerSequence + 1,
        orderedAnswers,
      );
      updateParticipantSession(token, { answerSequence: answerSequence + 1 });
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

  if (!session || (isProtectedMode && !questionWindow && isLoadingWindow)) {
    return (
      <Card className="bg-white/82">
        <CardContent className="p-8 text-sm text-slate-500">Loading assessment...</CardContent>
      </Card>
    );
  }

  const answeredCount = isProtectedMode && questionWindow
    ? (() => {
        const savedInCurrentGroup = questionWindow.savedAnswers.filter((answer) => {
          const question = questionWindow.questions.find((item) => item.id === answer.questionId);
          return question ? isQuestionAnswered(question, answer) : false;
        }).length;
        const localInCurrentGroup = questionWindow.questions.filter((question) => isQuestionAnswered(question, answers[question.id])).length;
        return questionWindow.answeredQuestionCount - savedInCurrentGroup + localInCurrentGroup;
      })()
    : session.questions.filter((question) => isQuestionAnswered(question, answers[question.id])).length;
  const totalQuestions = session.session.delivery.totalQuestions || session.questions.length;
  const progressValue = totalQuestions === 0 ? 0 : (answeredCount / totalQuestions) * 100;
  const allVisibleAnswered = activeQuestions.every((question) => isQuestionAnswered(question, answers[question.id]));

  return (
    <div className="space-y-6">
      <Card className="bg-white/82">
        <CardHeader>
          <CardTitle>{session.session.title}</CardTitle>
          <CardDescription>
            {formatTestTypeLabel(session.session.testType)} assessment • {answeredCount} of {totalQuestions} questions answered
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Progress value={progressValue} />
          <div className="flex flex-col gap-2 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
            <span>{Math.round(progressValue)}% complete</span>
            <span>Estimated {session.session.estimatedMinutes} minutes</span>
          </div>
          {isProtectedMode && questionWindow ? (
            <div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-700">
              Protected delivery is enabled. You are completing group {questionWindow.groupIndex + 1} of {questionWindow.totalGroups}.
            </div>
          ) : null}
        </CardContent>
      </Card>

      {activeQuestions.map((question, index) => {
        const answer = answers[question.id];
        const displayIndex = isProtectedMode && questionWindow
          ? questionWindow.groupIndex + index + 1
          : index + 1;

        return (
          <Card key={question.id} className="bg-white/82">
            <CardHeader>
              <CardTitle>Question {displayIndex}</CardTitle>
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

      <div className="sticky bottom-4 flex flex-wrap justify-end gap-3">
        {isProtectedMode && questionWindow && questionWindow.groupIndex > 0 ? (
          <Button variant="outline" size="lg" disabled={isLoadingWindow || isSubmitting} onClick={() => void saveCurrentGroupAndMove(questionWindow.groupIndex - 1)}>
            Previous section
          </Button>
        ) : null}
        {isProtectedMode && questionWindow && questionWindow.groupIndex < questionWindow.totalGroups - 1 ? (
          <Button size="lg" className="shadow-panel" disabled={isLoadingWindow || isSubmitting || !allVisibleAnswered} onClick={() => void saveCurrentGroupAndMove(questionWindow.groupIndex + 1)}>
            {isLoadingWindow ? 'Saving...' : 'Save and continue'}
          </Button>
        ) : (
          <Button size="lg" className="shadow-panel" disabled={isSubmitting || !allVisibleAnswered} onClick={handleSubmit}>
            {isSubmitting ? 'Submitting...' : 'Submit responses'}
          </Button>
        )}
      </div>
    </div>
  );
}

