import type { ScoreAssessmentContext, ScoredAssessmentResult } from './scoring.types.js';

const dimensionOrder = ['D', 'I', 'S', 'C'] as const;
type DiscDimension = (typeof dimensionOrder)[number];

function createScoreRecord() {
  return {
    D: 0,
    I: 0,
    S: 0,
    C: 0,
  } satisfies Record<DiscDimension, number>;
}

export function scoreDiscAssessment({ participantId, definition, answers }: ScoreAssessmentContext): ScoredAssessmentResult {
  const mostScores = createScoreRecord();
  const leastScores = createScoreRecord();
  const answerMap = new Map(answers.map((answer) => [answer.questionId, answer]));

  for (const question of definition.questions) {
    const answer = answerMap.get(question.id);
    const mostOption = question.options.find((option) => option.id === answer?.mostOptionId);
    const leastOption = question.options.find((option) => option.id === answer?.leastOptionId);

    if (mostOption?.dimensionKey && mostOption.dimensionKey in mostScores) {
      mostScores[mostOption.dimensionKey as DiscDimension] += 1;
    }

    if (
      leastOption?.dimensionKey &&
      leastOption.id !== mostOption?.id &&
      leastOption.dimensionKey in leastScores
    ) {
      leastScores[leastOption.dimensionKey as DiscDimension] += 1;
    }
  }

  const balanceScores = createScoreRecord();

  for (const dimension of dimensionOrder) {
    balanceScores[dimension] = mostScores[dimension] - leastScores[dimension];
  }

  const rankedDimensions = [...dimensionOrder].sort((left, right) => {
    const mostDelta = mostScores[right] - mostScores[left];
    if (mostDelta !== 0) {
      return mostDelta;
    }

    const balanceDelta = balanceScores[right] - balanceScores[left];
    if (balanceDelta !== 0) {
      return balanceDelta;
    }

    return dimensionOrder.indexOf(left) - dimensionOrder.indexOf(right);
  });

  const primaryType = rankedDimensions[0];
  const secondaryType = rankedDimensions[1];
  const profileCode = `${primaryType}/${secondaryType}`;
  const scoreTotal = Object.values(mostScores).reduce((sum, score) => sum + score, 0);

  return {
    scoreTotal,
    scoreBand: null,
    primaryType,
    secondaryType,
    profileCode,
    interpretationKey: `disc_${primaryType.toLowerCase()}`,
    payload: {
      participantId,
      scores: mostScores,
      leastScores,
      balanceScores,
      primaryType,
      secondaryType,
      profileCode,
      note: 'Dummy DISC scoring for MVP reporting. This is not a clinical diagnosis.',
    },
    summaries: dimensionOrder.map((dimension) => ({
      metricKey: dimension,
      metricLabel: dimension,
      score: mostScores[dimension],
      band: null,
    })),
  };
}
