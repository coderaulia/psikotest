import type { AssessmentOption } from '../public-sessions/public-session.types.js';
import type { ResultSummaryItem, ScoreAssessmentContext, ScoredAssessmentResult } from './scoring.types.js';

function resolveNumericValue(option: AssessmentOption | undefined, fallbackValue: number | undefined) {
  if (typeof fallbackValue === 'number' && Number.isFinite(fallbackValue)) {
    return fallbackValue;
  }

  if (typeof option?.value === 'number' && Number.isFinite(option.value)) {
    return option.value;
  }

  return null;
}

function getResearchBand(averageScore: number | null) {
  if (averageScore == null) {
    return null;
  }

  if (averageScore < 2.5) {
    return 'low_response';
  }

  if (averageScore < 3.75) {
    return 'moderate_response';
  }

  return 'high_response';
}

export function scoreCustomAssessment({ participantId, definition, answers }: ScoreAssessmentContext): ScoredAssessmentResult {
  const answerMap = new Map(answers.map((answer) => [answer.questionId, answer]));
  const categoryScores: Record<string, number> = {};
  const categoryCounts: Record<string, number> = {};
  const questionTypeCounts: Record<string, number> = {
    single_choice: 0,
    forced_choice: 0,
    likert: 0,
  };

  let totalScore = 0;
  let answeredQuestions = 0;

  for (const question of definition.questions) {
    const answer = answerMap.get(question.id);
    if (!answer) {
      continue;
    }

    if (question.questionType === 'forced_choice') {
      const mostOption = question.options.find((option) => option.id === answer.mostOptionId);
      const leastOption = question.options.find((option) => option.id === answer.leastOptionId);

      if (mostOption?.dimensionKey) {
        categoryScores[mostOption.dimensionKey] = (categoryScores[mostOption.dimensionKey] ?? 0) + 1;
        categoryCounts[mostOption.dimensionKey] = (categoryCounts[mostOption.dimensionKey] ?? 0) + 1;
      }

      if (leastOption?.dimensionKey && leastOption.id !== mostOption?.id) {
        categoryScores[leastOption.dimensionKey] = (categoryScores[leastOption.dimensionKey] ?? 0) - 1;
        categoryCounts[leastOption.dimensionKey] = (categoryCounts[leastOption.dimensionKey] ?? 0) + 1;
      }

      if (mostOption || leastOption) {
        answeredQuestions += 1;
        questionTypeCounts.forced_choice += 1;
      }

      continue;
    }

    const selectedOption = question.options.find((option) => option.id === answer.selectedOptionId);
    const numericValue = resolveNumericValue(selectedOption, answer.value);
    const categoryKey = question.dimensionKey ?? selectedOption?.dimensionKey ?? 'overall';

    if (answer.selectedOptionId) {
      answeredQuestions += 1;
      questionTypeCounts[question.questionType] += 1;
    }

    if (numericValue != null) {
      totalScore += numericValue;
      categoryScores[categoryKey] = (categoryScores[categoryKey] ?? 0) + numericValue;
      categoryCounts[categoryKey] = (categoryCounts[categoryKey] ?? 0) + 1;
    }
  }

  const averageScore = answeredQuestions === 0 ? null : Number((totalScore / answeredQuestions).toFixed(2));
  const scoreBand = getResearchBand(averageScore);

  const summaries: ResultSummaryItem[] = Object.entries(categoryScores).map(([metricKey, score]) => ({
    metricKey,
    metricLabel: metricKey
      .replace(/[_-]+/g, ' ')
      .replace(/\b\w/g, (segment) => segment.toUpperCase()),
    score: Number(score.toFixed(2)),
    band: null,
  }));

  if (averageScore != null) {
    summaries.push({
      metricKey: 'overall_average',
      metricLabel: 'Overall Average',
      score: averageScore,
      band: scoreBand,
    });
  }

  return {
    scoreTotal: answeredQuestions === 0 ? null : Number(totalScore.toFixed(2)),
    scoreBand,
    primaryType: null,
    secondaryType: null,
    profileCode: null,
    interpretationKey: scoreBand ? `custom_${scoreBand}` : 'custom_completed',
    payload: {
      participantId,
      totalScore: answeredQuestions === 0 ? null : Number(totalScore.toFixed(2)),
      averageScore,
      answeredQuestions,
      categoryScores,
      categoryCounts,
      questionTypeCounts,
      scoreBand,
      note: 'Indicative summary for a researcher-configured questionnaire. Use validated instruments and professional review where required.',
    },
    summaries,
  };
}
