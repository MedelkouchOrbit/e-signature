"use client"

import type React from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { NextIntlClientProvider } from "next-intl"

// Create a QueryClient instance outside the component to avoid re-creation on re-renders
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
})

interface ProvidersProps {
  children: React.ReactNode
  messages: Record<string, string> // Type for messages
  locale: string
}

export function Providers({ children, messages, locale }: ProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <NextIntlClientProvider messages={messages} locale={locale} timeZone="UTC">
        {children}
      </NextIntlClientProvider>
    </QueryClientProvider>
  )
}
