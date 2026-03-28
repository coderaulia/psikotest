import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { formatTokenLabel } from '@/lib/formatters';
import { getCustomerAssessment, updateCustomerAssessment } from '@/services/customer-onboarding';
import type {
  AdministrationMode,
  AssessmentPurpose,
  CustomerAssessmentDetail,
  CustomerAssessmentResultVisibility,
  TestTypeCode,
  UpdateCustomerAssessmentPayload,
} from '@/types/assessment';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';

const assessmentTypeOptions: Array<{ value: TestTypeCode; label: string }> = [
  { value: 'iq', label: 'IQ Test' },
  { value: 'disc', label: 'DISC Personality' },
  { value: 'workload', label: 'Workload / Stress Test' },
  { value: 'custom', label: 'Custom Assessment' },
];

const purposeOptions: Array<{ value: AssessmentPurpose; label: string }> = [
  { value: 'recruitment', label: 'Recruitment' },
  { value: 'employee_development', label: 'Employee development' },
  { value: 'academic_evaluation', label: 'Academic evaluation' },
  { value: 'research', label: 'Research' },
  { value: 'self_assessment', label: 'Self assessment' },
];

const administrationOptions: Array<{ value: AdministrationMode; label: string }> = [
  { value: 'remote_unsupervised', label: 'Remote unsupervised' },
  { value: 'supervised', label: 'Supervised' },
];

const visibilityOptions: Array<{ value: CustomerAssessmentResultVisibility; label: string; description: string }> = [
  {
    value: 'review_required',
    label: 'Internal review first',
    description: 'Participants complete the assessment, but interpretation is held for reviewer follow-up.',
  },
  {
    value: 'participant_summary',
    label: 'Participant summary',
    description: 'Participants can see an indicative summary after completion.',
  },
];

const initialForm: UpdateCustomerAssessmentPayload = {
  testType: 'disc',
  title: '',
  purpose: 'recruitment',
  organizationName: '',
  administrationMode: 'remote_unsupervised',
  timeLimitMinutes: 15,
  participantLimit: 25,
  resultVisibility: 'review_required',
  protectedDeliveryMode: false,
};

