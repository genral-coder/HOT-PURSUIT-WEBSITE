/**
 * HOT PURSUIT RP — Shared domain types
 * Used by both the web app and the API to keep frontend/backend in sync.
 *
 * NOTE: These types are derived from the actual data in the legacy site
 * (products.json + site-config.js). Do not invent fields that aren't used.
 */

/* ───────────────────────────── i18n ───────────────────────────── */

export type Language = "en" | "ar";

/** A value that has an English and an Arabic form. */
export interface Localized {
  name: string;
  nameAr?: string;
}

/* ───────────────────────────── Store / Products ───────────────────────────── */

export type ProductCategoryId = "vehicles" | "mlo" | "vip" | "bundles";

export type BusinessTypeId =
  | "restaurant"
  | "mechanic"
  | "dealership"
  | "nightclub"
  | "cafe"
  | "hotel";

export type VehicleClassId = "S" | "S+" | "S++" | "X";

export interface Product {
  /** Unique id (legacy data uses numeric ids). */
  id: number;
  category: ProductCategoryId;
  name: string;
  nameAr?: string;
  /** Short description shown on the card. */
  short?: string;
  shortAr?: string;
  /** Long description shown in the product details. */
  description?: string;
  descriptionAr?: string;
  features?: string[];
  featuresAr?: string[];
  /** Display price as a raw string (e.g. "20$ Monthly"). */
  price: string;
  image?: string;
  /** Business subtype, only for category === "mlo". */
  type?: BusinessTypeId | null;
  /** Vehicle class, only for category === "vehicles". */
  class?: VehicleClassId | null;
  sold?: boolean;
  popular?: boolean;
  new?: boolean;
  featured?: boolean;
  likes?: number;
}

export interface Category {
  id: ProductCategoryId;
  name: string;
  nameAr: string;
  emoji: string;
  color: string;
}

export interface BusinessType {
  id: BusinessTypeId;
  name: string;
  nameAr: string;
  emoji: string;
}

export interface VehicleClass {
  id: VehicleClassId;
  monthly: string;
  season: string;
  color: string;
}

export interface LocalizedRule {
  en: string;
  ar: string;
}

export interface PaymentMethod {
  id: string;
  name: string;
  nameAr: string;
  /** Inline SVG markup (kept as a string for display). */
  icon: string;
}

/* ───────────────────────────── Server ───────────────────────────── */

export interface ServerStatus {
  /** True while the UI may show dev/demo values (no live API yet). */
  mock: boolean;
  online: boolean;
  name: string;
  description: string;
  tagline: string;
  /** Full address e.g. "connect.example.com:30120". */
  ipFull?: string;
  ip?: string;
  port?: string;
  playersOnline?: number;
  playerLimit?: number;
  version?: string;
  lastRestart?: string;
  uptime?: string;
  region?: string;
}

/* ───────────────────────────── Jobs / Applications ───────────────────────────── */

export interface Job {
  id: string;
  name: string;
  nameAr?: string;
  emoji: string;
  desc?: string;
  descAr?: string;
  requirements?: string[];
  features?: string[];
}

export interface ApplicationOffer extends ListItem {
  requirements?: string[];
}

export interface ListItem {
  id: string;
  name: string;
  nameAr?: string;
  emoji?: string;
  desc?: string;
  descAr?: string;
}

/* ───────────────────────────── Rules / FAQ ───────────────────────────── */

export interface RuleCategory {
  id: string;
  name: string;
  nameAr: string;
  list: LocalizedRule[];
}

export interface FaqItem {
  q: string;
  qAr: string;
  a: string;
  aAr: string;
  /** True when it is sample/development content. */
  sample?: boolean;
}

/* ───────────────────────────── News / Media ───────────────────────────── */

export interface NewsPost {
  title: string;
  /** Arabic title (optional). */
  titleAr?: string;
  date: string;
  tag: string;
  cover?: string;
  excerpt?: string;
  excerptAr?: string;
  body?: string[];
  bodyAr?: string[];
  gallery?: string[];
  video?: string;
  /** True when sample/dev content, not real news. */
  sample?: boolean;
}

export interface MediaItem {
  id: string;
  url?: string;
  embed?: string;
  type: "screenshot" | "video";
}

