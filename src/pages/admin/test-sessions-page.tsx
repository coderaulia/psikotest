import { Copy, Eye, Plus, Search } from 'lucide-react';
import { useDeferredValue, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { StateCard } from '@/components/common/state-card';
import { SectionHeading } from '@/components/common/section-heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { createAdminTestSession, fetchSettingsOverview, fetchTestSessions } from '@/services/admin-data';
import type { AdminTestSessionListItem, CreateTestSessionPayload, TestTypeCode } from '@/types/assessment';
import { formatDateTime, formatStatusLabel, formatTestTypeLabel, formatTokenLabel } from '@/lib/formatters';

const textAreaClassName = 'min-h-[120px] w-full rounded-2xl border border-border bg-white/80 px-4 py-3 text-sm text-foreground shadow-sm outline-none transition placeholder:text-slate-400 focus:border-slate-300 focus:ring-2 focus:ring-slate-200';

function toIsoString(value: string) {
  return value ? new Date(value).toISOString() : null;
}

export function TestSessionsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'active' | 'completed' | 'archived'>('all');
  const [testTypeFilter, setTestTypeFilter] = useState<'all' | TestTypeCode>('all');
  const [sessions, setSessions] = useState<AdminTestSessionListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [hasLoadedDefaults, setHasLoadedDefaults] = useState(false);
  const [form, setForm] = useState({
    title: '',
    testType: 'disc' as TestTypeCode,
    status: 'active' as 'draft' | 'active',
    timeLimitMinutes: '15',
    startsAt: '',
    description: '',
    instructions: '',
    assessmentPurpose: 'recruitment',
    administrationMode: 'remote_unsupervised',
    interpretationMode: 'professional_review',
    contactPerson: 'HR Assessment Desk',
    consentStatement:
      'I agree to participate in this psychological assessment and understand that my responses will be used for the stated assessment purpose.',
    privacyStatement:
      'Your personal information and responses will be treated as confidential assessment data and accessed only by authorized reviewers.',
  });

  async function loadSessions() {
    setIsLoading(true);
    setError(null);

    try {
      setSessions(
        await fetchTestSessions({
          search: deferredSearch.trim(),
          status: statusFilter,
          testType: testTypeFilter,
        }),
      );
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to load sessions');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadSessions();
  }, [deferredSearch, statusFilter, testTypeFilter]);

  useEffect(() => {
    if (hasLoadedDefaults) {
      return;
    }

    void fetchSettingsOverview()
      .then((overview) => {
        setForm((current) => ({
          ...current,
          timeLimitMinutes: String(overview.sessionDefaults.timeLimitMinutes),
          description: current.description || overview.sessionDefaults.descriptionTemplate,
          instructions: current.instructions || overview.sessionDefaults.instructions.join('\n'),
          assessmentPurpose: overview.sessionDefaults.settings.assessmentPurpose,
          administrationMode: overview.sessionDefaults.settings.administrationMode,
          interpretationMode: overview.sessionDefaults.settings.interpretationMode,
          contactPerson: overview.sessionDefaults.settings.contactPerson,
          consentStatement: overview.sessionDefaults.settings.consentStatement,
          privacyStatement: overview.sessionDefaults.settings.privacyStatement,
        }));
        setHasLoadedDefaults(true);
      })
      .catch(() => {
        setHasLoadedDefaults(true);
      });
  }, [hasLoadedDefaults]);

  function updateForm<Key extends keyof typeof form>(key: Key, value: (typeof form)[Key]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleCreateSession(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsCreating(true);
    setCreateError(null);

    const payload: CreateTestSessionPayload = {
      title: form.title.trim(),
      testType: form.testType,
      status: form.status,
      description: form.description.trim() || undefined,
      instructions: form.instructions.trim() || undefined,
      timeLimitMinutes: form.timeLimitMinutes ? Number(form.timeLimitMinutes) : undefined,
      startsAt: toIsoString(form.startsAt),
      settings: {
        assessmentPurpose: form.assessmentPurpose as CreateTestSessionPayload['settings']['assessmentPurpose'],
        administrationMode: form.administrationMode as CreateTestSessionPayload['settings']['administrationMode'],
        interpretationMode: form.interpretationMode as CreateTestSessionPayload['settings']['interpretationMode'],
        contactPerson: form.contactPerson.trim(),
        consentStatement: form.consentStatement.trim(),
        privacyStatement: form.privacyStatement.trim(),
      },
    };

    try {
      const session = await createAdminTestSession(payload);
      setShowCreateForm(false);
      await loadSessions();
      navigate(`/admin/test-sessions/${session.id}`);
    } catch (requestError) {
      setCreateError(requestError instanceof Error ? requestError.message : 'Unable to create session');
    } finally {
      setIsCreating(false);
    }
  }

  async function handleCopyLink(accessToken: string) {
    const origin = typeof window === 'undefined' ? '' : window.location.origin;
    const publicUrl = `${origin}/t/${accessToken}`;
    await navigator.clipboard.writeText(publicUrl);
  }

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Sessions"
        title="Test session management"
        description="Create compliant assessment sessions, share access links, and track completions by assessment type."
        actions={<Button className="gap-2" onClick={() => setShowCreateForm((current) => !current)}><Plus className="h-4 w-4" /> {showCreateForm ? 'Close form' : 'New session'}</Button>}
      />

      {showCreateForm ? (
        <Card className="bg-white/80">
          <CardHeader>
            <CardTitle>Create new session</CardTitle>
            <CardDescription>Define the purpose, administration mode, consent, and interpretation path before inviting participants.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleCreateSession}>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-600">Title</label>
                  <Input value={form.title} onChange={(event) => updateForm('title', event.target.value)} placeholder="Graduate Hiring Batch B" required />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-600">Test type</label>
                    <Select value={form.testType} onChange={(event) => updateForm('testType', event.target.value as TestTypeCode)}>
                      <option value="disc">DISC</option>
                      <option value="iq">IQ</option>
                      <option value="workload">Workload</option>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-600">Status</label>
                    <Select value={form.status} onChange={(event) => updateForm('status', event.target.value as 'draft' | 'active')}>
                      <option value="active">Active</option>
                      <option value="draft">Draft</option>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2 lg:col-span-2">
                  <label className="text-sm font-medium text-slate-600">Assessment purpose</label>
                  <Select value={form.assessmentPurpose} onChange={(event) => updateForm('assessmentPurpose', event.target.value)}>
                    <option value="recruitment">Recruitment</option>
                    <option value="employee_development">Employee development</option>
                    <option value="academic_evaluation">Academic evaluation</option>
                    <option value="research">Research</option>
                    <option value="self_assessment">Self assessment</option>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-600">Administration</label>
                  <Select value={form.administrationMode} onChange={(event) => updateForm('administrationMode', event.target.value)}>
                    <option value="supervised">Supervised</option>
                    <option value="remote_unsupervised">Remote unsupervised</option>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-600">Interpretation</label>
                  <Select value={form.interpretationMode} onChange={(event) => updateForm('interpretationMode', event.target.value)}>
                    <option value="professional_review">Professional review</option>
                    <option value="self_assessment">Self assessment</option>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-600">Start time</label>
                  <Input type="datetime-local" value={form.startsAt} onChange={(event) => updateForm('startsAt', event.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-600">Time limit (minutes)</label>
                  <Input type="number" min={1} max={180} value={form.timeLimitMinutes} onChange={(event) => updateForm('timeLimitMinutes', event.target.value)} />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-600">Contact person</label>
                <Input value={form.contactPerson} onChange={(event) => updateForm('contactPerson', event.target.value)} placeholder="Psychologist or HR contact" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-600">Description</label>
                <textarea className={textAreaClassName} value={form.description} onChange={(event) => updateForm('description', event.target.value)} placeholder="Optional context for HR or psychology reviewers." />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-600">Participant instructions</label>
                <textarea className={textAreaClassName} value={form.instructions} onChange={(event) => updateForm('instructions', event.target.value)} placeholder="Add participant instructions, one line per instruction." />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-600">Consent statement</label>
                <textarea className={textAreaClassName} value={form.consentStatement} onChange={(event) => updateForm('consentStatement', event.target.value)} />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-600">Privacy statement</label>
                <textarea className={textAreaClassName} value={form.privacyStatement} onChange={(event) => updateForm('privacyStatement', event.target.value)} />
              </div>

              {createError ? <p className="text-sm text-rose-600">{createError}</p> : null}

              <div className="flex justify-end gap-3">
                <Button type="button" variant="secondary" onClick={() => setShowCreateForm(false)}>Cancel</Button>
                <Button type="submit" disabled={isCreating}>{isCreating ? 'Creating...' : 'Create session'}</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : null}

      <Card className="bg-white/80">
        <CardContent className="space-y-5 p-5">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="relative w-full max-w-md">
              <Search className="pointer-events-none absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
              <Input className="pl-10" placeholder="Search session title" value={search} onChange={(event) => setSearch(event.target.value)} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:w-[360px]">
              <Select value={testTypeFilter} onChange={(event) => setTestTypeFilter(event.target.value as 'all' | TestTypeCode)}>
                <option value="all">All test types</option>
                <option value="disc">DISC</option>
                <option value="iq">IQ</option>
                <option value="workload">Workload</option>
              </Select>
              <Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}>
                <option value="all">All statuses</option>
                <option value="active">Active</option>
                <option value="draft">Draft</option>
                <option value="completed">Completed</option>
                <option value="archived">Archived</option>
              </Select>
            </div>
          </div>

          {isLoading ? (
            <StateCard title="Loading sessions" description="Pulling test session records from MySQL." />
          ) : error ? (
            <StateCard title="Sessions unavailable" description={error} tone="danger" actionLabel="Retry" onAction={() => void loadSessions()} />
          ) : sessions.length === 0 ? (
            <StateCard title="No sessions found" description="Create your first session to generate an access link and start collecting responses." />
          ) : (
            <div className="grid gap-4 xl:grid-cols-2">
              {sessions.map((session) => (
                <Card key={session.id} className="bg-white/80">
                  <CardContent className="space-y-5 p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-lg font-semibold text-slate-950">{session.title}</p>
                        <p className="mt-1 text-sm text-slate-500">{formatTestTypeLabel(session.testType)} • {formatStatusLabel(session.status)}</p>
                        <p className="mt-2 text-xs uppercase tracking-[0.18em] text-slate-400">{formatDateTime(session.startsAt)}</p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge>{formatStatusLabel(session.status)}</Badge>
                        <span className="text-xs uppercase tracking-[0.18em] text-slate-400">{session.accessToken}</span>
                      </div>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
                        <p className="font-medium text-slate-950">Purpose</p>
                        <p className="mt-1">{formatTokenLabel(session.settings.assessmentPurpose)}</p>
                      </div>
                      <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
                        <p className="font-medium text-slate-950">Interpretation</p>
                        <p className="mt-1">{formatTokenLabel(session.settings.interpretationMode)}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm text-slate-500">
                      <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                        <p className="font-medium text-slate-950">Participants</p>
                        <p className="mt-1">{session.participantCount}</p>
                      </div>
                      <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                        <p className="font-medium text-slate-950">Completed</p>
                        <p className="mt-1">{session.completedCount}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <Button variant="secondary" size="sm" className="gap-2" onClick={() => void handleCopyLink(session.accessToken)}>
                        <Copy className="h-4 w-4" /> Copy link
                      </Button>
                      <Button variant="outline" size="sm" className="gap-2" asChild>
                        <Link to={`/admin/test-sessions/${session.id}`}>
                          <Eye className="h-4 w-4" /> View session
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

