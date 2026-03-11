export const dashboardMetrics = [
  { label: 'Active Sessions', value: '8', meta: '+2 this week' },
  { label: 'Participants', value: '128', meta: 'Across all sessions' },
  { label: 'Completion Rate', value: '73%', meta: 'Stable trend' },
  { label: 'Average IQ', value: '108', meta: 'Demo dataset' },
];

export const sessionRows = [
  {
    id: 1,
    title: 'Graduate Hiring Batch A',
    testType: 'DISC',
    status: 'Active',
    participants: 32,
    completed: 19,
  },
  {
    id: 2,
    title: 'Leadership Screening',
    testType: 'IQ',
    status: 'Draft',
    participants: 14,
    completed: 0,
  },
  {
    id: 3,
    title: 'Operations Load Check',
    testType: 'Workload',
    status: 'Completed',
    participants: 46,
    completed: 46,
  },
];

export const participantRows = [
  {
    id: 1,
    fullName: 'Participant 01',
    department: 'People Operations',
    position: 'Talent Acquisition Specialist',
    testType: 'DISC',
    status: 'Completed',
  },
  {
    id: 2,
    fullName: 'Participant 02',
    department: 'Finance',
    position: 'Financial Analyst',
    testType: 'IQ',
    status: 'In Progress',
  },
  {
    id: 3,
    fullName: 'Participant 03',
    department: 'Operations',
    position: 'Operations Coordinator',
    testType: 'Workload',
    status: 'Completed',
  },
];

export const resultRows = [
  {
    id: 501,
    participantName: 'Participant 01',
    testType: 'DISC',
    summary: 'Primary I, Secondary D',
    score: 'I/D',
    date: '09 Mar 2026',
  },
  {
    id: 502,
    participantName: 'Participant 02',
    testType: 'IQ',
    summary: 'Above average band',
    score: '114',
    date: '09 Mar 2026',
  },
  {
    id: 503,
    participantName: 'Participant 03',
    testType: 'Workload',
    summary: 'Moderate workload',
    score: '61',
    date: '08 Mar 2026',
  },
];

export const landingFeatures = [
  'Premium landing page and calm participant experience',
  'Session management for IQ, DISC, and workload assessments',
  'Admin results dashboard with reusable reporting panels',
  'Extensible schema for new test modules and export workflows',
];

export const discPreviewQuestions = [
  {
    code: 'DISC_Q001',
    instruction: 'Pilih pernyataan yang paling dan paling tidak menggambarkan diri Anda.',
    options: [
      'Saya suka mengambil keputusan dengan cepat',
      'Saya mudah bergaul dan berbicara dengan banyak orang',
      'Saya lebih nyaman bekerja dalam suasana stabil',
      'Saya memperhatikan detail sebelum mengambil keputusan',
    ],
  },
  {
    code: 'DISC_Q002',
    instruction: 'Pilih pernyataan yang paling dan paling tidak menggambarkan diri Anda.',
    options: [
      'Saya suka memimpin dan mengarahkan orang lain',
      'Saya suka membuat suasana kerja menjadi menyenangkan',
      'Saya sabar dan konsisten dalam bekerja',
      'Saya teliti dan mengikuti prosedur dengan baik',
    ],
  },
];
