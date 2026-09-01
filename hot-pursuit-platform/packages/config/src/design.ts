/**
 * HOT PURSUIT RP — Design tokens
 * Migrated from the legacy dark-cinematic theme (style.css).
 * Used to configure Tailwind so the new app keeps the exact HOT PURSUIT identity.
 */
export const design = {
  colors: {
    /** Main background */
    bg: "#0b0b0e",
    /** Soft card background */
    "bg-soft": "#131318",
    /** Subtle white overlay for panels */
    panel: "rgba(255,255,255,0.045)",
    "panel-hover": "rgba(255,255,255,0.08)",
    border: "rgba(255,255,255,0.09)",
    /** Main accent (red) */
    accent: "#ff2d3f",
    "accent-dark": "#b31224",
    "accent-glow": "rgba(255,45,63,0.35)",
    text: "#f2f2f5",
    muted: "#9a9aa5",
    gold: "#ffc24b",
    green: "#3ddc84",
  },
  radius: {
    DEFAULT: "16px",
    sm: "10px",
    md: "14px",
    lg: "20px",
  },
  fonts: {
    display: "'Rajdhani','Segoe UI',system-ui,sans-serif",
    body: "'Rajdhani','Segoe UI',system-ui,sans-serif",
    mono: "ui-monospace,SFMono-Regular,Menlo,monospace",
  },
} as const;

export type Design = typeof design;
