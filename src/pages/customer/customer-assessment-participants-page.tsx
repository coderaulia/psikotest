import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { Copy, Mail, Plus, Send, Users } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';

import { formatDateTime, formatTokenLabel } from '@/lib/formatters';
import {
  createCustomerAssessmentParticipant,
  getCustomerAssessment,
  listCustomerAssessmentParticipants,
  sendCustomerAssessmentBulkInvites,
  sendCustomerAssessmentParticipantInvite,
} from '@/services/customer-onboarding';
import type {
  CreateCustomerAssessmentParticipantPayload,
  CustomerAssessmentDetail,
  CustomerAssessmentParticipantItem,
  CustomerAssessmentParticipantListResponse,
} from '@/types/assessment';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

const initialForm: CreateCustomerAssessmentParticipantPayload = {
  fullName: '',
  email: '',
  employeeCode: null,
  department: null,
  positionTitle: null,
  note: null,
};

export function CustomerAssessmentParticipantsPage() {
  const { assessmentId = '' } = useParams();
  const parsedAssessmentId = Number(assessmentId);
  const [detail, setDetail] = useState<CustomerAssessmentDetail | null>(null);
  const [participantData, setParticipantData] = useState<CustomerAssessmentParticipantListResponse | null>(null);
  const [form, setForm] = useState<CreateCustomerAssessmentParticipantPayload>(initialForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sendingId, setSendingId] = useState<number | null>(null);
  const [isSendingBulk, setIsSendingBulk] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  async function loadData() {
    const [detailPayload, participantsPayload] = await Promise.all([
      getCustomerAssessment(parsedAssessmentId),
      listCustomerAssessmentParticipants(parsedAssessmentId),
    ]);

    setDetail(detailPayload);
    setParticipantData(participantsPayload);
  }

  useEffect(() => {
    if (!Number.isFinite(parsedAssessmentId) || parsedAssessmentId <= 0) {
      setErrorMessage('Assessment draft not found');
      setIsLoading(false);
      return;
    }

    let mounted = true;

    void Promise.all([getCustomerAssessment(parsedAssessmentId), listCustomerAssessmentParticipants(parsedAssessmentId)])
      .then(([detailPayload, participantsPayload]) => {
        if (!mounted) {
          return;
        }

        setDetail(detailPayload);
        setParticipantData(participantsPayload);
      })
      .catch((error) => {
        if (mounted) {
          setErrorMessage(error instanceof Error ? error.message : 'Unable to load participant list');
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

  const summaryCards = useMemo(() => {
    if (!participantData) {
      return [];
    }

    return [
      { label: 'Total', value: participantData.summary.total },
      { label: 'Draft', value: participantData.summary.draft },
      { label: 'Invited', value: participantData.summary.invited },
      { label: 'In progress', value: participantData.summary.inProgress },
      { label: 'Completed', value: participantData.summary.completed },
    ];
  }, [participantData]);

  function updateField<Key extends keyof CreateCustomerAssessmentParticipantPayload>(
    key: Key,
    value: CreateCustomerAssessmentParticipantPayload[Key],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleAddParticipant(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!detail) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await createCustomerAssessmentParticipant(detail.assessmentId, form);
      await loadData();
      setForm(initialForm);
      setSuccessMessage('Participant added to the invite list.');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to add participant');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSendInvite(participant: CustomerAssessmentParticipantItem, channel: 'email' | 'link') {
    if (!detail) {
      return;
    }

    setSendingId(participant.id);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const payload = await sendCustomerAssessmentParticipantInvite(detail.assessmentId, participant.id, { channel });
      await loadData();
      setSuccessMessage(payload.deliveryPreview);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to send invite');
    } finally {
      setSendingId(null);
    }
  }

  async function handleSendBulkInvites(channel: 'email' | 'link') {
    if (!detail || !canInvite) {
      return;
    }

    setIsSendingBulk(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const payload = await sendCustomerAssessmentBulkInvites(detail.assessmentId, { channel });
      await loadData();
      setSuccessMessage(payload.deliveryPreview);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to send bulk invites');
    } finally {
      setIsSendingBulk(false);
    }
  }

  async function handleCopyShareLink() {
    if (!participantData?.shareLink || typeof navigator === 'undefined' || !navigator.clipboard) {
      return;
    }

    await navigator.clipboard.writeText(participantData.shareLink);
    setSuccessMessage('Assessment link copied to clipboard.');
  }

  if (isLoading) {
    return (
      <Card className="bg-white/82">
        <CardContent className="p-8 text-sm text-slate-500">Loading participant list...</CardContent>
      </Card>
    );
  }

  if (errorMessage && !detail) {
    return (
      <Card className="bg-white/82">
        <CardContent className="p-8 text-sm text-rose-600">{errorMessage}</CardContent>
      </Card>
    );
  }

  if (!detail || !participantData) {
    return null;
  }

  const canInvite = detail.sessionStatus === 'active';

  return (
    <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
      <div className="space-y-6">
        <Card className="bg-white/84">
          <CardHeader>
            <CardTitle>Participant invitations</CardTitle>
            <CardDescription>Add participants now, then send dummy email invites or share the live assessment link.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 text-sm text-slate-500">
              <p className="font-medium text-slate-950">Assessment link</p>
              <p className="mt-2 break-all">{participantData.shareLink}</p>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Button type="button" variant="secondary" onClick={handleCopyShareLink}>
                  Copy link <Copy className="ml-2 h-4 w-4" />
                </Button>
                <Button type="button" variant="secondary" disabled={!canInvite || isSendingBulk} onClick={() => void handleSendBulkInvites('email')}>
                  {isSendingBulk ? 'Sending...' : 'Send pending emails'} <Mail className="ml-2 h-4 w-4" />
                </Button>
                <Button type="button" variant="outline" disabled={!canInvite || isSendingBulk} onClick={() => void handleSendBulkInvites('link')}>
                  {isSendingBulk ? 'Preparing...' : 'Prepare share links'} <Send className="ml-2 h-4 w-4" />
                </Button>
                <Button type="button" variant="outline" asChild>
                  <a href={participantData.shareLink} target="_blank" rel="noreferrer">Open participant link</a>
                </Button>
              </div>
            </div>

            {detail.sessionStatus !== 'active' ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                Finish dummy checkout first to activate sharing before invites are sent externally.
              </div>
            ) : null}

            {errorMessage ? <p className="text-sm text-rose-600">{errorMessage}</p> : null}
            {successMessage ? <p className="text-sm text-emerald-700">{successMessage}</p> : null}

            <form className="space-y-4" onSubmit={handleAddParticipant}>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-600">Full name</label>
                  <Input value={form.fullName} onChange={(event) => updateField('fullName', event.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-600">Email</label>
                  <Input type="email" value={form.email} onChange={(event) => updateField('email', event.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-600">Employee code</label>
                  <Input value={form.employeeCode ?? ''} onChange={(event) => updateField('employeeCode', event.target.value || null)} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-600">Department</label>
                  <Input value={form.department ?? ''} onChange={(event) => updateField('department', event.target.value || null)} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-600">Position</label>
                  <Input value={form.positionTitle ?? ''} onChange={(event) => updateField('positionTitle', event.target.value || null)} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-600">Note</label>
                  <Input value={form.note ?? ''} onChange={(event) => updateField('note', event.target.value || null)} />
                </div>
              </div>
              <Button type="submit" size="lg" disabled={isSubmitting || !form.fullName.trim() || !form.email.trim()}>
                {isSubmitting ? 'Adding participant...' : 'Add participant'} <Plus className="ml-2 h-4 w-4" />
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="bg-slate-950 text-white">
          <CardHeader>
            <CardTitle>Flow checkpoint</CardTitle>
            <CardDescription className="text-white/70">This page completes the current MVP commercial onboarding path.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-white/75">
            <p>1. Setup assessment and visibility policy.</p>
            <p>2. Complete dummy payment to activate sharing.</p>
            <p>3. Add participants and send invite or copy the live link.</p>
            <div className="flex flex-col gap-3 pt-2">
              <Button variant="secondary" className="w-full justify-between" asChild>
                <Link to={`/workspace/assessments/${detail.assessmentId}`}>Back to assessment overview</Link>
              </Button>
              <Button variant="outline" className="w-full justify-between border-white/20 bg-white/10 text-white hover:bg-white/15 hover:text-white" asChild>
                <Link to={`/workspace/assessments/${detail.assessmentId}/setup`}>Edit assessment setup</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <div className="grid gap-3 sm:grid-cols-5">
          {summaryCards.map((card) => (
            <Card key={card.label} className="bg-white/84">
              <CardContent className="p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-400">{card.label}</p>
                <p className="mt-2 text-2xl font-semibold text-slate-950">{card.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="bg-white/84">
          <CardHeader>
            <CardTitle>Participant list</CardTitle>
            <CardDescription>Track invitation state, progress, and completion at the assessment level.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {participantData.items.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-6 text-sm text-slate-500">
                No participants added yet.
              </div>
            ) : (
              participantData.items.map((participant) => (
                <div key={participant.id} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-slate-950">{participant.fullName}</p>
                        <Badge className="border-slate-200 bg-slate-100 text-slate-700">{formatTokenLabel(participant.status)}</Badge>
                        {participant.submissionStatus ? <Badge className="border-sky-200 bg-sky-50 text-sky-700">{formatTokenLabel(participant.submissionStatus)}</Badge> : null}
                      </div>
                      <p className="mt-2 text-sm text-slate-500">{participant.email}</p>
                      <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-400">
                        {participant.employeeCode ? <span>ID: {participant.employeeCode}</span> : null}
                        {participant.department ? <span>{participant.department}</span> : null}
                        {participant.positionTitle ? <span>{participant.positionTitle}</span> : null}
                        {participant.invitedAt ? <span>Invited {formatDateTime(participant.invitedAt)}</span> : null}
                        {participant.lastSubmittedAt ? <span>Submitted {formatDateTime(participant.lastSubmittedAt)}</span> : null}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row lg:flex-col xl:flex-row">
                      <Button type="button" size="sm" variant="secondary" disabled={!canInvite || sendingId === participant.id} onClick={() => void handleSendInvite(participant, 'email')}>
                        {sendingId === participant.id ? 'Sending...' : 'Send dummy email'} <Mail className="ml-2 h-4 w-4" />
                      </Button>
                      <Button type="button" size="sm" variant="outline" disabled={!canInvite || sendingId === participant.id} onClick={() => void handleSendInvite(participant, 'link')}>
                        Share link <Send className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  {participant.note ? <p className="mt-3 text-sm text-slate-500">Note: {participant.note}</p> : null}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="bg-white/84">
          <CardHeader>
            <CardTitle>Assessment state</CardTitle>
            <CardDescription>Current operational state for participant delivery.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-4 text-sm text-slate-500">
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
              <p className="inline-flex items-center gap-2 font-medium text-slate-950"><Users className="h-4 w-4" /> Status</p>
              <p className="mt-2">{formatTokenLabel(detail.sessionStatus)}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
              <p className="font-medium text-slate-950">Distribution</p>
              <p className="mt-2">{formatTokenLabel(detail.distributionPolicy)}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
              <p className="font-medium text-slate-950">Participant access</p>
              <p className="mt-2">{formatTokenLabel(detail.participantResultAccess)}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
              <p className="font-medium text-slate-950">Delivery mode</p>
              <p className="mt-2">{detail.protectedDeliveryMode ? 'Protected progressive' : 'Full delivery'}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
