/**
 * Authentication and RBAC Types
 */

export type UserRole = "super_admin" | "admin" | "manager" | "editor" | "customer";

export interface AuthUser {
  id: string;
  email: string;
  fullName?: string;
  phone?: string;
  roles: UserRole[];
  isActive: boolean;
  createdAt: string;
}

export interface SessionContext {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isManager: boolean;
}
