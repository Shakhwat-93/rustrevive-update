/**
 * Rust & Revive — Comprehensive Authentication & RBAC Types
 * Operational role definitions and granular permission mapping.
 */

export type Role =
  | "SUPER_ADMIN"
  | "ADMIN"
  | "EDITOR"
  | "ORDER_MANAGER"
  | "INVENTORY_MANAGER"
  | "CUSTOMER_SUPPORT"
  | "MARKETING_MANAGER";

export type Permission =
  // Dashboard
  | "dashboard:view"
  | "dashboard:analytics"
  // Products
  | "products:view"
  | "products:create"
  | "products:edit"
  | "products:delete"
  | "products:publish"
  | "products:bulk"
  // Inventory
  | "inventory:view"
  | "inventory:adjust"
  | "inventory:history"
  // Orders
  | "orders:view"
  | "orders:create"
  | "orders:edit"
  | "orders:cancel"
  | "orders:refund"
  | "orders:fulfill"
  // Customers
  | "customers:view"
  | "customers:edit"
  | "customers:segments"
  // Content / CMS
  | "content:view"
  | "content:edit"
  | "content:publish"
  // Media
  | "media:view"
  | "media:upload"
  | "media:delete"
  // Marketing & Discounts
  | "marketing:view"
  | "marketing:manage"
  | "discounts:view"
  | "discounts:manage"
  // Settings & Audit
  | "settings:view"
  | "settings:manage"
  | "audit:view"
  | "users:manage";

export interface AdminUser {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  roles: Role[];
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
}

export interface AdminSession {
  user: AdminUser;
  token?: string;
  expiresAt: string;
}
