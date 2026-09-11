import type { Product } from "@hotpursuit/types";
import { useLanguage } from "@/i18n/LanguageContext";
import { assetUrl } from "@/utils/media";
import { businessTypeMap, categoryMap, vehicleClassMap } from "@/data/store";
import { FavoriteButton } from "./FavoriteButton";

interface ProductCardProps {
  product: Product;
  favorite: boolean;
  onToggleFavorite: (id: number) => void;
  onOpen: (product: Product) => void;
}

function LocalizedText({ en, ar }: { en?: string; ar?: string }) {
  const { lang } = useLanguage();
  return <>{lang === "ar" && ar ? ar : en ?? ""}</>;
}

export function ProductCard({
  product,
  favorite,
  onToggleFavorite,
  onOpen,
}: ProductCardProps) {
  const { t, lang } = useLanguage();
  const cat = categoryMap[product.category];
  const biz = product.type ? businessTypeMap[product.type] : null;
  const vc = product.class ? vehicleClassMap[product.class] : null;

  return (
    <article
      onClick={() => onOpen(product)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen(product);
        }
      }}
      className="group relative flex cursor-pointer flex-col overflow-hidden rounded-lg border border-line bg-panel transition-all duration-300 hover:-translate-y-0.5 hover:border-[var(--cat-color)] hover:shadow-lg hover:shadow-black/30"
      style={{ ["--cat-color" as string]: cat?.color ?? "#ff2d3f" }}
    >
      {/* Image */}
      <div className="relative block aspect-[4/3] w-full overflow-hidden bg-bg-soft">
        {product.image ? (
          <img
            src={assetUrl(product.image)}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-5xl">
            {vc ? <span>🚗</span> : cat?.emoji}
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 flex items-end justify-center bg-gradient-to-t from-black/70 via-black/10 to-transparent p-3 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <span className="rounded-md bg-white/95 px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-black">
            {t("details")}
          </span>
        </div>

        <div className="absolute top-2 start-2 flex flex-wrap gap-1.5">
          {product.popular && (
            <span className="rounded-full bg-accent px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white">
              {t("popularBadge")}
            </span>
          )}
          {product.new && (
            <span className="rounded-full bg-gold px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-black">
              {t("newBadge")}
            </span>
          )}
          {product.sold && (
            <span className="rounded-full bg-black/70 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white">
              {t("soldBadge")}
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col p-3.5">
        <div className="mb-1.5 flex items-center justify-between gap-2">
          <span
            className="truncate text-[11px] font-semibold uppercase tracking-wider"
            style={{ color: cat?.color }}
          >
            {lang === "ar" ? cat?.nameAr : cat?.name}
            {vc ? ` · ${vc.id}` : ""}
          </span>
          <FavoriteButton
            active={favorite}
            onToggle={() => onToggleFavorite(product.id)}
            size="sm"
          />
        </div>

        <h3 className="mb-1 line-clamp-1 text-base font-bold leading-tight text-ink">
          <LocalizedText en={product.name} ar={product.nameAr} />
        </h3>

        <p className="mb-3 line-clamp-2 text-sm leading-snug text-mute">
          <LocalizedText en={product.short} ar={product.shortAr} />
        </p>

        {biz && (
          <div className="mb-2 flex items-center gap-1.5 text-xs text-mute">
            <span>{biz.emoji}</span>
            <span className="truncate">
              {lang === "ar" ? biz.nameAr : biz.name}
            </span>
          </div>
        )}

        <div className="mt-auto flex items-center justify-between gap-2 pt-2">
          <span className="text-base font-bold text-gold">{product.price}</span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpen(product);
            }}
            className="rounded-md bg-accent px-3 py-1.5 text-sm font-bold text-white transition-colors hover:bg-accent-dark"
          >
            {t("donate")}
          </button>
        </div>
      </div>
    </article>
  );
}
