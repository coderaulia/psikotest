import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, CreditCard, ShieldCheck } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { formatDateTime } from '@/lib/formatters';
import { getCustomerBillingOverview } from '@/services/customer-billing';
import { completeCustomerAssessmentCheckout, getCustomerAssessment } from '@/services/customer-onboarding';
import type {
  CustomerAssessmentCheckoutPayload,
  CustomerAssessmentDetail,
  CustomerBillingOverviewResponse,
  DummyCheckoutBillingCycle,
  DummyCheckoutPlan,
} from '@/types/assessment';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const dummyPrices: Record<DummyCheckoutPlan, Record<DummyCheckoutBillingCycle, string>> = {
  starter: { monthly: '$0', annual: '$0' },
  growth: { monthly: '$29', annual: '$290' },
  research: { monthly: '$39', annual: '$390' },
};

function getRecommendedPlan(testType: CustomerAssessmentDetail['testType']) {
  return testType === 'custom' ? 'research' : 'growth';
}

export function CustomerAssessmentCheckoutPage() {
  const { assessmentId = '' } = useParams();
  const navigate = useNavigate();
  const parsedAssessmentId = Number(assessmentId);
  const [detail, setDetail] = useState<CustomerAssessmentDetail | null>(null);
  const [billingOverview, setBillingOverview] = useState<CustomerBillingOverviewResponse | null>(null);
  const [billingCycle, setBillingCycle] = useState<DummyCheckoutBillingCycle>('monthly');
  const [selectedPlan, setSelectedPlan] = useState<DummyCheckoutPlan>('starter');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!Number.isFinite(parsedAssessmentId) || parsedAssessmentId <= 0) {
      setErrorMessage('Assessment draft not found');
      setIsLoading(false);
      return;
    }

    let mounted = true;

    Promise.all([getCustomerAssessment(parsedAssessmentId), getCustomerBillingOverview()])
      .then(([assessment, overview]) => {
        if (!mounted) {
          return;
        }

        const recommendedPlan = assessment.planStatus === 'upgraded' ? overview.subscription.planCode : getRecommendedPlan(assessment.testType);
        setDetail(assessment);
        setBillingOverview(overview);
        setSelectedPlan(recommendedPlan);
        setBillingCycle(overview.subscription.billingCycle);
      })
      .catch((error) => {
        if (mounted) {
          setErrorMessage(error instanceof Error ? error.message : 'Unable to load checkout');
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

  const selectedPlanCard = useMemo(
    () => billingOverview?.plans.find((plan) => plan.planCode === selectedPlan) ?? null,
    [billingOverview, selectedPlan],
  );

  async function handleCheckout() {
    if (!detail) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const payload: CustomerAssessmentCheckoutPayload = {
        selectedPlan,
        billingCycle,
      };
      const nextDetail = await completeCustomerAssessmentCheckout(detail.assessmentId, payload);
      const nextBillingOverview = await getCustomerBillingOverview();
      setDetail(nextDetail);
      setBillingOverview(nextBillingOverview);
      setSuccessMessage('Dummy payment completed. Participant sharing is now activated for this assessment.');
      navigate(`/workspace/assessments/${detail.assessmentId}/participants`, { replace: true });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to complete dummy payment');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <Card className="bg-white/82">
        <CardContent className="p-8 text-sm text-slate-500">Loading dummy checkout...</CardContent>
      </Card>
    );
  }

  if (errorMessage || !detail || !billingOverview) {
    return (
      <Card className="bg-white/82">
        <CardContent className="p-8 text-sm text-rose-600">{errorMessage ?? 'Assessment draft not found'}</CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
      <Card className="bg-white/84">
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle>Dummy checkout</CardTitle>
              <CardDescription>Simulate the SaaS upgrade step before this assessment becomes shareable.</CardDescription>
            </div>
            <Badge className="border-amber-200 bg-amber-50 text-amber-700">Trial payment</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="inline-flex rounded-full border border-slate-200 bg-slate-100 p-1 text-sm">
            {(['monthly', 'annual'] as DummyCheckoutBillingCycle[]).map((cycle) => (
              <button
                key={cycle}
                type="button"
                onClick={() => setBillingCycle(cycle)}
                className={`rounded-full px-4 py-2 transition ${billingCycle === cycle ? 'bg-slate-950 text-white' : 'text-slate-500'}`}
              >
                {cycle === 'monthly' ? 'Monthly' : 'Annual'}
              </button>
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {billingOverview.plans.map((plan) => (
              <button
                key={plan.planCode}
                type="button"
                onClick={() => setSelectedPlan(plan.planCode)}
                className={`rounded-[26px] border p-5 text-left transition ${selectedPlan === plan.planCode ? 'border-slate-950 bg-slate-950 text-white shadow-lg' : 'border-slate-200 bg-slate-50/70 hover:border-slate-300 hover:bg-white'}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium">{plan.label}</p>
                  {billingOverview.subscription.planCode === plan.planCode ? <Badge className="border-white/10 bg-white/10 text-white">Current</Badge> : null}
                </div>
                <p className={`mt-2 text-3xl font-semibold ${selectedPlan === plan.planCode ? 'text-white' : 'text-slate-950'}`}>
                  {dummyPrices[plan.planCode][billingCycle]}
                </p>
                <p className={`mt-2 text-sm leading-7 ${selectedPlan === plan.planCode ? 'text-white/70' : 'text-slate-500'}`}>{plan.description}</p>
                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{plan.assessmentLimit} draft/live assessments</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{plan.participantLimit} participant records</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{plan.teamMemberLimit} team seats</span>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {errorMessage ? <p className="text-sm text-rose-600">{errorMessage}</p> : null}
          {successMessage ? <p className="text-sm text-emerald-700">{successMessage}</p> : null}

          <div className="flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-slate-500">
              Selected plan: <span className="font-medium text-slate-950">{selectedPlanCard?.label ?? billingOverview.subscription.planLabel}</span> ({billingCycle})
            </div>
            <Button type="button" size="lg" onClick={handleCheckout} disabled={isSubmitting || detail.sessionStatus === 'active'}>
              {detail.sessionStatus === 'active' ? 'Already activated' : isSubmitting ? 'Processing dummy payment...' : 'Complete dummy payment'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card className="bg-white/84">
          <CardHeader>
            <CardTitle>{detail.title}</CardTitle>
            <CardDescription>{detail.organizationName}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-slate-500">
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
              <p className="font-medium text-slate-950">Current workspace subscription</p>
              <p className="mt-2">{billingOverview.subscription.planLabel} ({billingOverview.subscription.billingCycle})</p>
              <p className="mt-1 text-xs text-slate-400">
                Trial ends: {billingOverview.subscription.trialEndsAt ? formatDateTime(billingOverview.subscription.trialEndsAt) : 'No active trial window'}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Next renewal: {billingOverview.subscription.renewsAt ? formatDateTime(billingOverview.subscription.renewsAt) : 'Renewal appears after dummy activation'}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
              <p className="font-medium text-slate-950">What checkout unlocks</p>
              <ul className="mt-3 space-y-2 leading-7">
                <li>Participant sharing moves from private draft to active link.</li>
                <li>Invitation list becomes operational for email or direct link sharing.</li>
                <li>Workspace plan and usage are updated for SaaS flow validation.</li>
              </ul>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
              <p className="inline-flex items-center gap-2 font-medium text-slate-950"><ShieldCheck className="h-4 w-4" /> Audience policy remains intact</p>
              <p className="mt-2">Distribution policy: {detail.distributionPolicy.replace(/_/g, ' ')}</p>
              <p className="mt-1">Participant access: {detail.participantResultAccess.replace(/_/g, ' ')}</p>
              <p className="mt-1">HR access: {detail.hrResultAccess.replace(/_/g, ' ')}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-950 text-white">
          <CardHeader>
            <CardTitle>Before you continue</CardTitle>
            <CardDescription className="text-white/70">This is still a dummy commercial step for MVP validation.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-white/75">
            <p>No real billing provider is connected yet.</p>
            <p>The selected plan is stored to validate workspace limits, upgrade flow, and activation behavior.</p>
            <div className="flex flex-col gap-3 pt-2">
              <Button variant="secondary" className="w-full justify-between" asChild>
                <Link to={`/workspace/assessments/${detail.assessmentId}`}>Back to assessment overview</Link>
              </Button>
              <Button variant="outline" className="w-full justify-between border-white/20 bg-white/10 text-white hover:bg-white/15 hover:text-white" asChild>
                <Link to="/workspace/billing">Open workspace billing</Link>
              </Button>
              <Button variant="outline" className="w-full justify-between border-white/20 bg-white/10 text-white hover:bg-white/15 hover:text-white" asChild>
                <Link to={`/workspace/assessments/${detail.assessmentId}/setup`}>Edit setup first</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
