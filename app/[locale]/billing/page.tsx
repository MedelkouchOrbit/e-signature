import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Billing - E-Signature Platform",
  description: "Manage your billing and subscription",
}

export default function BillingPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Billing Dashboard</h1>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600">
            🎉 This billing page is automatically protected by middleware!
          </p>
          <p className="text-gray-600 mt-2">
            You can only see this because you have a valid session token.
          </p>
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded">
            <h3 className="font-semibold text-green-800">Protected Route Demo</h3>
            <p className="text-green-700 text-sm mt-1">
              This page (/billing) was automatically protected without adding it to any protection list!
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
