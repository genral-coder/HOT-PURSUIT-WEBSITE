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

/* ───────────────────────────── Users / Auth (future backend) ───────────────────────────── */

export interface DiscordUser {
  id: string;
  username: string;
  displayName: string;
  avatar?: string | null;
  /** True when the account is verified via Discord. */
  verified: boolean;
}

export interface User {
  id: string;
  discordId: string;
  gamesName?: string;
  createdAt: string;
  player?: Player;
  admin?: Admin;
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

/* ───────────────────────────── Admin / permissions ───────────────────────────── */

export type AdminRole = "OWNER" | "ADMIN" | "MODERATOR" | "CONTENT_MANAGER";

export type Permission =
  | "store"
  | "orders"
  | "applications"
  | "tickets"
  | "news"
  | "media"
  | "players"
  | "server"
  | "settings";

/** Default permission set per role (seed data). */
export const ROLE_PERMISSIONS: Record<AdminRole, Permission[]> = {
  OWNER: [
    "store",
    "orders",
    "applications",
    "tickets",
    "news",
    "media",
    "players",
    "server",
    "settings",
  ],
  ADMIN: ["store", "orders", "applications", "tickets", "news", "players"],
  MODERATOR: ["applications", "tickets"],
  CONTENT_MANAGER: ["news", "media"],
};

export interface Admin {
  id: string;
  discordId: string;
  role: AdminRole;
  permissions: Permission[];
}

/* ───────────────────────────── Orders / Purchases ───────────────────────────── */

export type OrderStatus = "pending" | "paid" | "processing" | "delivered" | "cancelled";

export interface OrderItem {
  productId: number;
  price: string;
  quantity: number;
}

export interface Order {
  id: string;
  userId?: string;
  items: OrderItem[];
  status: OrderStatus;
  createdAt: string;
  note?: string;
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
