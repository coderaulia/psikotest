const results = [
  {
    id: 501,
    participantName: 'Nadia Pratama',
    testType: 'disc',
    submittedAt: '2026-03-09T10:00:00.000Z',
    primaryType: 'I',
    secondaryType: 'D',
    profileCode: 'I/D',
    scores: { D: 6, I: 10, S: 4, C: 2 },
  },
  {
    id: 502,
    participantName: 'Raka Mahendra',
    testType: 'iq',
    submittedAt: '2026-03-09T11:30:00.000Z',
    scoreTotal: 114,
    scoreBand: 'above_average',
  },
];

export function listResults() {
  return results;
}

export function getResultById(id: number) {
  return results.find((result) => result.id === id) ?? null;
}
