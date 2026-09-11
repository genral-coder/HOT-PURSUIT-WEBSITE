import { useEffect, useState, type ReactNode } from "react";
import type {
  AdminProductRow,
  Billing,
  CreateProductInput,
  ProductCategoryId,
} from "@hotpursuit/types";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/features/auth/AuthContext";
import { Modal } from "@/components/Modal";
import {
  archiveAdminProduct,
  createAdminProduct,
  fetchAdminProducts,
  updateAdminProduct,
  type AdminProductQuery,
} from "@/services/api";
import { businessTypes, categories, categoryMap, vehicleClasses } from "@/data/store";

/**
 * Admin Products — /admin/products.
 *
 * Real catalog rows from the backend (RBAC store.view). The client NEVER
 * fabricates data: every product, price, status flag and archive state comes
 * from the server, and saves are enforced server-side via store.manage.
 * Archive = soft delete (available:false) — products are never hard-deleted.
 */
interface FormState {
  category: ProductCategoryId;
  name: string;
  nameAr: string;
  short: string;
  shortAr: string;
  description: string;
  descriptionAr: string;
  features: string;
  featuresAr: string;
  price: string;
  image: string;
  type: string;
  vehicleClass: string;
  amountCents: string;
  billing: Billing;
  sold: boolean;
  popular: boolean;
  new: boolean;
  featured: boolean;
  available: boolean;
}

const EMPTY_FORM: FormState = {
  category: "vehicles",
  name: "",
  nameAr: "",
  short: "",
  shortAr: "",
  description: "",
  descriptionAr: "",
  features: "",
  featuresAr: "",
  price: "",
  image: "",
  type: "",
  vehicleClass: "",
  amountCents: "",
  billing: "MONTHLY",
  sold: false,
  popular: false,
  new: false,
  featured: false,
  available: true,
};

function fromProduct(p: AdminProductRow): FormState {
  return {
    category: p.category,
    name: p.name ?? "",
    nameAr: p.nameAr ?? "",
    short: p.short ?? "",
    shortAr: p.shortAr ?? "",
    description: p.description ?? "",
    descriptionAr: p.descriptionAr ?? "",
    features: (p.features ?? []).join("\n"),
    featuresAr: (p.featuresAr ?? []).join("\n"),
    price: p.price ?? "",
    image: p.image ?? "",
    type: p.type ?? "",
    vehicleClass: p.class ?? "",
    amountCents: String(p.amountCents ?? ""),
    billing: p.billing,
    sold: !!p.sold,
    popular: !!p.popular,
    new: !!p.new,
    featured: !!p.featured,
    available: p.available,
  };
}

function toPayload(f: FormState): CreateProductInput {
  const split = (v: string) =>
    v.split("\n").map((s) => s.trim()).filter((s) => s.length > 0);
  const clean = (v: string) => {
    const t = v.trim();
    return t.length > 0 ? t : undefined;
  };
  const payload: CreateProductInput = {
    category: f.category,
    name: f.name.trim(),
    price: f.price.trim(),
    amountCents: Math.max(1, Math.floor(Number(f.amountCents) || 0)),
    billing: f.billing,
    available: f.available,
    sold: f.sold,
    popular: f.popular,
    new: f.new,
    featured: f.featured,
  };
  if (clean(f.nameAr)) payload.nameAr = clean(f.nameAr);
  if (clean(f.short)) payload.short = clean(f.short);
  if (clean(f.shortAr)) payload.shortAr = clean(f.shortAr);
  if (clean(f.description)) payload.description = clean(f.description);
  if (clean(f.descriptionAr)) payload.descriptionAr = clean(f.descriptionAr);
  if (clean(f.image)) payload.image = clean(f.image);
  const feats = split(f.features);
  const featsAr = split(f.featuresAr);
  if (feats.length) payload.features = feats;
  if (featsAr.length) payload.featuresAr = featsAr;
  if (f.category === "mlo" && f.type.trim()) payload.type = f.type.trim() as CreateProductInput["type"];
  if (f.category === "vehicles" && f.vehicleClass.trim()) payload.class = f.vehicleClass.trim() as CreateProductInput["class"];
  return payload;
}

