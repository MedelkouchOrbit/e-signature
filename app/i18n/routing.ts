export const locales = ["en", "ar"] as const;
export const localePrefix = "always" as const;

export const pathnames = {
  "/": "/",
  "/about": {
    en: "/about",
    ar: "/حول",
  },
  "/auth/login": {
    en: "/auth/login",
    ar: "/تسجيل-الدخول",
  },
  "/auth/signup": {
    en: "/auth/signup",
    ar: "/تسجيل-العضوية",
  },
  "/features": {
    en: "/features",
    ar: "/الميزات",
  },
  "/pricing": {
    en: "/pricing",
    ar: "/الأسعار",
  },
  "/contact": {
    en: "/contact",
    ar: "/اتصل-بنا",
  },
  "/terms": {
    en: "/terms",
    ar: "/الشروط",
  },
  "/dashboard": {
    en: "/dashboard",
    ar: "/لوحة-التحكم",
  },
};

export type Pathnames = keyof typeof pathnames;
export type Locale = (typeof locales)[number];
export const defaultLocale = "en" as const;