/* ───────────────────────────── Social / Community ───────────────────────────── */

export interface SocialLink {
  id: string;
  name: string;
  emoji: string;
  /** Empty url hides the platform. */
  url: string;
  primary?: boolean;
}

export interface Links {
  discord?: string;
  discordTicket?: string;
  play?: string;
  tiktok?: string;
  youtube?: string;
  instagram?: string;
  twitter?: string;
  twitch?: string;
}

/* ───────────────────────────── Branding ───────────────────────────── */

export interface SiteBrand {
  name: string;
  logo: string;
  logoFallbackText: string;
}

export interface WhyUsCard {
  icon: string;
  title: string;
  titleAr: string;
  text: string;
  textAr: string;
}

export interface SiteFeature {
  icon: string;
  title: string;
  titleAr: string;
  text: string;
  textAr: string;
}

/* ───────────────────────────── Users / Auth ───────────────────────────── */

/** Roles supported by the admin authorization foundation (server-enforced). */
export type RoleName = "OWNER" | "ADMIN" | "MODERATOR" | "CONTENT_MANAGER";

/**
 * Granular permissions (server-enforced). These may grow over time as future
 * Admin/Player/Store modules land. Not every role gets every permission —
 * they are assigned per role in the database seed / admin management and
 * checked server-side only.
 */
export type Permission =
  | "admin.access"
  | "players.view"
  | "players.manage"
  | "store.view"
  | "store.manage"
  | "orders.view"
  | "orders.manage"
  | "applications.view"
  | "applications.manage"
  | "tickets.view"
  | "tickets.manage"
  | "news.view"
  | "news.manage"
  | "media.manage"
  | "server.view"
  | "admins.manage"
  | "settings.manage";

/** Default permission set per role (seed data, database). */
export const ROLE_PERMISSIONS: Record<RoleName, Permission[]> = {
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
  MODERATOR: ["admin.access", "players.view", "applications.view", "applications.manage", "tickets.view", "tickets.manage"],
  CONTENT_MANAGER: ["admin.access", "news.view", "news.manage", "media.manage"],
};

/** Discord data stored for an authenticated user (safe subset only). */
export interface DiscordUser {
  /** Discord user id (server-verified, never trusted from the client). */
  id: string;
  username: string;
  globalName?: string | null;
  avatar?: string | null;
  /** True when identity was validated via Discord OAuth. */
  verified: boolean;
}

export interface AuthRole {
  name: RoleName;
}

/**
 * Authenticated user as returned by the backend (GET /api/auth/me).
 * `permissions` is the *effective* set after resolving roles + direct grants,
 * resolved server-side only. Clients use this purely for UI visibility.
 */
export interface AuthUser {
  id: string;
  discord: DiscordUser;
  roles: RoleName[];
  permissions: Permission[];
  createdAt: string;
}

/** Full user record (stored shape). `role` is optional — auth is role-based. */
export interface User {
  id: string;
  discordId: string;
  gamesName?: string;
  createdAt: string;
  player?: Player;
  admin?: Admin;
}

export interface Admin {
  id: string;
  discordId: string;
  role: RoleName;
  permissions: Permission[];
}

export interface Player {
  id: string;
  userId: string;
  fiveMId?: string;
  characterNames?: string[];
  playtimeHours: number;
  ownedVehicles?: string[];
  vip?: boolean;
  money?: number;
}

/* ───────────────────────────── Orders / Payments ───────────────────────────── */

/** Lifecycle of an order. Transitions are enforced server-side only. */
export type OrderStatus =
  | "PENDING"
  | "PAID"
  | "PROCESSING"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED"
  | "REFUNDED";

/** Payment state, tracked independently from the order lifecycle. */
export type PaymentStatus =
  | "UNPAID"
  | "PENDING"
  | "PAID"
  | "FAILED"
  | "REFUNDED"
  | "PARTIALLY_REFUNDED";

/** Which backend owns the payment. MOCK is development-only. */
export type PaymentProviderType = "MANUAL" | "MOCK" | "STRIPE" | "PAYPAL" | "TEBEX";

/** Billing model of a priced product line. */
export type Billing = "MONTHLY" | "ONE_TIME";

