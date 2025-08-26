import { AuthGuard } from "@/app/components/auth/AuthGuard"

export default function OthersPage() {
  return (
    <AuthGuard>
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-6">Others</h1>
        <p>Additional features and tools page</p>
      </div>
    </AuthGuard>
  )
}
