"use client"

import { AuthGuard } from "@/app/components/auth/AuthGuard"
import { DocumentsTable } from "@/app/components/documents/DocumentsTableNew"

// Disable static generation for this page since it requires authentication
export const dynamic = 'force-dynamic'

export default function DocumentsPage() {
  return (
    <AuthGuard>
      <div className="container mx-auto py-8">
        <DocumentsTable />
      </div>
    </AuthGuard>
  )
}
