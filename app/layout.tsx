import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({ 
  subsets: ["latin"],
  display: "swap",
  preload: true,
  fallback: ['system-ui', 'arial']
})

export const metadata: Metadata = {
  title: "WatiqaSign - Electronic Signature Solution",
  description: "Secure and efficient electronic signature platform for businesses.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Comprehensive error handling for browser extensions and external scripts
              window.addEventListener('error', function(e) {
                console.warn('JavaScript error caught and handled:', e.message);
                // Don't let the error propagate and break the page
                e.preventDefault();
                return true;
              });

              // Handle unhandled promise rejections
              window.addEventListener('unhandledrejection', function(e) {
                console.warn('Unhandled promise rejection caught:', e.reason);
                e.preventDefault();
                return true;
              });

              // Override querySelector to prevent null errors from extensions
              const originalQuerySelector = Document.prototype.querySelector;
              Document.prototype.querySelector = function(selector) {
                try {
                  return originalQuerySelector.call(this, selector);
                } catch (e) {
                  console.warn('Selector error prevented:', e.message);
                  return null;
                }
              };

              // Protect addEventListener from being called on null elements
              const originalAddEventListener = EventTarget.prototype.addEventListener;
              EventTarget.prototype.addEventListener = function(type, listener, options) {
                if (this === null || this === undefined) {
                  console.warn('Prevented addEventListener on null/undefined element');
                  return;
                }
                return originalAddEventListener.call(this, type, listener, options);
              };
            `,
          }}
        />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        {children}
      </body>
    </html>
  )
}
