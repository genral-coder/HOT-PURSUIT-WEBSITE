/**
 * HOT PURSUIT RP — Shared utilities (framework-agnostic).
 */

/** Join class names, dropping falsy values. */
export function cn(...args: Array<string | false | null | undefined>): string {
  return args.filter(Boolean).join(" ");
}

/** Simple cache-safe localStorage helpers (guarded for SSR). */
export const storage = {
  get<T>(key: string, fallback: T): T {
    if (typeof localStorage === "undefined") return fallback;
    try {
      const raw = localStorage.getItem(key);
      return raw === null ? fallback : (JSON.parse(raw) as T);
    } catch {
      return fallback;
    }
  },
  set(key: string, value: unknown): void {
    if (typeof localStorage === "undefined") return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* ignore */
    }
  },
  remove(key: string): void {
    if (typeof localStorage === "undefined") return;
    try {
      localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  },
};

/** Replace {placeholders} in a translated string. */
export function interpolate(
  template: string,
  values: Record<string, string | number>,
): string {
  return template.replace(/\{(\w+)\}/g, (_, key) =>
    key in values ? String(values[key]) : `{${key}}`,
  );
}

export function isArabicLang(lang: string): boolean {
  return lang === "ar";
}

/** Simple id generator for seed/sample records. */
export function uid(prefix = "id"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}