/** One priced line of an order. name/image/price are snapshots at order time. */
export interface OrderItem {
  id: string;
  orderId: string;
  productId: number;
  productName: string;
  productNameAr: string | null;
  productImage: string | null;
  quantity: number;
  unitPriceCents: number;
  totalCents: number;
  billing: Billing;
}

/** A full order as stored by the API. Money values are integer cents. */
export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  currency: string;
  subtotalCents: number;
  discountCents: number;
  totalCents: number;
  provider: PaymentProviderType;
  providerOrderId: string | null;
  providerPaymentId: string | null;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

/** Order line as submitted by the client at checkout (the server re-prices). */
export interface CheckoutItem {
  productId: number;
  quantity: number;
}

/** Response of POST /api/orders. checkoutUrl is null when no provider exists. */
export interface CreateOrderResult {
  order: Order;
  checkoutUrl: string | null;
}

/** Lightweight row for order lists (My Orders + Admin Orders). */
export interface OrderSummary {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  currency: string;
  totalCents: number;
  itemCount: number;
  provider: PaymentProviderType;
  createdAt: string;
}

/** Paged response for GET /api/admin/orders. */
export interface PagedOrders {
  orders: OrderSummary[];
  total: number;
  page: number;
  limit: number;
}

/** Admin detail: a full order plus the owning user's display identity. */
export interface AdminOrderRow extends Order {
  user: {
    id: string;
    discordUsername: string;
    discordGlobalName: string | null;
  };
}

/* ───────────────────────────── Applications / Tickets ───────────────────────────── */

export type ApplicationStatus = "pending" | "review" | "accepted" | "rejected";

export interface GameApplication {
  id: string;
  userId?: string;
  type: string;
  status: ApplicationStatus;
  data: Record<string, string>;
  createdAt: string;
}

export interface Ticket {
  id: string;
  userId?: string;
  subject: string;
  body: string;
  status: "open" | "closed";
  createdAt: string;
}

/* ───────────────────────────── Admin / Management ───────────────────────────── */

/** Role hierarchy rank (higher = more privilege). Used for admin management. */
export const ROLE_RANK: Record<RoleName, number> = {
  CONTENT_MANAGER: 1,
  MODERATOR: 2,
  ADMIN: 3,
  OWNER: 4,
};

/** An admin/staff user as listed by GET /api/admins. */
export interface AdminUser {
  id: string;
  discordId: string;
  username: string;
  globalName?: string | null;
  avatar?: string | null;
  roles: RoleName[];
  /** Highest role held (for quick rank display). */
  primaryRole: RoleName | null;
  permissions: Permission[];
  createdAt: string;
  updatedAt?: string;
}

/** Actions recorded in the audit log. */
export type AuditAction =
  | "ADMIN_ADDED"
  | "ADMIN_REMOVED"
  | "ROLE_CHANGED"
  | "PERMISSION_CHANGED"
  | "ORDER_STATUS_UPDATED"
  | "PAYMENT_WEBHOOK_PROCESSED";

/** One audit log entry. */
export interface AuditLogEntry {
  id: string;
  actorUser: string;
  actorRole?: string | null;
  action: AuditAction | string;
  targetUser?: string | null;
  targetResource?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
}

/** Admin dashboard summary — only REAL backend-provided metrics. */
export interface AdminSummary {
  /** Number of authenticated (registered) site users. */
  users: number;
  /** Number of staff accounts (users holding a staff role). */
  staff: number;
  /** Server status from /api/health (may be unavailable). */
  database: "connected" | "unavailable";
  /** True when a metric in the UI is not yet backed by the backend. */
  store: "coming-soon";
  orders: "coming-soon";
  applications: "coming-soon";
  tickets: "coming-soon";
  players: "coming-soon";
}

export interface AddAdminInput {
  discordId: string;
  role: RoleName;
  permissions?: Permission[];
}

export interface ChangeAdminInput {
  role?: RoleName;
  permissions?: Permission[];
}

/* ───────────────────────────── Leaderboards (future) ───────────────────────────── */

export interface LeaderboardEntry {
  name: string;
  value: string;
}

export interface Leaderboard {
  id: string;
  name: string;
  nameAr: string;
  list: LeaderboardEntry[];
}
