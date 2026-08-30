import { useState } from "react";
import type { Product } from "@hotpursuit/types";
import { useLanguage } from "@/i18n/LanguageContext";
import { Modal } from "@/components/Modal";
import { assetUrl } from "@/utils/media";
import {
  businessTypeMap,
  categoryMap,
  paymentMethods,
  vehicleClassMap,
} from "@/data/store";
import { PurchaseModal } from "./PurchaseModal";

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
}

export function ProductDetailModal({
  product,
  onClose,
}: ProductDetailModalProps) {
  const { t, lang } = useLanguage();
  const [purchasing, setPurchasing] = useState(false);

  if (!product) return null;

  const cat = categoryMap[product.category];
  const biz = product.type ? businessTypeMap[product.type] : null;
  const vc = product.class ? vehicleClassMap[product.class] : null;

  const label = lang === "ar" ? product.nameAr : product.name;
  const desc = lang === "ar" ? product.descriptionAr : product.description;
  const features =
    (lang === "ar" ? product.featuresAr : product.features) ?? product.features;

  return (
    <>
      <Modal open={!!product} onClose={onClose} wide title={label ?? product.name}>
        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <div className="overflow-hidden rounded-lg border border-line bg-bg-soft">
              {product.image ? (
                <img
                  src={assetUrl(product.image)}
                  alt={product.name}
                  className="aspect-[4/3] w-full object-cover"
                />
              ) : (
                <div className="flex aspect-[4/3] w-full items-center justify-center text-6xl">
                  {cat?.emoji}
                </div>
              )}
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
              <span
                className="rounded-full px-2.5 py-1 text-xs font-semibold"
                style={{ background: `${cat?.color}22`, color: cat?.color }}
              >
                {lang === "ar" ? cat?.nameAr : cat?.name}
              </span>
              {biz && (
                <span className="rounded-full border border-line bg-panel px-2.5 py-1 text-xs text-mute">
                  {biz.emoji} {lang === "ar" ? biz.nameAr : biz.name}
                </span>
              )}
              {vc && (
                <span
                  className="rounded-full px-2.5 py-1 text-xs font-semibold"
                  style={{ background: `${vc.color}22`, color: vc.color }}
                >
                  Class {vc.id}
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col">
            <div className="mb-1 text-3xl font-bold text-ink">
              {label ?? product.name}
            </div>
            <div className="mb-3 text-xl font-bold text-gold">
              {product.price}
            </div>

            {vc && (
              <div className="mb-3 grid grid-cols-2 gap-2 rounded-lg border border-line bg-panel p-3 text-sm">
                <div>
                  <div className="text-xs text-mute">{t("vehMonthly")}</div>
                  <div className="font-bold text-ink">{vc.monthly}</div>
                </div>
                <div>
                  <div className="text-xs text-mute">{t("vehSeason")}</div>
                  <div className="font-bold text-ink">{vc.season}</div>
                </div>
              </div>
            )}

            {desc && (
              <p className="mb-4 text-sm leading-relaxed text-mute">{desc}</p>
            )}

            {features && features.length > 0 && (
              <div className="mb-4">
                <div className="mb-2 text-sm font-bold text-ink">
                  {t("features")}
                </div>
                <ul className="space-y-1.5">
                  {features.map((f, i) => (
                    <li key={i} className="flex gap-2 text-sm text-mute">
                      <span className="text-accent">✓</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mb-4">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-mute">
                {t("payLabel")}
              </div>
              <div className="flex flex-wrap gap-2">
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

            <button
              type="button"
              onClick={() => setPurchasing(true)}
              className="mt-auto w-full rounded-md bg-accent py-3 text-center text-sm font-bold uppercase tracking-wide text-white transition-colors hover:bg-accent-dark"
            >
              {t("donateBtn")}
            </button>
          </div>
        </div>
      </Modal>

      <PurchaseModal
        open={purchasing}
        onClose={() => setPurchasing(false)}
        product={product}
      />
    </>
  );
}
