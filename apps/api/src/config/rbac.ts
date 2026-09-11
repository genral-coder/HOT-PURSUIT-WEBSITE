import type { Permission, RoleName } from "@hotpursuit/types";

/**
 * Role-based access control definition for the admin foundation.
 *
 * This is the SINGLE server-side source of truth for which permissions each
 * built-in role gets. It is used both for seeding PostgreSQL and (as a fallback
 * that also handles the Owner bridge) when resolving the current user.
 *
 * The database may later grant extra/different permissions to individual
 * users; those direct grants are additive on top of these role defaults.
 */
export const ROLE_DEFAULT_PERMISSIONS: Record<RoleName, Permission[]> = {
  OWNER: [
    "admin.access",
    "players.view",
    "players.manage",
    "store.view",
    "store.manage",
    "orders.view",
    "orders.manage",
    "applications.view",
    "applications.manage",
    "tickets.view",
    "tickets.manage",
    "news.view",
    "news.manage",
    "media.manage",
    "server.view",
    "admins.manage",
    "settings.manage",
  ],
  ADMIN: [
    "admin.access",
    "players.view",
    "players.manage",
    "store.view",
    "store.manage",
    "orders.view",
    "orders.manage",
    "applications.view",
    "applications.manage",
    "tickets.view",
    "tickets.manage",
    "news.view",
    "news.manage",
    "media.manage",
    "server.view",
  ],
  MODERATOR: [
    "admin.access",
    "players.view",
    "applications.view",
    "applications.manage",
    "tickets.view",
    "tickets.manage",
  ],
  CONTENT_MANAGER: ["admin.access", "news.view", "news.manage", "media.manage"],
};

export const ROLES: RoleName[] = [
  "OWNER",
  "ADMIN",
  "MODERATOR",
  "CONTENT_MANAGER",
];

export const ALL_PERMISSIONS: Permission[] = [
  "admin.access",
  "players.view",
  "players.manage",
  "store.view",
  "store.manage",
  "orders.view",
  "orders.manage",
  "applications.view",
  "applications.manage",
  "tickets.view",
  "tickets.manage",
  "news.view",
  "news.manage",
  "media.manage",
  "server.view",
  "admins.manage",
  "settings.manage",
];

export const ROLE_DESCRIPTIONS: Record<RoleName, string> = {
  OWNER: "Full control over the entire platform.",
  ADMIN: "Broad management access across most modules.",
  MODERATOR: "Handle players, applications and tickets.",
  CONTENT_MANAGER: "Manage news and media content.",
};

export const PERMISSION_DESCRIPTIONS: Record<Permission, string> = {
  "admin.access": "Can access the admin area.",
  "players.view": "View player data.",
  "players.manage": "Manage players.",
  "store.view": "View the store.",
  "store.manage": "Manage store products.",
  "orders.view": "View orders.",
  "orders.manage": "Manage orders.",
  "applications.view": "View applications.",
  "applications.manage": "Manage applications.",
  "tickets.view": "View tickets.",
  "tickets.manage": "Manage tickets.",
  "news.view": "View news.",
  "news.manage": "Manage news.",
  "media.manage": "Manage media.",
  "server.view": "View server data.",
  "admins.manage": "Manage admins.",
  "settings.manage": "Manage settings.",
};
