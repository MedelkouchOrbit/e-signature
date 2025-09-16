"use client"

import { AuthGuard } from "@/app/components/auth/AuthGuard"

// Disable static generation for this page since it requires authentication
export const dynamic = 'force-dynamic'

export default function ReportsPage() {
  return (
    <AuthGuard>
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-6">Reports</h1>
        <p>Reports and analytics page</p>
      </div>
    </AuthGuard>
  )
}
