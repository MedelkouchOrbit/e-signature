"use client"

import { useState, useEffect, useCallback } from "react"
import { useTranslations } from "next-intl"
import { AuthGuard } from "@/app/components/auth/AuthGuard"
import { useTemplatesStore } from "@/app/lib/templates-store"
import { templatesApiService } from "@/app/lib/templates-api-service"
import { PDFViewer } from "@/app/components/documents/PDFViewer"
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Plus, Search, MoreVertical, Eye, Edit, Trash2, Filter } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

// Template interface to handle dynamic API response structure
interface TemplateData {
  id?: string
  objectId?: string
  Name?: string
  name?: string
  Description?: string
  description?: string
  URL?: string
  url?: string
  Signers?: Array<unknown>
  signers?: Array<unknown>
  createdAt?: string
  updatedAt?: string
  [key: string]: unknown
}

export default function TemplatesPage() {
  const t = useTranslations("templates")
  const router = useRouter()
  const { 
    templates, 
    isLoading, 
    error,
    setTemplates, 
    setLoading, 
    setError,
    deleteTemplate 
  } = useTemplatesStore()
  
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "archived">("all")
  const [previewTemplate, setPreviewTemplate] = useState<{
    id: string
    name: string
    url: string
  } | null>(null)
  const [showPreview, setShowPreview] = useState(false)

  const loadTemplates = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const templatesResponse = await templatesApiService.getTemplates()
      setTemplates(templatesResponse.results)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t("messages.loadFailed")
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [setLoading, setError, setTemplates, t])

  useEffect(() => {
    loadTemplates()
  }, [loadTemplates])

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm(t("deleteConfirmation"))) return
    
    try {
      const sessionToken = localStorage.getItem('opensign_session_token')
      if (!sessionToken) {
        toast.error('No session token found')
        return
      }

      // Archive the template instead of deleting it
      const response = await fetch(`http://94.249.71.89:9000/api/app/classes/contracts_Template/${templateId}`, {
        method: 'PUT',
        headers: {
          'Accept': 'application/json, text/plain, */*',
          'Accept-Language': 'en-US,en;q=0.9,fr-FR;q=0.8,fr;q=0.7',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'Content-Type': 'application/json',
          'Origin': 'http://94.249.71.89:9000',
          'Pragma': 'no-cache',
          'Referer': 'http://94.249.71.89:9000/report/6TeaPr321t',
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36',
          'X-Parse-Application-Id': 'opensign',
          'X-Parse-Session-Token': sessionToken
        },
        body: JSON.stringify({ IsArchive: true })
      })

      if (!response.ok) {
        throw new Error(`Failed to archive template: ${response.status}`)
      }

      // Remove from local state
      deleteTemplate(templateId)
      toast.success(t("messages.deleteSuccess"))
    } catch (error) {
      console.error('Error archiving template:', error)
      toast.error(t("messages.deleteFailed"))
    }
  }

  const handlePreviewTemplate = (template: TemplateData) => {
    setPreviewTemplate({
      id: template.id || template.objectId || '',
      name: getTemplateField(template, 'name'),
      url: getTemplateField(template, 'url')
    })
    setShowPreview(true)
  }

  // Helper function to get field values from template (handles both API response and local formats)
  const getTemplateField = (template: TemplateData, field: string): string => {
    // Try capitalized version first (API response format)
    const capitalizedField = field.charAt(0).toUpperCase() + field.slice(1)
    if (template[capitalizedField] !== undefined) {
      return String(template[capitalizedField] || '')
    }
    // Fall back to lowercase version (local format)
    return String(template[field] || '')
  }

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = getTemplateField(template as unknown as TemplateData, 'name').toLowerCase().includes(searchQuery.toLowerCase()) ||
                         getTemplateField(template as unknown as TemplateData, 'description').toLowerCase().includes(searchQuery.toLowerCase())
    return matchesSearch
  })

  // Check if any template has description to decide whether to show the description column
  const hasDescriptions = filteredTemplates.some(template => {
    const description = getTemplateField(template as unknown as TemplateData, 'description')
    return description && description.trim() !== '' && description.toLowerCase() !== 'no description'
  })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
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
            onClick={() => router.push('/templates/create')}
            className="bg-[#47a3ad] hover:bg-[#3a8892] text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            {t("createTemplate")}
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
                {t("filterByStatus", { status: statusFilter === "all" ? t("allTemplates") : t(`status.${statusFilter}`) })}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setStatusFilter("all")}>
                {t("allTemplates")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter("active")}>
                {t("status.active")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter("archived")}>
                {t("status.archived")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Templates Table */}
        <div className="overflow-hidden bg-white border border-gray-200 rounded-lg dark:bg-gray-800 dark:border-gray-700">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#47a3ad] mx-auto"></div>
              <p className="mt-2 text-gray-600 dark:text-gray-400">{t("loading")}</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center">
              <p className="mb-4 text-red-600 dark:text-red-400">{error}</p>
              <Button onClick={loadTemplates} variant="outline">
                {t("tryAgain")}
              </Button>
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="p-8 text-center">
              <p className="mb-4 text-gray-600 dark:text-gray-400">
                {searchQuery || statusFilter !== "all" 
                  ? t("noSearchResults")
                  : t("noTemplatesMessage")
                }
              </p>
              <Button 
                onClick={() => router.push('/templates/create')}
                className="bg-[#47a3ad] hover:bg-[#3a8892] text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                {t("createTemplate")}
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("table.name")}</TableHead>
                  {hasDescriptions && <TableHead>{t("table.description")}</TableHead>}
                  <TableHead>{t("table.signers")}</TableHead>
                  <TableHead>{t("table.created")}</TableHead>
                  <TableHead>{t("table.updated")}</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTemplates.map((template) => (
                  <TableRow key={template.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <TableCell className="font-medium">
                      <div className="font-semibold text-gray-900 dark:text-white">
                        {getTemplateField(template as unknown as TemplateData, 'name')}
                      </div>
                    </TableCell>
                    {hasDescriptions && (
                      <TableCell>
                        <div className="max-w-xs text-gray-600 truncate dark:text-gray-300">
                          {getTemplateField(template as unknown as TemplateData, 'description') || t("noDescription")}
                        </div>
                      </TableCell>
                    )}
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {(() => {
                          // First try the lowercase 'signers' (from our transform function)
                          let signers = (template as unknown as TemplateData).signers || []
                          // Fallback to uppercase 'Signers' (direct API response)
                          if (!Array.isArray(signers) || signers.length === 0) {
                            signers = (template as unknown as TemplateData).Signers || []
                          }
                          
                          if (Array.isArray(signers) && signers.length > 0) {
                            return signers.map((signer: unknown, index: number) => {
                              const s = signer as { name?: string; Name?: string; email?: string; Email?: string };
                              return (
                                <span key={index} className="px-2 py-1 text-xs text-blue-800 bg-blue-100 rounded-full dark:bg-blue-900 dark:text-blue-200">
                                  {s.name || s.Name || s.email || s.Email || `Signer ${index + 1}`}
                                </span>
                              );
                            })
                          }
                          return <span className="text-sm text-gray-400">{t("noSigners")}</span>
                        })()}
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-600 dark:text-gray-300">
                      {formatDate(template.createdAt)}
                    </TableCell>
                    <TableCell className="text-gray-600 dark:text-gray-300">
                      {formatDate(template.updatedAt)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem 
                            onClick={() => handlePreviewTemplate(template as unknown as TemplateData)}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            {t("actions.preview")}
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => router.push(`/templates/edit/${template.id}`)}
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            {t("actions.edit")}
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDeleteTemplate(template.id)}
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

      {/* PDF Preview Dialog */}
      {showPreview && previewTemplate && (
        <Dialog open={showPreview} onOpenChange={setShowPreview}>
          <DialogContent className="max-w-4xl w-full h-[80vh]">
            <DialogHeader>
              <DialogTitle>
                Preview: {previewTemplate.name}
              </DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-hidden">
              <PDFViewer
                fileUrl={previewTemplate.url}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </AuthGuard>
  )
}
