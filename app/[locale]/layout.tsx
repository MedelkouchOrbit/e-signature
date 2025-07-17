import type React from "react"
import { notFound } from "next/navigation"
import { routing } from "../i18n/routing"
import { Providers } from "../providers"

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { locale: string }
}) {
  const { locale } = await params

  if (!routing.locales.includes(locale as "en" | "ar")) {
    notFound()
  }

  let messages
  try {
    messages = (await import(`../../messages/${locale}.json`)).default
  } catch (error) {
    console.error(`Could not load messages for locale ${locale}:`, error)
    notFound()
  }

  if (typeof window !== "undefined") {
    console.log("Client-side JavaScript is running in LocaleLayout!")
    // alert("Client-side JavaScript is running!"); // You can uncomment this for a more obvious test
  }

  return (
    <div dir={locale === "ar" ? "rtl" : "ltr"}>
      <Providers messages={messages} locale={locale}>
        {children}
      </Providers>
    </div>
  )
}
