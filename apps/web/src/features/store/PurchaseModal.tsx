import { useState } from "react";
import { interpolate } from "@hotpursuit/shared";
import type { Product } from "@hotpursuit/types";
import { useLanguage } from "@/i18n/LanguageContext";
import { Modal } from "@/components/Modal";
import { purchaseRules, paymentMethods } from "@/data/store";
import { siteLinks } from "@/data/site";
import { PurchaseRulesModal } from "./PurchaseRulesModal";

interface PurchaseModalProps {
  open: boolean;
  onClose: () => void;
  product: Product;
}

/**
 * Purchase confirmation. Rules are shown and MUST be accepted before the user
 * can continue to Discord (preserves the legacy enforce-rules-first behavior).
 * The Discord target falls back discordTicket → discord, matching the original.
 */
export function PurchaseModal({ open, onClose, product }: PurchaseModalProps) {
  const { t, lang } = useLanguage();
  const [agreed, setAgreed] = useState(false);
  const [toast, setToast] = useState(false);
  const [rulesOpen, setRulesOpen] = useState(false);

  const label = lang === "ar" ? product.nameAr : product.name;
  const discordUrl = siteLinks.discordTicket || siteLinks.discord;

  const handleContinue = () => {
    if (!agreed) return;
    if (discordUrl) {
      setToast(true);
      setTimeout(() => setToast(false), 2400);
      setTimeout(() => window.open(discordUrl, "_blank", "noopener,noreferrer"), 250);
    }
    if (!discordUrl) onClose();
  };

  return (
    <>
      <Modal open={open} onClose={onClose} title={t("dmTitle")}>
        <div className="space-y-4">
          <p
            className="text-sm leading-relaxed text-ink"
            dangerouslySetInnerHTML={{
              __html: interpolate(t("dmText"), {
                name: label ?? product.name,
                price: product.price,
              }),
            }}
          />

          <div className="rounded-lg border border-line bg-panel p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="text-sm font-bold text-ink">{t("secRules")}</span>
              <button
                type="button"
                onClick={() => setRulesOpen(true)}
                className="text-xs font-semibold text-accent hover:underline"
              >
                {t("viewFullRules")}
              </button>
            </div>
            <ol className="space-y-2">
              {purchaseRules.slice(0, 4).map((r, i) => (
                <li key={i} className="flex gap-2 text-xs leading-relaxed text-mute">
                  <span className="mt-0.5 shrink-0 font-bold text-accent">
                    {i + 1}.
                  </span>
                  <span>{lang === "ar" ? r.ar : r.en}</span>
                </li>
              ))}
              <li className="flex gap-2 text-xs leading-relaxed text-mute">
                <span className="mt-0.5 shrink-0 text-gold">…</span>
                <span>{t("moreRulesHint")}</span>
              </li>
            </ol>
          </div>

          <label className="flex cursor-pointer items-start gap-2 text-sm text-ink">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 accent-[#ff2d3f]"
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

          {!discordUrl && (
            <div className="rounded-lg border border-gold/40 bg-gold/5 p-3 text-xs leading-relaxed text-gold">
              {lang === "ar"
                ? "لم يتم ضبط رابط الديسكورد بعد. سيتم تفعيل الشراء فور ارتباط الديسكورد."
                : "The Discord ticket link is not configured yet. Purchasing will be enabled once Discord is connected."}
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

      {/* Toast */}
      <div
        className={
          "pointer-events-none fixed bottom-5 start-1/2 z-[60] -translate-x-1/2 rounded-md bg-accent px-4 py-2 text-sm font-bold text-white shadow-accent-glow transition-opacity duration-300 " +
          (toast ? "opacity-100" : "opacity-0")
        }
        aria-live="polite"
      >
        {t("openingDiscord")}
      </div>

      <PurchaseRulesModal
        open={rulesOpen}
        onClose={() => setRulesOpen(false)}
        includeVehicleRules={product.category === "vehicles"}
      />
    </>
  );
}
