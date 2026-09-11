/**
 * HOT PURSUIT RP — Server page data.
 *
 * Static/informational content is migrated from the legacy site-config.js
 * (description, region, player limit). DYNAMIC live values (players online,
 * status, uptime, ping, address) are intentionally left as an explicit
 * "coming soon"/unavailable state — NEVER faked. A future FiveM/cfx.re
 * integration will feed these through a data-access layer.
 */
import type { ServerStatus } from "@hotpursuit/types";

export const serverInfo: ServerStatus = {
  /** No live API yet → the UI must render "live data not connected". */
  mock: true,
  online: false,
  name: "HOT PURSUIT RP",
  description:
    "HOT PURSUIT RP is a premium FiveM roleplay experience where your choices shape your story. Create depth, build reputation, and write your own story in the city.",
  tagline: "YOUR STORY. YOUR RULES.",
  playerLimit: 200,
  region: "Global / MENA",
  ip: "",
  port: "30120",
};

/** Static jobs/departments description has its own data module (public.ts). */

/** How-to-play / join steps (informational, migrated intent — no fake data). */
export interface JoinStep {
  id: string;
  title: string;
  titleAr: string;
  text: string;
  textAr: string;
}

export const joinSteps: JoinStep[] = [
  {
    id: "discord",
    title: "Join the Discord",
    titleAr: "انضم إلى الديسكورد",
    text: "Create your account and join our community to get news, support and whitelist information.",
    textAr: "أنشئ حسابك وانضم إلى مجتمعنا لتحصل على الأخبار والدعم ومعلومات تقديم الطلبات.",
  },
  {
    id: "download",
    title: "Download FiveM",
    titleAr: "حمّل FiveM",
    text: "Install the FiveM client and make sure your game meets the server requirements.",
    textAr: "ثبّت عميل FiveM وتأكد من أن جهازك يلبي متطلبات السيرفر.",
  },
  {
    id: "connect",
    title: "Connect to the server",
    titleAr: "اتصل بالسيرفر",
    text: "Use the server address to connect. The connection address will appear here once the server is live.",
    textAr: "استخدم عنوان السيرفر للاتصال. سيظهر عنوان الاتصال هنا بمجرد تشغيل السيرفر.",
  },
];
