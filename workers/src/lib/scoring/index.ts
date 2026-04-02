// Scoring Types
export interface IQScoreResult {
  totalScore: number; // IQ equivalent
  band: 'below_average' | 'low_average' | 'average' | 'high_average' | 'superior';
  rawScore: number;   // Correct count
  maxScore: number;    // Total questions
  percentile: number;  // Approximate percentile
  dimensions: {
    pattern: { correct: number; total: number; percentage: number };
    numerical: { correct: number; total: number; percentage: number };
    verbal: { correct: number; total: number; percentage: number };
    spatial: { correct: number; total: number; percentage: number };
  };
  interpretation: string;
}

export interface DISCScoreResult {
  scores: { D: number; I: number; S: number; C: number };
  percentages: { D: number; I: number; S: number; C: number };
  primaryType: 'D' | 'I' | 'S' | 'C';
  secondaryType: 'D' | 'I' | 'S' | 'C' | null;
  profilePattern: string;
  interpretation: string;
}

export interface WorkloadScoreResult {
  overallScore: number;
  band: 'low' | 'moderate' | 'high' | 'critical';
  dimensions: {
    mental_demand: number;
    physical_demand: number;
    temporal_demand: number;
    performance: number;
    effort: number;
    frustration: number;
  };
  elevatedDimensions: string[];
  interpretation: string;
}

export interface QuestionOption {
  id: number;
  optionKey: string;
  optionText: string;
  dimensionKey: string | null;
  valueNumber: number | null;
  isCorrect: boolean;
  optionOrder: number;
  scorePayload: Record<string, unknown> | null;
}

export interface ScoredQuestion {
  id: number;
  testTypeId: number;
  testType: string;
  questionCode: string;
  dimensionKey: string | null;
  questionType: string;
  options: QuestionOption[];
}

export interface SubmissionAnswer {
  questionId: number;
  selectedOptionId?: number;
  mostOptionId?: number;   // For forced-choice DISC
  leastOptionId?: number;  // For forced-choice DISC
  likertValue?: number;    // For likert scale
}

// ─── IQ Scoring ─────────────────────────────────────────────────────────────

const IQ_BANDS = [
  { min: 0, max: 10, band: 'below_average', iqMin: 70, iqMax: 84, percentile: 2 },
  { min: 11, max: 20, band: 'low_average', iqMin: 85, iqMax: 99, percentile: 16 },
  { min: 21, max: 28, band: 'average', iqMin: 100, iqMax: 114, percentile: 50 },
  { min: 29, max: 34, band: 'high_average', iqMin: 115, iqMax: 129, percentile: 84 },
  { min: 35, max: 100, band: 'superior', iqMin: 130, iqMax: 160, percentile: 98 },
];

const IQ_INTERPRETATIONS: Record<string, string> = {
  below_average: 'The results suggest challenges in cognitive processing that may benefit from supportive interventions.',
  low_average: 'The results indicate below-average cognitive performance compared to normative data.',
  average: 'The results indicate average cognitive performance within the normal range of the general population.',
  high_average: 'The results indicate above-average cognitive performance with strong problem-solving abilities.',
  superior: 'The results indicate superior cognitive performance in the higher percentile of the population.',
};

export function scoreIQ(
  questions: ScoredQuestion[],
  answers: SubmissionAnswer[]
): IQScoreResult {
  const dimensionScores: Record<string, { correct: number; total: number }> = {
    pattern: { correct: 0, total: 0 },
    numerical: { correct: 0, total: 0 },
    verbal: { correct: 0, total: 0 },
    spatial: { correct: 0, total: 0 },
  };

  let correctCount = 0;
  let totalCount = 0;

  for (const question of questions) {
    const answer = answers.find(a => a.questionId === question.id);
    if (!answer) continue;

    totalCount += 1;

    const correctOption = question.options.find(o => o.isCorrect);
    if (!correctOption) continue;

    const isCorrect = answer.selectedOptionId === correctOption.id;
    if (isCorrect) {
      correctCount += 1;
    }

    // Track dimension scores
    const dimension = question.dimensionKey?.toLowerCase();
    if (dimension && dimensionScores[dimension]) {
      dimensionScores[dimension].total += 1;
      if (isCorrect) {
        dimensionScores[dimension].correct += 1;
      }
    }
  }

  // Calculate IQ score from raw score
  const percentage = totalCount > 0 ? (correctCount / totalCount) * 100 : 0;
  
  // Find matching band
  const bandInfo = IQ_BANDS.find(b => correctCount >= b.min && correctCount <= b.max) || IQ_BANDS[2];
  
  // Interpolate IQ within band range
  const bandRange = bandInfo.iqMax - bandInfo.iqMin;
  const positionInBand = totalCount > 0 ? (correctCount - bandInfo.min) / Math.max(1, (bandInfo.max - bandInfo.min)) : 0.5;
  const iqScore = Math.round(bandInfo.iqMin + (bandRange * positionInBand));

  // Calculate dimension percentages
  const dimensions: IQScoreResult['dimensions'] = {
    pattern: {
      correct: dimensionScores.pattern.correct,
      total: dimensionScores.pattern.total,
      percentage: dimensionScores.pattern.total > 0 
        ? Math.round((dimensionScores.pattern.correct / dimensionScores.pattern.total) * 100) 
        : 0,
    },
    numerical: {
      correct: dimensionScores.numerical.correct,
      total: dimensionScores.numerical.total,
      percentage: dimensionScores.numerical.total > 0 
        ? Math.round((dimensionScores.numerical.correct / dimensionScores.numerical.total) * 100) 
        : 0,
    },
    verbal: {
      correct: dimensionScores.verbal.correct,
      total: dimensionScores.verbal.total,
      percentage: dimensionScores.verbal.total > 0 
        ? Math.round((dimensionScores.verbal.correct / dimensionScores.verbal.total) * 100) 
        : 0,
    },
    spatial: {
      correct: dimensionScores.spatial.correct,
      total: dimensionScores.spatial.total,
      percentage: dimensionScores.spatial.total > 0 
        ? Math.round((dimensionScores.spatial.correct / dimensionScores.spatial.total) * 100) 
        : 0,
    },
  };

  return {
    totalScore: iqScore,
    band: bandInfo.band as IQScoreResult['band'],
    rawScore: correctCount,
    maxScore: totalCount,
    percentile: bandInfo.percentile,
    dimensions,
    interpretation: IQ_INTERPRETATIONS[bandInfo.band] || IQ_INTERPRETATIONS.average,
  };
}

