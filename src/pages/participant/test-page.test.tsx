import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

import { saveParticipantSession } from '@/lib/participant-session';
import { renderWithRoute } from '@/test/render';

import { ParticipantTestPage } from './test-page';

const fetchPublicSessionMock = vi.fn();
const fetchSubmissionQuestionWindowMock = vi.fn();
const savePublicAnswersMock = vi.fn();
const submitPublicSubmissionMock = vi.fn();

vi.mock('@/services/public-sessions', () => ({
  fetchPublicSession: (...args: unknown[]) => fetchPublicSessionMock(...args),
  fetchSubmissionQuestionWindow: (...args: unknown[]) => fetchSubmissionQuestionWindowMock(...args),
  savePublicAnswers: (...args: unknown[]) => savePublicAnswersMock(...args),
  submitPublicSubmission: (...args: unknown[]) => submitPublicSubmissionMock(...args),
}));

describe('ParticipantTestPage', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    window.localStorage.clear();
    fetchPublicSessionMock.mockReset();
    fetchSubmissionQuestionWindowMock.mockReset();
    savePublicAnswersMock.mockReset();
    submitPublicSubmissionMock.mockReset();

    saveParticipantSession(
      'disc-batch-a',
      {
        submissionId: 21,
        participantId: 12,
        token: 'disc-batch-a',
        submissionAccessToken: 'submission-token',
        submissionAccessExpiresAt: new Date(Date.now() + 60_000).toISOString(),
        answerSequence: 0,
        status: 'in_progress',
        testType: 'disc',
        participantResultMode: 'review_required',
      },
      {
        fullName: 'Nadia Pratama',
        email: 'nadia@example.com',
        consentAccepted: true,
        consentAcceptedAt: new Date().toISOString(),
      },
      { participantResultAccess: 'full_released' },
    );
  });

  it('loads protected delivery one group at a time and saves the next answer sequence', async () => {
    fetchPublicSessionMock.mockResolvedValue({
      session: {
        id: 10,
        title: 'DISC Hiring Session',
        testType: 'disc',
        instructions: ['Read carefully'],
        estimatedMinutes: 15,
        status: 'active',
        compliance: {
          assessmentPurpose: 'recruitment',
          administrationMode: 'remote_unsupervised',
          interpretationMode: 'professional_review',
          participantResultMode: 'review_required',
          participantLimit: null,
          consentStatement: 'Consent',
          privacyStatement: 'Privacy',
          contactPerson: 'HR desk',
          distributionPolicy: 'full_report_with_consent',
          protectedDeliveryMode: true,
          participantResultAccess: 'full_released',
          hrResultAccess: 'full',
        },
        delivery: {
          mode: 'progressive',
          totalQuestions: 2,
          totalGroups: 2,
        },
      },
      questions: [],
    });

    fetchSubmissionQuestionWindowMock
      .mockResolvedValueOnce({
        submissionId: 21,
        status: 'in_progress',
        answerSequence: 0,
        groupIndex: 0,
        totalGroups: 2,
        totalQuestions: 2,
        answeredQuestionCount: 0,
        groupKey: 'group-1',
        savedAnswers: [],
        questions: [
          {
            id: 100,
            code: 'DISC_Q001',
            questionType: 'forced_choice',
            instructionText: 'Choose most and least',
            options: [
              { id: 1001, key: 'A', label: 'Decisive' },
              { id: 1002, key: 'B', label: 'Persuasive' },
              { id: 1003, key: 'C', label: 'Steady' },
              { id: 1004, key: 'D', label: 'Analytical' },
            ],
          },
        ],
      })
      .mockResolvedValueOnce({
        submissionId: 21,
        status: 'in_progress',
        answerSequence: 1,
        groupIndex: 1,
        totalGroups: 2,
        totalQuestions: 2,
        answeredQuestionCount: 1,
        groupKey: 'group-2',
        savedAnswers: [],
        questions: [
          {
            id: 101,
            code: 'DISC_Q002',
            questionType: 'forced_choice',
            instructionText: 'Choose most and least',
            options: [
              { id: 1011, key: 'A', label: 'Direct' },
              { id: 1012, key: 'B', label: 'Enthusiastic' },
              { id: 1013, key: 'C', label: 'Patient' },
              { id: 1014, key: 'D', label: 'Precise' },
            ],
          },
        ],
      });

    savePublicAnswersMock.mockResolvedValue({
      submissionId: 21,
      saved: true,
      answerSequence: 1,
      answeredQuestionCount: 1,
      status: 'in_progress',
    });

    renderWithRoute(<ParticipantTestPage />, {
      route: '/t/disc-batch-a/test',
      path: '/t/:token/test',
    });

    expect(await screen.findByText(/protected delivery is enabled/i)).toBeInTheDocument();
    expect(screen.getByText(/group 1 of 2/i)).toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(screen.getAllByRole('button', { name: 'Most' })[0]!);
    await user.click(screen.getAllByRole('button', { name: 'Least' })[1]!);
    await user.click(screen.getByRole('button', { name: /save and continue/i }));

    expect(savePublicAnswersMock).toHaveBeenCalledWith(21, 'submission-token', 1, [
      {
        questionId: 100,
        mostOptionId: 1001,
        leastOptionId: 1002,
      },
    ]);
    expect(fetchSubmissionQuestionWindowMock).toHaveBeenLastCalledWith(21, 'submission-token', 1);
    expect(await screen.findByText(/group 2 of 2/i)).toBeInTheDocument();
    expect(screen.getByText(/direct/i)).toBeInTheDocument();
  });
});
