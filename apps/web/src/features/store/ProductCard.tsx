import type { Product } from "@hotpursuit/types";
import { useLanguage } from "@/i18n/LanguageContext";
import { assetUrl } from "@/utils/media";
import {
  businessTypeMap,
  categoryMap,
  vehicleClassMap,
} from "@/data/store";

interface ProductCardProps {
  product: Product;
  favorite: boolean;
  onToggleFavorite: (id: number) => void;
  onOpen: (product: Product) => void;
}

function LocalizedText({
  en,
  ar,
}: {
  en?: string;
  ar?: string;
}) {
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
      className="group relative flex flex-col overflow-hidden rounded-md border border-line bg-panel transition-all duration-300 hover:border-[var(--cat-color)] hover:bg-panel-hover"
      style={{ ["--cat-color" as string]: cat?.color ?? "#ff2d3f" }}
    >
      {/* Image */}
      <button
        type="button"
        onClick={() => onOpen(product)}
        className="relative block aspect-[4/3] w-full overflow-hidden bg-bg-soft"
        aria-label={product.name}
      >
        {product.image ? (
          <img
            src={assetUrl(product.image)}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-4xl">
            {cat?.emoji}
          </div>
        )}

        <div className="absolute top-2 flex flex-wrap gap-1.5 ps-2">
          {product.popular && (
            <span className="rounded-full bg-accent px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white shadow-accent-glow">
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
      </button>

      {/* Body */}
      <div className="flex flex-1 flex-col p-3">
        <div className="mb-1 flex items-center justify-between gap-2">
          <span
            className="text-[11px] font-semibold uppercase tracking-wider"
            style={{ color: cat?.color }}
          >
            {lang === "ar" ? cat?.nameAr : cat?.name}
            {vc ? ` · ${vc.id}` : ""}
          </span>
          <button
            type="button"
            onClick={() => onToggleFavorite(product.id)}
            className="text-lg leading-none transition-transform hover:scale-110"
            aria-label={
              favorite ? t("likedTitle") : t("likedBtn")
            }
          >
            <span className={favorite ? "text-accent" : "text-mute"}>
              {favorite ? "❤️" : "🤍"}
            </span>
          </button>
        </div>

        <h3 className="mb-1 text-base font-bold leading-tight text-ink">
          <LocalizedText en={product.name} ar={product.nameAr} />
        </h3>

        <p className="mb-3 line-clamp-2 text-sm leading-snug text-mute">
          <LocalizedText en={product.short} ar={product.shortAr} />
        </p>

        {biz && (
          <div className="mb-2 flex items-center gap-1.5 text-xs text-mute">
            <span>{biz.emoji}</span>
            <span>{lang === "ar" ? biz.nameAr : biz.name}</span>
          </div>
        )}

        <div className="mt-auto flex items-center justify-between gap-2">
          <span className="text-base font-bold text-gold">
            {lang === "ar" ? product.price : product.price}
          </span>
          <button
            type="button"
            onClick={() => onOpen(product)}
            className="rounded-md bg-accent px-3 py-1.5 text-sm font-bold text-white transition-colors hover:bg-accent-dark"
          >
            {t("details")}
          </button>
        </div>
      </div>
    </article>
  );
}
