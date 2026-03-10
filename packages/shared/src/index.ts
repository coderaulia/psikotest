export type TestTypeCode = 'iq' | 'disc' | 'workload';

export type SubmissionStatus =
  | 'not_started'
  | 'in_progress'
  | 'submitted'
  | 'scored';

export type SessionStatus = 'draft' | 'active' | 'completed' | 'archived';

export interface DiscScoreSet {
  D: number;
  I: number;
  S: number;
  C: number;
}

export interface DiscResultPayload {
  participantId: number;
  scores: DiscScoreSet;
  primaryType: keyof DiscScoreSet;
  secondaryType: keyof DiscScoreSet;
  profileCode: string;
}
