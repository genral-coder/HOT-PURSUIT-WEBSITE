import type { Leaderboard } from "@hotpursuit/types";

/**
 * Leaderboard categories available on the public Leaderboards page.
 *
 * Live standings are NOT available yet (no live FiveM API connected), so each
 * category ships with an EMPTY list and the page renders an explicit
 * "coming soon / not connected" state. These records already conform to the
 * shared `Leaderboard` type so a future backend can replace the empty lists
 * without a schema change.
 */
export const leaderboardCategories: Leaderboard[] = [
  { id: "rich", name: "Richest Players", nameAr: "الأغنى", list: [] },
  { id: "crim", name: "Top Criminals", nameAr: "أخطر المجرمين", list: [] },
  { id: "wanted", name: "Most Wanted", nameAr: "الأكثر طلباً", list: [] },
  { id: "cop", name: "Top Cops", nameAr: "أفضل الشرطة", list: [] },
  { id: "staff", name: "Staff Activity", nameAr: "نشاط الإدارة", list: [] },
];