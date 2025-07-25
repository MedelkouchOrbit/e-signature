"use client"

import { useAuthStore } from "@/app/lib/auth/auth-store"
import { Button } from "@/components/ui/button"
import { useRouter } from "@/app/i18n/navigation"
import { useTranslations } from "next-intl"

export function DashboardClientPage() {
  const t = useTranslations("DashboardPage")
  const { logout } = useAuthStore()
  const router = useRouter()

  const handleLogout = () => {
    logout()
    router.push("/auth/login")
  }

  return (
    <div className="flex min-h-[calc(100vh-57px)] flex-col items-center justify-center bg-gray-100 p-4 dark:bg-gray-950">
      <div className="w-full max-w-4xl space-y-6 rounded-lg bg-white p-8 shadow-lg dark:bg-gray-900">
        <h1 className="text-3xl font-bold">Hello Dashboard</h1>
        
        <Button onClick={handleLogout} variant="destructive" className="mt-8">
          {t("logoutButton")}
        </Button>
      </div>
    </div>
  )
}
