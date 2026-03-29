import { lazy, Suspense, type ComponentType, type ReactElement } from 'react';
import { createBrowserRouter, isRouteErrorResponse, Link, Navigate, useRouteError } from 'react-router-dom';
import { Home, RotateCcw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { CustomerRoleGuard } from '@/components/common/customer-role-guard';
import { isChunkLoadError, tryRecoverFromChunkError } from '@/lib/chunk-load-recovery';

function lazyNamed<TProps extends object = object>(
  loader: () => Promise<Record<string, unknown>>,
  exportName: string,
) {
  return lazy(async () => {
    try {
      const module = await loader();
      return { default: module[exportName] as ComponentType<TProps> };
    } catch (error) {
      if (isChunkLoadError(error) && tryRecoverFromChunkError()) {
        return new Promise<never>(() => undefined);
      }

      throw error;
    }
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

function RouteErrorPage() {
  const error = useRouteError();
  const chunkError = isChunkLoadError(error);

  let title = 'Something went wrong while loading this page';
  let description = 'Please try again. If the problem continues, return to the homepage and retry the flow.';

  if (chunkError) {
    title = 'The app was updated while this page was open';
    description = 'The current page is trying to load an older asset bundle. Reload once to sync with the latest deployment.';
  } else if (isRouteErrorResponse(error)) {
    title = `${error.status} ${error.statusText}`;
    description = typeof error.data === 'string' ? error.data : description;
  } else if (error instanceof Error && error.message) {
    description = error.message;
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#fdfdfd_0%,#f5f6f8_40%,#eef2f7_100%)] px-6 py-16 text-slate-950">
      <div className="mx-auto max-w-3xl rounded-[32px] border border-white/80 bg-white/88 p-8 shadow-sm backdrop-blur">
        <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Application error</p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">{title}</h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600">{description}</p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button size="lg" className="gap-2" onClick={() => window.location.reload()}>
            <RotateCcw className="h-4 w-4" />
            Reload App
          </Button>
          <Button variant="secondary" size="lg" className="gap-2" asChild>
            <Link to="/">
              <Home className="h-4 w-4" />
              Go to Homepage
            </Link>
          </Button>
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
const ManualPage = lazyNamed(() => import('@/pages/manual-page'), 'ManualPage');
const WhiteLabelPage = lazyNamed(() => import('@/pages/white-label-page'), 'WhiteLabelPage');
const CustomerSignupPage = lazyNamed(() => import('@/pages/customer/customer-signup-page'), 'CustomerSignupPage');
const CustomerLoginPage = lazyNamed(() => import('@/pages/customer/customer-login-page'), 'CustomerLoginPage');
const CustomerWorkspacePage = lazyNamed(() => import('@/pages/customer/customer-workspace-page'), 'CustomerWorkspacePage');
const CustomerCompanyPage = lazyNamed(() => import('@/pages/customer/customer-company-page'), 'CustomerCompanyPage');
const CustomerBillingPage = lazyNamed(() => import('@/pages/customer/customer-billing-page'), 'CustomerBillingPage');
const CustomerResultsPage = lazyNamed(() => import('@/pages/customer/customer-results-page'), 'CustomerResultsPage');
const CustomerResultDetailPage = lazyNamed(() => import('@/pages/customer/customer-result-detail-page'), 'CustomerResultDetailPage');
const CustomerActivityPage = lazyNamed(() => import('@/pages/customer/customer-activity-page'), 'CustomerActivityPage');
const CustomerTeamPage = lazyNamed(() => import('@/pages/customer/customer-team-page'), 'CustomerTeamPage');
const CustomerOnboardingPage = lazyNamed(() => import('@/pages/customer/customer-onboarding-page'), 'CustomerOnboardingPage');
const CustomerAssessmentDetailPage = lazyNamed(() => import('@/pages/customer/customer-assessment-detail-page'), 'CustomerAssessmentDetailPage');
const CustomerAssessmentSetupPage = lazyNamed(() => import('@/pages/customer/customer-assessment-setup-page'), 'CustomerAssessmentSetupPage');
const CustomerAssessmentCheckoutPage = lazyNamed(() => import('@/pages/customer/customer-assessment-checkout-page'), 'CustomerAssessmentCheckoutPage');
const CustomerAssessmentParticipantsPage = lazyNamed(() => import('@/pages/customer/customer-assessment-participants-page'), 'CustomerAssessmentParticipantsPage');
const CustomerWorkspaceSettingsPage = lazyNamed(() => import('@/pages/customer/customer-workspace-settings-page'), 'CustomerWorkspaceSettingsPage');
const AdminLoginPage = lazyNamed(() => import('@/pages/admin/admin-login-page'), 'AdminLoginPage');
const DashboardPage = lazyNamed(() => import('@/pages/admin/dashboard-page'), 'DashboardPage');
const ParticipantsPage = lazyNamed(() => import('@/pages/admin/participants-page'), 'ParticipantsPage');
const TestSessionsPage = lazyNamed(() => import('@/pages/admin/test-sessions-page'), 'TestSessionsPage');
const TestSessionDetailPage = lazyNamed(() => import('@/pages/admin/test-session-detail-page'), 'TestSessionDetailPage');
const QuestionBankPage = lazyNamed(() => import('@/pages/admin/question-bank-page'), 'QuestionBankPage');
const ResultsPage = lazyNamed(() => import('@/pages/admin/results-page'), 'ResultsPage');
const ResultDetailPage = lazyNamed(() => import('@/pages/admin/result-detail-page'), 'ResultDetailPage');
const ReviewerQueuePage = lazyNamed(() => import('@/pages/admin/reviewer-queue-page'), 'ReviewerQueuePage');
const ReportsPage = lazyNamed(() => import('@/pages/admin/reports-page'), 'ReportsPage');
const SettingsPage = lazyNamed(() => import('@/pages/admin/settings-page'), 'SettingsPage');
const CustomersPage = lazyNamed(() => import('@/pages/admin/customers-page'), 'CustomersPage');
const ParticipantConsentPage = lazyNamed(() => import('@/pages/participant/consent-page'), 'ParticipantConsentPage');
const ParticipantIdentityPage = lazyNamed(() => import('@/pages/participant/identity-page'), 'ParticipantIdentityPage');
const ParticipantInstructionsPage = lazyNamed(() => import('@/pages/participant/instructions-page'), 'ParticipantInstructionsPage');
const ParticipantTestPage = lazyNamed(() => import('@/pages/participant/test-page'), 'ParticipantTestPage');
const ParticipantCompletedPage = lazyNamed(() => import('@/pages/participant/completed-page'), 'ParticipantCompletedPage');
const NotFoundPage = lazyNamed(() => import('@/pages/not-found-page'), 'NotFoundPage');

const routeErrorElement = <RouteErrorPage />;

export const router = createBrowserRouter([
  {
    path: '/',
    element: withSuspense(<MarketingLayout />),
    errorElement: routeErrorElement,
    children: [
      { index: true, element: withSuspense(<LandingPage />), errorElement: routeErrorElement },
      { path: 'manual', element: withSuspense(<ManualPage />), errorElement: routeErrorElement },
      { path: 'white-label', element: withSuspense(<WhiteLabelPage />), errorElement: routeErrorElement },
    ],
  },
  {
    path: '/signup',
    element: withSuspense(<CustomerSignupPage />),
    errorElement: routeErrorElement,
  },
  {
    path: '/login',
    element: withSuspense(<CustomerLoginPage />),
    errorElement: routeErrorElement,
  },
  {
    path: '/admin/login',
    element: withSuspense(<AdminLoginPage />),
    errorElement: routeErrorElement,
  },
  {
    path: '/workspace',
    element: withSuspense(<CustomerLayout />),
    errorElement: routeErrorElement,
    children: [
      { index: true, element: withSuspense(<CustomerWorkspacePage />), errorElement: routeErrorElement },
      { path: 'company', element: withSuspense(<CustomerRoleGuard allowedRoles={['owner', 'admin']}><CustomerCompanyPage /></CustomerRoleGuard>), errorElement: routeErrorElement },
      { path: 'billing', element: withSuspense(<CustomerRoleGuard allowedRoles={['owner']}><CustomerBillingPage /></CustomerRoleGuard>), errorElement: routeErrorElement },
      { path: 'results', element: withSuspense(<CustomerResultsPage />), errorElement: routeErrorElement },
      { path: 'results/:resultId', element: withSuspense(<CustomerResultDetailPage />), errorElement: routeErrorElement },
      { path: 'activity', element: withSuspense(<CustomerActivityPage />), errorElement: routeErrorElement },
      { path: 'team', element: withSuspense(<CustomerRoleGuard allowedRoles={['owner', 'admin']}><CustomerTeamPage /></CustomerRoleGuard>), errorElement: routeErrorElement },
      { path: 'create', element: withSuspense(<CustomerRoleGuard allowedRoles={['owner', 'admin', 'operator']}><CustomerOnboardingPage /></CustomerRoleGuard>), errorElement: routeErrorElement },
      { path: 'assessments/:assessmentId', element: withSuspense(<CustomerAssessmentDetailPage />), errorElement: routeErrorElement },
      { path: 'assessments/:assessmentId/setup', element: withSuspense(<CustomerRoleGuard allowedRoles={['owner', 'admin', 'operator']}><CustomerAssessmentSetupPage /></CustomerRoleGuard>), errorElement: routeErrorElement },
      { path: 'assessments/:assessmentId/checkout', element: withSuspense(<CustomerRoleGuard allowedRoles={['owner', 'admin', 'operator']}><CustomerAssessmentCheckoutPage /></CustomerRoleGuard>), errorElement: routeErrorElement },
      { path: 'assessments/:assessmentId/participants', element: withSuspense(<CustomerRoleGuard allowedRoles={['owner', 'admin', 'operator']}><CustomerAssessmentParticipantsPage /></CustomerRoleGuard>), errorElement: routeErrorElement },
      { path: 'settings', element: withSuspense(<CustomerRoleGuard allowedRoles={['owner', 'admin']}><CustomerWorkspaceSettingsPage /></CustomerRoleGuard>), errorElement: routeErrorElement },
    ],
  },
  {
    path: '/admin',
    element: withSuspense(<AdminLayout />),
    errorElement: routeErrorElement,
    children: [
      { index: true, element: <Navigate to="/admin/dashboard" replace />, errorElement: routeErrorElement },
      { path: 'dashboard', element: withSuspense(<DashboardPage />), errorElement: routeErrorElement },
      { path: 'participants', element: withSuspense(<ParticipantsPage />), errorElement: routeErrorElement },
      { path: 'test-sessions', element: withSuspense(<TestSessionsPage />), errorElement: routeErrorElement },
      { path: 'question-bank', element: withSuspense(<QuestionBankPage />), errorElement: routeErrorElement },
      { path: 'test-sessions/:id', element: withSuspense(<TestSessionDetailPage />), errorElement: routeErrorElement },
      { path: 'results', element: withSuspense(<ResultsPage />), errorElement: routeErrorElement },
      { path: 'results/:id', element: withSuspense(<ResultDetailPage />), errorElement: routeErrorElement },
      { path: 'reviewer-queue', element: withSuspense(<ReviewerQueuePage />), errorElement: routeErrorElement },
      { path: 'reports', element: withSuspense(<ReportsPage />), errorElement: routeErrorElement },
      { path: 'settings', element: withSuspense(<SettingsPage />), errorElement: routeErrorElement },
      { path: 'customers', element: withSuspense(<CustomersPage />), errorElement: routeErrorElement },
    ],
  },
  {
    path: '/t/:token',
    element: withSuspense(<ParticipantLayout />),
    errorElement: routeErrorElement,
    children: [
      { index: true, element: withSuspense(<ParticipantConsentPage />), errorElement: routeErrorElement },
      { path: 'identity', element: withSuspense(<ParticipantIdentityPage />), errorElement: routeErrorElement },
      { path: 'instructions', element: withSuspense(<ParticipantInstructionsPage />), errorElement: routeErrorElement },
      { path: 'test', element: withSuspense(<ParticipantTestPage />), errorElement: routeErrorElement },
      { path: 'completed', element: withSuspense(<ParticipantCompletedPage />), errorElement: routeErrorElement },
    ],
  },
  {
    path: '*',
    element: withSuspense(<NotFoundPage />),
    errorElement: routeErrorElement,
  },
]);





