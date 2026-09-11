import { useEffect, type ReactNode } from "react";
import { cn } from "@hotpursuit/shared";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
  wide?: boolean;
}

/**
 * Shared modal used across the Store (product details, purchase rules).
 * Provides Escape/backdrop close, scroll-lock and a sticky header.
 */
export function Modal({ open, onClose, title, children, wide }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={cn(
          "max-h-[88vh] w-full overflow-y-auto rounded-lg border border-line bg-bg-soft shadow-2xl",
          wide ? "max-w-3xl" : "max-w-lg",
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-line bg-bg-soft/95 px-5 py-3 backdrop-blur">
          <div className="text-lg font-bold text-ink">{title}</div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-2 py-1 text-mute transition-colors hover:bg-panel hover:text-ink"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
