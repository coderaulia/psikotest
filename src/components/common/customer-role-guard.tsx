import type { ReactNode } from 'react';

import { Navigate, useLocation } from 'react-router-dom';

import { loadCustomerSession } from '@/lib/customer-session';
import type { CustomerWorkspaceMemberRole } from '@/types/assessment';

export function CustomerRoleGuard({
  allowedRoles,
  children,
}: {
  allowedRoles: CustomerWorkspaceMemberRole[];
  children: ReactNode;
}) {
  const location = useLocation();
  const session = loadCustomerSession();

  if (!session) {
    return <Navigate to="/login" replace state={{ redirectTo: location.pathname }} />;
  }

  if (!allowedRoles.includes(session.account.workspaceRole)) {
    return <Navigate to="/workspace" replace />;
  }

  return <>{children}</>;
}