export function AdminProductsPage() {
  const { t, lang } = useLanguage();
  const { user } = useAuth();
  const [rows, setRows] = useState<AdminProductRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 20;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  const [editing, setEditing] = useState<AdminProductRow | null>(null);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmArchive, setConfirmArchive] = useState<AdminProductRow | null>(null);
  const [archiveBusy, setArchiveBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const canManage = !!user?.permissions.includes("store.manage");
  const modalOpen = creating || editing !== null;

  const load = async (query: AdminProductQuery = {}) => {
    setLoading(true);
    try {
      const res = await fetchAdminProducts(query);
      setRows(res.products);
      setTotal(res.total);
      setPage(Math.max(1, query.page ?? 1));
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const params: AdminProductQuery = { page, limit };
    if (search.trim()) params.search = search.trim();
    if (statusFilter) params.status = statusFilter as AdminProductQuery["status"];
    if (categoryFilter) params.category = categoryFilter;
    void load(params);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, statusFilter, categoryFilter, search]);

  const refresh = () =>
    void load({
      page,
      limit,
      ...(statusFilter ? { status: statusFilter as AdminProductQuery["status"] } : {}),
      ...(categoryFilter ? { category: categoryFilter } : {}),
      ...(search.trim() ? { search: search.trim() } : {}),
    });

  const handleSave = async (input: CreateProductInput) => {
    setSaving(true);
    try {
      if (editing) {
        await updateAdminProduct(editing.id, input);
      } else {
        await createAdminProduct(input);
      }
      setToast(t("adminProductsSaved"));
      setCreating(false);
      setEditing(null);
      await refresh();
    } catch (e) {
      setToast((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleArchiveToggle = async () => {
    if (!confirmArchive) return;
    setArchiveBusy(true);
    try {
      if (confirmArchive.available) {
        await archiveAdminProduct(confirmArchive.id);
      } else {
        await updateAdminProduct(confirmArchive.id, { available: true });
      }
      setToast(t(confirmArchive.available ? "adminProductsArchivedMsg" : "adminProductsRestoredMsg"));
      setConfirmArchive(null);
      await refresh();
    } catch (e) {
      setToast((e as Error).message);
    } finally {
      setArchiveBusy(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));

  const catName = (id: ProductCategoryId) => {
    const c = categoryMap[id];
    if (!c) return id;
    return lang === "ar" && c.nameAr ? c.nameAr : c.name;
  };

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-ink">{t("adminProducts")}</h1>

      {error && (
        <div className="mb-4 rounded-lg border border-line bg-panel p-4 text-sm text-accent">{error}</div>
      )}

      {/* Filters + actions */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <input
          type="search"
          value={search}
          onChange={(e) => { setPage(1); setSearch(e.target.value); }}
          placeholder={t("adminProductsSearch")}
          className="w-64 rounded-md border border-line bg-panel px-3 py-2 text-sm text-ink outline-none focus:border-accent/60"
        />
        <select
          value={statusFilter}
          onChange={(e) => { setPage(1); setStatusFilter(e.target.value); }}
          className="rounded-md border border-line bg-panel px-3 py-2 text-sm text-ink outline-none focus:border-accent/60"
        >
          <option value="">{t("adminProductsStatusAll")}</option>
          <option value="active">{t("adminProductsStatusActive")}</option>
          <option value="archived">{t("adminProductsStatusArchived")}</option>
        </select>
        <select
          value={categoryFilter}
          onChange={(e) => { setPage(1); setCategoryFilter(e.target.value); }}
          className="rounded-md border border-line bg-panel px-3 py-2 text-sm text-ink outline-none focus:border-accent/60"
        >
          <option value="">{t("adminProductsStatusAll")}</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.emoji} {lang === "ar" && c.nameAr ? c.nameAr : c.name}
            </option>
          ))}
        </select>
        {canManage && (
          <button
            type="button"
            onClick={() => { setEditing(null); setCreating(true); }}
            className="ms-auto rounded-md border border-on/40 bg-on/10 px-3 py-2 text-sm font-bold text-on transition-colors hover:bg-on/20"
          >
            + {t("adminProductsAdd")}
          </button>
        )}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-line bg-bg-soft">
        {loading ? (
          <div className="space-y-2 p-4">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="h-12 animate-pulse rounded bg-panel" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="p-10 text-center text-sm text-mute">{t("adminProductsEmpty")}</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-xs uppercase tracking-widest text-mute">
                <th className="px-4 py-3 text-start font-bold">{t("adminProductsColId")}</th>
                <th className="px-4 py-3 text-start font-bold">{t("adminProductsColName")}</th>
                <th className="hidden px-4 py-3 text-start font-bold sm:table-cell">{t("adminProductsColCategory")}</th>
                <th className="px-4 py-3 text-start font-bold">{t("adminProductsColPrice")}</th>
                <th className="hidden px-4 py-3 text-start font-bold md:table-cell">{t("adminProductsColStatus")}</th>
                <th className="px-4 py-3 text-end font-bold">{t("adminProductsColActions")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.id}
                  className="cursor-pointer border-b border-line/60 transition-colors last:border-0 hover:bg-panel"
                  onClick={() => { setCreating(false); setEditing(r); }}
                >
                  <td className="px-4 py-3 font-bold text-mute">#{r.id}</td>
                  <td className="min-w-0 px-4 py-3">
                    <div className="flex items-center gap-2">
                      {r.image && (
                        <img
                          src={r.image}
                          alt=""
                          className="h-8 w-8 shrink-0 rounded-md border border-line object-cover"
                          onError={(e) => { e.currentTarget.style.display = "none"; }}
                        />
                      )}
                      <span className="truncate font-semibold text-ink">
                        {lang === "ar" && r.nameAr ? r.nameAr : r.name}
                      </span>
                      {r.sold && <Badge tone="border-accent/40 bg-accent/10 text-accent">{t("soldBadge")}</Badge>}
                    </div>
                  </td>
                  <td className="hidden px-4 py-3 text-mute sm:table-cell">{catName(r.category)}</td>
                  <td className="px-4 py-3 text-ink">{r.price}</td>
                  <td className="hidden px-4 py-3 md:table-cell">
                    <Badge tone={r.available ? "border-on/40 bg-on/10 text-on" : "border-line bg-panel text-mute"}>
                      {r.available ? t("adminProductsActive") : t("adminProductsArchived")}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setEditing(r); }}
                        className="rounded-md border border-line bg-panel px-2 py-1 text-[11px] font-bold uppercase tracking-wide text-ink transition-colors hover:border-accent/60 hover:text-accent disabled:opacity-40"
                      >
                        {t("adminEdit")}
                      </button>
                      {canManage && (
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setConfirmArchive(r); }}
                          className="rounded-md border border-line bg-panel px-2 py-1 text-[11px] font-bold uppercase tracking-wide text-mute transition-colors hover:border-accent/60 hover:text-accent disabled:opacity-40"
                        >
                          {r.available ? t("adminProductsArchived") : t("adminProductsActive")}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="rounded-md border border-line bg-panel px-3 py-1.5 font-semibold text-ink transition-colors hover:bg-accent/10 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {t("paginationPrev")}
          </button>
          <span className="text-mute">{page} / {totalPages}</span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="rounded-md border border-line bg-panel px-3 py-1.5 font-semibold text-ink transition-colors hover:bg-accent/10 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {t("paginationNext")}
          </button>
        </div>
      )}

      {/* Edit / create modal */}
      <Modal
        open={modalOpen}
        onClose={() => { setCreating(false); setEditing(null); }}
        title={creating ? t("adminProductsAdd") : editing ? t("adminProductsEdit") : ""}
        wide
      >
        {modalOpen && (
          <ProductForm
            key={editing?.id ?? "new"}
            product={editing}
            canManage={canManage}
            saving={saving}
            t={t}
            lang={lang}
            onSave={(input) => void handleSave(input)}
          />
        )}
      </Modal>

      {/* Archive confirm */}
      <Modal
        open={confirmArchive !== null}
        onClose={() => { if (!archiveBusy) setConfirmArchive(null); }}
        title={t("adminProductsConfirmArchive")}
      >
        {confirmArchive && (
          <div className="space-y-4">
            <p className="text-sm text-mute">{t("adminProductsConfirmArchiveText")}</p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                disabled={archiveBusy}
                onClick={() => setConfirmArchive(null)}
                className="rounded-md border border-line bg-panel px-3 py-1.5 text-sm font-semibold text-ink transition-colors hover:bg-accent/10 disabled:opacity-40"
              >
                {t("cancel")}
              </button>
              <button
                type="button"
                disabled={archiveBusy}
                onClick={() => void handleArchiveToggle()}
                className="rounded-md border border-on/40 bg-on/10 px-3 py-1.5 text-sm font-bold text-on transition-colors hover:bg-on/20 disabled:opacity-40"
              >
                {confirmArchive.available ? t("adminProductsArchived") : t("adminProductsActive")}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Toast */}
      <div
        className={`pointer-events-none fixed bottom-5 start-1/2 z-[60] -translate-x-1/2 rounded-md bg-accent px-4 py-2 text-sm font-bold text-white shadow-accent-glow transition-opacity duration-300 ${toast ? "opacity-100" : "opacity-0"}`}
        aria-live="polite"
      >
        {String(toast ?? "")}
      </div>
    </div>
  );
}

