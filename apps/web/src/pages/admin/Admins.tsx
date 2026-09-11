import { useCallback, useEffect, useMemo, useState } from "react";
import { cn } from "@hotpursuit/shared";
import {
  ROLE_RANK,
  type AdminUser,
  type Permission,
  type RoleName,
} from "@hotpursuit/types";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/features/auth/AuthContext";
import { Modal } from "@/components/Modal";
import {
  addAdmin,
  changeAdmin,
  fetchAdminMeta,
  fetchAdmins,
  removeAdmin,
} from "@/services/api";
import type { AdminMeta } from "@/services/api";

/**
 * Admin Management — /admin/admins.
 *
 * UI-only; EVERY mutation is authorized server-side (admins.manage + role
 * hierarchy + owner protection). Lists real staff accounts from the backend.
 * The permission checkboxes below edit DIRECT grants (per-user overrides);
 * role defaults come from the selected role and are always applied by the
 * server. No fake accounts are ever created.
 */

interface EditState {
  admin: AdminUser;
  role: RoleName;
  /** Direct grants to set (replaces the member's current direct grants). */
  permissions: Permission[];
}

export function AdminsPage() {
  const { t, dir } = useLanguage();
  const { user } = useAuth();
  const [admins, setAdmins] = useState<AdminUser[] | null>(null);
  const [meta, setMeta] = useState<AdminMeta | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [showAdd, setShowAdd] = useState(false);
  const [editOpen, setEditOpen] = useState<EditState | null>(null);
  const [confirm, setConfirm] = useState<AdminUser | null>(null);

  const isOwner = !!user?.roles.includes("OWNER");

  const load = useCallback(async () => {
    try {
      const [a, m] = await Promise.all([fetchAdmins(), fetchAdminMeta()]);
      setAdmins(a.admins);
      setMeta(m);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // Permissions grouped by area for the picker.
  const sectioned = useMemo(() => {
    if (!meta) return [];
    return groupPermissions(meta.permissions);
  }, [meta]);

  const handleAdd = async (
    discordId: string,
    role: RoleName,
    permissions: Permission[],
  ) => {
    setBusy(true);
    try {
      await addAdmin({ discordId, role, permissions });
      setShowAdd(false);
      setError(null);
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const handleChange = async (edit: EditState) => {
    setBusy(true);
    try {
      await changeAdmin(edit.admin.id, {
        role: edit.role,
        permissions: edit.permissions,
      });
      setEditOpen(null);
      setError(null);
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = async (admin: AdminUser) => {
    setBusy(true);
    try {
      await removeAdmin(admin.id);
      setConfirm(null);
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (admins === null) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 py-10">
        <div className="h-8 w-48 animate-pulse rounded bg-panel" />
        <div className="mt-4 h-40 animate-pulse rounded-lg bg-panel" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-ink sm:text-3xl">
          HOT <span className="text-accent">PURSUIT</span> {t("adminManage")}
        </h1>
        <button
          type="button"
          onClick={() => setShowAdd(true)}
          className="rounded-md bg-accent px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-accent-dark"
        >
          + {t("adminAdd")}
        </button>
      </div>

      {error && (
        <div className="mb-4 flex items-center justify-between gap-3 rounded-lg border border-line bg-panel p-4 text-sm text-accent">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => {
              setError(null);
              void load();
            }}
            className="shrink-0 underline"
          >
            {t("adminRetry")}
          </button>
        </div>
      )}

      {admins.length === 0 && !error ? (
        <div className="rounded-lg border border-line bg-panel p-10 text-center">
          <p className="text-sm text-mute">{t("adminNone")}</p>
          <p className="mt-1 text-xs text-mute">{t("adminNoneHint")}</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-line">
          <table className="w-full min-w-[720px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-mute">
                <th className="px-4 py-3 font-semibold">{t("adminColStaff")}</th>
                <th className="px-4 py-3 font-semibold">{t("adminColRole")}</th>
                <th className="px-4 py-3 font-semibold">{t("adminColJoined")}</th>
                <th className="px-4 py-3 text-end font-semibold">{t("adminColActions")}</th>
              </tr>
            </thead>
            <tbody>
              {admins.map((a) => (
                <tr key={a.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {a.avatar ? (
                        <img src={a.avatar} alt="" className="h-8 w-8 rounded-full object-cover" />
                      ) : (
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/20 text-sm font-bold text-ink">
                          {a.username.charAt(0).toUpperCase()}
                        </span>
                      )}
                      <div className={cn("min-w-0", dir === "rtl" && "text-right")}>
                        <div className="truncate font-semibold text-ink">
                          {a.globalName || a.username || a.discordId}
                          {a.roles.includes("OWNER") && (
                            <span className="ml-2 rounded bg-accent/15 px-1.5 py-0.5 text-[9px] font-bold uppercase text-accent">
                              {t("roleOwner")}
                            </span>
                          )}
                          {isEnvBridge(a) && (
                            <span className="ml-2 rounded bg-panel px-1.5 py-0.5 text-[9px] font-bold uppercase text-mute">
                              {t("adminConn")}
                            </span>
                          )}
                        </div>
                        <div className="truncate text-xs text-mute" dir="ltr">
                          ID: {a.discordId}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-ink capitalize">
                    {a.primaryRole?.toLowerCase() ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-mute">
                    {new Date(a.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-end">
                    <div className="inline-flex gap-2">
                      <RowBtn
                        label={t("adminEdit")}
                        onClick={() =>
                          setEditOpen({
                            admin: a,
                            role: a.primaryRole ?? "CONTENT_MANAGER",
                            // Direct grants start empty; role defaults come from role.
                            permissions: [],
                          })
                        }
                      />
                      <RowBtn
                        label={t("adminRemove")}
                        danger
                        onClick={() => setConfirm(a)}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-3 text-xs text-mute">
        {isOwner ? t("adminOwnerHint") : t("adminNoOwnerHint")}
      </p>

      {showAdd && (
        <AddAdminModal
          meta={meta}
          dir={dir}
          busy={busy}
          onClose={() => setShowAdd(false)}
          onSave={handleAdd}
        />
      )}

      {editOpen && (
        <EditAdminModal
          edit={editOpen}
          meta={meta}
          sectioned={sectioned}
          dir={dir}
          busy={busy}
          onClose={() => setEditOpen(null)}
          onSave={handleChange}
        />
      )}

      {confirm && (
        <Modal open onClose={() => setConfirm(null)} title={t("adminConfirmRemove")}>
          <p className="mb-4 text-sm text-mute">
            {t("adminConfirmRemoveText")}{" "}
            <span className="font-semibold text-ink">
              {confirm.globalName || confirm.username || confirm.discordId}
            </span>{" "}
            ({confirm.primaryRole?.toLowerCase() ?? "—"})?
          </p>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setConfirm(null)}
              className="rounded-md border border-line bg-panel px-4 py-2 text-sm font-bold text-ink"
            >
              {t("cancel")}
            </button>
            <button
              type="button"
              onClick={() => void handleRemove(confirm)}
              disabled={busy}
              className="rounded-md bg-accent px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-accent-dark disabled:opacity-50"
            >
              {busy ? "..." : t("adminRemove")}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function isEnvBridge(a: AdminUser): boolean {
  return (a as AdminUser & { viaEnvBridge?: boolean }).viaEnvBridge === true;
}

function RowBtn({
  label,
  danger,
  onClick,
}: {
  label: string;
  danger?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-md border px-2.5 py-1 text-xs font-bold transition-colors",
        danger
          ? "border-accent/40 text-accent hover:bg-accent/10"
          : "border-line bg-panel text-ink hover:bg-panel-hover",
      )}
    >
      {label}
    </button>
  );
}

const ALL_ROLES: RoleName[] = ["OWNER", "ADMIN", "MODERATOR", "CONTENT_MANAGER"];

function AddAdminModal({
  meta,
  dir,
  busy,
  onClose,
  onSave,
}: {
  meta: AdminMeta | null;
  dir: string;
  busy: boolean;
  onClose: () => void;
  onSave: (discordId: string, role: RoleName, permissions: Permission[]) => void;
}) {
  const { t } = useLanguage();
  const [discordId, setDiscordId] = useState("");
  const [role, setRole] = useState<RoleName>("MODERATOR");
  const [permissions, setPermissions] = useState<Permission[]>([]);

  return (
    <Modal open onClose={onClose} title={t("adminAdd")} wide>
      <div className="space-y-4">
        <label className="block text-sm font-semibold text-ink">
          {t("adminDiscordId")}
          <input
            value={discordId}
            onChange={(e) => setDiscordId(e.target.value)}
            placeholder="123456789012345678"
            dir="ltr"
            autoFocus
            className="mt-1 w-full rounded-md border border-line bg-bg px-3 py-2 text-sm text-ink outline-none focus:border-accent"
          />
        </label>

        <div className="text-sm">
          <div className="mb-1.5 font-semibold text-ink">{t("adminRole")}</div>
          <div className="flex flex-wrap gap-2">
            {ALL_ROLES.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={cn(
                  "rounded-md border px-3 py-1.5 text-sm font-bold transition-colors",
                  role === r
                    ? "border-accent bg-accent/15 text-accent"
                    : "border-line bg-panel text-mute hover:text-ink",
                )}
              >
                {r}
              </button>
            ))}
          </div>
          <p className="mt-1.5 text-xs text-mute">{t("adminRoleDefaults")}: {role}</p>
        </div>

        <PermissionPicker
          sectioned={sectionedFor(meta)}
          selected={permissions}
          dir={dir}
          onChange={setPermissions}
        />

        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-line bg-panel px-4 py-2 text-sm font-bold text-ink"
          >
            {t("cancel")}
          </button>
          <button
            type="button"
            disabled={busy || !discordId || !role}
            onClick={() => onSave(discordId, role, permissions)}
            className="rounded-md bg-accent px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-accent-dark disabled:opacity-50"
          >
            {busy ? "..." : t("adminSave")}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function EditAdminModal({
  edit,
  meta,
  sectioned,
  dir,
  busy,
  onClose,
  onSave,
}: {
  edit: EditState;
  meta: AdminMeta | null;
  sectioned: PermissionGroup[];
  dir: string;
  busy: boolean;
  onClose: () => void;
  onSave: (edit: EditState) => void;
}) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [role, setRole] = useState<RoleName>(edit.role);
  const [permissions, setPermissions] = useState<Permission[]>(edit.permissions);

  const isOwner = !!user?.roles.includes("OWNER");
  const targetIsOwner = edit.admin.roles.includes("OWNER");
  const viaBridge = isEnvBridge(edit.admin);

  const canEdit = isOwner || !targetIsOwner;

  if (viaBridge) {
    return (
      <Modal open onClose={onClose} title={t("adminEdit")} wide>
        <p className="text-sm text-mute">{t("adminConnProtected")}</p>
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-line bg-panel px-4 py-2 text-sm font-bold text-ink"
          >
            {t("close")}
          </button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal open onClose={onClose} title={t("adminEdit")} wide>
      {!canEdit ? (
        <p className="text-sm text-mute">{t("adminOwnerProtected")}</p>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            {edit.admin.avatar ? (
              <img
                src={edit.admin.avatar}
                alt=""
                className="h-10 w-10 rounded-full object-cover"
              />
            ) : null}
            <div>
              <div className="font-bold text-ink">
                {edit.admin.globalName || edit.admin.username || edit.admin.discordId}
              </div>
              <div className="text-xs text-mute" dir="ltr">
                ID: {edit.admin.discordId}
              </div>
            </div>
          </div>

          <div className="text-sm">
            <div className="mb-1.5 font-semibold text-ink">{t("adminRole")}</div>
            <div className="flex flex-wrap gap-2">
              {ALL_ROLES.map((r) => {
                const disabled =
                  r === "OWNER"
                    ? !isOwner
                    : targetIsOwner
                      ? !isOwner
                      : !canChangeToRole(edit.admin.primaryRole, r);
                return (
                  <button
                    key={r}
                    type="button"
                    disabled={disabled}
                    onClick={() => setRole(r)}
                    className={cn(
                      "rounded-md border px-3 py-1.5 text-sm font-bold transition-colors",
                      role === r
                        ? "border-accent bg-accent/15 text-accent"
                        : "border-line bg-panel text-mute hover:text-ink",
                      disabled && "cursor-not-allowed opacity-40 hover:text-mute",
                    )}
                  >
                    {r}
                  </button>
                );
              })}
            </div>
            {!isOwner && targetIsOwner && (
              <p className="mt-1.5 text-xs text-accent">{t("adminOwnerProtected")}</p>
            )}
          </div>

          <div className="rounded-md border border-line bg-panel p-3">
            <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-accent">
              {t("adminDirectGrants")}
            </div>
            <p className="mb-2 text-xs text-mute">{t("adminDirectGrantsHint")}</p>
            <PermissionPicker
              sectioned={sectioned.length ? sectioned : sectionedFor(meta)}
              selected={permissions}
              dir={dir}
              onChange={setPermissions}
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-line bg-panel px-4 py-2 text-sm font-bold text-ink"
            >
              {t("cancel")}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => onSave({ ...edit, role, permissions })}
              className="rounded-md bg-accent px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-accent-dark disabled:opacity-50"
            >
              {busy ? "..." : t("adminSave")}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}

/** Client-side mirror of the server rule: only a strictly-higher rank may set a role. */
function canChangeToRole(from: RoleName | null, to: RoleName): boolean {
  const fromRank = from ? ROLE_RANK[from] : 0;
  return fromRank > ROLE_RANK[to];
}

interface PermissionGroup {
  area: string;
  items: Permission[];
}

function groupPermissions(permissions: Permission[]): PermissionGroup[] {
  const map: Record<string, Permission[]> = {};
  for (const p of permissions) {
    const area = p.split(".")[0];
    (map[area] ??= []).push(p);
  }
  return Object.entries(map).map(([area, items]) => ({ area, items }));
}

function sectionedFor(meta: AdminMeta | null): PermissionGroup[] {
  if (!meta) return [];
  return groupPermissions(meta.permissions);
}

function PermissionPicker({
  sectioned,
  selected,
  dir,
  onChange,
}: {
  sectioned: PermissionGroup[];
  selected: Permission[];
  dir: string;
  onChange: (p: Permission[]) => void;
}) {
  const { t } = useLanguage();
  const toggle = (p: Permission) =>
    onChange(selected.includes(p) ? selected.filter((x) => x !== p) : [...selected, p]);

  if (sectioned.length === 0) {
    return <p className="text-sm text-mute">{t("adminNoPerms")}</p>;
  }

  return (
    <div>
      <div className="mb-1.5 font-semibold text-ink">{t("adminPermissions")}</div>
      <div className="grid gap-3 sm:grid-cols-2">
        {sectioned.map((group) => (
          <div key={group.area} className="rounded-md border border-line bg-panel p-3">
            <div className="mb-2 text-[11px] font-bold uppercase tracking-wide text-accent">
              {group.area}
            </div>
            <div className="space-y-1.5">
              {group.items.map((p) => {
                const on = selected.includes(p);
                return (
                  <label
                    key={p}
                    className={cn(
                      "flex cursor-pointer items-center gap-2 text-sm",
                      dir === "rtl" && "flex-row-reverse",
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={on}
                      onChange={() => toggle(p)}
                      className="accent-accent"
                    />
                    <span className="text-ink">{p}</span>
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
