import type { Role, Permission, AdminUser } from "@/types/auth.types";
import { ForbiddenError, AuthenticationError } from "@/lib/errors/app-error";

/**
 * Granular Role to Permission Mapping
 */
export const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  SUPER_ADMIN: [
    "dashboard:view",
    "dashboard:analytics",
    "products:view",
    "products:create",
    "products:edit",
    "products:delete",
    "products:publish",
    "products:bulk",
    "inventory:view",
    "inventory:adjust",
    "inventory:history",
    "orders:view",
    "orders:create",
    "orders:edit",
    "orders:cancel",
    "orders:refund",
    "orders:fulfill",
    "customers:view",
    "customers:edit",
    "customers:segments",
    "content:view",
    "content:edit",
    "content:publish",
    "media:view",
    "media:upload",
    "media:delete",
    "marketing:view",
    "marketing:manage",
    "discounts:view",
    "discounts:manage",
    "settings:view",
    "settings:manage",
    "audit:view",
    "users:manage",
  ],
  ADMIN: [
    "dashboard:view",
    "dashboard:analytics",
    "products:view",
    "products:create",
    "products:edit",
    "products:delete",
    "products:publish",
    "products:bulk",
    "inventory:view",
    "inventory:adjust",
    "inventory:history",
    "orders:view",
    "orders:create",
    "orders:edit",
    "orders:cancel",
    "orders:refund",
    "orders:fulfill",
    "customers:view",
    "customers:edit",
    "customers:segments",
    "content:view",
    "content:edit",
    "content:publish",
    "media:view",
    "media:upload",
    "media:delete",
    "marketing:view",
    "marketing:manage",
    "discounts:view",
    "discounts:manage",
    "settings:view",
    "audit:view",
  ],
  EDITOR: [
    "dashboard:view",
    "content:view",
    "content:edit",
    "content:publish",
    "products:view",
    "products:create",
    "products:edit",
    "media:view",
    "media:upload",
  ],
  ORDER_MANAGER: [
    "dashboard:view",
    "orders:view",
    "orders:create",
    "orders:edit",
    "orders:fulfill",
    "customers:view",
    "inventory:view",
  ],
  INVENTORY_MANAGER: [
    "dashboard:view",
    "inventory:view",
    "inventory:adjust",
    "inventory:history",
    "products:view",
    "products:edit",
  ],
  CUSTOMER_SUPPORT: [
    "dashboard:view",
    "orders:view",
    "customers:view",
    "customers:edit",
  ],
  MARKETING_MANAGER: [
    "dashboard:view",
    "dashboard:analytics",
    "marketing:view",
    "marketing:manage",
    "discounts:view",
    "discounts:manage",
    "customers:view",
    "customers:segments",
    "content:view",
  ],
};

/**
 * Checks if a set of roles includes a specific permission.
 */
export function hasPermission(roles: Role[], permission: Permission): boolean {
  if (roles.includes("SUPER_ADMIN")) return true;
  return roles.some((role) => {
    const permissions = ROLE_PERMISSIONS[role];
    return permissions ? (permissions as readonly Permission[]).includes(permission) : false;
  });
}

/**
 * Checks if a set of roles includes any of the provided permissions.
 */
export function hasAnyPermission(roles: Role[], permissions: Permission[]): boolean {
  return permissions.some((permission) => hasPermission(roles, permission));
}

/**
 * Checks if a set of roles includes all of the provided permissions.
 */
export function hasAllPermissions(roles: Role[], permissions: Permission[]): boolean {
  return permissions.every((permission) => hasPermission(roles, permission));
}

/**
 * Server-side authorization guard.
 * Throws UnauthorizedError or ForbiddenError if check fails.
 */
export function requirePermission(
  user: AdminUser | null | undefined,
  permission: Permission
): asserts user is AdminUser {
  if (!user || !user.isActive) {
    throw new AuthenticationError("Authentication required for this administrative action.");
  }

  if (!hasPermission(user.roles, permission)) {
    throw new ForbiddenError(`User lacks required permission: ${permission}`);
  }
}
