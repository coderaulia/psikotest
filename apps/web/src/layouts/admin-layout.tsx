import { Outlet } from 'react-router-dom';

import { AdminShell } from '@/components/common/admin-shell';

export function AdminLayout() {
  return (
    <AdminShell>
      <Outlet />
    </AdminShell>
  );
}
