import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { tr } from "@hotpursuit/config";
import { storage } from "@hotpursuit/shared";
import type { Language } from "@hotpursuit/types";

interface LanguageContextValue {
  lang: Language;
  dir: "ltr" | "rtl";
  setLang: (l: Language) => void;
  toggle: () => void;
  t: (key: string, values?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

const STORAGE_KEY = "hp_lang";

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>(() =>
    storage.get<Language>(STORAGE_KEY, "en"),
  );

  const dir: "ltr" | "rtl" = lang === "ar" ? "rtl" : "ltr";

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
    storage.set(STORAGE_KEY, lang);
  }, [lang, dir]);

  const setLang = useCallback((l: Language) => setLangState(l), []);
  const toggle = useCallback(
    () => setLangState((p) => (p === "en" ? "ar" : "en")),
    [],
  );

  const t = useCallback(
    (key: string, values?: Record<string, string | number>) => {
      let out = tr(key, lang);
      if (values) {
        out = out.replace(/\{(\w+)\}/g, (_, k) =>
          k in values ? String(values[k]) : `{${k}}`,
        );
      }
      return out;
    },
    [lang],
  );

  const value = useMemo(
    () => ({ lang, dir, setLang, toggle, t }),
    [lang, dir, setLang, toggle, t],
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
