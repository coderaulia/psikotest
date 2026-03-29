import type { CustomerWorkspaceMemberRole } from '@/types/assessment';

export function canAccessWorkspaceSettings(role: CustomerWorkspaceMemberRole) {
  return role === 'owner' || role === 'admin';
}

export function canAccessWorkspaceTeam(role: CustomerWorkspaceMemberRole) {
  return role === 'owner' || role === 'admin';
}

export function canAccessWorkspaceBilling(role: CustomerWorkspaceMemberRole) {
  return role === 'owner';
}

export function canOperateAssessments(role: CustomerWorkspaceMemberRole) {
  return role === 'owner' || role === 'admin' || role === 'operator';
}

export function canViewWorkspaceResults(role: CustomerWorkspaceMemberRole) {
  return role === 'owner' || role === 'admin' || role === 'operator' || role === 'reviewer';
}