function ProductForm({
  product,
  canManage,
  saving,
  t,
  lang,
  onSave,
}: {
  product: AdminProductRow | null;
  canManage: boolean;
  saving: boolean;
  t: (k: string, v?: Record<string, string | number>) => string;
  lang: string;
  onSave: (input: CreateProductInput) => void;
}) {
  const [form, setForm] = useState<FormState>(() => (product ? fromProduct(product) : EMPTY_FORM));
  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const category = categories.find((c) => c.id === form.category);
  const valid =
    form.category.trim().length > 0 &&
    form.name.trim().length > 0 &&
    form.price.trim().length > 0 &&
    (Number(form.amountCents) > 0);

  const inputCls =
    "w-full rounded-md border border-line bg-panel px-3 py-2 text-sm text-ink outline-none focus:border-accent/60 disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <div className="space-y-4">
      {!canManage && <p className="text-xs text-mute">{t("adminProductsManageHint")}</p>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label={t("productFieldCategory")}>
          <select
            value={form.category}
            onChange={(e) => set("category", e.target.value as ProductCategoryId)}
            disabled={!canManage}
            className={inputCls}
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.emoji} {lang === "ar" && c.nameAr ? c.nameAr : c.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t("productFieldName")}>
          <input
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder={formatPlaceholder(form.category)}
            disabled={!canManage}
            className={inputCls}
          />
        </Field>
        <Field label={t("productFieldNameAr")}>
          <input
            value={form.nameAr}
            onChange={(e) => set("nameAr", e.target.value)}
            disabled={!canManage}
            className={inputCls}
          />
        </Field>
        <Field label={t("productFieldPrice")}>
          <input
            value={form.price}
            onChange={(e) => set("price", e.target.value)}
            placeholder={placeholderByCategory(form.category)}
            disabled={!canManage}
            className={inputCls}
          />
        </Field>
        <Field label={t("productFieldAmount")}>
          <input
            type="number"
            min={1}
            value={form.amountCents}
            onChange={(e) => set("amountCents", e.target.value)}
            disabled={!canManage}
            className={inputCls}
          />
        </Field>
        <Field label={t("productFieldBilling")}>
          <select
            value={form.billing}
            onChange={(e) => set("billing", e.target.value as Billing)}
            disabled={!canManage}
            className={inputCls}
          >
            <option value="MONTHLY">{t("billing_MONTHLY")}</option>
            <option value="ONE_TIME">{t("billing_ONE_TIME")}</option>
          </select>
        </Field>
        <Field label={t("productFieldShort")}>
          <input
            value={form.short}
            onChange={(e) => set("short", e.target.value)}
            disabled={!canManage}
            className={inputCls}
          />
        </Field>
        <Field label={t("productFieldShortAr")}>
          <input
            value={form.shortAr}
            onChange={(e) => set("shortAr", e.target.value)}
            disabled={!canManage}
            className={inputCls}
          />
        </Field>
        <Field label={t("productFieldDescription")}>
          <textarea
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            rows={3}
            disabled={!canManage}
            className={inputCls}
          />
        </Field>
        <Field label={t("productFieldDescriptionAr")}>
          <textarea
            value={form.descriptionAr}
            onChange={(e) => set("descriptionAr", e.target.value)}
            rows={3}
            disabled={!canManage}
            className={inputCls}
          />
        </Field>
        <Field label={t("productFieldFeatures")}>
          <textarea
            value={form.features}
            onChange={(e) => set("features", e.target.value)}
            rows={4}
            placeholder={t("productTypeNone")}
            disabled={!canManage}
            className={inputCls}
          />
        </Field>
        <Field label={t("productFieldFeaturesAr")}>
          <textarea
            value={form.featuresAr}
            onChange={(e) => set("featuresAr", e.target.value)}
            rows={4}
            disabled={!canManage}
            className={inputCls}
          />
        </Field>
        <Field label={t("productFieldImage")}>
          <input
            value={form.image}
            onChange={(e) => set("image", e.target.value)}
            placeholder={t("productTypeNone")}
            disabled={!canManage}
            className={inputCls}
          />
        </Field>
        {category && category.id === "mlo" && (
          <Field label={t("productFieldType")}>
            <select
              value={form.type}
              onChange={(e) => set("type", e.target.value)}
              disabled={!canManage}
              className={inputCls}
            >
              <option value="">{t("productTypeNone")}</option>
              {businessTypes.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.emoji} {lang === "ar" && b.nameAr ? b.nameAr : b.name}
                </option>
              ))}
            </select>
          </Field>
        )}
        {category && category.id === "vehicles" && (
          <Field label={t("productFieldClass")}>
            <select
              value={form.vehicleClass}
              onChange={(e) => set("vehicleClass", e.target.value)}
              disabled={!canManage}
              className={inputCls}
            >
              <option value="">{t("productTypeNone")}</option>
              {vehicleClasses.map((v) => (
                <option key={v.id} value={v.id}>{v.id}</option>
              ))}
            </select>
          </Field>
        )}
      </div>

      {/* Flags */}
      <div className="flex flex-wrap gap-x-6 gap-y-2 rounded-lg border border-line bg-panel p-3 text-sm">
        {(["sold", "popular", "new", "featured", "available"] as const).map((flag) => (
          <label key={flag} className="flex cursor-pointer items-center gap-2 text-ink">
            <input
              type="checkbox"
              checked={form[flag]}
              onChange={(e) => set(flag, e.target.checked)}
              disabled={!canManage}
              className="h-4 w-4 accent-current"
            />
            {t(`productField${flag.charAt(0).toUpperCase()}${flag.slice(1)}`)}
          </label>
        ))}
      </div>

      {/* Actions */}
      {canManage && (
        <div className="flex justify-end gap-2 border-t border-line pt-3">
          <button
            type="button"
            disabled={saving}
            onClick={valid ? () => onSave(toPayload(form)) : undefined}
            className="rounded-md border border-line bg-panel px-4 py-2 text-sm font-bold text-ink transition-colors hover:bg-accent/10 disabled:opacity-40"
          >
            {t("adminSave")}
          </button>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-bold uppercase tracking-widest text-mute">{label}</span>
      {children}
    </label>
  );
}

function Badge({ tone, children }: { tone: string; children: ReactNode }) {
  return (
    <span className={`inline-block rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${tone}`}>
      {children}
    </span>
  );
}

function placeholderByCategory(category: ProductCategoryId): string {
  if (category === "vehicles") return "30$ Monthly";
  if (category === "mlo") return "20$ Monthly";
  if (category === "vip") return "5$ One Time";
  return "Monthly subscription";
}

function formatPlaceholder(category: ProductCategoryId): string {
  if (category === "mlo") return "e.g. Nightclub";
  if (category === "vehicles") return "e.g. Bugatti Chiron";
  return "e.g. VIP Package";
}