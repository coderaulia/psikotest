import { useEffect, useMemo, useState } from 'react';
import { Building2, CreditCard, FileCog, ShieldCheck, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

import { formatDateTime } from '@/lib/formatters';
import { getCustomerWorkspaceSettings } from '@/services/customer-workspace';
import { listCustomerAssessments } from '@/services/customer-onboarding';
import type { CustomerAssessmentItem, CustomerWorkspaceSettingsResponse } from '@/types/assessment';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function CustomerCompanyPage() {
  const [workspace, setWorkspace] = useState<CustomerWorkspaceSettingsResponse | null>(null);
  const [assessments, setAssessments] = useState<CustomerAssessmentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    void Promise.all([getCustomerWorkspaceSettings(), listCustomerAssessments()])
      .then(([workspacePayload, assessmentPayload]) => {
        if (!mounted) {
          return;
        }

        setWorkspace(workspacePayload);
        setAssessments(assessmentPayload);
      })
      .catch((error) => {
        if (mounted) {
          setErrorMessage(error instanceof Error ? error.message : 'Unable to load company workspace');
        }
      })
      .finally(() => {
        if (mounted) {
          setIsLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  const summary = useMemo(() => {
    const drafts = assessments.filter((item) => item.sessionStatus === 'draft').length;
    const live = assessments.filter((item) => item.sessionStatus === 'active').length;
    const upgraded = assessments.filter((item) => item.planStatus === 'upgraded').length;

    return {
      total: assessments.length,
      drafts,
      live,
      upgraded,
    };
  }, [assessments]);

  if (isLoading) {
    return (
      <Card className="bg-white/82">
        <CardContent className="p-8 text-sm text-slate-500">Loading company workspace...</CardContent>
      </Card>
    );
  }

  if (errorMessage || !workspace) {
    return (
      <Card className="bg-white/82">
        <CardContent className="p-8 text-sm text-rose-600">{errorMessage ?? 'Unable to load company workspace'}</CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-slate-500">Company setup and operating defaults</p>
        <h2 className="text-2xl font-semibold tracking-tight text-slate-950">Workspace company profile</h2>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="bg-white/84">
          <CardHeader>
            <CardTitle>{workspace.account.organizationName}</CardTitle>
            <CardDescription>{workspace.settings.brandTagline}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 text-sm text-slate-600">
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
              <p className="inline-flex items-center gap-2 font-medium text-slate-950"><Building2 className="h-4 w-4" /> Brand identity</p>
              <p className="mt-2">Brand name: {workspace.settings.brandName}</p>
              <p className="mt-1">Support email: {workspace.settings.supportEmail}</p>
              <p className="mt-1">Contact person: {workspace.settings.contactPerson}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
              <p className="inline-flex items-center gap-2 font-medium text-slate-950"><ShieldCheck className="h-4 w-4" /> Default policy</p>
              <p className="mt-2">Purpose: {workspace.settings.defaultAssessmentPurpose.replace(/_/g, ' ')}</p>
              <p className="mt-1">Administration: {workspace.settings.defaultAdministrationMode.replace(/_/g, ' ')}</p>
              <p className="mt-1">Result visibility: {workspace.settings.defaultResultVisibility.replace(/_/g, ' ')}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:col-span-2">
              <p className="font-medium text-slate-950">Default consent statement</p>
              <p className="mt-2 leading-7 text-slate-500">{workspace.settings.defaultConsentStatement}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:col-span-2">
              <p className="font-medium text-slate-950">Default privacy statement</p>
              <p className="mt-2 leading-7 text-slate-500">{workspace.settings.defaultPrivacyStatement}</p>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-5">
          <Card className="bg-white/84">
            <CardHeader>
              <CardTitle>Workspace summary</CardTitle>
              <CardDescription>Operational view for the current customer workspace.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Assessments</p>
                <p className="mt-2 text-3xl font-semibold text-slate-950">{summary.total}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Drafts</p>
                <p className="mt-2 text-3xl font-semibold text-slate-950">{summary.drafts}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Live links</p>
                <p className="mt-2 text-3xl font-semibold text-slate-950">{summary.live}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Upgraded</p>
                <p className="mt-2 text-3xl font-semibold text-slate-950">{summary.upgraded}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-950 text-white">
            <CardHeader>
              <CardTitle>Next setup actions</CardTitle>
              <CardDescription className="text-white/70">Move from workspace defaults into a share-ready assessment workflow.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-white/75">
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                <p className="inline-flex items-center gap-2 font-medium text-white"><FileCog className="h-4 w-4" /> Review assessment setup</p>
                <p className="mt-2">Edit instructions, visibility, and delivery mode before activation.</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                <p className="inline-flex items-center gap-2 font-medium text-white"><CreditCard className="h-4 w-4" /> Complete dummy payment</p>
                <p className="mt-2">Simulate the SaaS upgrade step before participant sharing is switched on.</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                <p className="inline-flex items-center gap-2 font-medium text-white"><Users className="h-4 w-4" /> Invite participants</p>
                <p className="mt-2">Prepare invite lists and share the live participant link when the assessment is active.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="bg-white/84">
        <CardHeader>
          <CardTitle>Recent assessments</CardTitle>
          <CardDescription>Jump back into setup, checkout, or participant management.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {assessments.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-6 text-sm text-slate-500">
              No assessments yet. <Link to="/workspace/create" className="font-medium text-slate-950">Create your first draft</Link>.
            </div>
          ) : (
            assessments.slice(0, 4).map((assessment) => (
              <div key={assessment.assessmentId} className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-medium text-slate-950">{assessment.title}</p>
                  <p className="mt-1 text-sm text-slate-500">{assessment.testType.toUpperCase()} • {assessment.sessionStatus} • Created {formatDateTime(assessment.createdAt)}</p>
                </div>
                <Button variant="secondary" asChild>
                  <Link to={`/workspace/assessments/${assessment.assessmentId}`}>Open assessment</Link>
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