// ─── DISC Scoring ───────────────────────────────────────────────────────────

const DISC_PATTERNS: Record<string, { name: string; interpretation: string }> = {
  D: { name: 'Director', interpretation: 'Strong drive for results and direct communication style.' },
  I: { name: 'Influencer', interpretation: 'Enthusiastic and people-oriented with strong communication skills.' },
  S: { name: 'Supporter', interpretation: 'Patient, reliable, and team-oriented with steady work pace.' },
  C: { name: 'Analyst', interpretation: 'Analytical, precise, and systematic with attention to quality.' },
  'D+I': { name: 'Achiever', interpretation: 'Results-driven with strong people skills and persuasive abilities.' },
  'D+S': { name: 'Counselor', interpretation: 'Supportive leader who balances people needs with task focus.' },
  'D+C': { name: 'Perfectionist', interpretation: 'Detail-oriented achiever with high standards and systematic approach.' },
  'I+S': { name: 'Harmonizer', interpretation: 'Team builder who values relationships and collaboration.' },
  'I+C': { name: 'Motivator', interpretation: 'Persuasive and systematic, combines enthusiasm with precision.' },
  'S+C': { name: 'Specialist', interpretation: 'Methodical and reliable with expertise in specific areas.' },
};

export function scoreDISC(
  questions: ScoredQuestion[],
  answers: SubmissionAnswer[]
): DISCScoreResult {
  const scores = { D: 0, I: 0, S: 0, C: 0 };
  
  for (const question of questions) {
    const answer = answers.find(a => a.questionId === question.id);
    if (!answer) continue;

    // For single-choice DISC questions
    if (question.questionType === 'single_choice' && answer.selectedOptionId) {
      const selectedOption = question.options.find(o => o.id === answer.selectedOptionId);
      if (selectedOption?.dimensionKey) {
        const dim = selectedOption.dimensionKey.toUpperCase() as 'D' | 'I' | 'S' | 'C';
        if (scores.hasOwnProperty(dim)) {
          scores[dim] += 1;
        }
      }
    }

    // For forced-choice (most/least) questions
    if (question.questionType === 'forced_choice') {
      // Most selection adds to the dimension
      if (answer.mostOptionId) {
        const mostOption = question.options.find(o => o.id === answer.mostOptionId);
        if (mostOption?.dimensionKey) {
          const dim = mostOption.dimensionKey.toUpperCase() as 'D' | 'I' | 'S' | 'C';
          if (scores.hasOwnProperty(dim)) {
            scores[dim] += 1;
          }
        }
      }
      // Least selection subtracts from the dimension (optional)
      if (answer.leastOptionId) {
        const leastOption = question.options.find(o => o.id === answer.leastOptionId);
        if (leastOption?.dimensionKey) {
          const dim = leastOption.dimensionKey.toUpperCase() as 'D' | 'I' | 'S' | 'C';
          if (scores.hasOwnProperty(dim)) {
            scores[dim] = Math.max(0, scores[dim] - 0.5);
          }
        }
      }
    }
  }

  const total = Object.values(scores).reduce((sum, v) => sum + v, 0) || 1;
  
  const percentages = {
    D: Math.round((scores.D / total) * 100),
    I: Math.round((scores.I / total) * 100),
    S: Math.round((scores.S / total) * 100),
    C: Math.round((scores.C / total) * 100),
  };

  // Sort dimensions by score
  const sorted = Object.entries(scores)
    .sort((a, b) => b[1] - a[1]);
  
  const primaryType = sorted[0]?.[0] as 'D' | 'I' | 'S' | 'C';
  const secondaryType: 'D' | 'I' | 'S' | 'C' | null = (sorted[1]?.[0] as 'D' | 'I' | 'S' | 'C') ?? null;

  // Determine profile pattern
  let profilePattern: string = primaryType;
  if (secondaryType && (sorted[1][1] / total) > 0.25) {
    profilePattern = `${primaryType}+${secondaryType}`;
  }

  const patternInfo = DISC_PATTERNS[profilePattern] || DISC_PATTERNS[primaryType];

  return {
    scores,
    percentages,
    primaryType,
    secondaryType,
    profilePattern,
    interpretation: patternInfo.interpretation,
  };
}

