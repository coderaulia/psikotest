export interface Env {
  DB: D1Database;
  JWT_SECRET: string;
  APP_ORIGIN: string;
}

// ─── JWT Payload Shapes ──────────────────────────────────────────────────────

export interface AdminJwtPayload {
  sub: string; // admin id (string)
  adminId: number;
  email: string;
  role: 'super_admin' | 'admin' | 'psychologist_reviewer';
  sessionVersion: number;
  exp: number;
}

export interface CustomerJwtPayload {
  sub: string;
  accountId: number;
  actorId: number;
  actorType: 'owner' | 'workspace_member';
  email: string;
  accountType: 'business' | 'researcher';
  workspaceRole: 'owner' | 'admin' | 'operator' | 'reviewer';
  sessionVersion: number;
  exp: number;
}

// ─── Hono Context Variables ──────────────────────────────────────────────────

export interface AdminContextVars {
  adminPayload: AdminJwtPayload;
}

export interface CustomerContextVars {
  customerPayload: CustomerJwtPayload;
}