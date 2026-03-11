import { type FormEvent, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { saveParticipantSession } from '@/lib/participant-session';
import { startPublicSubmission } from '@/services/public-sessions';
import type { ParticipantIdentityPayload } from '@/types/assessment';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

const initialForm: ParticipantIdentityPayload = {
  fullName: '',
  email: '',
  employeeCode: '',
  department: '',
  position: '',
};

export function ParticipantIdentityPage() {
  const { token = 'assessment-token' } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState<ParticipantIdentityPayload>(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateField<Key extends keyof ParticipantIdentityPayload>(key: Key, value: string) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const start = await startPublicSubmission(token, form);
      saveParticipantSession(token, start, form);
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
          Fill in your basic information before starting the assessment session.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-600">Full name</label>
              <Input
                required
                value={form.fullName}
                onChange={(event) => updateField('fullName', event.target.value)}
                placeholder="Full name"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-600">Email</label>
              <Input
                required
                type="email"
                value={form.email}
                onChange={(event) => updateField('email', event.target.value)}
                placeholder="name@company.com"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-600">Employee ID</label>
              <Input
                value={form.employeeCode ?? ''}
                onChange={(event) => updateField('employeeCode', event.target.value)}
                placeholder="Optional code"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-600">Department</label>
              <Input
                value={form.department ?? ''}
                onChange={(event) => updateField('department', event.target.value)}
                placeholder="Department"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-slate-600">Position</label>
              <Input
                value={form.position ?? ''}
                onChange={(event) => updateField('position', event.target.value)}
                placeholder="Current position"
              />
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

