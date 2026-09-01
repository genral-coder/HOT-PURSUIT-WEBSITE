/**
 * HOT PURSUIT RP — Media filters.
 */
export interface MediaFilter {
  id: string;
  label: string;
  labelAr: string;
}

export const mediaFilterOptions: MediaFilter[] = [
  { id: "all", label: "All", labelAr: "الكل" },
  { id: "screenshot", label: "Screenshots", labelAr: "لقطات" },
  { id: "video", label: "Videos", labelAr: "فيديوهات" },
  { id: "clip", label: "Clips", labelAr: "مقاطع قصيرة" },
  { id: "art", label: "Art", labelAr: "فنون" },
];
