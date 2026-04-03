import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import {
  loadParticipantSession,
  saveParticipantResult,
  updateParticipantSession,
} from '@/lib/participant-session';
import {
  fetchNextSubmissionGroup,
  fetchPublicSession,
  fetchSubmissionQuestionWindow,
  savePublicAnswers,
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
import { useLanguage } from '@/lib/language';

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

const copy = {
  en: {
    loadProtectedError: 'Unable to load protected assessment questions',
    loadQuestionsError: 'Unable to load assessment questions',
    loadAssessmentError: 'Unable to load assessment',
    loadNextGroupError: 'Unable to load the next question group',
    answerSectionRequired: 'Please answer all questions in this section before continuing.',
    answerSectionSubmit: 'Please answer all questions in this section before submitting.',
    answerAllSubmit: 'Please answer all questions before submitting.',
    submitError: 'Unable to submit assessment',
    loadingAssessment: 'Loading assessment...',
    assessmentWord: 'assessment',
    answeredWord: 'questions answered',
    completeWord: 'complete',
    estimatedWord: 'Estimated',
    minutesWord: 'minutes',
    protectedMessage: 'Protected delivery is enabled. You are completing group {current} of {total}.',
    sectionLabel: 'Section {current} of {total}',
    sectionAnswered: '{answered} of {total} questions answered in this section',
    sectionProgress: '{progress}% section progress',
    questionWord: 'Question',
    most: 'Most',
    least: 'Least',
    previousSection: 'Previous section',
    loadingNextSection: 'Loading next section...',
    saving: 'Saving...',
    saveContinue: 'Save and continue',
    submitting: 'Submitting...',
    submitResponses: 'Submit responses',
  },
  id: {
    loadProtectedError: 'Pertanyaan asesmen terlindungi belum bisa dimuat',
    loadQuestionsError: 'Pertanyaan asesmen belum bisa dimuat',
    loadAssessmentError: 'Asesmen belum bisa dimuat',
    loadNextGroupError: 'Grup pertanyaan berikutnya belum bisa dimuat',
    answerSectionRequired: 'Isi semua pertanyaan di bagian ini dulu sebelum lanjut.',
    answerSectionSubmit: 'Isi semua pertanyaan di bagian ini dulu sebelum kirim.',
    answerAllSubmit: 'Isi semua pertanyaan dulu sebelum kirim.',
    submitError: 'Asesmen belum bisa dikirim',
    loadingAssessment: 'Lagi memuat asesmen...',
    assessmentWord: 'asesmen',
    answeredWord: 'pertanyaan terjawab',
    completeWord: 'selesai',
    estimatedWord: 'Estimasi',
    minutesWord: 'menit',
    protectedMessage: 'Mode terlindungi aktif. Kamu sedang mengerjakan grup {current} dari {total}.',
    sectionLabel: 'Bagian {current} dari {total}',
    sectionAnswered: '{answered} dari {total} pertanyaan terjawab di bagian ini',
    sectionProgress: 'Progres bagian {progress}%',
    questionWord: 'Pertanyaan',
    most: 'Paling menggambarkan',
    least: 'Paling tidak menggambarkan',
    previousSection: 'Bagian sebelumnya',
    loadingNextSection: 'Memuat bagian berikutnya...',
    saving: 'Menyimpan...',
    saveContinue: 'Simpan dan lanjut',
    submitting: 'Mengirim...',
    submitResponses: 'Kirim jawaban',
  },
} as const;

export function ParticipantTestPage() {
  const { token = 'assessment-token' } = useParams();
  const { language } = useLanguage();
  const t = copy[language];
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

        setIsLoadingWindow(true);
        try {
          const initialWindow = await fetchSubmissionQuestionWindow(
            storedSession.submissionId,
            storedSession.submissionAccessToken,
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
            const fallbackMessage =
              payload.session.delivery.mode === 'progressive' ? t.loadProtectedError : t.loadQuestionsError;
            setError(requestError instanceof Error ? requestError.message : fallbackMessage);
          }
        } finally {
          if (isMounted) {
            setIsLoadingWindow(false);
          }
        }
      })
      .catch((requestError) => {
        if (isMounted) {
          setError(requestError instanceof Error ? requestError.message : t.loadAssessmentError);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [navigate, token]);

  const isProtectedMode = session?.session.delivery.mode === 'progressive';
  const activeQuestions = questionWindow?.questions ?? [];

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

  async function saveCurrentGroupAndMove() {
    if (!questionWindow || !submissionId || !submissionAccessToken) {
      return;
    }

    const groupAnswers = questionWindow.questions
      .map((question) => answers[question.id])
      .filter((answer): answer is SubmissionAnswerInput => Boolean(answer));

    const allGroupAnswered = questionWindow.questions.every((question) => isQuestionAnswered(question, answers[question.id]));

    if (!allGroupAnswered) {
      setError(t.answerSectionRequired);
      return;
    }

    setIsLoadingWindow(true);
    setError(null);

    try {
      if (groupAnswers.length > 0) {
        const nextSequence = answerSequence + 1;
        const saveResponse = await savePublicAnswers(submissionId, submissionAccessToken, nextSequence, groupAnswers);
        setAnswerSequence(saveResponse.answerSequence);
        updateParticipantSession(token, { answerSequence: saveResponse.answerSequence });
      }

      const nextWindow = await fetchNextSubmissionGroup(submissionId, submissionAccessToken);
      if (nextWindow.complete) {
        await handleSubmit();
        return;
      }

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
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : t.loadNextGroupError);
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
          throw new Error(t.answerSectionSubmit);
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

      const orderedAnswers = activeQuestions
        .map((question) => answers[question.id])
        .filter((answer): answer is SubmissionAnswerInput => Boolean(answer));

      const allAnswered = activeQuestions.every((question) => isQuestionAnswered(question, answers[question.id]));
      if (!allAnswered) {
        throw new Error(t.answerAllSubmit);
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
      setError(submissionError instanceof Error ? submissionError.message : t.submitError);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (error && !questionWindow) {
    return (
      <Card className="bg-white/82">
        <CardContent className="p-8 text-sm text-rose-600">{error}</CardContent>
      </Card>
    );
  }

  if (!session || !questionWindow) {
    return (
      <Card className="bg-white/82">
        <CardContent className="p-8 text-sm text-slate-500">{t.loadingAssessment}</CardContent>
      </Card>
    );
  }

  const currentGroupAnswered = activeQuestions.filter((question) => isQuestionAnswered(question, answers[question.id])).length;
  const answeredCount = isProtectedMode
    ? Math.max(questionWindow.answeredQuestionCount, currentGroupAnswered)
    : currentGroupAnswered;
  const totalQuestions = session.session.delivery.totalQuestions || questionWindow.totalQuestions || questionWindow.questions.length;
  const progressValue = totalQuestions === 0 ? 0 : (answeredCount / totalQuestions) * 100;
  const sectionProgressValue = isProtectedMode
    ? ((questionWindow.currentGroup + 1) / Math.max(1, questionWindow.totalGroups)) * 100
    : progressValue;
  const allVisibleAnswered = activeQuestions.every((question) => isQuestionAnswered(question, answers[question.id]));

  return (
    <div className="space-y-6">
      <Card className="bg-white/82">
        <CardHeader>
          <CardTitle>{session.session.title}</CardTitle>
          <CardDescription>
            {formatTestTypeLabel(session.session.testType)} {t.assessmentWord} • {answeredCount} / {totalQuestions} {t.answeredWord}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Progress value={isProtectedMode ? sectionProgressValue : progressValue} />
          <div className="flex flex-col gap-2 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
            <span>
              {isProtectedMode
                ? t.sectionProgress.replace('{progress}', String(Math.round(sectionProgressValue)))
                : `${Math.round(progressValue)}% ${t.completeWord}`}
            </span>
            <span>{t.estimatedWord} {session.session.estimatedMinutes} {t.minutesWord}</span>
          </div>
          {isProtectedMode && questionWindow ? (
            <div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-700">
              {t.protectedMessage.replace('{current}', String(questionWindow.groupIndex + 1)).replace('{total}', String(questionWindow.totalGroups))}
              <div className="mt-2 text-xs">
                {t.sectionAnswered
                  .replace('{answered}', String(currentGroupAnswered))
                  .replace('{total}', String(questionWindow.questions.length))}
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {isProtectedMode ? (
        <div className="rounded-2xl border border-slate-200 bg-white/82 px-4 py-3 text-sm font-medium text-slate-700">
          {t.sectionLabel
            .replace('{current}', String(questionWindow.currentGroup + 1))
            .replace('{total}', String(questionWindow.totalGroups))}
        </div>
      ) : null}

      {activeQuestions.map((question, index) => {
        const answer = answers[question.id];
        const displayIndex = index + 1;

        return (
          <Card key={question.id} className="bg-white/82">
            <CardHeader>
              <CardTitle>{t.questionWord} {displayIndex}</CardTitle>
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

      {isLoadingWindow && questionWindow ? (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          {t.loadingNextSection}
        </div>
      ) : null}

      <div className="sticky bottom-4 flex flex-wrap justify-end gap-3">
        {isProtectedMode && questionWindow && questionWindow.groupIndex < questionWindow.totalGroups - 1 ? (
          <Button size="lg" className="shadow-panel" disabled={isLoadingWindow || isSubmitting || !allVisibleAnswered} onClick={() => void saveCurrentGroupAndMove()}>
            {isLoadingWindow ? t.loadingNextSection : t.saveContinue}
          </Button>
        ) : (
          <Button size="lg" className="shadow-panel" disabled={isSubmitting || !allVisibleAnswered} onClick={handleSubmit}>
            {isSubmitting ? t.submitting : t.submitResponses}
          </Button>
        )}
      </div>
    </div>
  );
}





