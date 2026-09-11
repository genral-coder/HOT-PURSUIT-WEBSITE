import assert from "node:assert/strict";
import { test } from "node:test";
import type { Permission, RoleName } from "@hotpursuit/types";
import { permissionsFromRoles, permits } from "../src/services/permissions.js";

/**
 * Admin route access matrix (pure permission checks — no DB required).
 *
 * Mirrors the permission each /api/admins route enforces so we can assert which
 * staff tier can reach which section:
 *   - admins.manage  → list/add/change/remove + meta  (Owner only, by default)
 *   - admin.access   → dashboard summary             (all staff)
 */

const tiers: Array<{ name: string; roles: RoleName[] }> = [
  { name: "normal", roles: [] },
  { name: "CONTENT_MANAGER", roles: ["CONTENT_MANAGER"] },
  { name: "MODERATOR", roles: ["MODERATOR"] },
  { name: "ADMIN", roles: ["ADMIN"] },
  { name: "OWNER", roles: ["OWNER"] },
];

test("access matrix: who may call the management endpoints (admins.manage)", () => {
  for (const { name, roles } of tiers) {
    const perms = permissionsFromRoles(roles);
    const expectManage = name === "OWNER";
    assert.equal(
      permits(perms, "admins.manage"),
      expectManage,
      `${name} admins.manage expected ${expectManage}`,
    );
  }
});

test("all staff tiers may access the dashboard (admin.access)", () => {
  for (const t of tiers) {
    if (t.name === "normal") continue;
    assert.ok(permits(permissionsFromRoles(t.roles), "admin.access"));
  }
  assert.ok(!permits(permissionsFromRoles([]), "admin.access"));
});

test("a user promoted to ADMIN still lacks admins.manage unless granted", () => {
  assert.ok(!permits(permissionsFromRoles(["ADMIN"]), "admins.manage"));
  const withGrant: Permission[] = [...permissionsFromRoles(["ADMIN"]), "admins.manage"];
  assert.ok(permits(withGrant, "admins.manage"));
});

test("MODERATOR is confined to its limited sections, not the store/orders", () => {
  const perms = permissionsFromRoles(["MODERATOR"]);
  assert.ok(permits(perms, "applications.view"));
  assert.ok(permits(perms, "tickets.manage"));
  assert.ok(!permits(perms, "store.manage"));
  assert.ok(!permits(perms, "orders.view"));
  assert.ok(!permits(perms, "settings.manage"));
});
