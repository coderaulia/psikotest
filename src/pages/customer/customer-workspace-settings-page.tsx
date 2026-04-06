import { type FormEvent, useEffect, useState } from 'react';
import { Lock } from 'lucide-react';

import { useLanguage } from '@/lib/language';
import { getCustomerWorkspaceSettings, updateCustomerWorkspaceSettings } from '@/services/customer-workspace';
import type {
  AdministrationMode,
  AssessmentPurpose,
  CustomerAssessmentResultVisibility,
  UpdateCustomerWorkspaceSettingsPayload,
} from '@/types/assessment';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';

const purposeOptions: Array<{ value: AssessmentPurpose; label: { en: string; id: string } }> = [
  { value: 'recruitment', label: { en: 'Recruitment', id: 'Rekrutmen' } },
  { value: 'employee_development', label: { en: 'Employee development', id: 'Pengembangan karyawan' } },
  { value: 'academic_evaluation', label: { en: 'Academic evaluation', id: 'Evaluasi akademik' } },
  { value: 'research', label: { en: 'Research', id: 'Riset' } },
  { value: 'self_assessment', label: { en: 'Self assessment', id: 'Penilaian mandiri' } },
];

const administrationOptions: Array<{ value: AdministrationMode; label: { en: string; id: string } }> = [
  { value: 'remote_unsupervised', label: { en: 'Remote unsupervised', id: 'Remote tanpa pengawas' } },
  { value: 'supervised', label: { en: 'Supervised', id: 'Dengan pengawasan' } },
];

const visibilityOptions: Array<{ value: CustomerAssessmentResultVisibility; label: { en: string; id: string } }> = [
  { value: 'review_required', label: { en: 'Internal review first', id: 'Review internal terlebih dahulu' } },
  { value: 'participant_summary', label: { en: 'Participant summary', id: 'Ringkasan peserta' } },
];

