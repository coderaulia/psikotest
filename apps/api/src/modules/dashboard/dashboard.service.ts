export function getDashboardSummary() {
  return {
    summaryCards: [
      { label: 'Active Sessions', value: 8, delta: '+2 this week' },
      { label: 'Participants', value: 128, delta: '+14 this week' },
      { label: 'Completed Assessments', value: 94, delta: '73% completion' },
      { label: 'Average IQ Score', value: 108, delta: 'Across demo data' },
    ],
    distributions: {
      disc: [
        { label: 'D', value: 18 },
        { label: 'I', value: 29 },
        { label: 'S', value: 24 },
        { label: 'C', value: 21 },
      ],
      workload: [
        { label: 'Low', value: 21 },
        { label: 'Moderate', value: 48 },
        { label: 'High', value: 13 },
      ],
    },
    recentParticipants: [
      { id: 101, fullName: 'Nadia Pratama', testType: 'DISC', completedAt: '2026-03-09T10:00:00.000Z' },
      { id: 102, fullName: 'Raka Mahendra', testType: 'IQ', completedAt: '2026-03-09T11:30:00.000Z' },
      { id: 103, fullName: 'Tasya Mulyani', testType: 'Workload', completedAt: '2026-03-09T13:45:00.000Z' },
    ],
  };
}
