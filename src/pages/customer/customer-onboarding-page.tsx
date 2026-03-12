import { useMemo, useState } from 'react';
import { Brain, ClipboardCheck, Copy, ExternalLink, FileText, Gauge, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

import { loadCustomerSession } from '@/lib/customer-session';
import { cn } from '@/lib/cn';
import { formatTokenLabel } from '@/lib/formatters';
import { createCustomerAssessment } from '@/services/customer-onboarding';
import type { AdministrationMode, AssessmentPurpose, CreateCustomerAssessmentPayload, CustomerAssessmentItem, CustomerAssessmentResultVisibility, TestTypeCode } from '@/types/assessment';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Select } from '@/components/ui/select';

const assessmentTypeOptions: Array<{ value: TestTypeCode; title: string; description: string; icon: typeof Brain }> = [
  {
    value: 'iq',
    title: 'IQ Test',
    description: 'Cognitive screening with timed multiple-choice questions.',
    icon: Brain,
  },
  {
    value: 'disc',
    title: 'DISC Personality',
    description: 'Behavioral style profiling using forced-choice statements.',
    icon: ClipboardCheck,
  },
  {
    value: 'workload',
    title: 'Workload / Stress Test',
    description: 'Structured workload monitoring for teams and wellbeing programs.',
    icon: Gauge,
  },
  {
    value: 'custom',
    title: 'Custom Assessment',
    description: 'Research questionnaires and flexible psychological scale instruments.',
    icon: FileText,
  },
];

const purposeOptions: Array<{ value: AssessmentPurpose; label: string }> = [
  { value: 'recruitment', label: 'Recruitment' },
  { value: 'employee_development', label: 'Employee development' },
  { value: 'academic_evaluation', label: 'Academic evaluation' },
  { value: 'research', label: 'Research' },
  { value: 'self_assessment', label: 'Self assessment' },
];

const resultVisibilityOptions: Array<{ value: CustomerAssessmentResultVisibility; label: string; description: string }> = [
  {
    value: 'review_required',
    label: 'Internal review first',
    description: 'Participants complete the test, but interpretation is held for reviewer follow-up.',
  },
  {
    value: 'participant_summary',
    label: 'Participant summary',
    description: 'Participants can see an indicative summary after completion.',
  },
];

const administrationModeOptions: Array<{ value: AdministrationMode; label: string }> = [
  { value: 'remote_unsupervised', label: 'Remote unsupervised' },
  { value: 'supervised', label: 'Supervised' },
];

const totalSteps = 4;

function getDefaultPurpose(accountType: 'business' | 'researcher' | undefined, testType: TestTypeCode): AssessmentPurpose {
  if (testType === 'custom' || accountType === 'researcher') {
    return 'research';
  }

  return 'recruitment';
}

