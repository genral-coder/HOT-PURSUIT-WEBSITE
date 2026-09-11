import type { ReactNode } from "react";

interface PageHeroProps {
  eyebrow: string;
  title: string;
  subtitle?: string;
  children?: ReactNode;
}

/** Consistent cinematic page header used across all public sections. */
export function PageHero({ eyebrow, title, subtitle, children }: PageHeroProps) {
  return (
    <div className="mb-10">
      <span className="mb-3 inline-block rounded-full border border-line bg-panel px-4 py-1.5 text-xs font-bold uppercase tracking-[0.25em] text-accent">
        {eyebrow}
      </span>
      <h1 className="max-w-3xl text-3xl font-bold leading-tight text-ink sm:text-4xl">
        {title}
      </h1>
      {subtitle && (
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-mute">
          {subtitle}
        </p>
      )}
      {children}
    </div>
  );
}