const copy = {
  en: {
    title: 'Workspace settings',
    description: 'Manage organization defaults, participant-facing copy, and branding fields that will be used for future assessments.',
    loading: 'Loading workspace settings...',
    loadError: 'Unable to load workspace settings',
    saveError: 'Unable to save workspace settings',
    saveSuccess: 'Workspace settings updated.',
    upgradeNote: 'Upgrade to Growth to unlock this feature.',
    sections: {
      profile: 'Organization profile',
      profileDescription: 'These values shape the workspace identity and customer-facing branding.',
      defaults: 'Assessment defaults',
      defaultsDescription: 'Use these values as the default operational baseline for new assessments.',
      participantCopy: 'Participant communication defaults',
      participantCopyDescription: 'These templates are embedded into future assessment drafts.',
      participantExperience: 'Participant experience',
      participantExperienceDescription: 'Customize what participants see after submitting an assessment. Growth plan required for redirect.',
      notifications: 'Notification preferences',
      notificationsDescription: 'Control email alerts for workspace activity. Notifications are stored and will be wired to email delivery in a future release.',
    },
    fields: {
      organizationName: 'Organization name',
      brandName: 'Brand name',
      brandTagline: 'Brand tagline',
      supportEmail: 'Support email',
      contactPerson: 'Contact person',
      defaultAssessmentPurpose: 'Default assessment purpose',
      defaultAdministrationMode: 'Default administration mode',
      defaultResultVisibility: 'Default result visibility',
      defaultParticipantLimit: 'Default participant limit',
      defaultTimeLimitMinutes: 'Default time limit (minutes)',
      defaultConsentStatement: 'Default consent statement',
      defaultPrivacyStatement: 'Default privacy statement',
      completionPageMessage: 'Completion page message',
      postSubmitRedirectUrl: 'Post-submit redirect URL',
      notifyOnSubmission: 'Notify on participant submission',
      notifyOnReportReleased: 'Notify when report is released',
      notificationEmailAddress: 'Notification email address',
    },
    placeholders: {
      brandTagline: 'Calm, structured psychological assessments',
      contactPerson: 'Assessment coordinator',
      participantLimit: 'Leave empty for flexible',
      timeLimitMinutes: 'Leave empty for flexible',
      completionPageMessage: 'Thank you for completing the assessment.',
      redirectUrl: 'https://yoursite.com/thank-you',
    },
    actions: {
      saving: 'Saving settings...',
      save: 'Save workspace settings',
    },
  },
  id: {
    title: 'Pengaturan workspace',
    description: 'Kelola default organisasi, copy untuk peserta, dan field branding yang akan dipakai pada asesmen berikutnya.',
    loading: 'Memuat pengaturan workspace...',
    loadError: 'Tidak dapat memuat pengaturan workspace',
    saveError: 'Tidak dapat menyimpan pengaturan workspace',
    saveSuccess: 'Pengaturan workspace berhasil diperbarui.',
    upgradeNote: 'Upgrade ke paket Growth untuk membuka fitur ini.',
    sections: {
      profile: 'Profil organisasi',
      profileDescription: 'Nilai ini membentuk identitas workspace dan branding yang terlihat oleh pelanggan.',
      defaults: 'Default asesmen',
      defaultsDescription: 'Gunakan nilai ini sebagai baseline operasional untuk asesmen baru.',
      participantCopy: 'Default komunikasi peserta',
      participantCopyDescription: 'Template ini akan masuk ke draft asesmen baru.',
      participantExperience: 'Pengalaman peserta',
      participantExperienceDescription: 'Sesuaikan tampilan yang dilihat peserta setelah submit. Redirect membutuhkan paket Growth.',
      notifications: 'Preferensi notifikasi',
      notificationsDescription: 'Atur peringatan email untuk aktivitas workspace. Notifikasi akan dikirim via email pada rilis berikutnya.',
    },
    fields: {
      organizationName: 'Nama organisasi',
      brandName: 'Nama brand',
      brandTagline: 'Tagline brand',
      supportEmail: 'Email support',
      contactPerson: 'Kontak penanggung jawab',
      defaultAssessmentPurpose: 'Tujuan asesmen default',
      defaultAdministrationMode: 'Mode pelaksanaan default',
      defaultResultVisibility: 'Visibilitas hasil default',
      defaultParticipantLimit: 'Batas peserta default',
      defaultTimeLimitMinutes: 'Batas waktu default (menit)',
      defaultConsentStatement: 'Pernyataan persetujuan default',
      defaultPrivacyStatement: 'Pernyataan privasi default',
      completionPageMessage: 'Pesan halaman penyelesaian',
      postSubmitRedirectUrl: 'URL redirect pasca-submit',
      notifyOnSubmission: 'Notifikasi saat peserta submit',
      notifyOnReportReleased: 'Notifikasi saat laporan dirilis',
      notificationEmailAddress: 'Email notifikasi',
    },
    placeholders: {
      brandTagline: 'Asesmen psikologis yang tenang dan terstruktur',
      contactPerson: 'Koordinator asesmen',
      participantLimit: 'Kosongkan jika fleksibel',
      timeLimitMinutes: 'Kosongkan jika fleksibel',
      completionPageMessage: 'Terima kasih telah menyelesaikan asesmen.',
      redirectUrl: 'https://situs-anda.com/selesai',
    },
    actions: {
      saving: 'Menyimpan pengaturan...',
      save: 'Simpan pengaturan workspace',
    },
  },
} as const;

const textAreaClassName =
  'min-h-[140px] w-full rounded-[24px] border border-border bg-white/80 px-4 py-3 text-sm text-foreground shadow-sm outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-200';

const initialForm: UpdateCustomerWorkspaceSettingsPayload = {
  organizationName: '',
  brandName: '',
  brandTagline: '',
  supportEmail: '',
  contactPerson: '',
  defaultAssessmentPurpose: 'recruitment',
  defaultAdministrationMode: 'remote_unsupervised',
  defaultResultVisibility: 'review_required',
  defaultParticipantLimit: null,
  defaultTimeLimitMinutes: null,
  defaultConsentStatement: '',
  defaultPrivacyStatement: '',
  completionPageMessage: '',
  postSubmitRedirectUrl: '',
  notifyOnSubmission: false,
  notifyOnReportReleased: false,
  notificationEmailAddress: '',
};

function LockedOverlay({ message }: { message: string }) {
  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 rounded-[24px] bg-slate-50/90 backdrop-blur-[2px]">
      <Lock className="h-5 w-5 text-slate-400" />
      <span className="text-xs font-medium text-slate-500">{message}</span>
    </div>
  );
}