export function CustomerOnboardingPage() {
  const customerSession = loadCustomerSession();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [createdAssessment, setCreatedAssessment] = useState<CustomerAssessmentItem | null>(null);
  const [form, setForm] = useState<CreateCustomerAssessmentPayload>({
    testType: customerSession?.account.accountType === 'researcher' ? 'custom' : 'disc',
    title: '',
    purpose: getDefaultPurpose(customerSession?.account.accountType, customerSession?.account.accountType === 'researcher' ? 'custom' : 'disc'),
    organizationName: customerSession?.account.organizationName ?? '',
    administrationMode: 'remote_unsupervised',
    timeLimitMinutes: 15,
    participantLimit: customerSession?.account.accountType === 'researcher' ? 100 : 25,
    resultVisibility: customerSession?.account.accountType === 'researcher' ? 'participant_summary' : 'review_required',
  });

  const progressValue = useMemo(() => (step / totalSteps) * 100, [step]);

  function updateForm<K extends keyof CreateCustomerAssessmentPayload>(key: K, value: CreateCustomerAssessmentPayload[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function handleTypeSelection(testType: TestTypeCode) {
    setForm((current) => ({
      ...current,
      testType,
      purpose: getDefaultPurpose(customerSession?.account.accountType, testType),
      resultVisibility: testType === 'custom' ? 'participant_summary' : current.resultVisibility,
    }));
  }

  function nextStep() {
    setErrorMessage(null);
    setSuccessMessage(null);
    setStep((current) => Math.min(totalSteps, current + 1));
  }

  function previousStep() {
    setErrorMessage(null);
    setSuccessMessage(null);
    setStep((current) => Math.max(1, current - 1));
  }

  async function handleCreateAssessment() {
    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const assessment = await createCustomerAssessment(form);
      setCreatedAssessment(assessment);
      setSuccessMessage('Participant link generated. The draft remains private until you activate sharing.');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to create assessment draft');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleCopyLink() {
    if (!createdAssessment?.participantLink || typeof navigator === 'undefined' || !navigator.clipboard) {
      return;
    }

    await navigator.clipboard.writeText(createdAssessment.participantLink);
    setSuccessMessage('Participant link copied to clipboard.');
  }

  const selectedType = assessmentTypeOptions.find((item) => item.value === form.testType);

  return (
    <div className="grid gap-6 xl:grid-cols-[0.94fr_1.06fr]">
      <Card className="bg-white/84">
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle>Create your first assessment</CardTitle>
              <CardDescription>Follow the guided flow to prepare a compliant draft before sharing it externally.</CardDescription>
            </div>
            <Badge className="border-slate-200 bg-slate-100 text-slate-700">Step {step} of {totalSteps}</Badge>
          </div>
          <Progress value={progressValue} className="mt-4" />
        </CardHeader>
        <CardContent className="space-y-6">
          {step === 1 ? (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-slate-950">What type of assessment do you want to create?</p>
                <p className="mt-1 text-sm text-slate-500">Choose the format that matches your screening, development, or research objective.</p>
              </div>
              <div className="grid gap-4">
                {assessmentTypeOptions.map((option) => {
                  const Icon = option.icon;
                  const active = form.testType === option.value;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleTypeSelection(option.value)}
                      className={cn(
                        'rounded-[24px] border p-5 text-left transition',
                        active ? 'border-slate-950 bg-slate-950 text-white shadow-lg' : 'border-slate-200 bg-slate-50/70 hover:border-slate-300 hover:bg-white',
                      )}
                    >
                      <div className="flex items-start gap-4">
                        <div className={cn('flex h-12 w-12 items-center justify-center rounded-2xl', active ? 'bg-white/12' : 'bg-slate-950 text-white')}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-medium">{option.title}</p>
                          <p className={cn('mt-2 text-sm leading-7', active ? 'text-white/75' : 'text-slate-500')}>{option.description}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-slate-950">Assessment information</p>
                <p className="mt-1 text-sm text-slate-500">Define the assessment title, usage context, and organization or project owner.</p>
              </div>
              <div className="space-y-2">
                <label htmlFor="assessment-title" className="text-sm font-medium text-slate-600">Assessment name</label>
                <Input id="assessment-title" value={form.title} onChange={(event) => updateForm('title', event.target.value)} placeholder="Graduate screening batch A" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="assessment-purpose" className="text-sm font-medium text-slate-600">Purpose</label>
                  <Select id="assessment-purpose" value={form.purpose} onChange={(event) => updateForm('purpose', event.target.value as AssessmentPurpose)}>
                    {purposeOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-2">
                  <label htmlFor="organization-name" className="text-sm font-medium text-slate-600">Organization name</label>
                  <Input id="organization-name" value={form.organizationName} onChange={(event) => updateForm('organizationName', event.target.value)} placeholder="Your organization or research lab" />
                </div>
              </div>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-slate-950">Configure settings</p>
                <p className="mt-1 text-sm text-slate-500">Set the operational constraints and visibility model before the participant link is prepared.</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="time-limit" className="text-sm font-medium text-slate-600">Time limit (minutes)</label>
                  <Input id="time-limit" type="number" min="1" max="180" value={form.timeLimitMinutes ?? ''} onChange={(event) => updateForm('timeLimitMinutes', event.target.value ? Number(event.target.value) : null)} />
                </div>
                <div className="space-y-2">
                  <label htmlFor="participant-limit" className="text-sm font-medium text-slate-600">Number of participants</label>
                  <Input id="participant-limit" type="number" min="1" max="50000" value={form.participantLimit ?? ''} onChange={(event) => updateForm('participantLimit', event.target.value ? Number(event.target.value) : null)} />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="administration-mode" className="text-sm font-medium text-slate-600">Administration mode</label>
                  <Select id="administration-mode" value={form.administrationMode} onChange={(event) => updateForm('administrationMode', event.target.value as AdministrationMode)}>
                    {administrationModeOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-2">
                  <label htmlFor="result-visibility" className="text-sm font-medium text-slate-600">Result visibility</label>
                  <Select id="result-visibility" value={form.resultVisibility} onChange={(event) => updateForm('resultVisibility', event.target.value as CustomerAssessmentResultVisibility)}>
                    {resultVisibilityOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </Select>
                  <p className="text-xs leading-6 text-slate-400">
                    {resultVisibilityOptions.find((item) => item.value === form.resultVisibility)?.description}
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          {step === 4 ? (
            <div className="space-y-5">
              <div>
                <p className="text-sm font-medium text-slate-950">Generate participant link</p>
                <p className="mt-1 text-sm text-slate-500">Review the draft configuration. The participant link is created now, while external sharing remains a later activation step.</p>
              </div>

              <div className="grid gap-4 rounded-[28px] border border-slate-200 bg-slate-50/70 p-5 sm:grid-cols-2">
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Assessment</p>
                  <p className="mt-2 font-medium text-slate-950">{form.title || 'Untitled assessment'}</p>
                  <p className="mt-2 text-sm text-slate-500">{selectedType?.title}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Configuration</p>
                  <p className="mt-2 text-sm text-slate-600">Purpose: {formatTokenLabel(form.purpose)}</p>
                  <p className="mt-1 text-sm text-slate-600">Administration: {formatTokenLabel(form.administrationMode)}</p>
                  <p className="mt-1 text-sm text-slate-600">Visibility: {formatTokenLabel(form.resultVisibility)}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Organization</p>
                  <p className="mt-2 text-sm text-slate-600">{form.organizationName || 'Not set yet'}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Participant cap</p>
                  <p className="mt-2 text-sm text-slate-600">{form.participantLimit ?? 'Flexible'} participants</p>
                </div>
              </div>

              <Button size="lg" className="w-full" type="button" disabled={isSubmitting || !form.title.trim() || !form.organizationName.trim()} onClick={handleCreateAssessment}>
                {isSubmitting ? 'Generating draft...' : 'Generate participant link'}
              </Button>

              {errorMessage ? <p className="text-sm text-red-600">{errorMessage}</p> : null}
              {successMessage ? <p className="text-sm text-emerald-700">{successMessage}</p> : null}

              {createdAssessment ? (
                <div className="space-y-4 rounded-[28px] border border-emerald-100 bg-emerald-50/80 p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-600 text-white">
                      <Sparkles className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-950">Draft link is ready</p>
                      <p className="text-sm text-slate-600">Use the demo preview now, then activate sharing later.</p>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-emerald-100 bg-white p-4 text-sm text-slate-600">
                    <p className="font-medium text-slate-950">Participant link</p>
                    <p className="mt-2 break-all">{createdAssessment.participantLink}</p>
                    <p className="mt-2 text-xs text-slate-400">This link stays private during trial onboarding. Preview the demo flow before you share it broadly.</p>
                  </div>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Button type="button" variant="secondary" className="sm:flex-1" onClick={handleCopyLink}>
                      Copy link <Copy className="ml-2 h-4 w-4" />
                    </Button>
                    <Button type="button" variant="outline" className="sm:flex-1" asChild>
                      <a href={createdAssessment.previewDemoLink} target="_blank" rel="noreferrer">
                        Preview experience <ExternalLink className="ml-2 h-4 w-4" />
                      </a>
                    </Button>
                    <Button type="button" variant="outline" className="sm:flex-1" disabled>
                      Upgrade to share
                    </Button>
                  </div>
                  <div className="text-sm text-slate-500">
                    <Link to="/workspace" className="font-medium text-slate-950">Return to workspace</Link>
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="flex items-center justify-between gap-3 border-t border-slate-200 pt-4">
            <Button type="button" variant="secondary" onClick={previousStep} disabled={step === 1 || isSubmitting}>
              Back
            </Button>
            <div className="flex items-center gap-3">
              <span className="text-xs uppercase tracking-[0.16em] text-slate-400">{selectedType?.title}</span>
              {step < totalSteps ? (
                <Button type="button" onClick={nextStep} disabled={(step === 2 && (!form.title.trim() || !form.organizationName.trim())) || isSubmitting}>
                  Continue
                </Button>
              ) : null}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card className="bg-white/84">
          <CardHeader>
            <CardTitle>Traditional business flow</CardTitle>
            <CardDescription>Landing page onboarding for companies and researchers before public sharing is enabled.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              'Landing page',
              'Try demo / sign up',
              'Create first assessment',
              'Preview experience',
              'Upgrade to share',
            ].map((item, index) => (
              <div key={item} className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-sm text-slate-600">
                <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-slate-950 text-white">{index + 1}</div>
                <span>{item}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="bg-slate-950 text-white">
          <CardHeader>
            <CardTitle>Compliance-aware defaults</CardTitle>
            <CardDescription className="text-white/70">The onboarding draft already captures purpose, administration mode, consent framing, and result visibility intent.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-7 text-white/75">
            <p>Assessment purpose is required before the participant link is prepared.</p>
            <p>Visibility defaults distinguish indicative participant summaries from reviewer-first interpretation workflows.</p>
            <p>Research and custom questionnaires default to a more appropriate consent and privacy posture.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
