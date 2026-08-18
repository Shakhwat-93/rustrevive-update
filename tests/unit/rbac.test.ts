import { describe, it, expect } from "vitest";
import { hasPermission, hasAnyPermission, requirePermission } from "@/lib/auth/rbac";
import type { AdminUser } from "@/types/auth.types";

describe("RBAC Permissions Engine", () => {
  const superAdminUser: AdminUser = {
    id: "user_1",
    email: "super@rustrevive.store",
    fullName: "Super Admin",
    roles: ["SUPER_ADMIN"],
    isActive: true,
    createdAt: new Date().toISOString(),
  };

  const editorUser: AdminUser = {
    id: "user_2",
    email: "editor@rustrevive.store",
    fullName: "Editor Staff",
    roles: ["EDITOR"],
    isActive: true,
    createdAt: new Date().toISOString(),
  };

  const inactiveUser: AdminUser = {
    id: "user_3",
    email: "inactive@rustrevive.store",
    fullName: "Inactive Staff",
    roles: ["ADMIN"],
    isActive: false,
    createdAt: new Date().toISOString(),
  };

  it("grants SUPER_ADMIN access to all permissions", () => {
    expect(hasPermission(["SUPER_ADMIN"], "products:delete")).toBe(true);
    expect(hasPermission(["SUPER_ADMIN"], "settings:manage")).toBe(true);
    expect(hasPermission(["SUPER_ADMIN"], "content:publish")).toBe(true);
  });

  it("correctly evaluates permissions for restricted roles", () => {
    expect(hasPermission(["EDITOR"], "content:edit")).toBe(true);
    expect(hasPermission(["EDITOR"], "media:upload")).toBe(true);
    expect(hasPermission(["EDITOR"], "settings:manage")).toBe(false);
    expect(hasPermission(["EDITOR"], "users:manage")).toBe(false);
  });

  it("checks hasAnyPermission correctly", () => {
    expect(hasAnyPermission(["EDITOR"], ["settings:manage", "content:edit"])).toBe(true);
    expect(hasAnyPermission(["EDITOR"], ["settings:manage", "users:manage"])).toBe(false);
  });

  it("requirePermission passes for authorized users", () => {
    expect(() => requirePermission(superAdminUser, "settings:manage")).not.toThrow();
    expect(() => requirePermission(editorUser, "content:edit")).not.toThrow();
  });

  it("requirePermission throws ForbiddenError for unauthorized permissions", () => {
    expect(() => requirePermission(editorUser, "settings:manage")).toThrow(/lacks required permission/);
  });

  it("requirePermission throws UnauthorizedError for inactive or null users", () => {
    expect(() => requirePermission(null, "products:view")).toThrow(/Authentication required/);
    expect(() => requirePermission(inactiveUser, "products:view")).toThrow(/Authentication required/);
  });
});
