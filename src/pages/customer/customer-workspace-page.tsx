import { useEffect, useState } from 'react';
import { ArrowRight, ExternalLink, FlaskConical, Link as LinkIcon, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

import { formatTokenLabel } from '@/lib/formatters';
import { listCustomerAssessments } from '@/services/customer-onboarding';
import type { CustomerAssessmentItem } from '@/types/assessment';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function CustomerWorkspacePage() {
  const [items, setItems] = useState<CustomerAssessmentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    void listCustomerAssessments()
      .then((payload) => {
        if (mounted) {
          setItems(payload);
        }
      })
      .catch((error) => {
        if (mounted) {
          setErrorMessage(error instanceof Error ? error.message : 'Unable to load workspace');
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

  if (isLoading) {
    return (
      <Card className="bg-white/82">
        <CardContent className="p-8 text-sm text-slate-500">Loading your workspace...</CardContent>
      </Card>
    );
  }

  if (errorMessage) {
    return (
      <Card className="bg-white/82">
        <CardContent className="p-8 text-sm text-rose-600">{errorMessage}</CardContent>
      </Card>
    );
  }

  if (items.length === 0) {
    return (
      <Card className="bg-white/82">
        <CardHeader>
          <CardTitle>No assessment drafts yet</CardTitle>
          <CardDescription>Create your first guided assessment draft to generate a participant link and preview experience.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link to="/workspace/create">Create first assessment</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-slate-500">Your draft assessments</p>
          <h2 className="text-2xl font-semibold tracking-tight">Prepared links and preview flows</h2>
        </div>
        <Button asChild>
          <Link to="/workspace/create">
            Create another assessment <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        {items.map((item) => (
          <Card key={item.assessmentId} className="bg-white/84">
            <CardHeader className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle>{item.title}</CardTitle>
                  <CardDescription>{item.organizationName}</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Badge className="border-slate-200 bg-slate-100 text-slate-700">{formatTokenLabel(item.testType)}</Badge>
                  <Badge className="border-amber-200 bg-amber-50 text-amber-700">{formatTokenLabel(item.planStatus)}</Badge>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 text-sm text-slate-500">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Purpose</p>
                  <p className="mt-2 font-medium text-slate-950">{formatTokenLabel(item.assessmentPurpose)}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 text-sm text-slate-500">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Participants</p>
                  <p className="mt-2 font-medium text-slate-950">{item.participantLimit ?? 'Flexible'}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 text-sm text-slate-500">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Visibility</p>
                  <p className="mt-2 font-medium text-slate-950">{formatTokenLabel(item.resultVisibility)}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-slate-500">
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="font-medium text-slate-950">Draft participant link</p>
                <p className="mt-2 break-all text-slate-500">{item.participantLink}</p>
                <p className="mt-2 text-xs text-slate-400">This link is prepared during onboarding. Keep it private until your sharing flow is activated.</p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button variant="secondary" size="lg" className="sm:flex-1" asChild>
                  <a href={item.previewDemoLink} target="_blank" rel="noreferrer">
                    Preview demo experience <ExternalLink className="ml-2 h-4 w-4" />
                  </a>
                </Button>
                <Button variant="outline" size="lg" className="sm:flex-1" disabled>
                  Upgrade to share
                </Button>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                  <p className="inline-flex items-center gap-2 font-medium text-slate-950"><Users className="h-4 w-4" /> Draft access</p>
                  <p className="mt-2 text-xs leading-6 text-slate-500">Prepare participant settings before activating external distribution.</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                  <p className="inline-flex items-center gap-2 font-medium text-slate-950"><FlaskConical className="h-4 w-4" /> Preview route</p>
                  <p className="mt-2 text-xs leading-6 text-slate-500">Use the demo flow to inspect the participant experience without exposing your draft question set.</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                  <p className="inline-flex items-center gap-2 font-medium text-slate-950"><LinkIcon className="h-4 w-4" /> Created</p>
                  <p className="mt-2 text-xs leading-6 text-slate-500">{new Date(item.createdAt).toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
