import assert from "node:assert/strict";
import { test } from "node:test";
import type { Permission } from "@hotpursuit/types";
import {
  assertPermissions,
  assertRole,
  canAssignRole,
  canChangeRole,
  canManageRank,
  highestRank,
  primaryRole,
  rankOf,
  requireAdminsManage,
  type Actor,
} from "../src/services/adminLogic.js";
import { ApiError } from "../src/lib/errors.js";

/**
 * Admin Management security tests (pure logic — no DB required).
 *
 * These verify the server-side authorization rules that back the /api/admins
 * endpoints:
 *   - Only holders of `admins.manage` may issue management actions.
 *   - Self-promotion is impossible (you can never grant a role at/above yours).
 *   - Moderator → Owner and Admin → Owner are impossible.
 *   - Owners can only be managed by Owners.
 *   - Unknown roles/permissions are rejected.
 */

const owner = { rank: 4, isOwner: true, permissions: ["admins.manage"] } satisfies Actor;
const admin = {
  rank: 3,
  isOwner: false,
  permissions: ["admin.access", "players.manage"],
} satisfies Actor;
const moderator = {
  rank: 2,
  isOwner: false,
  permissions: ["admin.access", "tickets.manage"],
} satisfies Actor;
const content = {
  rank: 1,
  isOwner: false,
  permissions: ["admin.access", "news.manage"],
} satisfies Actor;

test("rankOf maps roles and yields 0 for unknown/non-staff", () => {
  assert.equal(rankOf("OWNER"), 4);
  assert.equal(rankOf("ADMIN"), 3);
  assert.equal(rankOf("MODERATOR"), 2);
  assert.equal(rankOf("CONTENT_MANAGER"), 1);
  assert.equal(rankOf("NOPE"), 0);
  assert.equal(rankOf(undefined), 0);
  assert.equal(rankOf(null), 0);
});

test("highestRank computes the top role among a set", () => {
  assert.equal(highestRank(["MODERATOR", "ADMIN"]), 3);
  assert.equal(highestRank([]), 0);
  assert.equal(highestRank(["OWNER"]), 4);
});

test("primaryRole returns the single highest role held", () => {
  assert.equal(primaryRole(["CONTENT_MANAGER"]), "CONTENT_MANAGER");
  assert.equal(primaryRole(["MODERATOR", "ADMIN"]), "ADMIN");
  assert.equal(primaryRole([]), null);
});

test("requireAdminsManage rejects actors without admins.manage", () => {
  assert.throws(
    () => requireAdminsManage({ ...admin, permissions: [] as Permission[] }),
    (e) => e instanceof ApiError && e.status === 403,
  );
  // Owner + admin holder passes.
  requireAdminsManage(owner);
  requireAdminsManage({ ...admin, permissions: ["admins.manage"] as Permission[] });
});

test("a moderator cannot assign OWNER or ADMIN (self-promotion impossible)", () => {
  assert.equal(canAssignRole(moderator, "OWNER"), false);
  assert.equal(canAssignRole(moderator, "ADMIN"), false);
  assert.equal(canAssignRole(moderator, "MODERATOR"), false); // equal rank
  assert.equal(canAssignRole(moderator, "CONTENT_MANAGER"), true); // lower
});

test("an ADMIN cannot assign OWNER or ADMIN (cannot grant equal/higher)", () => {
  assert.equal(canAssignRole(admin, "OWNER"), false);
  assert.equal(canAssignRole(admin, "ADMIN"), false); // equal rank
  assert.equal(canAssignRole(admin, "MODERATOR"), true);
});

test("an OWNER may assign every role (owner is exempt from rank cap)", () => {
  assert.equal(canAssignRole(owner, "OWNER"), true);
  assert.equal(canAssignRole(owner, "ADMIN"), true);
  assert.equal(canAssignRole(owner, "MODERATOR"), true);
});

test("non-owner cannot assign OWNER even if it is below their own rank cap", () => {
  // Hypothetical admin granted admins.manage cannot create an owner.
  assert.equal(canAssignRole({ ...admin, permissions: ["admins.manage"] as Permission[] }, "OWNER"), false);
});

test("canChangeRole blocks Moderator -> Owner and Admin -> Owner", () => {
  assert.equal(canChangeRole(moderator, "MODERATOR", "OWNER"), false);
  assert.equal(canChangeRole(admin, "MODERATOR", "OWNER"), false);
});

test("canChangeRole allows a higher-rank actor to demote a lower target", () => {
  // OWNER demotes ADMIN -> MODERATOR
  assert.equal(canChangeRole(owner, "ADMIN", "MODERATOR"), true);
  // ADMIN (with admins.manage) demotes MODERATOR -> CONTENT_MANAGER
  assert.equal(
    canChangeRole({ ...admin, permissions: ["admins.manage"] as Permission[] }, "MODERATOR", "CONTENT_MANAGER"),
    true,
  );
  // ADMIN cannot promote MODERATOR -> ADMIN (equal)
  assert.equal(
    canChangeRole({ ...admin, permissions: ["admins.manage"] as Permission[] }, "MODERATOR", "ADMIN"),
    false,
  );
});

test("canManageRank: only a strictly higher rank can manage an equal or higher target", () => {
  assert.equal(canManageRank(owner, 4), true); // owner manages owner
  assert.equal(canManageRank(admin, 3), false); // cannot manage equal rank
  assert.equal(canManageRank(admin, 2), true); // admin manages moderator
  assert.equal(canManageRank(moderator, 3), false); // celebrity can't manage admin
  assert.equal(canManageRank(moderator, 0), true); // target is not staff — fine
});

test("assertRole rejects unknown roles", () => {
  assert.throws(() => assertRole("SUPER_ADMIN"), ApiError);
  assert.throws(() => assertRole(123), ApiError);
  assert.doesNotThrow(() => assertRole("ADMIN"));
});

test("assertPermissions rejects invented/unknown permissions", () => {
  assert.throws(() => assertPermissions(["self.promote"]), ApiError);
  assert.throws(() => assertPermissions("admin.access"), ApiError);
  assert.throws(() => assertPermissions([42]), ApiError);
  assert.doesNotThrow(() => assertPermissions(["store.manage", "players.view"]));
  assert.doesNotThrow(() => assertPermissions([]));
});
