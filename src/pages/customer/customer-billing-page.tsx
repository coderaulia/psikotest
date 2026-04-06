import { useEffect, useMemo, useState } from 'react';
import { ArrowUpRight, BarChart3, CreditCard, ShieldCheck, Users, Download } from 'lucide-react';

import { cn } from '@/lib/cn';
import { formatDateTime, formatTokenLabel } from '@/lib/formatters';
import { getWorkspaceUsageSeverityClasses, getWorkspaceUsageSeverityLabel } from '@/lib/workspace-billing';
import { createCustomerManualPayment, getCustomerBillingOverview, submitCustomerManualPaymentProof } from '@/services/customer-billing';
import type {
  CustomerBillingOverviewResponse,
  ManualPaymentRecord,
  ManualPaymentStatus,
  WorkspaceBillingCycle,
  WorkspacePlanCode,
  WorkspaceUsageDiagnostic,
} from '@/types/assessment';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/lib/language';

const cycleLabels: Record<WorkspaceBillingCycle, string> = {
  monthly: 'Monthly',
  annual: 'Annual',
};

const dummyPrices: Record<WorkspacePlanCode, Record<WorkspaceBillingCycle, string>> = {
  starter: { monthly: '$0', annual: '$0' },
  growth: { monthly: '$29', annual: '$290' },
  research: { monthly: '$39', annual: '$390' },
};

const copy = {
  en: {
    loading: 'Loading billing overview...',
    title: 'Workspace plan and usage',
    subtitle: 'Control plan limits before you scale participant sharing',
    plan: 'Plan',
    activeAssessments: 'Active assessments',
    slotsRemaining: 'slots remaining',
    participants: 'Participants',
    recordsRemaining: 'records remaining',
    teamSeats: 'Team seats',
    seatsRemaining: 'seats remaining',
    changePlan: 'Change workspace plan',
    changePlanDesc: 'Use the dummy billing step to simulate trial upgrades, renewal cycles, and limit changes.',
    current: 'Current',
    recommended: 'Recommended',
    activeOrDraft: 'active or draft assessments',
    participantRecords: 'participant records',
    teamSeatsNum: 'team seats',
    selectedPlan: 'Selected plan:',
    saving: 'Processing checkout...',
    savePlan: 'Checkout & Save',
    usageGuardrails: 'Usage guardrails',
    usageGuardrailsDesc: 'Plan limits are now enforced during assessment creation, participant additions, and team growth.',
    timeline: 'Current subscription timeline',
    timelineDesc: 'Dummy billing now stores provider-ready period, checkout, and invoice history.',
    billingCycle: 'Billing cycle',
    currentPeriod: 'Current period',
    trialEnds: 'Trial ends',
    nextRenewal: 'Next renewal',
    billingContact: 'Billing contact',
    recentActivity: 'Recent billing activity',
    recentActivityDesc: 'Checkout attempts and invoices are now tracked for the workspace.',
    noInvoices: 'No invoices have been generated yet.',
    noCheckout: 'No checkout sessions recorded yet.',
    checkoutSessions: 'Checkout sessions',
    invoices: 'Invoices',
    date: 'Date',
    amount: 'Amount',
    status: 'Status',
    invoiceNumber: 'Invoice #',
    action: 'Action',
    download: 'Download',
    updateSuccess: 'Dummy subscription updated and invoice generated.',
    updateError: 'Unable to update workspace plan.',
  },
  id: {
    loading: 'Memuat ringkasan tagihan...',
    title: 'Paket dan penggunaan workspace',
    subtitle: 'Kontrol batas paket sebelum memperluas pembagian peserta',
    plan: 'Paket',
    activeAssessments: 'Asesmen aktif',
    slotsRemaining: 'slot tersisa',
    participants: 'Partisipan',
    recordsRemaining: 'data tersisa',
    teamSeats: 'Anggota tim',
    seatsRemaining: 'kursi tersisa',
    changePlan: 'Ubah paket workspace',
    changePlanDesc: 'Gunakan langkah penagihan dummy untuk menyimulasikan peningkatan percobaan, siklus perpanjangan, dan perubahan batas.',
    current: 'Saat ini',
    recommended: 'Rekomendasi',
    activeOrDraft: 'asesmen aktif atau draf',
    participantRecords: 'data partisipan',
    teamSeatsNum: 'kursi anggota tim',
    selectedPlan: 'Paket dipilih:',
    saving: 'Memproses pembayaran...',
    savePlan: 'Bayar & Simpan',
    usageGuardrails: 'Batas penggunaan',
    usageGuardrailsDesc: 'Batas paket sekarang ditegakkan selama pembuatan asesmen, penambahan peserta, dan penambahan tim.',
    timeline: 'Linimasa langganan saat ini',
    timelineDesc: 'Penagihan dummy sekarang menyimpan periode siap penyedia, checkout, dan riwayat faktur.',
    billingCycle: 'Siklus tagihan',
    currentPeriod: 'Periode saat ini',
    trialEnds: 'Masa percobaan berakhir',
    nextRenewal: 'Perpanjangan berikutnya',
    billingContact: 'Kontak tagihan',
    recentActivity: 'Aktivitas tagihan terbaru',
    recentActivityDesc: 'Upaya checkout dan faktur sekarang dilacak untuk workspace.',
    noInvoices: 'Belum ada faktur yang dibuat.',
    noCheckout: 'Belum ada sesi checkout yang tercatat.',
    checkoutSessions: 'Sesi checkout',
    invoices: 'Faktur',
    date: 'Tanggal',
    amount: 'Jumlah',
    status: 'Status',
    invoiceNumber: 'Nomor Faktur',
    action: 'Aksi',
    download: 'Unduh',
    updateSuccess: 'Langganan dummy diperbarui dan faktur dibuat.',
    updateError: 'Tidak dapat memperbarui paket workspace.',
  }
} as const;

