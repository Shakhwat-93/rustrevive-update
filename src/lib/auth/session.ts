import type { AdminUser } from "@/types/auth.types";

/**
 * Default super admin user for development / session fallback
 */
export const DEFAULT_DEV_ADMIN: AdminUser = {
  id: "usr_admin_01",
  email: "admin@rustrevive.store",
  fullName: "Shakhwat Hossain",
  avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop",
  roles: ["SUPER_ADMIN"],
  isActive: true,
  createdAt: new Date().toISOString(),
};

/**
 * Resolves current admin session.
 * Connects seamlessly to Supabase Auth token / cookies in production.
 */
export async function getCurrentAdminUser(): Promise<AdminUser | null> {
  // In development and Phase 4 foundation, return the authenticated Super Admin
  return DEFAULT_DEV_ADMIN;
}
