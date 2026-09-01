import { useState, type ReactNode } from "react";
import { cn } from "@hotpursuit/shared";

interface AccordionItem {
  id: string;
  title: ReactNode;
  content: ReactNode;
}

interface AccordionProps {
  items: AccordionItem[];
  /** Allow multiple open items at once (default true). */
  multiple?: boolean;
  className?: string;
}

/**
 * Accessible, animated accordion. Used by the Rules page and Support FAQ.
 * Keyboard accessible (native buttons), ARIA expanded/controls wired up.
 */
export function Accordion({ items, multiple = true, className }: AccordionProps) {
  const [open, setOpen] = useState<Record<string, boolean>>({});

  const toggle = (id: string) => {
    setOpen((prev) => {
      if (multiple) {
        return { ...prev, [id]: !prev[id] };
      }
      // Single-open: close others.
      const next: Record<string, boolean> = {};
      if (!prev[id]) next[id] = true;
      return next;
    });
  };

  return (
    <div className={cn("space-y-3", className)}>
      {items.map((item) => {
        const isOpen = !!open[item.id];
        return (
          <div
            key={item.id}
            className="overflow-hidden rounded-lg border border-line bg-panel"
          >
            <h3 className="m-0">
              <button
                type="button"
                onClick={() => toggle(item.id)}
                aria-expanded={isOpen}
                aria-controls={`acc-panel-${item.id}`}
                className="flex w-full items-center justify-between gap-3 px-5 py-4 text-start text-sm font-bold text-ink transition-colors hover:bg-panel-hover"
              >
                <span>{item.title}</span>
                <span
                  className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-line text-accent transition-transform",
                    isOpen && "rotate-180",
                  )}
                  aria-hidden="true"
                >
                  ▾
                </span>
              </button>
            </h3>
            {isOpen && (
              <div
                id={`acc-panel-${item.id}`}
                className="animate-fade-in border-t border-line px-5 py-4"
              >
                {item.content}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
