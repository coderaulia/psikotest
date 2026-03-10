import { createBrowserRouter, Navigate } from 'react-router-dom';

import { AdminLayout } from '@/layouts/admin-layout';
import { MarketingLayout } from '@/layouts/marketing-layout';
import { ParticipantLayout } from '@/layouts/participant-layout';
import { AdminLoginPage } from '@/pages/admin/admin-login-page';
import { DashboardPage } from '@/pages/admin/dashboard-page';
import { ParticipantsPage } from '@/pages/admin/participants-page';
import { ReportsPage } from '@/pages/admin/reports-page';
import { ResultsPage } from '@/pages/admin/results-page';
import { TestSessionsPage } from '@/pages/admin/test-sessions-page';
import { LandingPage } from '@/pages/landing-page';
import { NotFoundPage } from '@/pages/not-found-page';
import { ParticipantCompletedPage } from '@/pages/participant/completed-page';
import { ParticipantIdentityPage } from '@/pages/participant/identity-page';
import { ParticipantInstructionsPage } from '@/pages/participant/instructions-page';
import { ParticipantTestPage } from '@/pages/participant/test-page';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <MarketingLayout />,
    children: [{ index: true, element: <LandingPage /> }],
  },
  {
    path: '/admin/login',
    element: <AdminLoginPage />,
  },
  {
    path: '/admin',
    element: <AdminLayout />,
    children: [
      { index: true, element: <Navigate to="/admin/dashboard" replace /> },
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'participants', element: <ParticipantsPage /> },
      { path: 'test-sessions', element: <TestSessionsPage /> },
      { path: 'results', element: <ResultsPage /> },
      { path: 'reports', element: <ReportsPage /> },
    ],
  },
  {
    path: '/t/:token',
    element: <ParticipantLayout />,
    children: [
      { index: true, element: <ParticipantIdentityPage /> },
      { path: 'instructions', element: <ParticipantInstructionsPage /> },
      { path: 'test', element: <ParticipantTestPage /> },
      { path: 'completed', element: <ParticipantCompletedPage /> },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);
