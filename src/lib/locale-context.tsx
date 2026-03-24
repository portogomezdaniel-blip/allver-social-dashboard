"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { Locale, t as translate } from "./i18n";
import { createClient } from "./supabase/client";

interface LocaleContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (path: string) => string;
}

const LocaleContext = createContext<LocaleContextType>({
  locale: "es",
  setLocale: () => {},
  t: (path) => path,
});

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("es");

  useEffect(() => {
    // First check localStorage
    const saved = localStorage.getItem("ftp-locale") as Locale;
    if (saved && (saved === "es" || saved === "en")) {
      setLocaleState(saved);
    }

    // Then try to load from Supabase (overrides localStorage if set)
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data } = await supabase
        .from("creators")
        .select("locale")
        .eq("id", user.id)
        .single();
      if (data?.locale && (data.locale === "es" || data.locale === "en")) {
        setLocaleState(data.locale);
        localStorage.setItem("ftp-locale", data.locale);
      }
    }).catch(() => {});
  }, []);

  const setLocale = async (newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem("ftp-locale", newLocale);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from("creators")
          .update({ locale: newLocale })
          .eq("id", user.id);
      }
    } catch {}
  };

  const t = (path: string) => translate(locale, path);

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  return useContext(LocaleContext);
}
