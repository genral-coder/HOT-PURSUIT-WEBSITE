/** Normalize a legacy image path (e.g. "images/...") for Vite public serving. */
export function assetUrl(src?: string | null): string | undefined {
  if (!src) return undefined;
  if (/^(https?:)?\/\//.test(src)) return src;
  // Legacy paths are relative to the site root; served from /public in the new app.
  return `/` + src.replace(/^\/+/, "");
}
