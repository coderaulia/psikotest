import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, CreditCard, ShieldCheck } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { completeCustomerAssessmentCheckout, getCustomerAssessment } from '@/services/customer-onboarding';
import type { CustomerAssessmentCheckoutPayload, CustomerAssessmentDetail, DummyCheckoutBillingCycle, DummyCheckoutPlan } from '@/types/assessment';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const plans: Array<{
  value: DummyCheckoutPlan;
  title: string;
  subtitle: string;
  priceMonthly: string;
  priceAnnual: string;
  features: string[];
}> = [
  {
    value: 'starter',
    title: 'Starter',
    subtitle: 'For one team validating the first workflow.',
    priceMonthly: '$0',
    priceAnnual: '$0',
    features: ['Single workspace', 'Draft to live participant flow', 'Dummy payment mode'],
  },
  {
    value: 'growth',
    title: 'Growth',
    subtitle: 'For companies onboarding multiple hiring or development assessments.',
    priceMonthly: '$29',
    priceAnnual: '$290',
    features: ['Higher participant caps', 'Team operations flow', 'Invite management'],
  },
  {
    value: 'research',
    title: 'Research',
    subtitle: 'For lecturers, labs, and academic questionnaire projects.',
    priceMonthly: '$39',
    priceAnnual: '$390',
    features: ['Custom assessments', 'Structured participant datasets', 'Research-oriented defaults'],
  },
];

export function CustomerAssessmentCheckoutPage() {
  const { assessmentId = '' } = useParams();
  const navigate = useNavigate();
  const parsedAssessmentId = Number(assessmentId);
  const [detail, setDetail] = useState<CustomerAssessmentDetail | null>(null);
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

    void getCustomerAssessment(parsedAssessmentId)
      .then((payload) => {
        if (!mounted) {
          return;
        }

        setDetail(payload);
        setSelectedPlan(payload.testType === 'custom' ? 'research' : 'growth');
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

  const selectedPlanCard = useMemo(() => plans.find((plan) => plan.value === selectedPlan) ?? plans[0], [selectedPlan]);

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
      setDetail(nextDetail);
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

  if (errorMessage || !detail) {
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
            {plans.map((plan) => (
              <button
                key={plan.value}
                type="button"
                onClick={() => setSelectedPlan(plan.value)}
                className={`rounded-[26px] border p-5 text-left transition ${selectedPlan === plan.value ? 'border-slate-950 bg-slate-950 text-white shadow-lg' : 'border-slate-200 bg-slate-50/70 hover:border-slate-300 hover:bg-white'}`}
              >
                <p className="text-sm font-medium">{plan.title}</p>
                <p className={`mt-2 text-3xl font-semibold ${selectedPlan === plan.value ? 'text-white' : 'text-slate-950'}`}>
                  {billingCycle === 'monthly' ? plan.priceMonthly : plan.priceAnnual}
                </p>
                <p className={`mt-2 text-sm leading-7 ${selectedPlan === plan.value ? 'text-white/70' : 'text-slate-500'}`}>{plan.subtitle}</p>
                <div className="mt-4 space-y-2 text-sm">
                  {plan.features.map((feature) => (
                    <div key={feature} className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </button>
            ))}
          </div>

          {errorMessage ? <p className="text-sm text-rose-600">{errorMessage}</p> : null}
          {successMessage ? <p className="text-sm text-emerald-700">{successMessage}</p> : null}

          <div className="flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-slate-500">
              Selected plan: <span className="font-medium text-slate-950">{selectedPlanCard.title}</span> ({billingCycle})
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
              <p className="font-medium text-slate-950">What checkout unlocks</p>
              <ul className="mt-3 space-y-2 leading-7">
                <li>Participant sharing moves from private draft to active link.</li>
                <li>Invitation list becomes operational for email or direct link sharing.</li>
                <li>Workspace can start collecting real participant responses.</li>
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
            <p>The selected plan is stored only to validate SaaS flow transitions.</p>
            <div className="flex flex-col gap-3 pt-2">
              <Button variant="secondary" className="w-full justify-between" asChild>
                <Link to={`/workspace/assessments/${detail.assessmentId}`}>Back to assessment overview</Link>
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
