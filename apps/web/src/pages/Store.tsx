import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import type { Product, ProductCategoryId } from "@hotpursuit/types";
import { useLanguage } from "@/i18n/LanguageContext";
import { cn } from "@hotpursuit/shared";
import { products } from "@/data/products";
import {
  businessTypes,
  categories,
  vehicleClasses,
} from "@/data/store";
import { useFavorites } from "@/hooks/useFavorites";
import { ProductCard } from "@/features/store/ProductCard";
import { ProductDetailModal } from "@/features/store/ProductDetailModal";

const CAT_IDS = categories.map((c) => c.id);

export function StorePage() {
  const { category: categoryParam } = useParams();
  const { t, lang } = useLanguage();
  const { favorites, isFavorite, toggleFavorite } = useFavorites();

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

  const activeCount =
    activeCat === "all"
      ? products.length
      : products.filter((p) => p.category === activeCat).length;

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
      {/* Category tabs */}
      <nav className="mb-6 flex flex-wrap items-center gap-2">
        <Link
          to="/store"
          className={cn(
            "rounded-full px-4 py-2 text-sm font-bold transition-colors",
            activeCat === "all"
              ? "bg-accent text-white"
              : "border border-line bg-panel text-mute hover:text-ink",
          )}
        >
          {t("storeAll")}
        </Link>
        {categories.map((c) => (
          <Link
            key={c.id}
            to={`/store/${c.id}`}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-bold transition-colors",
              activeCat === c.id
                ? "text-white"
                : "border border-line bg-panel text-mute hover:text-ink",
            )}
            style={
              activeCat === c.id
                ? { background: c.color }
                : undefined
            }
          >
            <span className="me-1">{c.emoji}</span>
            {lang === "ar" ? c.nameAr : c.name}
          </Link>
        ))}
      </nav>

      {/* Toolbar */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="w-full rounded-md border border-line bg-panel px-4 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-mute focus:border-accent"
          />
        </div>

        {activeCat === "mlo" && (
          <select
            value={businessFilter}
            onChange={(e) => setBusinessFilter(e.target.value)}
            className="rounded-md border border-line bg-panel px-3 py-2.5 text-sm text-ink outline-none"
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
            className="rounded-md border border-line bg-panel px-3 py-2.5 text-sm text-ink outline-none"
          >
            <option value="all">{t("vehAll")}</option>
            {vehicleClasses.map((v) => (
              <option key={v.id} value={v.id}>
                Class {v.id} · {v.monthly}/{t("vehMonthly")}
              </option>
            ))}
          </select>
        )}

        <button
          type="button"
          onClick={() => setShowFavorites((s) => !s)}
          className={cn(
            "rounded-md border px-3 py-2.5 text-sm font-bold transition-colors",
            showFavorites
              ? "border-accent bg-accent/15 text-accent"
              : "border-line bg-panel text-mute hover:text-ink",
          )}
        >
          {t("likedBtn")} {favorites.length > 0 && `(${favorites.length})`}
        </button>
      </div>

      {/* Result summary */}
      <div className="mb-4 text-sm text-mute" data-count-test={filtered.length}>
        {query.trim()
          ? t("resultsFor", { q: query.trim() })
          : `${filtered.length} ${filtered.length === 1 ? t("product") : t("products")}`}
      </div>

      {/* Grid */}
      {filtered.length > 0 ? (
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
      ) : (
        <div className="rounded-lg border border-line bg-panel p-10 text-center">
          {query.trim() || showFavorites ? (
            <p
              className="text-sm text-mute"
              dangerouslySetInnerHTML={{
                __html: t("noResults", { q: query.trim() || "…" }),
              }}
            />
          ) : (
            <>
              <div className="mb-2 text-4xl">{t("comingSoon")} 🚧</div>
              <p className="text-sm text-mute">
                {activeCat !== "all" ? t("comingSoonDesc") : t("comingSoonDesc")}
              </p>
              {activeCat === "all" && activeCount > 0 && (
                <p className="mt-2 text-xs text-mute">
                  {activeCount} {t("products")}
                </p>
              )}
            </>
          )}
        </div>
      )}

      <ProductDetailModal product={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
