import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { AuthUser } from "@hotpursuit/types";
import { fetchMe, loginWithDiscord, logout as apiLogout } from "@/services/api";

interface AuthContextValue {
  /** Authenticated user (null when logged out). */
  user: AuthUser | null;
  /** True while the initial /me request is in flight. */
  loading: boolean;
  authenticated: boolean;
  /** Administrative visibility flag — UI ONLY. The backend still enforces. */
  isAdmin: boolean;
  /** Full list of roles for UI branching. */
  roles: string[];
  login: () => void;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const { user: u } = await fetchMe();
      setUser(u);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { user: u } = await fetchMe();
        if (!cancelled) setUser(u);
      } catch {
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiLogout();
    } catch {
      /* ignore — clear local state regardless */
    }
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      authenticated: !!user,
      isAdmin: !!user && user.permissions.includes("admin.access"),
      roles: user?.roles ?? [],
      login: loginWithDiscord,
      logout,
      refresh,
    }),
    [user, loading, logout, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
