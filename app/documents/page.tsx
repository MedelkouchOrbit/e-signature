"use client"

import { useState, useEffect } from "react"
import { AuthGuard } from "@/app/components/auth/AuthGuard"
import { DocumentsTable } from "@/app/components/documents/DocumentsTableNew"

// Disable static generation for this page since it requires authentication
export const dynamic = 'force-dynamic'

export default function DocumentsPage() {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  // Prevent server-side rendering to avoid hydration issues
  if (!isClient) {
    return null
  }

  return (
    <AuthGuard>
      <div className="container py-6 mx-auto">
        <DocumentsTable />
      </div>
    </AuthGuard>
  )
}
