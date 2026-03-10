import { jsx as _jsx } from "react/jsx-runtime";
import { Outlet } from 'react-router-dom';
import { AdminShell } from '@/components/common/admin-shell';
export function AdminLayout() {
    return (_jsx(AdminShell, { children: _jsx(Outlet, {}) }));
}
