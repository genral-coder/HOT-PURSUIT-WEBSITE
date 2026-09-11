import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ROLE_DEFAULT_PERMISSIONS,
} from "../src/config/rbac.js";
import {
  computeEffectivePermissions,
  permits,
  permissionsFromRoles,
} from "../src/services/permissions.js";

/**
 * Authorization model tests (pure logic — no DB required).
 *
 * These verify the RBAC rules that back requireRole/requirePermission:
 *   - Owner ⇒ full access
 *   - Admin ⇒ broad management subset
 *   - Moderator ⇒ limited subset
 *   - CONTENT_MANAGER ⇒ news/media only
 *   - Normal user (no roles) ⇒ no admin permissions
 *   - Direct grants are additive on top of roles
 */

test("OWNER is granted every permission (full access)", () => {
  const perms = permissionsFromRoles(["OWNER"]);
  for (const p of ROLE_DEFAULT_PERMISSIONS.OWNER) {
    assert.ok(perms.includes(p), `OWNER should have ${p}`);
  }
  assert.ok(perms.includes("admin.access"));
  assert.ok(perms.includes("settings.manage"));
  assert.ok(perms.includes("admins.manage"));
});

test("ADMIN has admin.access + broad management but NOT admins.manage/settings", () => {
  const perms = permissionsFromRoles(["ADMIN"]);
  assert.ok(perms.includes("admin.access"));
  assert.ok(perms.includes("store.manage"));
  assert.ok(perms.includes("players.manage"));
  assert.ok(!perms.includes("admins.manage"));
  assert.ok(!perms.includes("settings.manage"));
});

test("MODERATOR is limited to players.view, applications and tickets", () => {
  const perms = permissionsFromRoles(["MODERATOR"]);
  assert.ok(perms.includes("admin.access"));
  assert.ok(perms.includes("tickets.manage"));
  assert.ok(perms.includes("applications.manage"));
  assert.ok(!perms.includes("store.manage"));
  assert.ok(!perms.includes("players.manage"));
  assert.ok(!perms.includes("settings.manage"));
});

test("CONTENT_MANAGER only gets news + media", () => {
  const perms = permissionsFromRoles(["CONTENT_MANAGER"]);
  assert.ok(perms.includes("news.manage"));
  assert.ok(perms.includes("media.manage"));
  assert.ok(perms.includes("admin.access"));
  assert.ok(!perms.includes("players.view"));
  assert.ok(!perms.includes("store.manage"));
});

test("normal user (no roles) has zero admin permissions", () => {
  const perms = permissionsFromRoles([]);
  assert.equal(perms.length, 0);
  assert.ok(!permits(perms, "admin.access"));
  assert.ok(!permits(perms, "store.view"));
});

test("direct grants are additive on top of role defaults", () => {
  const perms = computeEffectivePermissions(["MODERATOR"], ["store.manage"]);
  assert.ok(perms.includes("store.manage"), "direct grant should be added");
  assert.ok(perms.includes("tickets.manage"), "role default preserved");
});

test("computeEffectivePermissions dedupes overlapping permissions", () => {
  const perms = computeEffectivePermissions(["ADMIN"], ["store.manage"]);
  const duplicates = perms.filter((p) => p === "store.manage").length;
  assert.equal(duplicates, 1);
});

test("permits() rejects when permission missing", () => {
  assert.ok(!permits([], "admin.access"));
  assert.ok(permits(["admin.access"], "admin.access"));
});
