import type { ScoreAssessmentContext, ScoredAssessmentResult } from './scoring.types.js';

import { scoreDiscAssessment } from './score-disc.js';
import { scoreIqAssessment } from './score-iq.js';
import { scoreWorkloadAssessment } from './score-workload.js';

export function scoreAssessment(context: ScoreAssessmentContext): ScoredAssessmentResult {
  switch (context.definition.session.testType) {
    case 'iq':
      return scoreIqAssessment(context);
    case 'disc':
      return scoreDiscAssessment(context);
    case 'workload':
      return scoreWorkloadAssessment(context);
    default:
      throw new Error(`Unsupported test type: ${String(context.definition.session.testType)}`);
  }
}
