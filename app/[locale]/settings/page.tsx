import { AuthGuard } from "@/app/components/auth/AuthGuard"

export default function SettingsPage() {
  return (
    <AuthGuard>
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-6">Settings</h1>
        <p>Account settings and preferences page</p>
      </div>
    </AuthGuard>
  )
}
