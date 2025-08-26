import { AuthGuard } from "@/app/components/auth/AuthGuard"

export default function HelpPage() {
  return (
    <AuthGuard>
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-6">Help & Support</h1>
        <p>Help documentation and support page</p>
      </div>
    </AuthGuard>
  )
}
