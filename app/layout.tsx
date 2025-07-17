import type React from "react"
import type { Metadata } from "next"
import "./globals.css" // Import global CSS here

export const metadata: Metadata = {
  title: "E-Signatures Made Simple for Growing Teams | DocuSign",
  description:
    "From contracts to NDAs, sign and send documents with just a few clicks—no technical setup required. Experience faster, smarter and more beautiful e-signature solutions.",
  keywords: ["e-signature", "digital signature", "document signing", "business tools", "collaboration"],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  )
}
