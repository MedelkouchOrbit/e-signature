"use client"

import { useState, useEffect, useCallback } from "react"
import { useTranslations } from "next-intl"
import { AuthGuard } from "@/app/components/auth/AuthGuard"
import { useBulkSendStore } from "@/app/lib/bulk-send-store"
import { bulkSendApiService } from "@/app/lib/bulk-send-api-service"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Plus, Search, MoreVertical, Send, Eye, Edit, Trash2, Filter } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

export default function BulkSendPage() {
  const t = useTranslations("bulkSend")
  const router = useRouter()
  const { 
    bulkSends, 
    isLoading, 
    error,
    setBulkSends, 
    setLoading, 
    setError,
    deleteBulkSend 
  } = useBulkSendStore()
  
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "draft" | "sending" | "completed" | "failed">("all")

  const loadBulkSends = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const bulkSendsResponse = await bulkSendApiService.getBulkSends()
      setBulkSends(bulkSendsResponse)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t("messages.loadFailed")
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [setLoading, setError, setBulkSends, t])

  useEffect(() => {
    loadBulkSends()
  }, [loadBulkSends])

  const handleDeleteBulkSend = async (bulkSendId: string) => {
    if (!confirm(t("deleteConfirmation"))) return
    
    try {
      await bulkSendApiService.deleteBulkSend(bulkSendId)
      deleteBulkSend(bulkSendId)
      toast.success(t("messages.deleteSuccess"))
    } catch {
      toast.error(t("messages.deleteFailed"))
    }
  }

  const handleSendBulkSend = async (bulkSendId: string) => {
    if (!confirm(t("sendConfirmation"))) return
    
    try {
      await bulkSendApiService.sendBulkSend(bulkSendId)
      toast.success(t("messages.sendSuccess"))
      // Reload to get updated status
      loadBulkSends()
    } catch {
      toast.error(t("messages.sendFailed"))
    }
  }

  const filteredBulkSends = (bulkSends || []).filter(bulkSend => {
    const matchesSearch = bulkSend.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || bulkSend.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
      case 'sending': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'failed': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
    }
  }

  const getProgressText = (bulkSend: typeof bulkSends[0]) => {
    const { completedCount, totalRecipients } = bulkSend
    return `${completedCount}/${totalRecipients} completed`
  }

  return (
    <AuthGuard>
      <div className="p-8 mx-auto max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="mb-2 text-3xl font-bold text-gray-900 dark:text-white">
              {t("title")}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {t("subtitle")}
            </p>
          </div>
          <Button 
            onClick={() => router.push('/bulk-send/create')}
            className="text-white bg-green-600 hover:bg-green-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            {t("createBulkSend")}
          </Button>
        </div>

        {/* Filters and Search */}
        <div className="flex gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute w-4 h-4 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
            <Input
              placeholder={t("searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Filter className="w-4 h-4" />
                {t("filterByStatus", { status: statusFilter === "all" ? t("allBulkSends") : t(`status.${statusFilter}`) })}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setStatusFilter("all")}>
                {t("allBulkSends")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter("draft")}>
                {t("status.draft")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter("sending")}>
                {t("status.sending")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter("completed")}>
                {t("status.completed")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter("failed")}>
                {t("status.failed")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Bulk Send Table */}
        <div className="overflow-hidden bg-white border border-gray-200 rounded-lg dark:bg-gray-800 dark:border-gray-700">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="w-8 h-8 mx-auto border-b-2 border-green-600 rounded-full animate-spin"></div>
              <p className="mt-2 text-gray-600 dark:text-gray-400">{t("loading")}</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center">
              <p className="mb-4 text-red-600 dark:text-red-400">{error}</p>
              <Button onClick={loadBulkSends} variant="outline">
                {t("tryAgain")}
              </Button>
            </div>
          ) : filteredBulkSends.length === 0 ? (
            <div className="p-8 text-center">
              <p className="mb-4 text-gray-600 dark:text-gray-400">
                {searchQuery || statusFilter !== "all" 
                  ? t("noSearchResults")
                  : t("noBulkSendsMessage")
                }
              </p>
              <Button 
                onClick={() => router.push('/bulk-send/create')}
                className="text-white bg-green-600 hover:bg-green-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                {t("createBulkSend")}
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("table.name")}</TableHead>
                  <TableHead>{t("table.status")}</TableHead>
                  <TableHead>{t("table.recipients")}</TableHead>
                  <TableHead>{t("table.progress")}</TableHead>
                  <TableHead>{t("table.created")}</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBulkSends.map((bulkSend) => (
                  <TableRow key={bulkSend.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <TableCell className="font-medium">
                      <div className="font-semibold text-gray-900 dark:text-white">
                        {bulkSend.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadgeColor(bulkSend.status)}`}>
                        {t(`status.${bulkSend.status}`)}
                      </span>
                    </TableCell>
                    <TableCell className="text-gray-600 dark:text-gray-300">
                      {bulkSend.totalRecipients}
                    </TableCell>
                    <TableCell className="text-gray-600 dark:text-gray-300">
                      {getProgressText(bulkSend)}
                    </TableCell>
                    <TableCell className="text-gray-600 dark:text-gray-300">
                      {formatDate(bulkSend.createdAt)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {bulkSend.status === 'draft' && (
                            <DropdownMenuItem 
                              onClick={() => handleSendBulkSend(bulkSend.id)}
                            >
                              <Send className="w-4 h-4 mr-2" />
                              {t("actions.send")}
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem 
                            onClick={() => router.push(`/bulk-send/${bulkSend.id}`)}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            {t("actions.view")}
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => router.push(`/bulk-send/${bulkSend.id}/edit`)}
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            {t("actions.edit")}
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDeleteBulkSend(bulkSend.id)}
                            className="text-red-600 dark:text-red-400"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            {t("actions.delete")}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </AuthGuard>
  )
}
