import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { Mail, ShieldCheck, Users } from 'lucide-react';

import { createCustomerWorkspaceMember, getCustomerWorkspaceTeam, sendCustomerWorkspaceMemberInvite } from '@/services/customer-workspace';
import type { CreateCustomerWorkspaceMemberPayload, CustomerWorkspaceMemberItem, CustomerWorkspaceMemberRole, CustomerWorkspaceTeamResponse } from '@/types/assessment';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { formatDateTime, formatTokenLabel } from '@/lib/formatters';

const roleOptions: Array<{ value: Exclude<CustomerWorkspaceMemberRole, 'owner'>; label: string; description: string }> = [
  { value: 'admin', label: 'Workspace admin', description: 'Can manage assessment operations and workspace setup.' },
  { value: 'operator', label: 'Operator', description: 'Can coordinate participant operations and delivery workflows.' },
  { value: 'reviewer', label: 'Reviewer', description: 'Reserved for interpretation and professional review functions.' },
];

const initialForm: CreateCustomerWorkspaceMemberPayload = {
  fullName: '',
  email: '',
  role: 'operator',
};

export function CustomerTeamPage() {
  const [team, setTeam] = useState<CustomerWorkspaceTeamResponse | null>(null);
  const [form, setForm] = useState<CreateCustomerWorkspaceMemberPayload>(initialForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sendingId, setSendingId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  async function loadTeam() {
    const payload = await getCustomerWorkspaceTeam();
    setTeam(payload);
  }

  useEffect(() => {
    let mounted = true;

    void getCustomerWorkspaceTeam()
      .then((payload) => {
        if (mounted) {
          setTeam(payload);
        }
      })
      .catch((error) => {
        if (mounted) {
          setErrorMessage(error instanceof Error ? error.message : 'Unable to load workspace team');
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
  }, []);

  const summary = useMemo(() => {
    const items = team?.items ?? [];
    return {
      total: items.length,
      active: items.filter((item) => item.status === 'active').length,
      invited: items.filter((item) => item.status === 'invited').length,
      reviewers: items.filter((item) => item.role === 'reviewer').length,
    };
  }, [team]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await createCustomerWorkspaceMember(form);
      await loadTeam();
      setForm(initialForm);
      setSuccessMessage('Workspace team member added. Send the dummy invite when you are ready.');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to add workspace member');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSendInvite(member: CustomerWorkspaceMemberItem) {
    setSendingId(member.id);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const payload = await sendCustomerWorkspaceMemberInvite(member.id);
      await loadTeam();
      setSuccessMessage(payload.deliveryPreview);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to send team invite');
    } finally {
      setSendingId(null);
    }
  }

  if (isLoading) {
    return (
      <Card className="bg-white/82">
        <CardContent className="p-8 text-sm text-slate-500">Loading workspace team...</CardContent>
      </Card>
    );
  }

  if (errorMessage && !team) {
    return (
      <Card className="bg-white/82">
        <CardContent className="p-8 text-sm text-rose-600">{errorMessage}</CardContent>
      </Card>
    );
  }

  if (!team) {
    return null;
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
      <div className="space-y-6">
        <Card className="bg-white/84">
          <CardHeader>
            <CardTitle>Workspace team</CardTitle>
            <CardDescription>Invite teammates who will help operate assessments, participant delivery, and review workflows.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {errorMessage ? <p className="text-sm text-rose-600">{errorMessage}</p> : null}
            {successMessage ? <p className="text-sm text-emerald-700">{successMessage}</p> : null}

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="workspace-member-full-name" className="text-sm font-medium text-slate-600">Full name</label>
                  <Input id="workspace-member-full-name" value={form.fullName} onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value }))} />
                </div>
                <div className="space-y-2">
                  <label htmlFor="workspace-member-email" className="text-sm font-medium text-slate-600">Email</label>
                  <Input id="workspace-member-email" type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} />
                </div>
              </div>
              <div className="space-y-2">
                <label htmlFor="workspace-member-role" className="text-sm font-medium text-slate-600">Role</label>
                <Select id="workspace-member-role" value={form.role} onChange={(event) => setForm((current) => ({ ...current, role: event.target.value as Exclude<CustomerWorkspaceMemberRole, 'owner'> }))}>
                  {roleOptions.map((role) => (
                    <option key={role.value} value={role.value}>{role.label}</option>
                  ))}
                </Select>
                <p className="text-xs leading-6 text-slate-400">{roleOptions.find((role) => role.value === form.role)?.description}</p>
              </div>
              <Button type="submit" size="lg" disabled={isSubmitting || !form.fullName.trim() || !form.email.trim()}>
                {isSubmitting ? 'Adding teammate...' : 'Add teammate'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="bg-slate-950 text-white">
          <CardHeader>
            <CardTitle>How this helps the SaaS flow</CardTitle>
            <CardDescription className="text-white/70">The workspace is no longer modeled as a single user only.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-white/75">
            <p>Owners can now prepare a broader operational team before scaling assessments.</p>
            <p>Invites are still dummy-mode for MVP, but the model is ready for future access handoff.</p>
            <p>Roles start separating workspace administration, operations, and reviewer participation.</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <div className="grid gap-3 sm:grid-cols-4">
          {[
            { label: 'Total', value: summary.total },
            { label: 'Active', value: summary.active },
            { label: 'Invited', value: summary.invited },
            { label: 'Reviewers', value: summary.reviewers },
          ].map((card) => (
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
            <CardTitle>{team.workspace.organizationName}</CardTitle>
            <CardDescription>Owner: {team.workspace.ownerName} ({team.workspace.ownerEmail})</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {team.items.map((member) => (
              <div key={`${member.source}-${member.id}`} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-slate-950">{member.fullName}</p>
                      <Badge className="border-slate-200 bg-slate-100 text-slate-700">{formatTokenLabel(member.role)}</Badge>
                      <Badge className={member.status === 'active' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-700'}>
                        {formatTokenLabel(member.status)}
                      </Badge>
                    </div>
                    <p className="mt-2 text-sm text-slate-500">{member.email}</p>
                    <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-400">
                      <span>{member.source === 'owner' ? 'Workspace owner' : 'Invited teammate'}</span>
                      {member.invitedAt ? <span>Invited {formatDateTime(member.invitedAt)}</span> : null}
                      {member.lastNotifiedAt ? <span>Last notified {formatDateTime(member.lastNotifiedAt)}</span> : null}
                    </div>
                  </div>
                  {member.source === 'workspace_member' ? (
                    <Button type="button" size="sm" variant="secondary" disabled={sendingId === member.id} onClick={() => void handleSendInvite(member)}>
                      {sendingId === member.id ? 'Sending...' : 'Send dummy invite'} <Mail className="ml-2 h-4 w-4" />
                    </Button>
                  ) : (
                    <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs text-slate-500">
                      <ShieldCheck className="h-3.5 w-3.5" /> Owner access
                    </div>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
