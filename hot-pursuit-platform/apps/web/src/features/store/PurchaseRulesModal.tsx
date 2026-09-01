import { useLanguage } from "@/i18n/LanguageContext";
import { Modal } from "@/components/Modal";
import { purchaseRules, vehicleRules } from "@/data/store";
import { cn } from "@hotpursuit/shared";

interface PurchaseRulesModalProps {
  open: boolean;
  onClose: () => void;
  /** Show the vehicle-specific rules section (e.g. when opened from a vehicle product). */
  includeVehicleRules?: boolean;
}

/**
 * Dedicated "Purchase Rules" panel for the Store. Content is migrated verbatim
 * from the legacy site — never rewritten or duplicated here.
 */
export function PurchaseRulesModal({
  open,
  onClose,
  includeVehicleRules = false,
}: PurchaseRulesModalProps) {
  const { t, lang } = useLanguage();

  return (
    <Modal open={open} onClose={onClose} title={`🛡 ${t("secRules")}`} wide>
      <div className="space-y-5">
        <div>
          <p className="mb-3 text-sm leading-relaxed text-mute">
            {lang === "ar"
              ? "يرجى قراءة وفهم قوانين الشراء قبل إتمام أي عملية شراء."
              : "Please read and understand the purchase rules before completing any purchase."}
          </p>
          <ol className="space-y-3">
            {purchaseRules.map((r, i) => (
              <li
                key={i}
                className={cn(
                  "flex gap-3 rounded-md border border-line bg-panel p-3",
                  "text-sm leading-relaxed",
                )}
              >
                <span
                  className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-full",
                    "bg-accent text-xs font-bold text-white",
                  )}
                >
                  {i + 1}
                </span>
                <span className="text-ink">{lang === "ar" ? r.ar : r.en}</span>
              </li>
            ))}
          </ol>
        </div>

        {includeVehicleRules && vehicleRules.length > 0 && (
          <div>
            <div className="mb-3 flex items-center gap-2 text-base font-bold text-ink">
              <span className="text-accent">🚗</span>
              {t("vehRulesTitle")}
            </div>
            <ol className="space-y-3">
              {vehicleRules.map((r, i) => (
                <li
                  key={i}
                  className={cn(
                    "flex gap-3 rounded-md border border-line bg-panel p-3",
                    "text-sm leading-relaxed",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-6 w-6 shrink-0 items-center justify-center rounded-full",
                      "bg-panel text-xs font-bold text-accent border border-line",
                    )}
                  >
                    {i + 1}
                  </span>
                  <span className="text-ink">{lang === "ar" ? r.ar : r.en}</span>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
    </Modal>
  );
}
