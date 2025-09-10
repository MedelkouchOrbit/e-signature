"use client"

import { useAuthStore } from "@/app/lib/auth/auth-store"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useRouter } from "next/navigation"
import { DocumentsTable } from "@/app/components/documents/DocumentsTableNew"
import { Search, Plus } from "lucide-react"
import { useState } from "react"

export function DashboardClientPage() {
  const { user } = useAuthStore()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")

  const handleAddDocument = () => {
    router.push("/templates/create")
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return "Good Morning"
    if (hour < 17) return "Good Afternoon"
    return "Good Evening"
  }

  const userName = user?.email?.split('@')[0] || "User"

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto p-6 space-y-8">
        {/* Header Section */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {getGreeting()}, {userName}!
            </h1>
          </div>
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="What can I help you find?"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Add Document Section */}
        <div className="flex justify-center">
          <Card 
            className="w-96 h-48 cursor-pointer transition-all hover:shadow-lg hover:scale-105 border-2 border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800"
            onClick={handleAddDocument}
          >
            <CardContent className="flex flex-col items-center justify-center h-full p-8 text-center">
              <div className="w-20 h-20 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mb-6">
                <Plus className="h-10 w-10 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Add document
              </h3>
              <p className="text-base text-gray-500 dark:text-gray-400">
                Drag & drop your document here
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Documents Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Documents
            </h2>
          </div>
          
          {/* Documents Table */}
          <Card>
            <CardContent className="p-0">
              <DocumentsTable />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
