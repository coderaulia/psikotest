import { type FormEvent, useEffect, useState } from 'react';

import { useLanguage } from '@/lib/language';
import { getCustomerWorkspaceSettings, updateCustomerWorkspaceSettings } from '@/services/customer-workspace';
import type { AdministrationMode, AssessmentPurpose, CustomerAssessmentResultVisibility, UpdateCustomerWorkspaceSettingsPayload } from '@/types/assessment';
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
    sections: {
      profile: 'Organization profile',
      profileDescription: 'These values shape the workspace identity and customer-facing branding.',
      defaults: 'Assessment defaults',
      defaultsDescription: 'Use these values as the default operational baseline for new assessments.',
      participantCopy: 'Participant communication defaults',
      participantCopyDescription: 'These templates are embedded into future assessment drafts. You can use tokens like {{organizationName}} and {{supportEmail}}.',
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
    },
    placeholders: {
      brandTagline: 'Calm, structured psychological assessments',
      contactPerson: 'Assessment coordinator',
      participantLimit: 'Leave empty for flexible',
      timeLimitMinutes: 'Leave empty for flexible',
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
    sections: {
      profile: 'Profil organisasi',
      profileDescription: 'Nilai ini membentuk identitas workspace dan branding yang terlihat oleh pelanggan.',
      defaults: 'Default asesmen',
      defaultsDescription: 'Gunakan nilai ini sebagai baseline operasional untuk asesmen baru.',
      participantCopy: 'Default komunikasi peserta',
      participantCopyDescription: 'Template ini akan masuk ke draft asesmen baru. Anda dapat memakai token seperti {{organizationName}} dan {{supportEmail}}.',
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
    },
    placeholders: {
      brandTagline: 'Asesmen psikologis yang tenang dan terstruktur',
      contactPerson: 'Koordinator asesmen',
      participantLimit: 'Kosongkan jika fleksibel',
      timeLimitMinutes: 'Kosongkan jika fleksibel',
    },
    actions: {
      saving: 'Menyimpan pengaturan...',
      save: 'Simpan pengaturan workspace',
    },
  },
} as const;

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
};

export function CustomerWorkspaceSettingsPage() {
  const { language } = useLanguage();
  const t = copy[language];
  const [form, setForm] = useState(initialForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    void getCustomerWorkspaceSettings()
      .then((payload) => {
        if (!mounted) {
          return;
        }

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
        });
      })
      .catch((error) => {
        if (mounted) {
          setErrorMessage(error instanceof Error ? error.message : t.loadError);
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
  }, [t.loadError]);

  function updateField<Key extends keyof UpdateCustomerWorkspaceSettingsPayload>(key: Key, value: UpdateCustomerWorkspaceSettingsPayload[Key]) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
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
      });
      setSuccessMessage(t.saveSuccess);
    } catch (error) {
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

      {errorMessage ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">{errorMessage}</div> : null}
      {successMessage ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{successMessage}</div> : null}

      <Card className="bg-white/84">
        <CardHeader>
          <CardTitle>{t.sections.profile}</CardTitle>
          <CardDescription>{t.sections.profileDescription}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-600">{t.fields.organizationName}</label>
            <Input value={form.organizationName} onChange={(event) => updateField('organizationName', event.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-600">{t.fields.brandName}</label>
            <Input value={form.brandName} onChange={(event) => updateField('brandName', event.target.value)} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium text-slate-600">{t.fields.brandTagline}</label>
            <Input value={form.brandTagline} onChange={(event) => updateField('brandTagline', event.target.value)} placeholder={t.placeholders.brandTagline} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-600">{t.fields.supportEmail}</label>
            <Input type="email" value={form.supportEmail} onChange={(event) => updateField('supportEmail', event.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-600">{t.fields.contactPerson}</label>
            <Input value={form.contactPerson} onChange={(event) => updateField('contactPerson', event.target.value)} placeholder={t.placeholders.contactPerson} />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white/84">
        <CardHeader>
          <CardTitle>{t.sections.defaults}</CardTitle>
          <CardDescription>{t.sections.defaultsDescription}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-600">{t.fields.defaultAssessmentPurpose}</label>
            <Select value={form.defaultAssessmentPurpose} onChange={(event) => updateField('defaultAssessmentPurpose', event.target.value as AssessmentPurpose)}>
              {purposeOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label[language]}</option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-600">{t.fields.defaultAdministrationMode}</label>
            <Select value={form.defaultAdministrationMode} onChange={(event) => updateField('defaultAdministrationMode', event.target.value as AdministrationMode)}>
              {administrationOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label[language]}</option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-600">{t.fields.defaultResultVisibility}</label>
            <Select value={form.defaultResultVisibility} onChange={(event) => updateField('defaultResultVisibility', event.target.value as CustomerAssessmentResultVisibility)}>
              {visibilityOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label[language]}</option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-600">{t.fields.defaultParticipantLimit}</label>
            <Input type="number" min={1} max={50000} value={form.defaultParticipantLimit ?? ''} onChange={(event) => updateField('defaultParticipantLimit', event.target.value ? Number(event.target.value) : null)} placeholder={t.placeholders.participantLimit} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium text-slate-600">{t.fields.defaultTimeLimitMinutes}</label>
            <Input type="number" min={1} max={180} value={form.defaultTimeLimitMinutes ?? ''} onChange={(event) => updateField('defaultTimeLimitMinutes', event.target.value ? Number(event.target.value) : null)} placeholder={t.placeholders.timeLimitMinutes} />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white/84">
        <CardHeader>
          <CardTitle>{t.sections.participantCopy}</CardTitle>
          <CardDescription>{t.sections.participantCopyDescription}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-600">{t.fields.defaultConsentStatement}</label>
            <textarea className="min-h-[140px] w-full rounded-[24px] border border-border bg-white/80 px-4 py-3 text-sm text-foreground shadow-sm outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-200" value={form.defaultConsentStatement} onChange={(event) => updateField('defaultConsentStatement', event.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-600">{t.fields.defaultPrivacyStatement}</label>
            <textarea className="min-h-[160px] w-full rounded-[24px] border border-border bg-white/80 px-4 py-3 text-sm text-foreground shadow-sm outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-200" value={form.defaultPrivacyStatement} onChange={(event) => updateField('defaultPrivacyStatement', event.target.value)} />
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
