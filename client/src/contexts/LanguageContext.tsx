import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";

export type AppLanguage = "ar" | "en";

const dictionary = {
  ar: {
    dashboard: "نظرة عامة", jobs: "الوظائف", candidates: "المرشحون", chat: "تجربة المحادثة",
    signInTitle: "سجّل الدخول للمتابعة", signInDescription: "يتطلب الوصول إلى لوحة التحكم تسجيل الدخول أولًا.", signIn: "تسجيل الدخول", signOut: "تسجيل الخروج", menu: "القائمة",
    language: "English", englishShort: "EN", arabicShort: "ع",
  },
  en: {
    dashboard: "Overview", jobs: "Jobs", candidates: "Candidates", chat: "Chat experience",
    signInTitle: "Sign in to continue", signInDescription: "Sign in first to access the administration dashboard.", signIn: "Sign in", signOut: "Sign out", menu: "Menu",
    language: "العربية", englishShort: "EN", arabicShort: "ع",
  },
} as const;

type DictionaryKey = keyof typeof dictionary.ar;
type LanguageContextValue = {
  language: AppLanguage;
  isArabic: boolean;
  direction: "rtl" | "ltr";
  setLanguage: (language: AppLanguage) => void;
  toggleLanguage: () => void;
  t: (key: DictionaryKey) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<AppLanguage>(() => (localStorage.getItem("recruitment-language") === "en" ? "en" : "ar"));
  const isArabic = language === "ar";
  const direction = isArabic ? "rtl" : "ltr";

  useEffect(() => {
    localStorage.setItem("recruitment-language", language);
    document.documentElement.lang = language;
    document.documentElement.dir = direction;
    document.body.dir = direction;
  }, [direction, language]);

  const value = useMemo<LanguageContextValue>(() => ({
    language, isArabic, direction, setLanguage,
    toggleLanguage: () => setLanguage(current => current === "ar" ? "en" : "ar"),
    t: key => dictionary[language][key],
  }), [direction, isArabic, language]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used inside LanguageProvider");
  return context;
}
