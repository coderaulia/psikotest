import { type FormEvent, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';

import { loadParticipantConsent, loadParticipantSession, saveParticipantSession } from '@/lib/participant-session';
import { startPublicSubmission, fetchPublicSession } from '@/services/public-sessions';
import type { ParticipantIdentityPayload } from '@/types/assessment';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';

const initialForm = {
  fullName: '',
  email: '',
  employeeCode: '',
  department: '',
  position: '',
  appliedPosition: '',
  age: '',
  educationLevel: '',
};

const educationLevelOptions = [
  'Primary school',
  'Junior high school',
  'Senior high school',
  'Diploma',
  'Bachelor',
  'Master',
  'Doctorate',
  'Other',
];

export function ParticipantIdentityPage() {
  const { token = 'assessment-token' } = useParams();
  const navigate = useNavigate();
  const existingSession = loadParticipantSession(token);
  const consentState = loadParticipantConsent(token);
  const consentAcceptedAt = consentState?.consentAcceptedAt ?? null;
  const [form, setForm] = useState(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (existingSession?.result) {
    return <Navigate to={`/t/${token}/completed`} replace />;
  }

  if (existingSession) {
    return <Navigate to={`/t/${token}/instructions`} replace />;
  }

  if (!consentAcceptedAt) {
    return <Navigate to={`/t/${token}`} replace />;
  }

  function updateField<Key extends keyof typeof initialForm>(key: Key, value: string) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!consentAcceptedAt) {
      setError('Consent confirmation is missing. Please review the consent step again.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const payload: ParticipantIdentityPayload = {
        fullName: form.fullName,
        email: form.email,
        employeeCode: form.employeeCode || undefined,
        department: form.department || undefined,
        position: form.position || undefined,
        appliedPosition: form.appliedPosition || undefined,
        age: form.age ? Number(form.age) : undefined,
        educationLevel: form.educationLevel || undefined,
        consentAccepted: true,
        consentAcceptedAt,
      };

      const start = await startPublicSubmission(token, payload);

      let complianceData: { participantResultAccess: 'none' | 'summary' | 'full_released' } | undefined;
      try {
        const sessionDef = await fetchPublicSession(token);
        complianceData = {
          participantResultAccess: sessionDef.session.compliance.participantResultAccess ?? 'summary',
        };
      } catch {
        // Best-effort; compliance defaults will be used on completed page
      }

      saveParticipantSession(token, start, payload, complianceData);
      navigate(`/t/${token}/instructions`);
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : 'Unable to start the session');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="mx-auto w-full max-w-3xl bg-white/82">
      <CardHeader>
        <CardTitle>Participant identity</CardTitle>
        <CardDescription>
          Fill in your identity and demographic information before starting the assessment session.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-600">Full name</label>
              <Input required value={form.fullName} onChange={(event) => updateField('fullName', event.target.value)} placeholder="Full name" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-600">Email</label>
              <Input required type="email" value={form.email} onChange={(event) => updateField('email', event.target.value)} placeholder="name@company.com" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-600">Employee ID</label>
              <Input value={form.employeeCode} onChange={(event) => updateField('employeeCode', event.target.value)} placeholder="Optional code" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-600">Age</label>
              <Input type="number" min={10} max={100} value={form.age} onChange={(event) => updateField('age', event.target.value)} placeholder="Age" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-600">Education level</label>
              <Select value={form.educationLevel} onChange={(event) => updateField('educationLevel', event.target.value)}>
                <option value="">Select education level</option>
                {educationLevelOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-600">Department</label>
              <Input value={form.department} onChange={(event) => updateField('department', event.target.value)} placeholder="Department" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-600">Current position</label>
              <Input value={form.position} onChange={(event) => updateField('position', event.target.value)} placeholder="Current position" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-600">Applied position</label>
              <Input value={form.appliedPosition} onChange={(event) => updateField('appliedPosition', event.target.value)} placeholder="Applied role, if relevant" />
            </div>
          </div>
          {error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
              {error}
            </div>
          ) : null}
          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Starting session...' : 'Continue'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
