import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Copy, CreditCard, ExternalLink, FileText, Link as LinkIcon, LockKeyhole, Settings2, ShieldCheck, Sparkles, Users } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';

import { formatDateTime, formatTokenLabel } from '@/lib/formatters';
import { getCustomerAssessment } from '@/services/customer-onboarding';
import type { CustomerAssessmentDetail } from '@/types/assessment';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

function getCustomerVisibilityNote(detail: CustomerAssessmentDetail) {
  if (detail.distributionPolicy === 'hr_only') {
    return 'This configuration keeps the report restricted to internal HR or authorized reviewers only.';
  }

  if (detail.participantResultAccess === 'none') {
    return 'Participants will complete the assessment, but they will not receive a result view from this workspace.';
  }

  if (detail.participantResultAccess === 'full_released') {
    return 'Participants only receive the full report after professional review and release.';
  }

  return 'Participants receive only the approved summary view. Reviewer drafts and internal notes remain hidden from this workspace.';
}

export function CustomerAssessmentDetailPage() {
  const { assessmentId = '' } = useParams();
  const parsedAssessmentId = Number(assessmentId);
  const [detail, setDetail] = useState<CustomerAssessmentDetail | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!Number.isFinite(parsedAssessmentId) || parsedAssessmentId <= 0) {
      setErrorMessage('Assessment draft not found');
      setIsLoading(false);
      return;
    }

    let mounted = true;

    void getCustomerAssessment(parsedAssessmentId)
      .then((payload) => {
        if (mounted) {
          setDetail(payload);
        }
      })
      .catch((error) => {
        if (mounted) {
          setErrorMessage(error instanceof Error ? error.message : 'Unable to load assessment draft');
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
  }, [parsedAssessmentId]);

  const headerBadgeLabel = useMemo(() => {
    if (!detail) {
      return null;
    }

    return detail.sessionStatus === 'active' ? 'Sharing active' : 'Draft review';
  }, [detail]);

  async function handleCopyLink() {
    if (!detail?.participantLink || typeof navigator === 'undefined' || !navigator.clipboard) {
      return;
    }

    await navigator.clipboard.writeText(detail.participantLink);
    setSuccessMessage('Participant link copied to clipboard.');
  }

  if (isLoading) {
    return (
      <Card className="bg-white/82">
        <CardContent className="p-8 text-sm text-slate-500">Loading assessment review...</CardContent>
      </Card>
    );
  }

  if (errorMessage || !detail) {
    return (
      <Card className="bg-white/82">
        <CardContent className="p-8 text-sm text-rose-600">{errorMessage ?? 'Assessment draft not found'}</CardContent>
      </Card>
    );
  }

  const visibilityCards = [
    {
      label: 'Distribution policy',
      value: formatTokenLabel(detail.distributionPolicy),
      icon: ShieldCheck,
    },
    {
      label: 'Participant access',
      value: formatTokenLabel(detail.participantResultAccess),
      icon: Users,
    },
    {
      label: 'HR access',
      value: formatTokenLabel(detail.hrResultAccess),
      icon: LinkIcon,
    },
    {
      label: 'Delivery mode',
      value: detail.protectedDeliveryMode ? 'Protected progressive' : 'Full session delivery',
      icon: Sparkles,
    },
  ];

  return (
    <div className="grid gap-6 xl:grid-cols-[1.04fr_0.96fr]">
      <div className="space-y-6">
        <Card className="bg-white/84">
          <CardHeader className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle>{detail.title}</CardTitle>
                <CardDescription>{detail.organizationName}</CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                {headerBadgeLabel ? <Badge className="border-slate-200 bg-slate-100 text-slate-700">{headerBadgeLabel}</Badge> : null}
                <Badge className="border-slate-200 bg-slate-100 text-slate-700">{formatTokenLabel(detail.testType)}</Badge>
                <Badge className={detail.planStatus === 'upgraded' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-700'}>
                  {formatTokenLabel(detail.planStatus)}
                </Badge>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 text-sm text-slate-500">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Purpose</p>
                <p className="mt-2 font-medium text-slate-950">{formatTokenLabel(detail.assessmentPurpose)}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 text-sm text-slate-500">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Administration</p>
                <p className="mt-2 font-medium text-slate-950">{formatTokenLabel(detail.administrationMode)}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 text-sm text-slate-500">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Distribution</p>
                <p className="mt-2 font-medium text-slate-950">{formatTokenLabel(detail.distributionPolicy)}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 text-sm text-slate-500">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Created</p>
                <p className="mt-2 font-medium text-slate-950">{formatDateTime(detail.createdAt)}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-slate-600">
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <p className="font-medium text-slate-950">Assessment summary</p>
              <p className="mt-2 leading-7 text-slate-500">{detail.description ?? 'No description available for this draft.'}</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Time limit</p>
                  <p className="mt-2 font-medium text-slate-950">{detail.timeLimitMinutes ?? 'Flexible'} minutes</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Participant limit</p>
                  <p className="mt-2 font-medium text-slate-950">{detail.participantLimit ?? 'Flexible'}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Interpretation mode</p>
                  <p className="mt-2 font-medium text-slate-950">{formatTokenLabel(detail.interpretationMode)}</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <p className="font-medium text-slate-950">Participant instructions</p>
              <div className="mt-4 space-y-3">
                {detail.instructions.map((item, index) => (
                  <div key={`${item}-${index}`} className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 leading-7 text-slate-500">
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <p className="inline-flex items-center gap-2 font-medium text-slate-950"><ShieldCheck className="h-4 w-4" /> Consent statement</p>
                <p className="mt-3 leading-7 text-slate-500">{detail.consentStatement}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <p className="inline-flex items-center gap-2 font-medium text-slate-950"><LockKeyhole className="h-4 w-4" /> Privacy statement</p>
                <p className="mt-3 leading-7 text-slate-500">{detail.privacyStatement}</p>
                <p className="mt-3 text-xs uppercase tracking-[0.16em] text-slate-400">Contact person</p>
                <p className="mt-1 text-sm text-slate-600">{detail.contactPerson}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card className="bg-white/84">
          <CardHeader>
            <CardTitle>Commercial onboarding actions</CardTitle>
            <CardDescription>Move through setup, dummy payment, and participant operations in order.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-slate-500">
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
              <div className="flex flex-wrap gap-2">
                <Badge className="border-slate-200 bg-slate-100 text-slate-700">{formatTokenLabel(detail.distributionPolicy)}</Badge>
                {detail.protectedDeliveryMode ? <Badge className="border-sky-200 bg-sky-50 text-sky-700">Protected delivery</Badge> : null}
              </div>
              <p className="mt-4 font-medium text-slate-950">Participant link</p>
              <p className="mt-2 break-all">{detail.participantLink}</p>
              <p className="mt-2 text-xs text-slate-400">
                {detail.sessionStatus === 'active'
                  ? 'This link is active and ready to be shared with participants.'
                  : 'This link is prepared but still private until dummy checkout is completed.'}
              </p>
            </div>
            {successMessage ? <p className="text-sm text-emerald-700">{successMessage}</p> : null}
            <div className="flex flex-col gap-3">
              <Button type="button" size="lg" variant="secondary" asChild>
                <Link to={`/workspace/assessments/${detail.assessmentId}/setup`}>
                  Edit assessment setup <Settings2 className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              {detail.sessionStatus === 'draft' ? (
                <Button type="button" size="lg" asChild>
                  <Link to={`/workspace/assessments/${detail.assessmentId}/checkout`}>
                    Continue to dummy payment <CreditCard className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              ) : (
                <>
                  <Button type="button" size="lg" asChild>
                    <Link to={`/workspace/assessments/${detail.assessmentId}/participants`}>
                      Manage participants <Users className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button type="button" size="lg" variant="secondary" asChild>
                    <Link to="/workspace/results">
                      View released results <FileText className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </>
              )}
              <Button type="button" variant="outline" size="lg" asChild>
                <a href={detail.previewDemoLink} target="_blank" rel="noreferrer">
                  Preview demo flow <ExternalLink className="ml-2 h-4 w-4" />
                </a>
              </Button>
              <Button type="button" variant="outline" size="lg" onClick={() => void handleCopyLink()}>
                Copy participant link <Copy className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/84">
          <CardHeader>
            <CardTitle>Audience visibility</CardTitle>
            <CardDescription>Workspace owners see policy state, not internal reviewer draft content.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-slate-500">
            <div className="grid gap-3 sm:grid-cols-2">
              {visibilityCards.map((card) => {
                const Icon = card.icon;
                return (
                  <div key={card.label} className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                    <p className="inline-flex items-center gap-2 font-medium text-slate-950"><Icon className="h-4 w-4" /> {card.label}</p>
                    <p className="mt-2 text-xs leading-6 text-slate-500">{card.value}</p>
                  </div>
                );
              })}
            </div>
            <div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-xs leading-6 text-sky-700">
              {getCustomerVisibilityNote(detail)} Reviewer notes and draft interpretations remain internal and are never exposed in the customer workspace view.
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-950 text-white">
          <CardHeader>
            <CardTitle>Readiness checklist</CardTitle>
            <CardDescription className="text-white/70">The SaaS onboarding still follows the ethical assessment workflow under the hood.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-7 text-white/75">
            <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
              <p className="inline-flex items-center gap-2 font-medium text-white"><CheckCircle2 className="h-4 w-4" /> Setup reviewed</p>
              <p className="mt-2">Assessment type, timing, protected delivery, and result visibility should be finalized first.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
              <p className="inline-flex items-center gap-2 font-medium text-white"><CheckCircle2 className="h-4 w-4" /> Dummy payment completed</p>
              <p className="mt-2">Sharing only becomes active after the commercial step is acknowledged.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
              <p className="inline-flex items-center gap-2 font-medium text-white"><CheckCircle2 className="h-4 w-4" /> Participant list prepared</p>
              <p className="mt-2">Use the participant page to manage invites and share the live assessment link.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