function formatCurrency(amount: number, currencyCode = 'USD') {
  return new Intl.NumberFormat(currencyCode === 'IDR' ? 'id-ID' : 'en-US', {
    style: 'currency',
    currency: currencyCode,
    maximumFractionDigits: 0,
  }).format(amount);
}

function statusBadgeTone(status: ManualPaymentStatus) {
  if (status === 'paid') return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  if (status === 'rejected') return 'border-rose-200 bg-rose-50 text-rose-700';
  if (status === 'expired') return 'border-slate-200 bg-slate-100 text-slate-700';
  return 'border-amber-200 bg-amber-50 text-amber-700';
}

function renderDiagnosticCard(diagnostic: WorkspaceUsageDiagnostic, isId: boolean) {
  const tone = getWorkspaceUsageSeverityClasses(diagnostic.severity);
  const usedText = isId ? 'digunakan' : 'used';
  const remText = isId ? 'tersisa' : 'remaining';
  const sugText = isId ? 'Saran paket:' : 'Suggested plan:';

  return (
    <div key={diagnostic.resource} className="rounded-[26px] border border-slate-200 bg-slate-50/80 p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-950">{diagnostic.label}</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">
            {diagnostic.current} / {diagnostic.limit}
          </p>
        </div>
        <Badge className={tone.badge}>{getWorkspaceUsageSeverityLabel(diagnostic.severity)}</Badge>
      </div>
      <div className="mt-4 h-2 rounded-full bg-slate-200">
        <div className={cn('h-2 rounded-full transition-all', tone.progress)} style={{ width: `${Math.max(diagnostic.utilizationPercent, 6)}%` }} />
      </div>
      <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
        <span>{diagnostic.utilizationPercent}% {usedText}</span>
        <span>{diagnostic.remaining} {remText}</span>
      </div>
      <p className="mt-4 text-sm leading-6 text-slate-500">{diagnostic.message}</p>
      {diagnostic.suggestedPlanLabel ? (
        <p className="mt-2 text-xs font-medium text-slate-700">{sugText} {diagnostic.suggestedPlanLabel}</p>
      ) : null}
    </div>
  );
}