// ─── Workload Scoring (NASA-TLX style) ───────────────────────────────────────

const WORKLOAD_BANDS = [
  { min: 1.0, max: 2.5, band: 'low' as const, interpretation: 'Workload is manageable and sustainable.' },
  { min: 2.6, max: 4.5, band: 'moderate' as const, interpretation: 'Workload presents some pressure but remains manageable.' },
  { min: 4.6, max: 6.0, band: 'high' as const, interpretation: 'Workload is significant and may benefit from mitigation strategies.' },
  { min: 6.1, max: 7.0, band: 'critical' as const, interpretation: 'Workload is unsustainable and requires immediate intervention.' },
];

const WORKLOAD_DIMENSION_LABELS: Record<string, string> = {
  mental_demand: 'Mental Demand',
  physical_demand: 'Physical Demand',
  temporal_demand: 'Temporal Demand',
  performance: 'Performance',
  effort: 'Effort',
  frustration: 'Frustration',
};

export function scoreWorkload(
  questions: ScoredQuestion[],
  answers: SubmissionAnswer[]
): WorkloadScoreResult {
  const dimensionScores: Record<string, number[]> = {
    mental_demand: [],
    physical_demand: [],
    temporal_demand: [],
    performance: [],
    effort: [],
    frustration: [],
  };

  for (const question of questions) {
    const answer = answers.find(a => a.questionId === question.id);
    if (!answer || answer.likertValue === undefined) continue;

    const dimension = question.dimensionKey?.toLowerCase();
    if (dimension && dimensionScores.hasOwnProperty(dimension)) {
      dimensionScores[dimension as keyof typeof dimensionScores].push(answer.likertValue);
    }
  }

  // Calculate averages for each dimension
  const dimensions: WorkloadScoreResult['dimensions'] = {
    mental_demand: 0,
    physical_demand: 0,
    temporal_demand: 0,
    performance: 0,
    effort: 0,
    frustration: 0,
  };

  let totalScore = 0;
  let dimensionCount = 0;

  for (const [key, values] of Object.entries(dimensionScores)) {
    if (values.length > 0) {
      const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
      dimensions[key as keyof typeof dimensions] = Math.round(avg * 10) / 10;
      totalScore += avg;
      dimensionCount += 1;
    }
  }

  const overallScore = dimensionCount > 0 ? Math.round((totalScore / dimensionCount) * 10) / 10 : 0;

  // Find elevated dimensions (score > 5.0)
  const elevatedDimensions = Object.entries(dimensions)
    .filter(([, score]) => score > 5.0)
    .map(([key]) => WORKLOAD_DIMENSION_LABELS[key] || key);

  // Determine band
  const bandInfo = WORKLOAD_BANDS.find(b => overallScore >= b.min && overallScore <= b.max) || WORKLOAD_BANDS[1];

  return {
    overallScore,
    band: bandInfo.band,
    dimensions,
    elevatedDimensions,
    interpretation: bandInfo.interpretation,
  };
}

// ─── Export Score Result Payload ─────────────────────────────────────────────

export interface ScoringResult {
  testType: 'iq' | 'disc' | 'workload';
  iqResult?: IQScoreResult;
  discResult?: DISCScoreResult;
  workloadResult?: WorkloadScoreResult;
  rawPayload: {
    answers: SubmissionAnswer[];
    scoredAt: string;
    questionCount: number;
    answeredCount: number;
  };
}

export function createScoringResult(
  testType: 'iq' | 'disc' | 'workload',
  questions: ScoredQuestion[],
  answers: SubmissionAnswer[]
): ScoringResult {
  const basePayload = {
    answers,
    scoredAt: new Date().toISOString(),
    questionCount: questions.length,
    answeredCount: answers.length,
  };

  if (testType === 'iq') {
    return {
      testType: 'iq',
      iqResult: scoreIQ(questions, answers),
      rawPayload: basePayload,
    };
  }

  if (testType === 'disc') {
    return {
      testType: 'disc',
      discResult: scoreDISC(questions, answers),
      rawPayload: basePayload,
    };
  }

  if (testType === 'workload') {
    return {
      testType: 'workload',
      workloadResult: scoreWorkload(questions, answers),
      rawPayload: basePayload,
    };
  }

  throw new Error(`Unknown test type: ${testType}`);
}