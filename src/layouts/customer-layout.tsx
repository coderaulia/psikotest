import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { CustomerShell } from '@/components/common/customer-shell';
import { loadCustomerSession } from '@/lib/customer-session';

export function CustomerLayout() {
  const location = useLocation();
  const customerSession = loadCustomerSession();

  if (!customerSession) {
    return <Navigate to="/login" replace state={{ redirectTo: location.pathname }} />;
  }

  return (
    <CustomerShell>
      <Outlet />
    </CustomerShell>
  );
}
