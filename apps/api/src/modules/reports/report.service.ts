import { fetchReportsSummaryData } from './report.repository.js';

export async function getReportsSummary() {
  const data = await fetchReportsSummaryData();

  return {
    summaryCards: [
      {
        label: 'Scored Results',
        value: String(data.counts.scoredResults),
        delta: 'Stored result records',
      },
      {
        label: 'Participants',
        value: String(data.counts.participants),
        delta: 'Unique participant profiles',
      },
      {
        label: 'Reportable Sessions',
        value: String(data.counts.reportableSessions),
        delta: 'Active or completed sessions',
      },
      {
        label: 'Reviewed Results',
        value: String(data.distributions.reviewStatus.find((item) => item.label === 'Reviewed')?.value ?? 0),
        delta: 'Professionally reviewed outcomes',
      },
    ],
    averagesByTestType: data.averagesByTestType,
    distributions: data.distributions,
    recentCompletions: data.recentCompletions,
  };
}
