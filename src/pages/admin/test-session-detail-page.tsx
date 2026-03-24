import { Copy, ExternalLink, PencilLine } from 'lucide-react';
import { type FormEvent, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { StateCard } from '@/components/common/state-card';
import { SectionHeading } from '@/components/common/section-heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { fetchTestSessionDetail, updateAdminTestSession } from '@/services/admin-data';
import type { AdminTestSessionDetail, UpdateTestSessionPayload } from '@/types/assessment';
import { formatDateTime, formatStatusLabel, formatTestTypeLabel, formatTokenLabel } from '@/lib/formatters';

const textAreaClassName = 'min-h-[120px] w-full rounded-2xl border border-border bg-white/80 px-4 py-3 text-sm text-foreground shadow-sm outline-none transition placeholder:text-slate-400 focus:border-slate-300 focus:ring-2 focus:ring-slate-200';

function toDateTimeLocal(value: string | null) {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  const pad = (input: number) => String(input).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function toIsoString(value: string) {
  return value ? new Date(value).toISOString() : null;
}

export function TestSessionDetailPage() {
  const { id } = useParams();
  const sessionId = Number(id);
  const [session, setSession] = useState<AdminTestSessionDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    instructions: '',
    startsAt: '',
    endsAt: '',
    timeLimitMinutes: '',
    participantLimit: '',
    status: 'active',
    assessmentPurpose: 'recruitment',
    administrationMode: 'remote_unsupervised',
    interpretationMode: 'professional_review',
    contactPerson: '',
    consentStatement: '',
    privacyStatement: '',
    distributionPolicy: 'participant_summary',
    protectedDeliveryMode: false,
    participantResultAccess: 'summary',
    hrResultAccess: 'full',
  });

  async function loadSession() {
    setIsLoading(true);
    setError(null);

    try {
      const detail = await fetchTestSessionDetail(sessionId);
      setSession(detail);
      setForm({
        title: detail.title,
        description: detail.description ?? '',
        instructions: detail.instructions.join('\n'),
        startsAt: toDateTimeLocal(detail.startsAt),
        endsAt: toDateTimeLocal(detail.endsAt),
        timeLimitMinutes: detail.timeLimitMinutes ? String(detail.timeLimitMinutes) : '',
        participantLimit: detail.settings.participantLimit ? String(detail.settings.participantLimit) : '',
        status: detail.status,
        assessmentPurpose: detail.settings.assessmentPurpose,
        administrationMode: detail.settings.administrationMode,
        interpretationMode: detail.settings.interpretationMode,
        contactPerson: detail.settings.contactPerson,
        consentStatement: detail.settings.consentStatement,
        privacyStatement: detail.settings.privacyStatement,
        distributionPolicy: detail.settings.distributionPolicy ?? 'participant_summary',
        protectedDeliveryMode: detail.settings.protectedDeliveryMode ?? false,
        participantResultAccess: detail.settings.participantResultAccess ?? 'summary',
        hrResultAccess: detail.settings.hrResultAccess ?? 'full',
      });
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to load session detail');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (Number.isFinite(sessionId)) {
      void loadSession();
    }
  }, [sessionId]);

  async function handleCopyLink() {
    if (!session) {
      return;
    }

    const origin = typeof window === 'undefined' ? '' : window.location.origin;
    await navigator.clipboard.writeText(`${origin}/t/${session.accessToken}`);
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const payload: UpdateTestSessionPayload = {
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        instructions: form.instructions.trim() || undefined,
        startsAt: toIsoString(form.startsAt),
        endsAt: toIsoString(form.endsAt),
        timeLimitMinutes: form.timeLimitMinutes ? Number(form.timeLimitMinutes) : undefined,
        status: form.status as UpdateTestSessionPayload['status'],
        settings: {
          assessmentPurpose: form.assessmentPurpose as UpdateTestSessionPayload['settings']['assessmentPurpose'],
          administrationMode: form.administrationMode as UpdateTestSessionPayload['settings']['administrationMode'],
          interpretationMode: form.interpretationMode as UpdateTestSessionPayload['settings']['interpretationMode'],
          participantLimit: form.participantLimit ? Number(form.participantLimit) : null,
          contactPerson: form.contactPerson.trim(),
          consentStatement: form.consentStatement.trim(),
          privacyStatement: form.privacyStatement.trim(),
          distributionPolicy: form.distributionPolicy as UpdateTestSessionPayload['settings']['distributionPolicy'],
          protectedDeliveryMode: form.protectedDeliveryMode,
          participantResultAccess: form.participantResultAccess as UpdateTestSessionPayload['settings']['participantResultAccess'],
          hrResultAccess: form.hrResultAccess as UpdateTestSessionPayload['settings']['hrResultAccess'],
        },
      };

      const updated = await updateAdminTestSession(sessionId, payload);
      setSession(updated);
      setSuccessMessage('Session metadata updated.');
      setIsEditing(false);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to update session');
    } finally {
      setIsSaving(false);
    }
  }

  if (!Number.isFinite(sessionId)) {
    return <StateCard title="Invalid session" description="The requested session id is not valid." tone="danger" />;
  }

  if (isLoading && !session) {
    return <StateCard title="Loading session" description="Pulling participant progress and session metadata." />;
  }

  if (error && !session) {
    return <StateCard title="Session unavailable" description={error} tone="danger" actionLabel="Retry" onAction={() => void loadSession()} />;
  }

  if (!session) {
    return <StateCard title="Session not found" description="The requested session could not be found." tone="danger" />;
  }

  const publicUrl = typeof window === 'undefined' ? `/t/${session.accessToken}` : `${window.location.origin}/t/${session.accessToken}`;

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Session Detail"
        title={session.title}
        description={session.description ?? 'Review session progress, participants, and generated access details.'}
        actions={
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" className="gap-2" onClick={() => void handleCopyLink()}>
              <Copy className="h-4 w-4" /> Copy link
            </Button>
            <Button variant="secondary" className="gap-2" onClick={() => setIsEditing((current) => !current)}>
              <PencilLine className="h-4 w-4" /> {isEditing ? 'Close editor' : 'Edit metadata'}
            </Button>
            <Button variant="outline" className="gap-2" asChild>
              <a href={publicUrl} target="_blank" rel="noreferrer">
                <ExternalLink className="h-4 w-4" /> Open public flow
              </a>
            </Button>
          </div>
        }
      />

      {error ? <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">{error}</div> : null}
      {successMessage ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{successMessage}</div> : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="bg-white/80"><CardHeader><CardDescription>Status</CardDescription><CardTitle>{formatStatusLabel(session.status)}</CardTitle></CardHeader></Card>
        <Card className="bg-white/80"><CardHeader><CardDescription>Participants</CardDescription><CardTitle>{session.participantCount}</CardTitle></CardHeader></Card>
        <Card className="bg-white/80"><CardHeader><CardDescription>Completed</CardDescription><CardTitle>{session.completedCount}</CardTitle></CardHeader></Card>
        <Card className="bg-white/80"><CardHeader><CardDescription>Completion Rate</CardDescription><CardTitle>{session.completionRate}%</CardTitle></CardHeader></Card>
      </div>

      {isEditing ? (
        <Card className="bg-white/80">
          <CardHeader>
            <CardTitle>Edit session metadata</CardTitle>
            <CardDescription>Update instructions, consent language, interpretation mode, and scheduling without changing the public link.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSave}>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-600">Title</label>
                  <Input value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} required />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-600">Status</label>
                  <Select value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}>
                    <option value="draft">Draft</option>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="archived">Archived</option>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-600">Start time</label>
                  <Input type="datetime-local" value={form.startsAt} onChange={(event) => setForm((current) => ({ ...current, startsAt: event.target.value }))} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-600">End time</label>
                  <Input type="datetime-local" value={form.endsAt} onChange={(event) => setForm((current) => ({ ...current, endsAt: event.target.value }))} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-600">Time limit (minutes)</label>
                  <Input type="number" min={1} max={180} value={form.timeLimitMinutes} onChange={(event) => setForm((current) => ({ ...current, timeLimitMinutes: event.target.value }))} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-600">Participant limit</label>
                  <Input type="number" min={1} max={50000} value={form.participantLimit} onChange={(event) => setForm((current) => ({ ...current, participantLimit: event.target.value }))} placeholder="Optional" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-600">Contact person</label>
                  <Input value={form.contactPerson} onChange={(event) => setForm((current) => ({ ...current, contactPerson: event.target.value }))} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-600">Assessment purpose</label>
                  <Select value={form.assessmentPurpose} onChange={(event) => setForm((current) => ({ ...current, assessmentPurpose: event.target.value }))}>
                    <option value="recruitment">Recruitment</option>
                    <option value="employee_development">Employee development</option>
                    <option value="academic_evaluation">Academic evaluation</option>
                    <option value="research">Research</option>
                    <option value="self_assessment">Self assessment</option>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-600">Administration mode</label>
                  <Select value={form.administrationMode} onChange={(event) => setForm((current) => ({ ...current, administrationMode: event.target.value }))}>
                    <option value="remote_unsupervised">Remote unsupervised</option>
                    <option value="supervised">Supervised</option>
                  </Select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-slate-600">Interpretation mode</label>
                  <Select value={form.interpretationMode} onChange={(event) => setForm((current) => ({ ...current, interpretationMode: event.target.value }))}>
                    <option value="professional_review">Professional review</option>
                    <option value="self_assessment">Self assessment</option>
                  </Select>
                </div>
              </div>

              <div className="mt-2 rounded-2xl border border-indigo-100 bg-indigo-50/40 p-4">
                <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-500">Distribution &amp; Security</h4>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-600">Distribution policy</label>
                    <Select value={form.distributionPolicy} onChange={(event) => setForm((current) => ({ ...current, distributionPolicy: event.target.value }))}>
                      <option value="participant_summary">Participant summary</option>
                      <option value="hr_only">HR only</option>
                      <option value="full_report_with_consent">Full report with consent</option>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-600">Participant result access</label>
                    <Select value={form.participantResultAccess} onChange={(event) => setForm((current) => ({ ...current, participantResultAccess: event.target.value }))}>
                      <option value="none">No access</option>
                      <option value="summary">Summary only</option>
                      <option value="full_released">Full (after release)</option>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-600">HR result access</label>
                    <Select value={form.hrResultAccess} onChange={(event) => setForm((current) => ({ ...current, hrResultAccess: event.target.value }))}>
                      <option value="none">No access</option>
                      <option value="summary">Summary only</option>
                      <option value="full">Full access</option>
                    </Select>
                  </div>
                  <div className="flex items-center gap-3 self-end rounded-2xl border border-slate-200 bg-white px-4 py-3">
                    <input type="checkbox" id="protectedDelivery" checked={form.protectedDeliveryMode} onChange={(event) => setForm((current) => ({ ...current, protectedDeliveryMode: event.target.checked }))} className="h-4 w-4 rounded border-slate-300 text-indigo-600" />
                    <label htmlFor="protectedDelivery" className="text-sm text-slate-600">Protected delivery mode</label>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-600">Description</label>
                <textarea className={textAreaClassName} value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-600">Participant instructions</label>
                <textarea className={textAreaClassName} value={form.instructions} onChange={(event) => setForm((current) => ({ ...current, instructions: event.target.value }))} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-600">Consent statement</label>
                <textarea className={textAreaClassName} value={form.consentStatement} onChange={(event) => setForm((current) => ({ ...current, consentStatement: event.target.value }))} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-600">Privacy statement</label>
                <textarea className={textAreaClassName} value={form.privacyStatement} onChange={(event) => setForm((current) => ({ ...current, privacyStatement: event.target.value }))} />
              </div>
              <div className="flex justify-end">
                <Button type="submit" disabled={isSaving}>{isSaving ? 'Saving metadata...' : 'Save metadata'}</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <Card className="bg-white/80">
          <CardHeader>
            <CardTitle>Session metadata</CardTitle>
            <CardDescription>Distribution and sharing details for this assessment session.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-slate-500">
            <div className="grid gap-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-4"><p className="text-xs uppercase tracking-[0.18em] text-slate-400">Test Type</p><p className="mt-2 font-medium text-slate-950">{formatTestTypeLabel(session.testType)}</p></div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4"><p className="text-xs uppercase tracking-[0.18em] text-slate-400">Purpose</p><p className="mt-2 font-medium text-slate-950">{formatTokenLabel(session.settings.assessmentPurpose)}</p></div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4"><p className="text-xs uppercase tracking-[0.18em] text-slate-400">Administration</p><p className="mt-2 font-medium text-slate-950">{formatTokenLabel(session.settings.administrationMode)}</p></div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4"><p className="text-xs uppercase tracking-[0.18em] text-slate-400">Interpretation</p><p className="mt-2 font-medium text-slate-950">{formatTokenLabel(session.settings.interpretationMode)}</p></div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4"><p className="text-xs uppercase tracking-[0.18em] text-slate-400">Participant Limit</p><p className="mt-2 font-medium text-slate-950">{session.settings.participantLimit ?? 'Open'}</p></div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4"><p className="text-xs uppercase tracking-[0.18em] text-slate-400">Access Token</p><p className="mt-2 font-medium text-slate-950">{session.accessToken}</p></div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4"><p className="text-xs uppercase tracking-[0.18em] text-slate-400">Start Time</p><p className="mt-2 font-medium text-slate-950">{formatDateTime(session.startsAt)}</p></div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4"><p className="text-xs uppercase tracking-[0.18em] text-slate-400">Time Limit</p><p className="mt-2 font-medium text-slate-950">{session.timeLimitMinutes ? `${session.timeLimitMinutes} minutes` : 'Not set'}</p></div>
              <div className="rounded-2xl border border-indigo-100 bg-indigo-50/40 p-4"><p className="text-xs uppercase tracking-[0.18em] text-indigo-500">Distribution Policy</p><p className="mt-2 font-medium text-slate-950">{formatTokenLabel(session.settings.distributionPolicy ?? 'participant_summary')}</p></div>
              <div className="rounded-2xl border border-indigo-100 bg-indigo-50/40 p-4"><p className="text-xs uppercase tracking-[0.18em] text-indigo-500">Participant Access</p><p className="mt-2 font-medium text-slate-950">{formatTokenLabel(session.settings.participantResultAccess ?? 'summary')}</p></div>
              <div className="rounded-2xl border border-indigo-100 bg-indigo-50/40 p-4"><p className="text-xs uppercase tracking-[0.18em] text-indigo-500">HR Access</p><p className="mt-2 font-medium text-slate-950">{formatTokenLabel(session.settings.hrResultAccess ?? 'full')}</p></div>
              <div className="rounded-2xl border border-indigo-100 bg-indigo-50/40 p-4"><p className="text-xs uppercase tracking-[0.18em] text-indigo-500">Protected Delivery</p><p className="mt-2 font-medium text-slate-950">{session.settings.protectedDeliveryMode ? 'Enabled' : 'Disabled'}</p></div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="bg-white/80">
            <CardHeader>
              <CardTitle>Consent and privacy</CardTitle>
              <CardDescription>Participant-facing compliance statements for this session.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-slate-600">
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Consent Statement</p>
                <p className="mt-2">{session.settings.consentStatement}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Privacy Statement</p>
                <p className="mt-2">{session.settings.privacyStatement}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Contact Person</p>
                <p className="mt-2">{session.settings.contactPerson}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80">
            <CardHeader>
              <CardTitle>Instructions</CardTitle>
              <CardDescription>What participants see before they start this session.</CardDescription>
            </CardHeader>
            <CardContent>
              {session.instructions.length === 0 ? (
                <p className="text-sm text-slate-500">No instructions were saved for this session.</p>
              ) : (
                <div className="space-y-3">
                  {session.instructions.map((instruction) => (
                    <div key={instruction} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
                      {instruction}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="bg-white/80">
        <CardHeader>
          <CardTitle>Participant progress</CardTitle>
          <CardDescription>Submission attempts, current status, and linked result records.</CardDescription>
        </CardHeader>
        <CardContent>
          {session.participants.length === 0 ? (
            <StateCard title="No participants yet" description="Share the access link to start collecting participant submissions." />
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">Participant</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Attempt</th>
                    <th className="px-4 py-3 font-medium">Review</th>
                    <th className="px-4 py-3 font-medium">Result</th>
                    <th className="px-4 py-3 font-medium">Submitted</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {session.participants.map((participant) => (
                    <tr key={participant.submissionId}>
                      <td className="px-4 py-4">
                        <div>
                          <p className="font-medium text-slate-950">{participant.fullName}</p>
                          <p className="text-slate-500">{participant.positionTitle ?? participant.email}</p>
                        </div>
                      </td>
                      <td className="px-4 py-4"><Badge>{formatStatusLabel(participant.status)}</Badge></td>
                      <td className="px-4 py-4 text-slate-500">#{participant.attemptNo}</td>
                      <td className="px-4 py-4 text-slate-500">{participant.reviewStatus ? <Badge>{formatTokenLabel(participant.reviewStatus)}</Badge> : '-'}</td>
                      <td className="px-4 py-4 text-slate-500">
                        {participant.resultId ? <Link className="font-medium text-slate-950 underline-offset-4 hover:underline" to={`/admin/results/${participant.resultId}`}>{participant.profileCode ?? participant.scoreTotal ?? formatTokenLabel(participant.scoreBand)}</Link> : '-'}
                      </td>
                      <td className="px-4 py-4 text-slate-500">{formatDateTime(participant.submittedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
