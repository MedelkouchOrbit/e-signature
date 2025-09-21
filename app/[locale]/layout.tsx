import type React from "react"
import type { Metadata } from "next"
import "../globals.css"
import { Providers } from "../providers"
import { getMessages } from "next-intl/server"
import LayoutRenderer from "@/app/components/shared/layout-renderer"
import { SessionTokenDebug } from "@/app/components/debug/SessionTokenDebug"

export const metadata: Metadata = {
  title: "WatiqaSign - Electronic Signature Solution",
  description: "Secure and efficient electronic signature platform for businesses.",
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  
  // Validate locale and provide fallback
  const validLocales = ['en', 'ar']
  const validatedLocale = validLocales.includes(locale) ? locale : 'en'
  
  // Load messages with error handling
  let messages = {}
  try {
    messages = await getMessages({ locale: validatedLocale })
  } catch (error) {
    console.warn(`Failed to load messages for locale ${validatedLocale}:`, error)
    // Try to load English fallback
    try {
      messages = await getMessages({ locale: 'en' })
    } catch (fallbackError) {
      console.error('Failed to load fallback messages:', fallbackError)
    }
  }

  return (
    <>
      <SessionTokenDebug />
      <Providers messages={messages} locale={validatedLocale}>
        <LayoutRenderer>
          {children}
        </LayoutRenderer>
      </Providers>
    </>
  )
}
