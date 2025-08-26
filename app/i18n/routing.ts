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
  "/contact": {
    en: "/contact",
    ar: "/اتصل-بنا",
  },
  "/auth/terms": {
    en: "/auth/terms",
    ar: "/تسجيل-الدخول/الشروط",
  },
  // Keep these routes simple without localization for now
  "/features": "/features",
  "/pricing": "/pricing",
  "/dashboard": "/dashboard",
  "/documents": "/documents",
  "/templates": "/templates",
  "/bulk-send": "/bulk-send",
  "/team": "/team",
  "/reports": "/reports",
  "/api": "/api",
  "/others": "/others",
  "/settings": "/settings",
  "/settings/billing-info": "/settings/billing-info",
  "/billing": "/billing",
  "/help": "/help",
};

export type Pathnames = keyof typeof pathnames;
export type Locale = (typeof locales)[number];
export const defaultLocale = "en" as const;
