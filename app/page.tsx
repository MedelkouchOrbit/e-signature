import { redirect } from "next/navigation"
import { headers } from "next/headers"
import { routing } from "./i18n/routing"

export default async function HomePage() {
  // Get the preferred locale from the request headers or use a default
  const hdrs = await headers();
  const acceptLanguage = hdrs.get("accept-language");
  const preferredLocale = acceptLanguage ? acceptLanguage.split(",")[0].split("-")[0] : routing.defaultLocale;

  // Redirect to the localized landing page
  // Ensure the preferredLocale is one of the supported locales
  const targetLocale = routing.locales.includes(preferredLocale as "en" | "ar") ? preferredLocale : routing.defaultLocale;

  redirect(`/${targetLocale}`);
}
