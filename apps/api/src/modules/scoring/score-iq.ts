import type { ScoreAssessmentContext, ScoredAssessmentResult } from './scoring.types.js';

function getIqBand(scoreTotal: number) {
  if (scoreTotal < 90) {
    return 'low';
  }

  if (scoreTotal < 110) {
    return 'average';
  }

  if (scoreTotal < 120) {
    return 'above_average';
  }

  return 'high';
}

export function scoreIqAssessment({ participantId, definition, answers }: ScoreAssessmentContext): ScoredAssessmentResult {
  const answerMap = new Map(answers.map((answer) => [answer.questionId, answer]));
  const totalQuestions = definition.questions.length;

  let correctAnswers = 0;
  let answeredQuestions = 0;

  for (const question of definition.questions) {
    const answer = answerMap.get(question.id);
    const selectedOption = question.options.find((option) => option.id === answer?.selectedOptionId);

    if (selectedOption) {
      answeredQuestions += 1;
    }

    if (selectedOption?.isCorrect) {
      correctAnswers += 1;
    }
  }

  const accuracyPercentage = totalQuestions === 0 ? 0 : Number(((correctAnswers / totalQuestions) * 100).toFixed(2));
  const scoreTotal = Math.round(70 + (correctAnswers / Math.max(totalQuestions, 1)) * 60);
  const scoreBand = getIqBand(scoreTotal);

  return {
    scoreTotal,
    scoreBand,
    primaryType: null,
    secondaryType: null,
    profileCode: null,
    interpretationKey: `iq_${scoreBand}`,
    payload: {
      participantId,
      correctAnswers,
      totalQuestions,
      answeredQuestions,
      accuracyPercentage,
      scoreTotal,
      scoreBand,
      note: 'Dummy scoring for MVP purposes only. This is not a clinical IQ interpretation.',
    },
    summaries: [
      {
        metricKey: 'correct_answers',
        metricLabel: 'Correct Answers',
        score: correctAnswers,
        band: null,
      },
      {
        metricKey: 'accuracy_percentage',
        metricLabel: 'Accuracy Percentage',
        score: accuracyPercentage,
        band: `${scoreBand}`,
      },
    ],
  };
}