export function CustomerWorkspaceSettingsPage() {
  const { language } = useLanguage();
  const t = copy[language];
  const [form, setForm] = useState(initialForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [lockedSettings, setLockedSettings] = useState({
    completionPageMessage: false,
    postSubmitRedirectUrl: false,
  });

  useEffect(() => {
    let mounted = true;

    void getCustomerWorkspaceSettings()
      .then((payload) => {
        if (!mounted) return;
        setForm({
          organizationName: payload.account.organizationName,
          brandName: payload.settings.brandName,
          brandTagline: payload.settings.brandTagline,
          supportEmail: payload.settings.supportEmail,
          contactPerson: payload.settings.contactPerson,
          defaultAssessmentPurpose: payload.settings.defaultAssessmentPurpose,
          defaultAdministrationMode: payload.settings.defaultAdministrationMode,
          defaultResultVisibility: payload.settings.defaultResultVisibility,
          defaultParticipantLimit: payload.settings.defaultParticipantLimit,
          defaultTimeLimitMinutes: payload.settings.defaultTimeLimitMinutes,
          defaultConsentStatement: payload.settings.defaultConsentStatement,
          defaultPrivacyStatement: payload.settings.defaultPrivacyStatement,
          completionPageMessage: payload.settings.completionPageMessage ?? '',
          postSubmitRedirectUrl: payload.settings.postSubmitRedirectUrl ?? '',
          notifyOnSubmission: payload.settings.notifyOnSubmission ?? false,
          notifyOnReportReleased: payload.settings.notifyOnReportReleased ?? false,
          notificationEmailAddress: payload.settings.notificationEmailAddress ?? '',
        });
        if (payload.lockedSettings) {
          setLockedSettings(payload.lockedSettings);
        }
      })
      .catch((error: unknown) => {
        if (mounted) {
          setErrorMessage(error instanceof Error ? error.message : t.loadError);
        }
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [t.loadError]);

  function updateField<Key extends keyof UpdateCustomerWorkspaceSettingsPayload>(
    key: Key,
    value: UpdateCustomerWorkspaceSettingsPayload[Key],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const payload = await updateCustomerWorkspaceSettings(form);
      setForm({
        organizationName: payload.account.organizationName,
        brandName: payload.settings.brandName,
        brandTagline: payload.settings.brandTagline,
        supportEmail: payload.settings.supportEmail,
        contactPerson: payload.settings.contactPerson,
        defaultAssessmentPurpose: payload.settings.defaultAssessmentPurpose,
        defaultAdministrationMode: payload.settings.defaultAdministrationMode,
        defaultResultVisibility: payload.settings.defaultResultVisibility,
        defaultParticipantLimit: payload.settings.defaultParticipantLimit,
        defaultTimeLimitMinutes: payload.settings.defaultTimeLimitMinutes,
        defaultConsentStatement: payload.settings.defaultConsentStatement,
        defaultPrivacyStatement: payload.settings.defaultPrivacyStatement,
        completionPageMessage: payload.settings.completionPageMessage ?? '',
        postSubmitRedirectUrl: payload.settings.postSubmitRedirectUrl ?? '',
        notifyOnSubmission: payload.settings.notifyOnSubmission ?? false,
        notifyOnReportReleased: payload.settings.notifyOnReportReleased ?? false,
        notificationEmailAddress: payload.settings.notificationEmailAddress ?? '',
      });
      if (payload.lockedSettings) {
        setLockedSettings(payload.lockedSettings);
      }
      setSuccessMessage(t.saveSuccess);
    } catch (error: unknown) {
      setErrorMessage(error instanceof Error ? error.message : t.saveError);
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <Card className="bg-white/82">
        <CardContent className="p-8 text-sm text-slate-500">{t.loading}</CardContent>
      </Card>
    );
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-slate-950">{t.title}</h2>
        <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-500">{t.description}</p>
      </div>

      {errorMessage ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">{errorMessage}</div>
      ) : null}
      {successMessage ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{successMessage}</div>
      ) : null}

      {/* ── Organization profile ── */}
      <Card className="bg-white/84">
        <CardHeader>
          <CardTitle>{t.sections.profile}</CardTitle>
          <CardDescription>{t.sections.profileDescription}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-600">{t.fields.organizationName}</label>
            <Input value={form.organizationName} onChange={(e) => updateField('organizationName', e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-600">{t.fields.brandName}</label>
            <Input value={form.brandName} onChange={(e) => updateField('brandName', e.target.value)} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium text-slate-600">{t.fields.brandTagline}</label>
            <Input value={form.brandTagline} onChange={(e) => updateField('brandTagline', e.target.value)} placeholder={t.placeholders.brandTagline} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-600">{t.fields.supportEmail}</label>
            <Input type="email" value={form.supportEmail} onChange={(e) => updateField('supportEmail', e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-600">{t.fields.contactPerson}</label>
            <Input value={form.contactPerson} onChange={(e) => updateField('contactPerson', e.target.value)} placeholder={t.placeholders.contactPerson} />
          </div>
        </CardContent>
      </Card>

      {/* ── Assessment defaults ── */}
      <Card className="bg-white/84">
        <CardHeader>
          <CardTitle>{t.sections.defaults}</CardTitle>
          <CardDescription>{t.sections.defaultsDescription}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-600">{t.fields.defaultAssessmentPurpose}</label>
            <Select
              value={form.defaultAssessmentPurpose}
              onChange={(e) => updateField('defaultAssessmentPurpose', e.target.value as AssessmentPurpose)}
            >
              {purposeOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label[language]}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-600">{t.fields.defaultAdministrationMode}</label>
            <Select
              value={form.defaultAdministrationMode}
              onChange={(e) => updateField('defaultAdministrationMode', e.target.value as AdministrationMode)}
            >
              {administrationOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label[language]}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-600">{t.fields.defaultResultVisibility}</label>
            <Select
              value={form.defaultResultVisibility}
              onChange={(e) => updateField('defaultResultVisibility', e.target.value as CustomerAssessmentResultVisibility)}
            >
              {visibilityOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label[language]}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-600">{t.fields.defaultParticipantLimit}</label>
            <Input
              type="number"
              min={1}
              max={50000}
              value={form.defaultParticipantLimit ?? ''}
              onChange={(e) => updateField('defaultParticipantLimit', e.target.value ? Number(e.target.value) : null)}
              placeholder={t.placeholders.participantLimit}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium text-slate-600">{t.fields.defaultTimeLimitMinutes}</label>
            <Input
              type="number"
              min={1}
              max={180}
              value={form.defaultTimeLimitMinutes ?? ''}
              onChange={(e) => updateField('defaultTimeLimitMinutes', e.target.value ? Number(e.target.value) : null)}
              placeholder={t.placeholders.timeLimitMinutes}
            />
          </div>
        </CardContent>
      </Card>

      {/* ── Participant communication defaults ── */}
      <Card className="bg-white/84">
        <CardHeader>
          <CardTitle>{t.sections.participantCopy}</CardTitle>
          <CardDescription>{t.sections.participantCopyDescription}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-600">{t.fields.defaultConsentStatement}</label>
            <textarea
              className={textAreaClassName}
              value={form.defaultConsentStatement}
              onChange={(e) => updateField('defaultConsentStatement', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-600">{t.fields.defaultPrivacyStatement}</label>
            <textarea
              className={textAreaClassName}
              value={form.defaultPrivacyStatement}
              onChange={(e) => updateField('defaultPrivacyStatement', e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* ── Participant experience (plan-gated) ── */}
      <Card className="bg-white/84">
        <CardHeader>
          <CardTitle>{t.sections.participantExperience}</CardTitle>
          <CardDescription>{t.sections.participantExperienceDescription}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-600">{t.fields.completionPageMessage}</label>
            <textarea
              className={textAreaClassName}
              value={form.completionPageMessage}
              onChange={(e) => updateField('completionPageMessage', e.target.value)}
              placeholder={t.placeholders.completionPageMessage}
            />
          </div>
          <div className="relative space-y-2">
            {lockedSettings.postSubmitRedirectUrl && <LockedOverlay message={t.upgradeNote} />}
            <label className="text-sm font-medium text-slate-600">{t.fields.postSubmitRedirectUrl}</label>
            <Input
              type="url"
              disabled={lockedSettings.postSubmitRedirectUrl}
              value={form.postSubmitRedirectUrl}
              onChange={(e) => updateField('postSubmitRedirectUrl', e.target.value)}
              placeholder={t.placeholders.redirectUrl}
            />
          </div>
        </CardContent>
      </Card>

      {/* ── Notification preferences ── */}
      <Card className="bg-white/84">
        <CardHeader>
          <CardTitle>{t.sections.notifications}</CardTitle>
          <CardDescription>{t.sections.notificationsDescription}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 accent-slate-800"
              checked={form.notifyOnSubmission}
              onChange={(e) => updateField('notifyOnSubmission', e.target.checked)}
            />
            <span className="text-sm font-medium text-slate-700">{t.fields.notifyOnSubmission}</span>
          </label>
          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 accent-slate-800"
              checked={form.notifyOnReportReleased}
              onChange={(e) => updateField('notifyOnReportReleased', e.target.checked)}
            />
            <span className="text-sm font-medium text-slate-700">{t.fields.notifyOnReportReleased}</span>
          </label>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-600">{t.fields.notificationEmailAddress}</label>
            <Input
              type="email"
              value={form.notificationEmailAddress}
              onChange={(e) => updateField('notificationEmailAddress', e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" size="lg" disabled={isSaving}>
          {isSaving ? t.actions.saving : t.actions.save}
        </Button>
      </div>
    </form>
  );
}
