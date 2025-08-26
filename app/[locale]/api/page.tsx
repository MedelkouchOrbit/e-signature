import { AuthGuard } from "@/app/components/auth/AuthGuard"

export default function ApiPage() {
  return (
    <AuthGuard>
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-6">API</h1>
        <p>API management and documentation page</p>
      </div>
    </AuthGuard>
  )
}
