import { lazy, Suspense, type ComponentType, type ReactElement } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';

function lazyNamed<TProps extends object = object>(
  loader: () => Promise<Record<string, unknown>>,
  exportName: string,
) {
  return lazy(async () => {
    const module = await loader();
    return { default: module[exportName] as ComponentType<TProps> };
  });
}

function RouteFallback() {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#fdfdfd_0%,#f5f6f8_40%,#eef2f7_100%)] px-6 py-16 text-slate-950">
      <div className="mx-auto max-w-5xl rounded-[32px] border border-white/80 bg-white/85 p-8 shadow-sm backdrop-blur">
        <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Loading view</p>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="h-32 animate-pulse rounded-[28px] bg-slate-100" />
          <div className="h-32 animate-pulse rounded-[28px] bg-slate-100" />
          <div className="h-28 animate-pulse rounded-[28px] bg-slate-100 md:col-span-2" />
        </div>
      </div>
    </div>
  );
}

function withSuspense(element: ReactElement) {
  return <Suspense fallback={<RouteFallback />}>{element}</Suspense>;
}

const MarketingLayout = lazyNamed(() => import('@/layouts/marketing-layout'), 'MarketingLayout');
const CustomerLayout = lazyNamed(() => import('@/layouts/customer-layout'), 'CustomerLayout');
const AdminLayout = lazyNamed(() => import('@/layouts/admin-layout'), 'AdminLayout');
const ParticipantLayout = lazyNamed(() => import('@/layouts/participant-layout'), 'ParticipantLayout');

const LandingPage = lazyNamed(() => import('@/pages/landing-page'), 'LandingPage');
const CustomerSignupPage = lazyNamed(() => import('@/pages/customer/customer-signup-page'), 'CustomerSignupPage');
const CustomerLoginPage = lazyNamed(() => import('@/pages/customer/customer-login-page'), 'CustomerLoginPage');
const CustomerWorkspacePage = lazyNamed(() => import('@/pages/customer/customer-workspace-page'), 'CustomerWorkspacePage');
const CustomerOnboardingPage = lazyNamed(() => import('@/pages/customer/customer-onboarding-page'), 'CustomerOnboardingPage');
const CustomerAssessmentDetailPage = lazyNamed(() => import('@/pages/customer/customer-assessment-detail-page'), 'CustomerAssessmentDetailPage');
const AdminLoginPage = lazyNamed(() => import('@/pages/admin/admin-login-page'), 'AdminLoginPage');
const DashboardPage = lazyNamed(() => import('@/pages/admin/dashboard-page'), 'DashboardPage');
const ParticipantsPage = lazyNamed(() => import('@/pages/admin/participants-page'), 'ParticipantsPage');
const TestSessionsPage = lazyNamed(() => import('@/pages/admin/test-sessions-page'), 'TestSessionsPage');
const TestSessionDetailPage = lazyNamed(() => import('@/pages/admin/test-session-detail-page'), 'TestSessionDetailPage');
const QuestionBankPage = lazyNamed(() => import('@/pages/admin/question-bank-page'), 'QuestionBankPage');
const ResultsPage = lazyNamed(() => import('@/pages/admin/results-page'), 'ResultsPage');
const ResultDetailPage = lazyNamed(() => import('@/pages/admin/result-detail-page'), 'ResultDetailPage');
const ReportsPage = lazyNamed(() => import('@/pages/admin/reports-page'), 'ReportsPage');
const SettingsPage = lazyNamed(() => import('@/pages/admin/settings-page'), 'SettingsPage');
const ParticipantConsentPage = lazyNamed(() => import('@/pages/participant/consent-page'), 'ParticipantConsentPage');
const ParticipantIdentityPage = lazyNamed(() => import('@/pages/participant/identity-page'), 'ParticipantIdentityPage');
const ParticipantInstructionsPage = lazyNamed(() => import('@/pages/participant/instructions-page'), 'ParticipantInstructionsPage');
const ParticipantTestPage = lazyNamed(() => import('@/pages/participant/test-page'), 'ParticipantTestPage');
const ParticipantCompletedPage = lazyNamed(() => import('@/pages/participant/completed-page'), 'ParticipantCompletedPage');
const NotFoundPage = lazyNamed(() => import('@/pages/not-found-page'), 'NotFoundPage');

export const router = createBrowserRouter([
  {
    path: '/',
    element: withSuspense(<MarketingLayout />),
    children: [{ index: true, element: withSuspense(<LandingPage />) }],
  },
  {
    path: '/signup',
    element: withSuspense(<CustomerSignupPage />),
  },
  {
    path: '/login',
    element: withSuspense(<CustomerLoginPage />),
  },
  {
    path: '/admin/login',
    element: withSuspense(<AdminLoginPage />),
  },
  {
    path: '/workspace',
    element: withSuspense(<CustomerLayout />),
    children: [
      { index: true, element: withSuspense(<CustomerWorkspacePage />) },
      { path: 'create', element: withSuspense(<CustomerOnboardingPage />) },
      { path: 'assessments/:assessmentId', element: withSuspense(<CustomerAssessmentDetailPage />) },
    ],
  },
  {
    path: '/admin',
    element: withSuspense(<AdminLayout />),
    children: [
      { index: true, element: <Navigate to="/admin/dashboard" replace /> },
      { path: 'dashboard', element: withSuspense(<DashboardPage />) },
      { path: 'participants', element: withSuspense(<ParticipantsPage />) },
      { path: 'test-sessions', element: withSuspense(<TestSessionsPage />) },
      { path: 'question-bank', element: withSuspense(<QuestionBankPage />) },
      { path: 'test-sessions/:id', element: withSuspense(<TestSessionDetailPage />) },
      { path: 'results', element: withSuspense(<ResultsPage />) },
      { path: 'results/:id', element: withSuspense(<ResultDetailPage />) },
      { path: 'reports', element: withSuspense(<ReportsPage />) },
      { path: 'settings', element: withSuspense(<SettingsPage />) },
    ],
  },
  {
    path: '/t/:token',
    element: withSuspense(<ParticipantLayout />),
    children: [
      { index: true, element: withSuspense(<ParticipantConsentPage />) },
      { path: 'identity', element: withSuspense(<ParticipantIdentityPage />) },
      { path: 'instructions', element: withSuspense(<ParticipantInstructionsPage />) },
      { path: 'test', element: withSuspense(<ParticipantTestPage />) },
      { path: 'completed', element: withSuspense(<ParticipantCompletedPage />) },
    ],
  },
  {
    path: '*',
    element: withSuspense(<NotFoundPage />),
  },
]);
