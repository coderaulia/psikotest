const publicSessions = {
  'disc-batch-a': {
    session: {
      id: 1,
      title: 'Graduate Hiring Batch A',
      testType: 'disc',
      instructions: [
        'Pilih satu pernyataan yang paling menggambarkan diri Anda.',
        'Pilih satu pernyataan yang paling tidak menggambarkan diri Anda.',
        'Jawab dengan spontan, tidak ada jawaban benar atau salah.',
      ],
      estimatedMinutes: 15,
    },
    questions: [
      {
        id: 1,
        code: 'DISC_Q001',
        instructionText: 'Pilih pernyataan yang paling dan paling tidak menggambarkan diri Anda.',
        options: [
          { id: 11, key: 'A', label: 'Saya suka mengambil keputusan dengan cepat', dimension: 'D' },
          { id: 12, key: 'B', label: 'Saya mudah bergaul dan berbicara dengan banyak orang', dimension: 'I' },
          { id: 13, key: 'C', label: 'Saya lebih nyaman bekerja dalam suasana stabil', dimension: 'S' },
          { id: 14, key: 'D', label: 'Saya memperhatikan detail sebelum mengambil keputusan', dimension: 'C' },
        ],
      },
      {
        id: 2,
        code: 'DISC_Q002',
        instructionText: 'Pilih pernyataan yang paling dan paling tidak menggambarkan diri Anda.',
        options: [
          { id: 21, key: 'A', label: 'Saya suka memimpin dan mengarahkan orang lain', dimension: 'D' },
          { id: 22, key: 'B', label: 'Saya suka membuat suasana kerja menjadi menyenangkan', dimension: 'I' },
          { id: 23, key: 'C', label: 'Saya sabar dan konsisten dalam bekerja', dimension: 'S' },
          { id: 24, key: 'D', label: 'Saya teliti dan mengikuti prosedur dengan baik', dimension: 'C' },
        ],
      },
    ],
  },
};

export function getPublicSession(token: string) {
  return publicSessions[token as keyof typeof publicSessions] ?? null;
}

export function startPublicSubmission(token: string, participant: Record<string, string>) {
  return {
    submissionId: Date.now(),
    token,
    participant,
    status: 'in_progress',
  };
}

export function saveSubmissionAnswers(submissionId: number, answers: unknown) {
  return {
    submissionId,
    saved: true,
    answers,
  };
}

export function submitPublicSubmission(submissionId: number) {
  return {
    submissionId,
    status: 'submitted',
  };
}
