import { Building2, Search, ShieldOff, ShieldCheck, Download, Filter, X } from 'lucide-react';
import { useDeferredValue, useEffect, useState } from 'react';

import { StateCard } from '@/components/common/state-card';
import { SectionHeading } from '@/components/common/section-heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { loadAdminSession } from '@/lib/admin-session';
import { formatDateTime, formatTokenLabel } from '@/lib/formatters';
import {
  fetchCustomers,
  updateCustomerStatus,
  fetchCustomerBilling,
  updateCustomerBilling,
  fetchAdminManualPayments,
  approveAdminManualPayment,
  rejectAdminManualPayment,
  type AdminCustomerBillingResponse,
} from '@/services/admin-data';
import type { CustomerAccountStatus, CustomerListItem, ManualPaymentRecord } from '@/types/assessment';

export function CustomersPage() {
  const adminSession = loadAdminSession();
  const isSuperAdmin = adminSession?.admin.role === 'super_admin';

  const [customers, setCustomers] = useState<CustomerListItem[]>([]);
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);
  const [statusFilter, setStatusFilter] = useState<'all' | CustomerAccountStatus>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'business' | 'researcher'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [pendingPayments, setPendingPayments] = useState<ManualPaymentRecord[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [paymentActionId, setPaymentActionId] = useState<number | null>(null);
  const [paymentActionError, setPaymentActionError] = useState<string | null>(null);
  const [rejectReasonById, setRejectReasonById] = useState<Record<number, string>>({});

  const [activeCustomer, setActiveCustomer] = useState<{ customer: CustomerListItem; mode: 'view' | 'manage' } | null>(null);
  const [billingData, setBillingData] = useState<AdminCustomerBillingResponse | null>(null);
  const [isBillingLoading, setIsBillingLoading] = useState(false);
  const [billingError, setBillingError] = useState<string | null>(null);

  const [manageForm, setManageForm] = useState<{
    planCode: string;
    status: string;
    billingCycle: string;
    trialEndsAt: string;
    cancelAtPeriodEnd: boolean;
  } | null>(null);
  const [isSavingSub, setIsSavingSub] = useState(false);

  async function handleOpenWorkspace(customer: CustomerListItem, mode: 'view' | 'manage') {
    setActiveCustomer({ customer, mode });
    setIsBillingLoading(true);
    setBillingError(null);
    try {
      const data = await fetchCustomerBilling(customer.id);
      setBillingData(data);
    } catch (err) {
      setBillingError(err instanceof Error ? err.message : 'Unable to load workspace data');
    } finally {
      setIsBillingLoading(false);
    }
  }

  useEffect(() => {
    if (billingData && activeCustomer?.mode === 'manage') {
      const tEnd = billingData.subscription.trialEndsAt 
        ? new Date(billingData.subscription.trialEndsAt).toISOString().slice(0, 16) 
        : '';
      setManageForm({
        planCode: billingData.subscription.planCode,
        status: billingData.subscription.status,
        billingCycle: billingData.subscription.billingCycle,
        trialEndsAt: tEnd,
        cancelAtPeriodEnd: billingData.subscription.cancelAtPeriodEnd,
      });
    }
  }, [billingData, activeCustomer]);

  async function handleSaveSubscription() {
    if (!activeCustomer || !manageForm) return;
    setIsSavingSub(true);
    try {
      await updateCustomerBilling(activeCustomer.customer.id, {
        planCode: manageForm.planCode,
        status: manageForm.status,
        billingCycle: manageForm.billingCycle,
        trialEndsAt: manageForm.trialEndsAt ? new Date(manageForm.trialEndsAt).toISOString() : null,
        cancelAtPeriodEnd: manageForm.cancelAtPeriodEnd,
      });
      await handleOpenWorkspace(activeCustomer.customer, 'manage');
    } catch(err) {
      alert(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setIsSavingSub(false);
    }
  }

  async function loadCustomers() {
    setIsLoading(true);
    setError(null);
    try {
      const items = await fetchCustomers({
        search: deferredSearch.trim() || undefined,
        status: statusFilter,
        accountType: typeFilter,
      });
      setCustomers(items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load customers');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (isSuperAdmin) {
      void loadCustomers();
      void loadPendingPayments();
    }
  }, [deferredSearch, statusFilter, typeFilter]);

  async function loadPendingPayments() {
    setPaymentsLoading(true);
    setPaymentActionError(null);
    try {
      const payload = await fetchAdminManualPayments('pending');
      setPendingPayments(payload.payments ?? []);
    } catch (err) {
      setPaymentActionError(err instanceof Error ? err.message : 'Unable to load pending payments');
    } finally {
      setPaymentsLoading(false);
    }
  }

  async function handleApprovePayment(paymentId: number) {
    setPaymentActionId(paymentId);
    setPaymentActionError(null);
    try {
      await approveAdminManualPayment(paymentId);
      await loadPendingPayments();
      if (activeCustomer?.customer) {
        await handleOpenWorkspace(activeCustomer.customer, activeCustomer.mode);
      }
    } catch (err) {
      setPaymentActionError(err instanceof Error ? err.message : 'Unable to approve payment');
    } finally {
      setPaymentActionId(null);
    }
  }

  async function handleRejectPayment(paymentId: number) {
    const reason = (rejectReasonById[paymentId] ?? '').trim();
    if (reason.length < 3) {
      setPaymentActionError('Rejection reason must be at least 3 characters');
      return;
    }

    setPaymentActionId(paymentId);
    setPaymentActionError(null);
    try {
      await rejectAdminManualPayment(paymentId, reason);
      setRejectReasonById((prev) => ({ ...prev, [paymentId]: '' }));
      await loadPendingPayments();
      if (activeCustomer?.customer) {
        await handleOpenWorkspace(activeCustomer.customer, activeCustomer.mode);
      }
    } catch (err) {
      setPaymentActionError(err instanceof Error ? err.message : 'Unable to reject payment');
    } finally {
      setPaymentActionId(null);
    }
  }

  async function handleToggleStatus(customer: CustomerListItem) {
    const next: CustomerAccountStatus = customer.status === 'active' ? 'inactive' : 'active';
    setTogglingId(customer.id);
    setActionError(null);
    try {
      await updateCustomerStatus(customer.id, next);
      setCustomers((prev) =>
        prev.map((c) => (c.id === customer.id ? { ...c, status: next } : c)),
      );
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Unable to update status');
    } finally {
      setTogglingId(null);
    }
  }

  async function handleExportCsv() {
    if (customers.length === 0) return;
    setIsExporting(true);
    
    try {
      const headers = ['Full Name', 'Email', 'Organization Name', 'Account Type', 'Assessment Count', 'Last Login', 'Created At', 'Status'];
      const rows = customers.map(c => [
        `"${(c.fullName || '').replace(/"/g, '""')}"`,
        `"${(c.email || '').replace(/"/g, '""')}"`,
        `"${(c.organizationName || '').replace(/"/g, '""')}"`,
        c.accountType,
        c.assessmentCount,
        formatDateTime(c.lastLoginAt) || '',
        formatDateTime(c.createdAt) || '',
        c.status,
      ]);
      
      const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `customers_export_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } finally {
      setIsExporting(false);
    }
  }

  if (!isSuperAdmin) {
    return (
      <StateCard
        title="Access restricted"
        description="This section is only accessible to Super Admins."
        tone="danger"
      />
    );
  }

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Platform Management"
        title="Customer accounts"
        description="All organizations and researchers signed up to use this platform. Manage account status and review assessment activity."
      />

      {actionError ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          {actionError}
        </div>
      ) : null}
      {paymentActionError ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {paymentActionError}
        </div>
      ) : null}

      <Card className="bg-white/80">
        <CardContent className="space-y-4 p-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-950">Manual payment verification</h3>
              <p className="text-sm text-slate-500">Approve or reject pending transfer proofs.</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => void loadPendingPayments()} disabled={paymentsLoading}>
              {paymentsLoading ? 'Refreshing...' : 'Refresh'}
            </Button>
          </div>
          {paymentsLoading ? (
            <StateCard title="Loading payments" description="Fetching pending manual payments..." />
          ) : pendingPayments.length === 0 ? (
            <p className="text-sm text-slate-500">No pending manual payments.</p>
          ) : (
            <div className="space-y-3">
              {pendingPayments.map((payment) => (
                <div key={payment.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-950">
                        {formatTokenLabel(payment.selectedPlan)} ({formatTokenLabel(payment.billingCycle)})
                      </p>
                      <p className="text-xs text-slate-500">
                        Workspace #{payment.workspaceId} • Ref {payment.paymentReference}
                      </p>
                      <p className="mt-1 text-sm text-slate-700">
                        Amount: {payment.currency} {payment.totalAmount.toLocaleString()}
                      </p>
                      <p className="text-xs text-slate-500">
                        Sender: {payment.senderName ?? '-'} ({payment.senderBank ?? '-'})
                      </p>
                      {payment.proofUrl ? (
                        <a
                          className="mt-1 inline-block text-xs text-blue-600 underline"
                          href={payment.proofUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Open proof URL
                        </a>
                      ) : null}
                    </div>
                    <div className="w-full max-w-md space-y-2">
                      <input
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                        placeholder="Reject reason (required for reject)"
                        value={rejectReasonById[payment.id] ?? ''}
                        onChange={(event) =>
                          setRejectReasonById((prev) => ({
                            ...prev,
                            [payment.id]: event.target.value,
                          }))
                        }
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => void handleApprovePayment(payment.id)}
                          disabled={paymentActionId === payment.id}
                        >
                          {paymentActionId === payment.id ? 'Processing...' : 'Approve'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => void handleRejectPayment(payment.id)}
                          disabled={paymentActionId === payment.id}
                        >
                          {paymentActionId === payment.id ? 'Processing...' : 'Reject'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-white/80">
        <CardContent className="space-y-5 p-5">
          {/* Filters */}
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="relative w-full max-w-md">
              <Search className="pointer-events-none absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
              <Input
                className="pl-10"
                placeholder="Search by name, email, or organization"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex gap-3">
              <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)}>
                <option value="all">All types</option>
                <option value="business">Business / HR</option>
                <option value="researcher">Researcher</option>
              </Select>
              <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}>
                <option value="all">All statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </Select>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-500">
              <Filter className="h-4 w-4" />
              {customers.length} customer{customers.length === 1 ? '' : 's'}
            </div>
            
            <Button variant="outline" size="sm" onClick={() => void handleExportCsv()} disabled={customers.length === 0 || isExporting}>
              <Download className="mr-2 h-4 w-4" /> {isExporting ? 'Exporting...' : 'Export CSV'}
            </Button>
          </div>

          {/* Table */}
          {isLoading ? (
            <StateCard title="Loading customers" description="Fetching registered customer accounts..." />
          ) : error ? (
            <StateCard title="Unable to load" description={error} tone="danger" actionLabel="Retry" onAction={() => void loadCustomers()} />
          ) : customers.length === 0 ? (
            <StateCard title="No customers found" description="No accounts match the current filters." />
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">Customer</th>
                    <th className="px-4 py-3 font-medium">Organization</th>
                    <th className="px-4 py-3 font-medium">Type</th>
                    <th className="px-4 py-3 font-medium">Assessments</th>
                    <th className="px-4 py-3 font-medium">Last login</th>
                    <th className="px-4 py-3 font-medium">Joined</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {customers.map((customer) => (
                    <tr key={customer.id} className={customer.status === 'inactive' ? 'opacity-60' : ''}>
                      <td className="px-4 py-4">
                        <p className="font-medium text-slate-950">{customer.fullName}</p>
                        <p className="text-xs text-slate-400">{customer.email}</p>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-3.5 w-3.5 text-slate-400" />
                          <span className="text-slate-700">{customer.organizationName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <Badge>{formatTokenLabel(customer.accountType)}</Badge>
                      </td>
                      <td className="px-4 py-4 text-slate-600">
                        {customer.assessmentCount}
                      </td>
                      <td className="px-4 py-4 text-slate-500">
                        {formatDateTime(customer.lastLoginAt)}
                      </td>
                      <td className="px-4 py-4 text-slate-500">
                        {formatDateTime(customer.createdAt)}
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            customer.status === 'active'
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {customer.status === 'active' ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <Button variant="outline" size="sm" onClick={() => void handleOpenWorkspace(customer, 'view')}>
                            View workspace
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => void handleOpenWorkspace(customer, 'manage')}>
                            Manage subscription
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            className="gap-1.5"
                            disabled={togglingId === customer.id}
                            onClick={() => void handleToggleStatus(customer)}
                          >
                            {customer.status === 'active' ? (
                              <>
                                <ShieldOff className="h-3.5 w-3.5" />
                                Deactivate
                              </>
                            ) : (
                              <>
                                <ShieldCheck className="h-3.5 w-3.5" />
                                Activate
                              </>
                            )}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="border-t border-slate-100 bg-slate-50/60 px-4 py-2.5">
                <p className="text-xs text-slate-400">{customers.length} customer{customers.length !== 1 ? 's' : ''} shown</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Slide-over */}
      {activeCustomer && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-sm print:hidden">
          <div className="w-full max-w-md bg-white shadow-2xl flex flex-col h-full animate-in slide-in-from-right">
             <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-950">{activeCustomer.customer.organizationName}</h2>
                  <p className="text-sm text-slate-500">{activeCustomer.mode === 'view' ? 'Workspace details' : 'Manage subscription'}</p>
                </div>
                <button onClick={() => setActiveCustomer(null)} className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                  <X className="h-5 w-5" />
                </button>
             </div>
             
             <div className="flex-1 overflow-y-auto p-6 space-y-8">
               {isBillingLoading ? (
                 <StateCard title="Loading" description="Fetching subscription data..." />
               ) : billingError ? (
                 <StateCard title="Error" description={billingError} tone="danger" />
               ) : billingData && activeCustomer.mode === 'view' ? (
                  <div className="space-y-8">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900 mb-3">Subscription State</h3>
                      <div className="rounded-xl border p-4 space-y-3 text-sm">
                         <div className="flex justify-between"><span className="text-slate-500">Plan</span><span className="font-medium">{billingData.subscription.planCode} / {billingData.subscription.billingCycle}</span></div>
                         <div className="flex justify-between"><span className="text-slate-500">Status</span><span className="font-medium">{billingData.subscription.status}</span></div>
                         <div className="flex justify-between"><span className="text-slate-500">Trial ends</span><span className="font-medium">{billingData.subscription.trialEndsAt ? formatDateTime(billingData.subscription.trialEndsAt) : '-'}</span></div>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900 mb-3">Usage vs Limits</h3>
                      <div className="rounded-xl border p-4 space-y-3 text-sm">
                         <div className="flex justify-between"><span className="text-slate-500">Assessments</span><span className="font-medium">{billingData.usage.activeAssessmentCount} / {billingData.subscription.assessmentLimit}</span></div>
                         <div className="flex justify-between"><span className="text-slate-500">Participants</span><span className="font-medium">{billingData.usage.participantRecordCount} / {billingData.subscription.participantLimit}</span></div>
                         <div className="flex justify-between"><span className="text-slate-500">Team seats</span><span className="font-medium">{billingData.usage.teamSeatCount} / {billingData.subscription.teamMemberLimit}</span></div>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900 mb-3">Account Info</h3>
                      <div className="rounded-xl border p-4 space-y-3 text-sm">
                         <div className="flex justify-between"><span className="text-slate-500">Created</span><span className="font-medium">{activeCustomer.customer.createdAt ? formatDateTime(activeCustomer.customer.createdAt) : '-'}</span></div>
                         <div className="flex justify-between"><span className="text-slate-500">Last login</span><span className="font-medium">{activeCustomer.customer.lastLoginAt ? formatDateTime(activeCustomer.customer.lastLoginAt) : '-'}</span></div>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900 mb-3">Recent Invoices</h3>
                      {billingData.invoices.length > 0 ? (
                        <div className="space-y-2">
                          {billingData.invoices.map(inv => (
                            <div key={inv.id} className="rounded-xl border p-3 flex items-center justify-between text-sm">
                              <div>
                                <p className="font-medium">{inv.currencyCode} {inv.amountTotal}</p>
                                <p className="text-xs text-slate-500">{inv.issuedAt ? formatDateTime(inv.issuedAt) : '-'}</p>
                              </div>
                              <Badge>{inv.status}</Badge>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-slate-500">No invoices found.</p>
                      )}
                    </div>
                  </div>
               ) : billingData && manageForm && activeCustomer.mode === 'manage' ? (
                  <div className="space-y-6">
                    <div>
                      <p className="mb-2 text-sm font-medium">Plan code</p>
                      <Select value={manageForm.planCode} onChange={e => setManageForm(s => s ? {...s, planCode: e.target.value} : s)}>
                         <option value="starter">Starter</option>
                         <option value="growth">Growth</option>
                         <option value="research">Research</option>
                      </Select>
                    </div>
                    <div>
                      <p className="mb-2 text-sm font-medium">Billing cycle</p>
                      <Select value={manageForm.billingCycle} onChange={e => setManageForm(s => s ? {...s, billingCycle: e.target.value} : s)}>
                         <option value="monthly">Monthly</option>
                         <option value="annual">Annual</option>
                      </Select>
                    </div>
                    <div>
                      <p className="mb-2 text-sm font-medium">Status</p>
                      <Select value={manageForm.status} onChange={e => setManageForm(s => s ? {...s, status: e.target.value} : s)}>
                         <option value="trial">Trial</option>
                         <option value="active">Active</option>
                         <option value="past_due">Past Due</option>
                         <option value="suspended">Suspended</option>
                      </Select>
                    </div>
                    <div>
                      <p className="mb-2 text-sm font-medium">Trial ends at</p>
                      <Input type="datetime-local" value={manageForm.trialEndsAt} onChange={e => setManageForm(s => s ? {...s, trialEndsAt: e.target.value} : s)} />
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" id="cancelPeriod" checked={manageForm.cancelAtPeriodEnd} onChange={e => setManageForm(s => s ? {...s, cancelAtPeriodEnd: e.target.checked} : s)} />
                      <label htmlFor="cancelPeriod" className="text-sm font-medium">Cancel at period end</label>
                    </div>
                    <div className="pt-4 border-t border-slate-100">
                      <Button onClick={() => void handleSaveSubscription()} disabled={isSavingSub} className="w-full">
                        {isSavingSub ? 'Saving...' : 'Save changes'}
                      </Button>
                    </div>
                  </div>
               ) : null}
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
