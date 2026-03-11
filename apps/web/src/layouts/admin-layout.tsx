import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { AdminShell } from '@/components/common/admin-shell';
import { loadAdminSession } from '@/lib/admin-session';

export function AdminLayout() {
  const location = useLocation();
  const adminSession = loadAdminSession();

  if (!adminSession) {
    return <Navigate to="/admin/login" replace state={{ redirectTo: location.pathname }} />;
  }

  return (
    <AdminShell>
      <Outlet />
    </AdminShell>
  );
}
