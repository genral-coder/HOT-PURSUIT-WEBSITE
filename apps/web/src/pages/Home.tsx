import { Link } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { products } from "@/data/products";
import { categories, vehicleClasses, purchaseRules, paymentMethods } from "@/data/store";
import { assetUrl } from "@/utils/media";
import type { Product } from "@hotpursuit/types";
import { useState } from "react";
import { ProductDetailModal } from "@/features/store/ProductDetailModal";

export function HomePage() {
  const { t, lang } = useLanguage();
  const [selected, setSelected] = useState<Product | null>(null);

  const popular = [...products]
    .filter((p) => p.popular && !p.sold)
    .sort((a, b) => (b.likes ?? 0) - (a.likes ?? 0))
    .slice(0, 6);

  const list =
    popular.length > 0 ? popular : products.filter((p) => !p.sold).slice(0, 6);

  return (
    <div>
      {/* Hero */}
      <section className="border-b border-line">
        <div className="mx-auto max-w-7xl px-4 py-16 text-center sm:px-6 sm:py-24">
          <span className="mb-4 inline-block rounded-full border border-line bg-panel px-4 py-1.5 text-sm text-accent">
            {t("heroChip")}
          </span>
          <h1 className="mx-auto mb-4 max-w-3xl text-4xl font-bold leading-tight text-ink sm:text-6xl">
            {t("tagline")}
          </h1>
          <p className="mx-auto mb-8 max-w-2xl text-base leading-relaxed text-mute sm:text-lg">
            {t("heroDesc")}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/store"
              className="rounded-md bg-accent px-6 py-3 text-sm font-bold uppercase tracking-wide text-white transition-colors hover:bg-accent-dark"
            >
              {t("browseStore")}
            </Link>
            <Link
              to="/server"
              className="rounded-md border border-line bg-panel px-6 py-3 text-sm font-bold uppercase tracking-wide text-ink transition-colors hover:border-accent"
            >
              {t("pgServer")}
            </Link>
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-sm text-mute">
            <span>{t("chipSafe")}</span>
            <span>{t("chipSupport")}</span>
          </div>
        </div>
      </section>

      {/* Popular products */}
      {list.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
          <div className="mb-6 flex items-end justify-between">
            <h2 className="text-2xl font-bold text-ink">{t("secPopular")}</h2>
            <Link to="/store" className="text-sm font-semibold text-accent hover:underline">
              {t("viewStore")}
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelected(p)}
                className="group flex items-center gap-3 rounded-lg border border-line bg-panel p-3 text-start transition-colors hover:border-accent"
              >
                {p.image ? (
                  <img
                    src={assetUrl(p.image)}
                    alt={p.name}
                    className="h-16 w-16 shrink-0 rounded-md object-cover"
                  />
                ) : (
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-md bg-bg-soft text-2xl">
                    {categories.find((c) => c.id === p.category)?.emoji}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="truncate text-sm font-bold text-ink">
                    {lang === "ar" ? p.nameAr : p.name}
                  </div>
                  <div className="text-sm font-semibold text-gold">{p.price}</div>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Categories */}
      <section className="border-y border-line bg-bg-soft/50">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
          <h2 className="mb-6 text-2xl font-bold text-ink">{t("secCategories")}</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {categories.map((c) => (
              <Link
                key={c.id}
                to={`/store/${c.id}`}
                className="group rounded-lg border border-line bg-panel p-5 text-center transition-all hover:border-[var(--cat-color)]"
                style={{ ["--cat-color" as string]: c.color }}
              >
                <div className="mb-2 text-4xl">{c.emoji}</div>
                <div className="text-base font-bold text-ink">
                  {lang === "ar" ? c.nameAr : c.name}
                </div>
                <div className="mt-1 text-xs text-mute">
                  {products.filter((p) => p.category === c.id).length}{" "}
                  {t("products")}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Vehicle classes */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <h2 className="mb-6 text-2xl font-bold text-ink">{t("vehClassesTitle")}</h2>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {vehicleClasses.map((vc) => (
            <div
              key={vc.id}
              className="rounded-lg border border-line bg-panel p-5"
              style={{ borderTopColor: vc.color, borderTopWidth: 3 }}
            >
              <div className="mb-2 text-sm font-bold" style={{ color: vc.color }}>
                Class {vc.id}
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between text-mute">
                  <span>{t("vehMonthly")}</span>
                  <span className="font-bold text-ink">{vc.monthly}</span>
                </div>
                <div className="flex justify-between text-mute">
                  <span>{t("vehSeason")}</span>
                  <span className="font-bold text-ink">{vc.season}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Purchase rules */}
      <section className="border-y border-line bg-bg-soft/50">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
          <div className="mb-6 flex items-end justify-between">
            <h2 className="text-2xl font-bold text-ink">{t("secRules")}</h2>
            <Link to="/store" className="text-sm font-semibold text-accent hover:underline">
              {t("viewStore")}
            </Link>
          </div>
          <ul className="grid gap-3 md:grid-cols-2">
            {purchaseRules.map((r, i) => (
              <li
                key={i}
                className="flex gap-2 rounded-lg border border-line bg-panel p-4 text-sm leading-relaxed text-mute"
              >
                <span className="mt-0.5 shrink-0 text-accent">•</span>
                <span>{lang === "ar" ? r.ar : r.en}</span>
              </li>
            ))}
          </ul>
          <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-mute">
            <span>{t("payLabel")}</span>
            <div className="flex gap-2">
              {paymentMethods.map((m) => (
                <span
                  key={m.id}
                  title={lang === "ar" ? m.nameAr : m.name}
                  className="flex h-10 w-10 items-center justify-center rounded-md border border-line bg-panel p-2 text-mute"
                >
                  <span dangerouslySetInnerHTML={{ __html: m.icon }} />
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 py-16 text-center sm:px-6">
        <h2 className="mb-3 text-3xl font-bold text-ink">{t("ctaTitle")}</h2>
        <p className="mx-auto mb-6 max-w-xl text-mute">{t("ctaText")}</p>
        <Link
          to="/store"
          className="inline-block rounded-md bg-accent px-8 py-3 text-sm font-bold uppercase tracking-wide text-white transition-colors hover:bg-accent-dark"
        >
          {t("viewStore")}
        </Link>
      </section>

      <ProductDetailModal product={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
