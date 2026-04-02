import { type FormEvent, useEffect, useState } from 'react';

import { SectionHeading } from '@/components/common/section-heading';
import { StateCard } from '@/components/common/state-card';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { fetchSettingsOverview, updateAdminProfile, updateSessionDefaults, updateAppSetting } from '@/services/admin-data';
import type { SettingsOverviewResponse } from '@/types/assessment';
import { updateStoredAdminProfile } from '@/lib/admin-session';
import { formatDateTime, formatTokenLabel } from '@/lib/formatters';

const textAreaClassName = 'min-h-[120px] w-full rounded-2xl border border-border bg-white/80 px-4 py-3 text-sm text-foreground shadow-sm outline-none transition placeholder:text-slate-400 focus:border-slate-300 focus:ring-2 focus:ring-slate-200';

function joinLines(lines: string[]) {
  return lines.join('\n');
}

function splitLines(value: string) {
  return value
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function SettingsPage() {
  const [data, setData] = useState<SettingsOverviewResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [profileForm, setProfileForm] = useState({ fullName: '', email: '' });
  const [defaultsForm, setDefaultsForm] = useState({
    timeLimitMinutes: '15',
    participantLimit: '',
    descriptionTemplate: '',
    instructions: '',
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

  const [platformForm, setPlatformForm] = useState({ platformDisplayName: '', supportEmail: '', publicContactUrl: '' });
  const [complianceForm, setComplianceForm] = useState({ 
    consentStatementTemplate: '', 
    privacyStatementTemplate: '', 
    reviewerAssignmentMode: 'auto_assign' as 'auto_assign' | 'manual_claim'
  });
  const [securityForm, setSecurityForm] = useState({ 
    submissionTokenExpiryHours: 4, 
    protectedDeliveryModeDefault: false, 
    answerSequenceStrictness: 'standard' as 'standard' | 'strict'
  });
  const [controlsForm, setControlsForm] = useState({ defaultPlanCode: 'starter', trialDurationDays: 14, requireManualActivation: false });

  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingDefaults, setIsSavingDefaults] = useState(false);
  const [isSavingPlatform, setIsSavingPlatform] = useState(false);
  const [isSavingCompliance, setIsSavingCompliance] = useState(false);
  const [isSavingSecurity, setIsSavingSecurity] = useState(false);
  const [isSavingControls, setIsSavingControls] = useState(false);
  
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  async function loadSettings() {
    setIsLoading(true);
    setError(null);

    try {
      const overview = await fetchSettingsOverview();
      setData(overview);
      setProfileForm({ fullName: overview.profile.fullName, email: overview.profile.email });
      setDefaultsForm({
        timeLimitMinutes: String(overview.sessionDefaults.timeLimitMinutes),
        participantLimit: overview.sessionDefaults.settings.participantLimit
          ? String(overview.sessionDefaults.settings.participantLimit)
          : '',
        descriptionTemplate: overview.sessionDefaults.descriptionTemplate,
        instructions: joinLines(overview.sessionDefaults.instructions),
        assessmentPurpose: overview.sessionDefaults.settings.assessmentPurpose,
        administrationMode: overview.sessionDefaults.settings.administrationMode,
        interpretationMode: overview.sessionDefaults.settings.interpretationMode,
        contactPerson: overview.sessionDefaults.settings.contactPerson,
        consentStatement: overview.sessionDefaults.settings.consentStatement,
        privacyStatement: overview.sessionDefaults.settings.privacyStatement,
        distributionPolicy: overview.sessionDefaults.settings.distributionPolicy ?? 'participant_summary',
        protectedDeliveryMode: overview.sessionDefaults.settings.protectedDeliveryMode ?? false,
        participantResultAccess: overview.sessionDefaults.settings.participantResultAccess ?? 'summary',
        hrResultAccess: overview.sessionDefaults.settings.hrResultAccess ?? 'full',
      });
      setPlatformForm(overview.platformIdentity);
      setComplianceForm(overview.complianceDefaults);
      setSecurityForm(overview.securityDefaults);
      setControlsForm(overview.customerControls);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to load settings');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadSettings();
  }, []);

  async function handleSaveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSavingProfile(true);
    setSuccessMessage(null);
    setError(null);

    try {
      const profile = await updateAdminProfile(profileForm);
      updateStoredAdminProfile({
        id: profile.id,
        fullName: profile.fullName,
        email: profile.email,
        role: profile.role,
      });
      setData((current) => (current ? { ...current, profile } : current));
      setSuccessMessage('Admin profile updated.');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to update profile');
    } finally {
      setIsSavingProfile(false);
    }
  }

  async function handleSaveDefaults(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSavingDefaults(true);
    setSuccessMessage(null);
    setError(null);

    try {
      const sessionDefaults = await updateSessionDefaults({
        timeLimitMinutes: Number(defaultsForm.timeLimitMinutes),
        descriptionTemplate: defaultsForm.descriptionTemplate,
        instructions: splitLines(defaultsForm.instructions),
        settings: {
          assessmentPurpose: defaultsForm.assessmentPurpose as SettingsOverviewResponse['sessionDefaults']['settings']['assessmentPurpose'],
          administrationMode: defaultsForm.administrationMode as SettingsOverviewResponse['sessionDefaults']['settings']['administrationMode'],
          interpretationMode: defaultsForm.interpretationMode as SettingsOverviewResponse['sessionDefaults']['settings']['interpretationMode'],
          participantLimit: defaultsForm.participantLimit ? Number(defaultsForm.participantLimit) : null,
          contactPerson: defaultsForm.contactPerson,
          consentStatement: defaultsForm.consentStatement,
          privacyStatement: defaultsForm.privacyStatement,
          distributionPolicy: defaultsForm.distributionPolicy as SettingsOverviewResponse['sessionDefaults']['settings']['distributionPolicy'],
          protectedDeliveryMode: defaultsForm.protectedDeliveryMode,
          participantResultAccess: defaultsForm.participantResultAccess as SettingsOverviewResponse['sessionDefaults']['settings']['participantResultAccess'],
          hrResultAccess: defaultsForm.hrResultAccess as SettingsOverviewResponse['sessionDefaults']['settings']['hrResultAccess'],
        },
      });

      setData((current) => (current ? { ...current, sessionDefaults } : current));
      setSuccessMessage('Session defaults updated.');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to update defaults');
    } finally {
      setIsSavingDefaults(false);
    }
  }

  async function handleSaveAppSetting(key: string, payload: any, setSaving: (val: boolean) => void) {
    setSaving(true);
    setSuccessMessage(null);
    setError(null);
    try {
      await updateAppSetting(key, payload);
      setSuccessMessage(`${formatTokenLabel(key)} updated.`);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : `Unable to update ${key}`);
    } finally {
      setSaving(false);
    }
  }

  if (isLoading && !data) {
    return <StateCard title="Loading settings" description="Preparing profile, session defaults, and audit activity." />;
  }

  if (error && !data) {
    return <StateCard title="Settings unavailable" description={error} tone="danger" actionLabel="Retry" onAction={() => void loadSettings()} />;
  }

  if (!data) {
    return <StateCard title="Settings unavailable" description="No settings data is available yet." />;
  }

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Settings"
        title="Operational settings"
        description="Maintain admin profile details, default session templates, and the most recent compliance audit trail."
      />

      {error ? <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">{error}</div> : null}
      {successMessage ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{successMessage}</div> : null}

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card className="bg-white/80">
          <CardHeader>
            <CardTitle>Admin profile</CardTitle>
            <CardDescription>Current signed-in administrator identity for this workspace.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Role</p>
                <p className="mt-2 font-medium text-slate-950">{formatTokenLabel(data.profile.role)}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Last Login</p>
                <p className="mt-2 font-medium text-slate-950">{formatDateTime(data.profile.lastLoginAt)}</p>
              </div>
            </div>

            <form className="space-y-4" onSubmit={handleSaveProfile}>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-600">Full name</label>
                <Input value={profileForm.fullName} onChange={(event) => setProfileForm((current) => ({ ...current, fullName: event.target.value }))} required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-600">Email</label>
                <Input type="email" value={profileForm.email} onChange={(event) => setProfileForm((current) => ({ ...current, email: event.target.value }))} required />
              </div>
              <Button type="submit" disabled={isSavingProfile}>{isSavingProfile ? 'Saving profile...' : 'Save profile'}</Button>
            </form>
          </CardContent>
        </Card>

        <Card className="bg-white/80">
          <CardHeader>
            <CardTitle>Platform identity</CardTitle>
            <CardDescription>Configure the global branding and support identity of the platform.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleSaveAppSetting('platform_identity', platformForm, setIsSavingPlatform); }}>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-600">Platform display name</label>
                <Input value={platformForm.platformDisplayName} onChange={(e) => setPlatformForm(c => ({...c, platformDisplayName: e.target.value}))} required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-600">Support email</label>
                <Input type="email" value={platformForm.supportEmail} onChange={(e) => setPlatformForm(c => ({...c, supportEmail: e.target.value}))} required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-600">Public contact URL</label>
                <Input value={platformForm.publicContactUrl} onChange={(e) => setPlatformForm(c => ({...c, publicContactUrl: e.target.value}))} required />
              </div>
              <Button type="submit" disabled={isSavingPlatform}>{isSavingPlatform ? 'Saving...' : 'Save platform identity'}</Button>
            </form>
          </CardContent>
        </Card>

        <Card className="bg-white/80">
          <CardHeader>
            <CardTitle>Compliance defaults</CardTitle>
            <CardDescription>Default statements used for participant agreements and reviews.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleSaveAppSetting('compliance_defaults', complianceForm, setIsSavingCompliance); }}>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-600">Consent template</label>
                <textarea className={textAreaClassName} value={complianceForm.consentStatementTemplate} onChange={(e) => setComplianceForm(c => ({...c, consentStatementTemplate: e.target.value}))} required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-600">Privacy template</label>
                <textarea className={textAreaClassName} value={complianceForm.privacyStatementTemplate} onChange={(e) => setComplianceForm(c => ({...c, privacyStatementTemplate: e.target.value}))} required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-600">Reviewer Assignment Mode</label>
                <Select value={complianceForm.reviewerAssignmentMode} onChange={(e) => setComplianceForm(c => ({...c, reviewerAssignmentMode: e.target.value as any}))}>
                  <option value="auto_assign">Auto Assign</option>
                  <option value="manual_claim">Manual Claim</option>
                </Select>
              </div>
              <Button type="submit" disabled={isSavingCompliance}>{isSavingCompliance ? 'Saving...' : 'Save compliance defaults'}</Button>
            </form>
          </CardContent>
        </Card>

        <Card className="bg-white/80">
          <CardHeader>
            <CardTitle>Session security defaults</CardTitle>
            <CardDescription>Hardening parameters for test sessions and participant flows.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleSaveAppSetting('security_defaults', securityForm, setIsSavingSecurity); }}>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-600">Submission token expiry (hours)</label>
                <Input type="number" min={1} max={72} value={securityForm.submissionTokenExpiryHours} onChange={(e) => setSecurityForm(c => ({...c, submissionTokenExpiryHours: Number(e.target.value)}))} required />
              </div>
              <div className="flex items-center gap-3 py-2">
                <input id="protected_delivery" type="checkbox" className="h-4 w-4 rounded border-slate-300 accent-slate-800" checked={securityForm.protectedDeliveryModeDefault} onChange={(e) => setSecurityForm(c => ({...c, protectedDeliveryModeDefault: e.target.checked}))} />
                <label htmlFor="protected_delivery" className="text-sm font-medium text-slate-600">Protected delivery mode default</label>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-600">Answer sequence strictness</label>
                <Select value={securityForm.answerSequenceStrictness} onChange={(e) => setSecurityForm(c => ({...c, answerSequenceStrictness: e.target.value as any}))}>
                  <option value="standard">Standard</option>
                  <option value="strict">Strict</option>
                </Select>
              </div>
              <Button type="submit" disabled={isSavingSecurity}>{isSavingSecurity ? 'Saving...' : 'Save security defaults'}</Button>
            </form>
          </CardContent>
        </Card>

        <Card className="bg-white/80">
          <CardHeader>
            <CardTitle>Customer account controls</CardTitle>
            <CardDescription>Configuration for new customer signups and initial workspace states.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleSaveAppSetting('customer_controls', controlsForm, setIsSavingControls); }}>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-600">Default plan code</label>
                <Input value={controlsForm.defaultPlanCode} onChange={(e) => setControlsForm(c => ({...c, defaultPlanCode: e.target.value}))} required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-600">Trial duration (days)</label>
                <Input type="number" min={1} max={365} value={controlsForm.trialDurationDays} onChange={(e) => setControlsForm(c => ({...c, trialDurationDays: Number(e.target.value)}))} required />
              </div>
              <div className="flex items-center gap-3 py-2">
                <input id="require_activation" type="checkbox" className="h-4 w-4 rounded border-slate-300 accent-slate-800" checked={controlsForm.requireManualActivation} onChange={(e) => setControlsForm(c => ({...c, requireManualActivation: e.target.checked}))} />
                <label htmlFor="require_activation" className="text-sm font-medium text-slate-600">Require manual account activation</label>
              </div>
              <Button type="submit" disabled={isSavingControls}>{isSavingControls ? 'Saving...' : 'Save customer controls'}</Button>
            </form>
          </CardContent>
        </Card>

        <Card className="bg-white/80">
          <CardHeader>
            <CardTitle>Default session template</CardTitle>
            <CardDescription>Applied as the starting point when creating a new assessment session.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSaveDefaults}>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-600">Default time limit (minutes)</label>
                  <Input type="number" min={1} max={180} value={defaultsForm.timeLimitMinutes} onChange={(event) => setDefaultsForm((current) => ({ ...current, timeLimitMinutes: event.target.value }))} required />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-600">Participant limit</label>
                  <Input type="number" min={1} max={50000} value={defaultsForm.participantLimit} onChange={(event) => setDefaultsForm((current) => ({ ...current, participantLimit: event.target.value }))} placeholder="Optional" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-600">Contact person</label>
                  <Input value={defaultsForm.contactPerson} onChange={(event) => setDefaultsForm((current) => ({ ...current, contactPerson: event.target.value }))} required />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-600">Assessment purpose</label>
                  <Select value={defaultsForm.assessmentPurpose} onChange={(event) => setDefaultsForm((current) => ({ ...current, assessmentPurpose: event.target.value as any }))}>
                    <option value="recruitment">Recruitment</option>
                    <option value="employee_development">Employee development</option>
                    <option value="academic_evaluation">Academic evaluation</option>
                    <option value="research">Research</option>
                    <option value="self_assessment">Self assessment</option>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-600">Administration mode</label>
                  <Select value={defaultsForm.administrationMode} onChange={(event) => setDefaultsForm((current) => ({ ...current, administrationMode: event.target.value as any }))}>
                    <option value="remote_unsupervised">Remote unsupervised</option>
                    <option value="supervised">Supervised</option>
                  </Select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-slate-600">Interpretation mode</label>
                  <Select value={defaultsForm.interpretationMode} onChange={(event) => setDefaultsForm((current) => ({ ...current, interpretationMode: event.target.value as any }))}>
                    <option value="professional_review">Professional review</option>
                    <option value="self_assessment">Self assessment</option>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-600">Description template</label>
                <textarea className={textAreaClassName} value={defaultsForm.descriptionTemplate} onChange={(event) => setDefaultsForm((current) => ({ ...current, descriptionTemplate: event.target.value }))} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-600">Default instructions</label>
                <textarea className={textAreaClassName} value={defaultsForm.instructions} onChange={(event) => setDefaultsForm((current) => ({ ...current, instructions: event.target.value }))} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-600">Consent statement</label>
                <textarea className={textAreaClassName} value={defaultsForm.consentStatement} onChange={(event) => setDefaultsForm((current) => ({ ...current, consentStatement: event.target.value }))} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-600">Privacy statement</label>
                <textarea className={textAreaClassName} value={defaultsForm.privacyStatement} onChange={(event) => setDefaultsForm((current) => ({ ...current, privacyStatement: event.target.value }))} />
              </div>
              <Button type="submit" disabled={isSavingDefaults}>{isSavingDefaults ? 'Saving defaults...' : 'Save session defaults'}</Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white/80">
        <CardHeader>
          <CardTitle>Recent audit activity</CardTitle>
          <CardDescription>Operational trace of session, submission, scoring, and review events.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.auditFeed.length === 0 ? (
            <p className="text-sm text-slate-500">No audit events have been recorded yet.</p>
          ) : (
            data.auditFeed.map((item) => (
              <div key={item.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-slate-950">{formatTokenLabel(item.action)}</p>
                    <p className="mt-1 text-sm text-slate-500">{item.actorName ?? formatTokenLabel(item.actorType)} • {formatTokenLabel(item.entityType)} {item.entityId ? `#${item.entityId}` : ''}</p>
                  </div>
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{formatDateTime(item.createdAt)}</p>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
