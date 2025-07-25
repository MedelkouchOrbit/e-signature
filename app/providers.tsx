"use client"

import type * as React from "react"
import { ThemeProvider } from "@/components/theme-provider"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { NextIntlClientProvider } from "next-intl"
import { Toaster } from "@/components/ui/toaster" // Import the themed Toaster from shadcn/ui

const queryClient = new QueryClient()

export function Providers({
  children,
  messages,
  locale,
}: { children: React.ReactNode; messages: Record<string, unknown>; locale: string }) {
  return (
    <NextIntlClientProvider 
      messages={messages} 
      locale={locale}
      timeZone="UTC"
    >
      <QueryClientProvider client={queryClient}>
        <ThemeProvider 
          attribute="class" 
          defaultTheme="light" 
          enableSystem={false}
          disableTransitionOnChange
        >
          {children}
          <Toaster richColors position="top-right" /> {/* Render the themed sonner Toaster here */}
        </ThemeProvider>
      </QueryClientProvider>
    </NextIntlClientProvider>
  )
}