export function CustomerAssessmentSetupPage() {
  const { assessmentId = '' } = useParams();
  const parsedAssessmentId = Number(assessmentId);
  const [detail, setDetail] = useState<CustomerAssessmentDetail | null>(null);
  const [form, setForm] = useState<UpdateCustomerAssessmentPayload>(initialForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
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
        setForm({
          testType: payload.testType,
          title: payload.title,
          purpose: payload.assessmentPurpose,
          organizationName: payload.organizationName,
          administrationMode: payload.administrationMode,
          timeLimitMinutes: payload.timeLimitMinutes,
          participantLimit: payload.participantLimit,
          resultVisibility: payload.resultVisibility,
          protectedDeliveryMode: payload.protectedDeliveryMode,
        });
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

  const isLocked = detail?.sessionStatus !== 'draft';
  const selectedVisibility = useMemo(
    () => visibilityOptions.find((option) => option.value === form.resultVisibility),
    [form.resultVisibility],
  );

  function updateField<Key extends keyof UpdateCustomerAssessmentPayload>(key: Key, value: UpdateCustomerAssessmentPayload[Key]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!detail || isLocked) {
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const nextDetail = await updateCustomerAssessment(detail.assessmentId, form);
      setDetail(nextDetail);
      setSuccessMessage('Assessment draft updated.');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to save assessment draft');
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <Card className="bg-white/82">
        <CardContent className="p-8 text-sm text-slate-500">Loading assessment setup...</CardContent>
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
    <div className="grid gap-6 xl:grid-cols-[1fr_0.82fr]">
      <form onSubmit={handleSubmit}>
        <Card className="bg-white/84">
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle>Assessment setup</CardTitle>
                <CardDescription>Edit the commercial and operational settings before checkout and participant sharing.</CardDescription>
              </div>
              <Badge className="border-slate-200 bg-slate-100 text-slate-700">{formatTokenLabel(detail.sessionStatus)}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {errorMessage ? <p className="text-sm text-rose-600">{errorMessage}</p> : null}
            {successMessage ? <p className="text-sm text-emerald-700">{successMessage}</p> : null}
            {isLocked ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                This assessment is no longer editable because participant sharing has already been activated.
              </div>
            ) : null}

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-600">Assessment type</label>
                <Select value={form.testType} onChange={(event) => updateField('testType', event.target.value as TestTypeCode)} disabled={isLocked}>
                  {assessmentTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-600">Assessment name</label>
                <Input value={form.title} onChange={(event) => updateField('title', event.target.value)} disabled={isLocked} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-600">Purpose</label>
                <Select value={form.purpose} onChange={(event) => updateField('purpose', event.target.value as AssessmentPurpose)} disabled={isLocked}>
                  {purposeOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-600">Organization name</label>
                <Input value={form.organizationName} onChange={(event) => updateField('organizationName', event.target.value)} disabled={isLocked} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-600">Administration mode</label>
                <Select value={form.administrationMode} onChange={(event) => updateField('administrationMode', event.target.value as AdministrationMode)} disabled={isLocked}>
                  {administrationOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-600">Result visibility</label>
                <Select value={form.resultVisibility} onChange={(event) => updateField('resultVisibility', event.target.value as CustomerAssessmentResultVisibility)} disabled={isLocked}>
                  {visibilityOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </Select>
                <p className="text-xs leading-6 text-slate-400">{selectedVisibility?.description}</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-600">Time limit (minutes)</label>
                <Input type="number" min="1" max="180" value={form.timeLimitMinutes ?? ''} onChange={(event) => updateField('timeLimitMinutes', event.target.value ? Number(event.target.value) : null)} disabled={isLocked} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-600">Participant limit</label>
                <Input type="number" min="1" max="50000" value={form.participantLimit ?? ''} onChange={(event) => updateField('participantLimit', event.target.value ? Number(event.target.value) : null)} disabled={isLocked} />
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
              <label className="flex items-start gap-3 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={form.protectedDeliveryMode}
                  onChange={(event) => updateField('protectedDeliveryMode', event.target.checked)}
                  disabled={isLocked}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-slate-950 focus:ring-slate-300"
                />
                <span>
                  <span className="block font-medium text-slate-950">Protected delivery mode</span>
                  <span className="mt-1 block leading-7 text-slate-500">
                    Deliver questions progressively and keep the participant flow tighter for higher-stakes assessments.
                  </span>
                </span>
              </label>
            </div>

            <div className="flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:justify-between">
              <div className="flex flex-col gap-2 text-sm text-slate-500">
                <Link to={`/workspace/assessments/${detail.assessmentId}`} className="font-medium text-slate-950">Back to assessment overview</Link>
                <Link to={`/workspace/assessments/${detail.assessmentId}/participants`} className="text-slate-500 hover:text-slate-950">Manage participants</Link>
              </div>
              <Button type="submit" size="lg" disabled={isSaving || isLocked}>
                {isSaving ? 'Saving setup...' : 'Save setup'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>

      <div className="space-y-6">
        <Card className="bg-white/84">
          <CardHeader>
            <CardTitle>Current release posture</CardTitle>
            <CardDescription>These values determine how the draft will behave after checkout and activation.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-slate-500">
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
              <p className="font-medium text-slate-950">Distribution policy</p>
              <p className="mt-2">{formatTokenLabel(detail.distributionPolicy)}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
              <p className="font-medium text-slate-950">Participant result access</p>
              <p className="mt-2">{formatTokenLabel(detail.participantResultAccess)}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
              <p className="font-medium text-slate-950">HR result access</p>
              <p className="mt-2">{formatTokenLabel(detail.hrResultAccess)}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-950 text-white">
          <CardHeader>
            <CardTitle>Next steps</CardTitle>
            <CardDescription className="text-white/70">Move from draft setup into dummy payment and participant operations.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-white/75">
            <Button variant="secondary" className="w-full justify-between" asChild>
              <Link to={`/workspace/assessments/${detail.assessmentId}/checkout`}>Continue to dummy checkout</Link>
            </Button>
            <Button variant="outline" className="w-full justify-between border-white/20 bg-white/10 text-white hover:bg-white/15 hover:text-white" asChild>
              <Link to={`/workspace/assessments/${detail.assessmentId}/participants`}>Prepare participant list</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
