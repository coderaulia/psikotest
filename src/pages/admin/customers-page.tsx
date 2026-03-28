import { Building2, Search, ShieldOff, ShieldCheck } from 'lucide-react';
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
import { fetchCustomers, updateCustomerStatus } from '@/services/admin-data';
import type { CustomerAccountStatus, CustomerListItem } from '@/types/assessment';

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
    }
  }, [deferredSearch, statusFilter, typeFilter]);

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
    </div>
  );
}
