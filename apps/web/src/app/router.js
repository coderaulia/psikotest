import { jsx as _jsx } from "react/jsx-runtime";
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
        element: _jsx(MarketingLayout, {}),
        children: [{ index: true, element: _jsx(LandingPage, {}) }],
    },
    {
        path: '/admin/login',
        element: _jsx(AdminLoginPage, {}),
    },
    {
        path: '/admin',
        element: _jsx(AdminLayout, {}),
        children: [
            { index: true, element: _jsx(Navigate, { to: "/admin/dashboard", replace: true }) },
            { path: 'dashboard', element: _jsx(DashboardPage, {}) },
            { path: 'participants', element: _jsx(ParticipantsPage, {}) },
            { path: 'test-sessions', element: _jsx(TestSessionsPage, {}) },
            { path: 'results', element: _jsx(ResultsPage, {}) },
            { path: 'reports', element: _jsx(ReportsPage, {}) },
        ],
    },
    {
        path: '/t/:token',
        element: _jsx(ParticipantLayout, {}),
        children: [
            { index: true, element: _jsx(ParticipantIdentityPage, {}) },
            { path: 'instructions', element: _jsx(ParticipantInstructionsPage, {}) },
            { path: 'test', element: _jsx(ParticipantTestPage, {}) },
            { path: 'completed', element: _jsx(ParticipantCompletedPage, {}) },
        ],
    },
    {
        path: '*',
        element: _jsx(NotFoundPage, {}),
    },
]);
