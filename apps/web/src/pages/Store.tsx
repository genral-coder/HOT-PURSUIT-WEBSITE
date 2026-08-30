import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import type { Product, ProductCategoryId } from "@hotpursuit/types";
import { useLanguage } from "@/i18n/LanguageContext";
import { cn } from "@hotpursuit/shared";
import { products } from "@/data/products";
import { businessTypes, categories, vehicleClasses } from "@/data/store";
import { useFavorites } from "@/hooks/useFavorites";
import { ProductCard } from "@/features/store/ProductCard";
import { ProductDetailModal } from "@/features/store/ProductDetailModal";
import { PurchaseRulesModal } from "@/features/store/PurchaseRulesModal";

const CAT_IDS = categories.map((c) => c.id);

export function StorePage() {
  const { category: categoryParam } = useParams();
  const { t, lang } = useLanguage();
  const { favorites, count, isFavorite, toggleFavorite } = useFavorites();

  const activeCat: ProductCategoryId | "all" = CAT_IDS.includes(
    categoryParam as ProductCategoryId,
  )
    ? (categoryParam as ProductCategoryId)
    : "all";

  const [businessFilter, setBusinessFilter] = useState<string>("all");
  const [classFilter, setClassFilter] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [showFavorites, setShowFavorites] = useState(false);
  const [selected, setSelected] = useState<Product | null>(null);
  const [rulesOpen, setRulesOpen] = useState(false);

  const filtered = useMemo(() => {
    let list = products.filter(
      (p) => activeCat === "all" || p.category === activeCat,
    );
    if (activeCat === "mlo" && businessFilter !== "all") {
      list = list.filter((p) => p.type === businessFilter);
    }
    if (activeCat === "vehicles" && classFilter !== "all") {
      list = list.filter((p) => p.class === classFilter);
    }
    if (showFavorites) list = list.filter((p) => favorites.includes(p.id));
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.nameAr ?? "").toLowerCase().includes(q) ||
          (p.short ?? "").toLowerCase().includes(q),
      );
    }
    return list;
  }, [activeCat, businessFilter, classFilter, query, showFavorites, favorites]);

  const searchActive = query.trim().length > 0;
  const isEmptyFavoritesView = showFavorites && favorites.length === 0;
  const isEmptyResults = filtered.length === 0;

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
      {/* Page heading */}
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-ink sm:text-3xl">
          HOT <span className="text-accent">PURSUIT</span> {t("pgStore")}
        </h1>
        <p className="mt-1 text-sm text-mute">
          {t("browse")} · {lang === "ar" ? "ترقب التحديثات" : "Stay updated with new drops"}
        </p>
      </div>

      {/* Unified Store navigation (scrolls horizontally on small screens) */}
      <div className="no-scrollbar -mx-4 mb-6 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <div className="flex items-center gap-2 whitespace-nowrap">
          {/* Category tabs */}
          <Link
            to="/store"
            onClick={() => setShowFavorites(false)}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-bold transition-colors",
              activeCat === "all" && !showFavorites
                ? "bg-accent text-white shadow-accent-glow"
                : "border border-line bg-panel text-mute hover:border-accent/50 hover:text-ink",
            )}
          >
            {t("storeAll")}
          </Link>
          {categories.map((c) => {
            const isActive =
              activeCat === c.id && !showFavorites;
            return (
              <Link
                key={c.id}
                to={`/store/${c.id}`}
                onClick={() => setShowFavorites(false)}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-bold transition-all",
                  isActive
                    ? "text-white"
                    : "border border-line bg-panel text-mute hover:border-[var(--cat-color)] hover:text-ink",
                )}
                style={isActive ? { background: c.color } : undefined}
              >
                <span className="me-1">{c.emoji}</span>
                {lang === "ar" ? c.nameAr : c.name}
              </Link>
            );
          })}

          {/* Divider */}
          <span
            className="mx-1 h-6 w-px shrink-0 bg-line"
            aria-hidden="true"
          />

          {/* Favorites tab */}
          <button
            type="button"
            onClick={() => setShowFavorites((s) => !s)}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-bold transition-colors",
              showFavorites
                ? "bg-accent/15 text-accent ring-1 ring-accent"
                : "border border-line bg-panel text-mute hover:border-accent/50 hover:text-ink",
            )}
          >
            <span className="me-1">{showFavorites ? "❤️" : "🤍"}</span>
            {t("likedTitle")}
            {count > 0 && (
              <span
                className={cn(
                  "ms-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[11px] font-bold",
                  showFavorites ? "bg-accent text-white" : "bg-panel text-mute",
                )}
              >
                {count}
              </span>
            )}
          </button>

          {/* Purchase Rules tab */}
          <button
            type="button"
            onClick={() => setRulesOpen(true)}
            className="rounded-full border border-line bg-panel px-4 py-2 text-sm font-bold text-mute transition-colors hover:border-gold/60 hover:text-gold"
          >
            <span className="me-1">🛡</span>
            {t("secRules")}
          </button>
        </div>
      </div>

      {/* Toolbar (search + contextual filters) */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1">
          <span className="pointer-events-none absolute start-3.5 top-1/2 -translate-y-1/2 text-mute">
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="w-full rounded-md border border-line bg-panel py-2.5 pe-4 ps-10 text-sm text-ink outline-none transition-colors placeholder:text-mute focus:border-accent"
          />
        </div>

        {activeCat === "mlo" && (
          <select
            value={businessFilter}
            onChange={(e) => setBusinessFilter(e.target.value)}
            aria-label="Business type filter"
            className="rounded-md border border-line bg-panel px-3 py-2.5 text-sm text-ink outline-none focus:border-accent"
          >
            <option value="all">{t("storeAll")}</option>
            {businessTypes.map((b) => (
              <option key={b.id} value={b.id}>
                {b.emoji} {lang === "ar" ? b.nameAr : b.name}
              </option>
            ))}
          </select>
        )}

        {activeCat === "vehicles" && (
          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            aria-label="Vehicle class filter"
            className="rounded-md border border-line bg-panel px-3 py-2.5 text-sm text-ink outline-none focus:border-accent"
          >
            <option value="all">{t("vehAll")}</option>
            {vehicleClasses.map((v) => (
              <option key={v.id} value={v.id}>
                Class {v.id} · {v.monthly}/{t("vehMonthly")}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Result summary */}
      <div
        className="mb-4 text-sm text-mute"
        data-count-test={filtered.length}
      >
        {searchActive
          ? t("resultsFor", { q: query.trim() })
          : `${filtered.length} ${filtered.length === 1 ? t("product") : t("products")}`}
      </div>

      {/* Empty states */}
      {isEmptyFavoritesView ? (
        <div className="rounded-lg border border-line bg-panel p-12 text-center">
          <div className="mb-3 text-4xl">🤍</div>
          <h2 className="mb-2 text-lg font-bold text-ink">{t("likedTitle")}</h2>
          <p className="mx-auto max-w-md text-sm leading-relaxed text-mute">
            {t("likedEmpty")}
          </p>
          <button
            type="button"
            onClick={() => setShowFavorites(false)}
            className="mt-5 rounded-md bg-accent px-5 py-2 text-sm font-bold text-white transition-colors hover:bg-accent-dark"
          >
            {t("browseStore")}
          </button>
        </div>
      ) : isEmptyResults ? (
        <div className="rounded-lg border border-line bg-panel p-10 text-center">
          {searchActive ? (
            <>
              <div className="mb-2 text-3xl">🔍</div>
              <p
                className="text-sm text-mute"
                dangerouslySetInnerHTML={{
                  __html: t("noResults", { q: query.trim() }),
                }}
              />
            </>
          ) : (
            <>
              <div className="mb-2 text-4xl">🚧</div>
              <div className="mb-1 text-lg font-bold text-ink">
                {t("comingSoon")}
              </div>
              <p className="text-sm text-mute">{t("comingSoonDesc")}</p>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              favorite={isFavorite(p.id)}
              onToggleFavorite={toggleFavorite}
              onOpen={setSelected}
            />
          ))}
        </div>
      )}

      <ProductDetailModal
        product={selected}
        onClose={() => setSelected(null)}
        favorite={selected ? isFavorite(selected.id) : false}
        onToggleFavorite={toggleFavorite}
      />
      <PurchaseRulesModal
        open={rulesOpen}
        onClose={() => setRulesOpen(false)}
        includeVehicleRules={activeCat === "vehicles"}
      />
    </div>
  );
}
