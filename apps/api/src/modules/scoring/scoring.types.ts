import type {
  PublicSessionDefinition,
  SubmissionAnswerInput,
} from '../public-sessions/public-session.types.js';

export interface ResultSummaryItem {
  metricKey: string;
  metricLabel: string;
  score: number;
  band?: string | null;
}

export interface ScoredAssessmentResult {
  scoreTotal: number | null;
  scoreBand: string | null;
  primaryType: string | null;
  secondaryType: string | null;
  profileCode: string | null;
  interpretationKey: string | null;
  payload: Record<string, unknown>;
  summaries: ResultSummaryItem[];
}

export interface ScoreAssessmentContext {
  participantId: number;
  definition: PublicSessionDefinition;
  answers: SubmissionAnswerInput[];
}
