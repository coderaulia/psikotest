import { fetchResults } from '../results/result.repository.js';
import { fetchTestSessions } from '../test-sessions/test-session.repository.js';
import {
  fetchDashboardMetrics,
  fetchDiscDistribution,
  fetchWorkloadDistribution,
} from './dashboard.repository.js';

function formatRecentSummary(item: {
  testType: 'iq' | 'disc' | 'workload';
  primaryType: string | null;
  secondaryType: string | null;
  scoreBand: string | null;
  profileCode: string | null;
}) {
  if (item.testType === 'disc') {
    if (item.primaryType && item.secondaryType) {
      return `Primary ${item.primaryType}, Secondary ${item.secondaryType}`;
    }

    return item.profileCode ?? 'DISC result available';
  }

  if (item.testType === 'iq') {
    return item.scoreBand ? `${item.scoreBand.replace(/_/g, ' ')} band` : 'IQ result available';
  }

  return item.scoreBand ? item.scoreBand.replace(/_/g, ' ') : 'Workload result available';
}

export async function getDashboardSummary() {
  const [metrics, discDistribution, workloadDistribution, liveSessions, recentResults] = await Promise.all([
    fetchDashboardMetrics(),
    fetchDiscDistribution(),
    fetchWorkloadDistribution(),
    fetchTestSessions({ limit: 3 }),
    fetchResults({ limit: 4 }),
  ]);

  const completionRate = metrics.totalSubmissions === 0
    ? 0
    : Math.round((metrics.completedSubmissions / metrics.totalSubmissions) * 100);

  return {
    summaryCards: [
      {
        label: 'Active Sessions',
        value: String(metrics.activeSessions),
        delta: `${metrics.draftSessions} draft queued`,
      },
      {
        label: 'Participants',
        value: String(metrics.participantCount),
        delta: `${metrics.completedSubmissions} completed submissions`,
      },
      {
        label: 'Completion Rate',
        value: `${completionRate}%`,
        delta: `${metrics.completedSubmissions}/${metrics.totalSubmissions} submitted or scored`,
      },
      {
        label: 'Average IQ',
        value: metrics.averageIqScore == null ? '-' : String(metrics.averageIqScore),
        delta: 'From scored IQ assessments',
      },
    ],
    distributions: {
      disc: discDistribution,
      workload: workloadDistribution,
    },
    liveSessions: liveSessions.map((session) => ({
      id: session.id,
      title: session.title,
      testType: session.testType.toUpperCase(),
      status: session.status,
      participants: session.participantCount,
      completed: session.completedCount,
    })),
    recentParticipants: recentResults.map((result) => ({
      id: result.id,
      fullName: result.participantName,
      testType: result.testType.toUpperCase(),
      completedAt: result.submittedAt,
      summary: formatRecentSummary(result),
    })),
  };
}