export function CustomerBillingPage() {
  const { language } = useLanguage();
  const t = copy[language];
  const isId = language === 'id';

  const [overview, setOverview] = useState<CustomerBillingOverviewResponse | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<WorkspacePlanCode>('starter');
  const [billingCycle, setBillingCycle] = useState<WorkspaceBillingCycle>('monthly');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [activePayment, setActivePayment] = useState<ManualPaymentRecord | null>(null);
  const [proofUrl, setProofUrl] = useState('');
  const [senderName, setSenderName] = useState('');
  const [senderBank, setSenderBank] = useState('');
  const [transferNote, setTransferNote] = useState('');
  const [isSubmittingProof, setIsSubmittingProof] = useState(false);

  useEffect(() => {
    let mounted = true;

    void getCustomerBillingOverview()
      .then((payload) => {
        if (!mounted) return;
        setOverview(payload);
        setSelectedPlan(payload.subscription.planCode);
        setBillingCycle(payload.subscription.billingCycle);
        setActivePayment((payload.recentManualPayments ?? [])[0] ?? null);
      })
      .catch((error) => {
        if (mounted) setErrorMessage(error instanceof Error ? error.message : t.updateError);
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [t.updateError]);

  const selectedPlanDefinition = useMemo(
    () => overview?.plans.find((p) => p.planCode === selectedPlan) ?? null,
    [overview, selectedPlan],
  );
  const recentInvoices = overview?.recentInvoices ?? [];

  async function handleSavePlan() {
    if (!overview) return;

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const payload = await createCustomerManualPayment({
        selectedPlan,
        billingCycle,
      });
      setActivePayment(payload.payment);
      const next = await getCustomerBillingOverview();
      setOverview(next);
      setSuccessMessage(payload.reused ? 'Active pending payment reused.' : 'Manual payment created. Complete transfer and submit proof.');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : t.updateError);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSubmitProof() {
    if (!activePayment) return;
    setIsSubmittingProof(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const payload = await submitCustomerManualPaymentProof(activePayment.id, {
        proofUrl: proofUrl.trim() || undefined,
        senderName: senderName.trim() || undefined,
        senderBank: senderBank.trim() || undefined,
        note: transferNote.trim() || undefined,
      });
      setActivePayment(payload.payment);
      setSuccessMessage('Payment proof submitted. Waiting for admin verification.');
      const next = await getCustomerBillingOverview();
      setOverview(next);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to submit proof.');
    } finally {
      setIsSubmittingProof(false);
    }
  }

  if (isLoading) {
    return (
      <Card className="bg-white/82">
        <CardContent className="p-8 text-sm text-slate-500">{t.loading}</CardContent>
      </Card>
    );
  }

  if (errorMessage && !overview) {
    return (
      <Card className="bg-white/82">
        <CardContent className="p-8 text-sm text-rose-600">{errorMessage}</CardContent>
      </Card>
    );
  }

  if (!overview) return null;

  const subscription = overview.subscription;
  const usage = overview.usage;
  const guidance = overview.upgradeGuidance;
  const guidanceTone = getWorkspaceUsageSeverityClasses(guidance.highestSeverity);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm text-slate-500">{t.title}</p>
          <h2 className="text-2xl font-semibold tracking-tight">{t.subtitle}</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge className="border-slate-200 bg-slate-100 text-slate-700">{subscription.planLabel}</Badge>
          <Badge className="border-sky-200 bg-sky-50 text-sky-700">{formatTokenLabel(subscription.status)}</Badge>
          <Badge className="border-amber-200 bg-amber-50 text-amber-700">{subscription.billingProvider === 'dummy' ? 'Dummy billing' : `${formatTokenLabel(subscription.billingProvider ?? 'dummy')} billing`}</Badge>
        </div>
      </div>

      {guidance.isUpgradeRecommended ? (
        <Card className={cn('border bg-white/88', guidanceTone.panel)}>
          <CardContent className="flex flex-col gap-4 p-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-3">
              <p className="text-sm font-medium">
                {guidance.suggestedPlanLabel
                  ? `${isId ? 'Peningkatan direkomendasikan:' : 'Upgrade recommended:'} ${guidance.suggestedPlanLabel}`
                  : (isId ? 'Paket saat ini butuh perhatian' : 'Current workspace plan needs attention')}
              </p>
              <div className="space-y-2 text-sm leading-6">
                {guidance.reasons.map((reason) => (
                  <p key={reason}>{reason}</p>
                ))}
              </div>
            </div>
            {guidance.suggestedPlanLabel ? (
              <div className="inline-flex items-center gap-2 rounded-full border border-current/15 bg-white/70 px-4 py-2 text-xs font-medium uppercase tracking-[0.16em]">
                {guidance.suggestedPlanLabel}
                <ArrowUpRight className="h-3.5 w-3.5" />
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-4">
        <Card className="bg-white/84">
          <CardHeader className="space-y-1">
            <CardDescription>{t.plan}</CardDescription>
            <CardTitle>{subscription.planLabel}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-500">{subscription.planDescription}</CardContent>
        </Card>
        <Card className="bg-white/84">
          <CardHeader className="space-y-1">
            <CardDescription>{t.activeAssessments}</CardDescription>
            <CardTitle>{usage.activeAssessmentCount} / {subscription.assessmentLimit}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-500">{usage.remainingAssessmentSlots} {t.slotsRemaining}</CardContent>
        </Card>
        <Card className="bg-white/84">
          <CardHeader className="space-y-1">
            <CardDescription>{t.participants}</CardDescription>
            <CardTitle>{usage.participantRecordCount} / {subscription.participantLimit}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-500">{usage.remainingParticipantSlots} {t.recordsRemaining}</CardContent>
        </Card>
        <Card className="bg-white/84">
          <CardHeader className="space-y-1">
            <CardDescription>{t.teamSeats}</CardDescription>
            <CardTitle>{usage.teamSeatCount} / {subscription.teamMemberLimit}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-500">{usage.remainingTeamSeats} {t.seatsRemaining}</CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {overview.diagnostics.map(d => renderDiagnosticCard(d, isId))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_0.92fr]">
        <div className="space-y-6">
          <Card className="bg-white/84">
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <CardTitle>{t.changePlan}</CardTitle>
                  <CardDescription>{t.changePlanDesc}</CardDescription>
                </div>
                <div className="inline-flex rounded-full border border-slate-200 bg-slate-100 p-1 text-sm">
                  {(['monthly', 'annual'] as WorkspaceBillingCycle[]).map((cycle) => (
                    <button
                      key={cycle}
                      type="button"
                      onClick={() => setBillingCycle(cycle)}
                      className={`rounded-full px-4 py-2 transition ${billingCycle === cycle ? 'bg-slate-950 text-white' : 'text-slate-500'}`}
                    >
                      {cycleLabels[cycle]}
                    </button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 lg:grid-cols-3">
                {overview.plans.map((plan) => {
                  const isSelected = selectedPlan === plan.planCode;
                  const isRecommended = overview.upgradeGuidance.suggestedPlanCode === plan.planCode;
                  const isCurrent = subscription.planCode === plan.planCode;

                  return (
                    <button
                      key={plan.planCode}
                      type="button"
                      onClick={() => setSelectedPlan(plan.planCode)}
                      className={`rounded-[26px] border p-5 text-left transition ${isSelected ? 'border-slate-950 bg-slate-950 text-white shadow-lg' : 'border-slate-200 bg-slate-50/80 hover:border-slate-300 hover:bg-white'}`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-medium">{plan.label}</p>
                        <div className="flex flex-wrap gap-2">
                          {isCurrent ? <Badge className="border-white/10 bg-white/10 text-white">{t.current}</Badge> : null}
                          {isRecommended ? <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700">{t.recommended}</Badge> : null}
                        </div>
                      </div>
                      <p className={`mt-3 text-3xl font-semibold ${isSelected ? 'text-white' : 'text-slate-950'}`}>
                        {plan[billingCycle === 'annual' ? 'annualPrice' : 'monthlyPrice'] != null ? formatCurrency(plan[billingCycle === 'annual' ? 'annualPrice' : 'monthlyPrice'] ?? 0) : dummyPrices[plan.planCode][billingCycle]}
                      </p>
                      <p className={`mt-3 text-sm leading-7 ${isSelected ? 'text-white/70' : 'text-slate-500'}`}>{plan.description}</p>
                      <div className={`mt-4 grid gap-2 text-sm ${isSelected ? 'text-white/85' : 'text-slate-600'}`}>
                        <span>{plan.assessmentLimit} {t.activeOrDraft}</span>
                        <span>{plan.participantLimit} {t.participantRecords}</span>
                        <span>{plan.teamMemberLimit} {t.teamSeatsNum}</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {errorMessage ? <p className="text-sm text-rose-600">{errorMessage}</p> : null}
              {successMessage ? <p className="text-sm text-emerald-700">{successMessage}</p> : null}

              <div className="flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm text-slate-500">
                  {t.selectedPlan} <span className="font-medium text-slate-950">{selectedPlanDefinition?.label ?? subscription.planLabel}</span>
                  {' '}
                  ({cycleLabels[billingCycle].toLowerCase()})
                </div>
                <Button type="button" size="lg" onClick={handleSavePlan} disabled={isSubmitting}>
                  {isSubmitting ? t.saving : 'Continue to Payment'}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/84">
            <CardHeader>
              <CardTitle>Manual payment instructions</CardTitle>
              <CardDescription>Transfer exact amount, then submit proof for admin verification.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {activePayment ? (
                <>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
                      <p className="text-slate-500">Plan</p>
                      <p className="mt-1 font-medium text-slate-900">{formatTokenLabel(activePayment.selectedPlan)} ({formatTokenLabel(activePayment.billingCycle)})</p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
                      <p className="text-slate-500">Status</p>
                      <Badge className={`mt-2 ${statusBadgeTone(activePayment.status)}`}>{formatTokenLabel(activePayment.status)}</Badge>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
                      <p className="text-slate-500">Exact transfer amount</p>
                      <p className="mt-1 font-semibold text-slate-900">{formatCurrency(activePayment.totalAmount, activePayment.currency)}</p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
                      <p className="text-slate-500">Payment reference</p>
                      <p className="mt-1 font-medium text-slate-900">{activePayment.paymentReference}</p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
                      <p className="text-slate-500">Bank</p>
                      <p className="mt-1 font-medium text-slate-900">{activePayment.bankName}</p>
                      <p className="mt-1 text-slate-700">{activePayment.bankAccountNumber}</p>
                      <p className="text-slate-700">{activePayment.bankAccountHolder}</p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
                      <p className="text-slate-500">Expires</p>
                      <p className="mt-1 font-medium text-slate-900">{activePayment.expiresAt ? formatDateTime(new Date(activePayment.expiresAt * 1000).toISOString()) : '-'}</p>
                    </div>
                  </div>

                  {activePayment.instructionsText ? (
                    <div className="rounded-xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-800">{activePayment.instructionsText}</div>
                  ) : null}

                  <div className="space-y-3 border-t border-slate-200 pt-4">
                    <p className="text-sm font-medium text-slate-900">Alternative payment channels</p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-slate-900">DOKU</p>
                          <Badge className="border-slate-200 bg-slate-100 text-slate-700">Coming Soon</Badge>
                        </div>
                        <p className="mt-2 text-xs text-slate-500">Gateway integration placeholder for future release.</p>
                        <Button className="mt-3 w-full" variant="outline" disabled>
                          Use DOKU (Coming Soon)
                        </Button>
                      </div>
                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-slate-900">Midtrans</p>
                          <Badge className="border-slate-200 bg-slate-100 text-slate-700">Coming Soon</Badge>
                        </div>
                        <p className="mt-2 text-xs text-slate-500">Gateway integration placeholder for future release.</p>
                        <Button className="mt-3 w-full" variant="outline" disabled>
                          Use Midtrans (Coming Soon)
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 border-t border-slate-200 pt-4">
                    <p className="text-sm font-medium text-slate-900">Submit payment proof</p>
                    <input
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                      placeholder="Proof URL (optional)"
                      value={proofUrl}
                      onChange={(event) => setProofUrl(event.target.value)}
                    />
                    <div className="grid gap-3 sm:grid-cols-2">
                      <input
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                        placeholder="Sender name"
                        value={senderName}
                        onChange={(event) => setSenderName(event.target.value)}
                      />
                      <input
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                        placeholder="Sender bank"
                        value={senderBank}
                        onChange={(event) => setSenderBank(event.target.value)}
                      />
                    </div>
                    <textarea
                      className="min-h-24 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                      placeholder="Transfer note"
                      value={transferNote}
                      onChange={(event) => setTransferNote(event.target.value)}
                    />
                    <Button onClick={handleSubmitProof} disabled={isSubmittingProof || activePayment.status !== 'pending'}>
                      {isSubmittingProof ? 'Submitting proof...' : 'Submit proof'}
                    </Button>
                    {activePayment.rejectionReason ? (
                      <p className="text-sm text-rose-700">Rejected: {activePayment.rejectionReason}</p>
                    ) : null}
                  </div>
                </>
              ) : (
                <p className="text-sm text-slate-500">No manual payment yet. Choose plan and click Continue to Payment.</p>
              )}
            </CardContent>
          </Card>

          <Card className="bg-white/84">
            <CardHeader>
              <CardTitle>{t.invoices}</CardTitle>
              <CardDescription>View all your past invoices below.</CardDescription>
            </CardHeader>
            <CardContent>
              {recentInvoices.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500">
                        <th className="pb-3 pr-4 font-medium">{t.invoiceNumber}</th>
                        <th className="pb-3 pr-4 font-medium">{t.date}</th>
                        <th className="pb-3 pr-4 font-medium">{t.amount}</th>
                        <th className="pb-3 pr-4 font-medium">{t.status}</th>
                        <th className="pb-3 font-medium text-right">{t.action}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {recentInvoices.map((inv) => (
                        <tr key={inv.id}>
                          <td className="py-3 pr-4 font-medium text-slate-950">{inv.invoiceNumber ?? `INV-${inv.id}`}</td>
                          <td className="py-3 pr-4 text-slate-500">
                            {inv.issuedAt ? formatDateTime(inv.issuedAt) : '-'}
                          </td>
                          <td className="py-3 pr-4 text-slate-950">
                            {formatCurrency(inv.amountTotal, inv.currencyCode)}
                          </td>
                          <td className="py-3 pr-4">
                            <Badge className="bg-slate-100 border-slate-200 text-slate-700">
                              {formatTokenLabel(inv.status)}
                            </Badge>
                          </td>
                          <td className="py-3 text-right">
                            <Button variant="outline" size="sm" className="gap-2">
                              <Download className="h-3.5 w-3.5" /> {t.download}
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-slate-500">{t.noInvoices}</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="bg-slate-950 text-white">
            <CardHeader>
              <CardTitle>{t.usageGuardrails}</CardTitle>
              <CardDescription className="text-white/70">{t.usageGuardrailsDesc}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm text-white/75">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="inline-flex items-center gap-2 font-medium text-white"><BarChart3 className="h-4 w-4" /> {isId ? 'Pembuatan Asesmen' : 'Assessment creation'}</p>
                <p className="mt-2">{isId ? 'Draf dan sesi aktif dihitung ke paket workspace.' : 'Drafts and active sessions both count against the workspace plan.'}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="inline-flex items-center gap-2 font-medium text-white"><Users className="h-4 w-4" /> {t.participantRecords}</p>
                <p className="mt-2">{isId ? 'Impor, entri manual, dan manajemen partisipan menggunakan volume paket.' : 'Imports, manual adds, and participant operations all consume workspace volume.'}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="inline-flex items-center gap-2 font-medium text-white"><ShieldCheck className="h-4 w-4" /> {t.teamSeats}</p>
                <p className="mt-2">{isId ? 'Pemilik dan anggota memakan kapasitas tempat terbatas.' : 'Owners and invited members consume workspace seat capacity.'}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/84">
            <CardHeader>
              <CardTitle>{t.timeline}</CardTitle>
              <CardDescription>{t.timelineDesc}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-slate-500">
              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                <p className="inline-flex items-center gap-2 font-medium text-slate-950"><CreditCard className="h-4 w-4" /> {t.billingCycle}</p>
                <p className="mt-2">{cycleLabels[subscription.billingCycle]}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                <p className="font-medium text-slate-950">{t.currentPeriod}</p>
                <p className="mt-2">
                  {subscription.currentPeriodStart && subscription.currentPeriodEnd
                    ? `${formatDateTime(subscription.currentPeriodStart)} to ${formatDateTime(subscription.currentPeriodEnd)}`
                    : '-'}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                <p className="font-medium text-slate-950">{t.trialEnds}</p>
                <p className="mt-2">{subscription.trialEndsAt ? formatDateTime(subscription.trialEndsAt) : 'Masa percobaan selesai'}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                <p className="font-medium text-slate-950">{t.nextRenewal}</p>
                <p className="mt-2">{subscription.renewsAt ? formatDateTime(subscription.renewsAt) : '-'}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 flex justify-between items-center">
                <div>
                  <p className="font-medium text-slate-950">{t.billingContact}</p>
                  <p className="mt-2">{subscription.billingContactEmail ?? overview.account.email}</p>
                </div>
                <Button variant="outline" size="sm">Edit</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
