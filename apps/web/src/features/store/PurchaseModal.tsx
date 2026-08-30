import { useState } from "react";
import { interpolate } from "@hotpursuit/shared";
import type { Product } from "@hotpursuit/types";
import { useLanguage } from "@/i18n/LanguageContext";
import { Modal } from "@/components/Modal";
import { purchaseRules, paymentMethods } from "@/data/store";
import { siteLinks } from "@/data/site";

interface PurchaseModalProps {
  open: boolean;
  onClose: () => void;
  product: Product;
}

export function PurchaseModal({ open, onClose, product }: PurchaseModalProps) {
  const { t, lang } = useLanguage();
  const [agreed, setAgreed] = useState(false);

  const label = lang === "ar" ? product.nameAr : product.name;
  const discounted =
    lang === "ar" ? product.price : product.price;

  const handleContinue = () => {
    if (!agreed) return;
    const url = siteLinks.discordTicket;
    if (url) {
      window.open(url, "_blank", "noopener,noreferrer");
    }
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={t("dmTitle")}>
      <div className="space-y-4">
        <p
          className="text-sm leading-relaxed text-ink"
          dangerouslySetInnerHTML={{
            __html: interpolate(t("dmText"), {
              name: label ?? product.name,
              price: discounted,
            }),
          }}
        />

        <div className="rounded-lg border border-line bg-panel p-3">
          <div className="mb-2 text-sm font-bold text-ink">{t("secRules")}</div>
          <ul className="space-y-2">
            {purchaseRules.map((r, i) => (
              <li key={i} className="flex gap-2 text-xs leading-relaxed text-mute">
                <span className="mt-0.5 shrink-0 text-accent">•</span>
                <span>{lang === "ar" ? r.ar : r.en}</span>
              </li>
            ))}
          </ul>
        </div>

        <label className="flex cursor-pointer items-start gap-2 text-sm text-ink">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-0.5 h-4 w-4 accent-[#ff2d3f]"
          />
          <span>{t("agreeRules")}</span>
        </label>

        <div>
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

        {!siteLinks.discordTicket && (
          <div className="rounded-lg border border-gold/40 bg-gold/5 p-3 text-xs leading-relaxed text-gold">
            {t("comingSoonTiny")} — غير مُعدّ رابط الديسكورد بعد.
          </div>
        )}

        <button
          type="button"
          disabled={!agreed}
          onClick={handleContinue}
          className="w-full rounded-md bg-accent py-2.5 text-center text-sm font-bold text-white transition-colors hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-40"
        >
          {t("continueDiscord")}
        </button>
      </div>
    </Modal>
  );
}
