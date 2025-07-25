"use client"

import dynamic from "next/dynamic"
import { AuthGuard } from "@/app/components/auth/AuthGuard"

// Dynamic import to prevent SSR for the dashboard
const DashboardClientPage = dynamic(
  () => import("./DashboardClientPage").then(mod => ({ default: mod.DashboardClientPage })),
  { 
    ssr: false,
    loading: () => (
      <div className="flex min-h-[calc(100vh-57px)] flex-col items-center justify-center bg-gray-100 p-4 dark:bg-gray-950">
        <div className="w-full max-w-4xl space-y-6 rounded-lg bg-white p-8 shadow-lg dark:bg-gray-900">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-8"></div>
            <div className="h-32 bg-gray-200 rounded mb-4"></div>
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          </div>
        </div>
      </div>
    )
  }
)

export default function DashboardPage() {
  return (
    <AuthGuard>
      <DashboardClientPage />
    </AuthGuard>
  )
}
