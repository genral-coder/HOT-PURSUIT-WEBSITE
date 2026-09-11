import { useLanguage } from "@/i18n/LanguageContext";
import { cn } from "@hotpursuit/shared";

interface FavoriteButtonProps {
  active: boolean;
  onToggle: () => void;
  size?: "sm" | "md" | "lg";
  label?: string;
}

const SIZES = {
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-6 w-6",
} as const;

/**
 * SVG heart toggle (no color emoji) so it renders consistently in both LTR
 * and RTL, and matches the dark theme. `active` → filled red, inactive → outline.
 */
export function FavoriteButton({
  active,
  onToggle,
  size = "md",
  label,
}: FavoriteButtonProps) {
  const { t } = useLanguage();
  const text = label ?? (active ? t("likedTitle") : t("likedBtn"));

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onToggle();
      }}
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-full transition-all",
        active
          ? "bg-accent/15 text-accent"
          : "bg-panel text-mute hover:bg-panel-hover hover:text-ink",
      )}
      aria-label={text}
      aria-pressed={active}
      title={text}
    >
      <svg
        viewBox="0 0 24 24"
        className={cn(SIZES[size], "shrink-0")}
        fill={active ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    </button>
  );
}
