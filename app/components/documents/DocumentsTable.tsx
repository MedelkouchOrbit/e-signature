"use client"

  import { useState, useEffect } from "react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { 
  Search, 
  Filter, 
  MoreHorizontal, 
  Download, 
  Share2, 
  Edit, 
  Copy, 
  Trash2, 
  RefreshCw,
  Eye,
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useDocumentsStore, type Document } from "@/app/lib/documents-store"
import { useToast } from "@/hooks/use-toast"

interface ShareDialogState {
  isOpen: boolean
  document: Document | null
  recipients: string[]
}

interface ActionMenuProps {
  document: Document
  onShare: (document: Document) => void
  onEdit: (document: Document) => void
  onDownload: (document: Document) => void
  onDuplicate: (document: Document) => void
  onDelete: (document: Document) => void
}

function ActionMenu({ 
  document, 
  onShare, 
  onEdit, 
  onDownload, 
  onDuplicate, 
  onDelete 
}: ActionMenuProps) {
  const t = useTranslations("documents")

  const getActionsByStatus = (status: string) => {
    switch (status) {
      case 'waiting':
        return (
          <>
            <DropdownMenuItem onClick={() => onShare(document)}>
              <Share2 className="h-4 w-4 mr-2" />
              {t("share")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDownload(document)}>
              <Download className="h-4 w-4 mr-2" />
              {t("download")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDuplicate(document)}>
              <Copy className="h-4 w-4 mr-2" />
              {t("duplicate")}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="text-red-600"
              onClick={() => onDelete(document)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {t("delete")}
            </DropdownMenuItem>
          </>
        )
      case 'signed':
        return (
          <>
            <DropdownMenuItem onClick={() => onShare(document)}>
              <Share2 className="h-4 w-4 mr-2" />
              {t("share")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDownload(document)}>
              <Download className="h-4 w-4 mr-2" />
              {t("download")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDuplicate(document)}>
              <Copy className="h-4 w-4 mr-2" />
              {t("duplicate")}
            </DropdownMenuItem>
          </>
        )
      case 'drafted':
        return (
          <>
            <DropdownMenuItem onClick={() => onEdit(document)}>
              <Edit className="h-4 w-4 mr-2" />
              {t("edit")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onShare(document)}>
              <Share2 className="h-4 w-4 mr-2" />
              {t("share")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDownload(document)}>
              <Download className="h-4 w-4 mr-2" />
              {t("download")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDuplicate(document)}>
              <Copy className="h-4 w-4 mr-2" />
              {t("duplicate")}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="text-red-600"
              onClick={() => onDelete(document)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {t("delete")}
            </DropdownMenuItem>
          </>
        )
      default:
        return (
          <>
            <DropdownMenuItem onClick={() => onDownload(document)}>
              <Download className="h-4 w-4 mr-2" />
              {t("download")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDuplicate(document)}>
              <Copy className="h-4 w-4 mr-2" />
              {t("duplicate")}
            </DropdownMenuItem>
          </>
        )
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {getActionsByStatus(document.status)}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function ReceiverTooltip({ document }: { document: Document }) {
  const t = useTranslations("documents")

  if (!document.Signers || document.Signers.length === 0) {
    return <span className="text-gray-500">-</span>
  }

  const signers = document.Signers

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center space-x-1 cursor-pointer">
            <span className="text-sm">
              {signers.map(signer => signer.Name || signer.Email).join(", ")}
            </span>
            <Users className="h-3 w-3 text-gray-400" />
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="p-2 space-y-2">
            <h4 className="font-medium text-sm">Signers Status</h4>
            {signers.map((signer, index) => (
              <div key={index} className="flex items-center justify-between space-x-4">
                <span className="text-xs">
                  {(signer as { Name?: string; Email?: string })?.Name || 
                   (signer as { Name?: string; Email?: string })?.Email || 
                   'Unknown'}
                </span>
                <div className="flex items-center space-x-1">
                  {document.status === 'signed' ? (
                    <>
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      <span className="text-xs text-green-600">{t("tooltip.signed")}</span>
                    </>
                  ) : (
                    <>
                      <Clock className="h-3 w-3 text-orange-500" />
                      <span className="text-xs text-orange-600">{t("tooltip.waiting")}</span>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

interface DocumentsTableProps {
  onCreateDocument?: () => void
  className?: string
}

export function DocumentsTable({ onCreateDocument, className }: DocumentsTableProps) {
  const t = useTranslations("documents")
  const { toast } = useToast()

  const {
    documents,
    isLoading,
    error,
    currentFilter,
    searchQuery,
    currentPage,
    totalDocuments,
    pageSize,
    fetchDocuments,
    setFilter,
    setSearchQuery,
    setCurrentPage,
    shareDocument,
    duplicateDocument,
    deleteDocument,
    clearError
  } = useDocumentsStore()

  const [shareDialog, setShareDialog] = useState<ShareDialogState>({
    isOpen: false,
    document: null,
    recipients: []
  })
  const [newRecipient, setNewRecipient] = useState("")

  useEffect(() => {
    fetchDocuments()
  }, [fetchDocuments])

  // Clear error when component unmounts
  useEffect(() => {
    return () => clearError()
  }, [clearError])

  const handleSearch = (value: string) => {
    setSearchQuery(value)
  }

  const handleStatusFilter = (status: string) => {
    setFilter(status)
  }

  const handleClearFilter = () => {
    setFilter('all')
    setSearchQuery('')
  }

  const handleShare = (document: Document) => {
    setShareDialog({
      isOpen: true,
      document,
      recipients: []
    })
  }

  const handleShareSubmit = async () => {
    if (!shareDialog.document || shareDialog.recipients.length === 0) {
      toast({
        title: "Share Error",
        description: "Please add at least one recipient",
        variant: "destructive",
      })
      return
    }

    try {
      const recipients = shareDialog.recipients.map(email => ({ email }))
      await shareDocument(shareDialog.document.objectId, recipients)
      toast({
        title: "Document Shared",
        description: `Document shared with ${shareDialog.recipients.length} recipient(s)`,
      })
      setShareDialog({ isOpen: false, document: null, recipients: [] })
    } catch (error) {
      toast({
        title: "Share Failed",
        description: error instanceof Error ? error.message : "Failed to share document",
        variant: "destructive",
      })
    }
  }

  const handleAddRecipient = () => {
    if (newRecipient && !shareDialog.recipients.includes(newRecipient)) {
      setShareDialog({
        ...shareDialog,
        recipients: [...shareDialog.recipients, newRecipient]
      })
      setNewRecipient("")
    }
  }

  const handleRemoveRecipient = (email: string) => {
    setShareDialog({
      ...shareDialog,
      recipients: shareDialog.recipients.filter(r => r !== email)
    })
  }

  const handleEdit = (/* _document: Document */) => {
    toast({
      title: "Edit Document",
      description: "Edit functionality would navigate to document editor",
    })
  }

  const handleDownload = (document: Document) => {
    if (document.SignedUrl || document.URL) {
      window.open(document.SignedUrl || document.URL, '_blank')
    } else {
      toast({
        title: "Download Error",
        description: "Document URL not available",
        variant: "destructive",
      })
    }
  }

  const handleDuplicate = async (document: Document) => {
    try {
      await duplicateDocument(document.objectId)
      toast({
        title: "Document Duplicated",
        description: `${document.Name} has been duplicated`,
      })
    } catch (error) {
      toast({
        title: "Duplicate Failed",
        description: error instanceof Error ? error.message : "Failed to duplicate document",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (document: Document) => {
    try {
      await deleteDocument(document.objectId)
      toast({
        title: "Document Deleted",
        description: `${document.Name} has been deleted`,
      })
    } catch (error) {
      toast({
        title: "Delete Failed",
        description: error instanceof Error ? error.message : "Failed to delete document",
        variant: "destructive",
      })
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'signed':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">{t("status.signed")}</Badge>
      case 'waiting':
        return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">{t("status.waiting")}</Badge>
      case 'drafted':
        return <Badge variant="secondary">{t("status.drafted")}</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const totalPages = Math.ceil(totalDocuments / pageSize)

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">{t("title")}</h1>
          <div className="flex items-center gap-4">
            <p className="text-gray-600">
              {totalDocuments} {totalDocuments === 1 ? 'document' : 'documents'}
            </p>
          </div>
        </div>
        <Button onClick={onCreateDocument}>
          <Plus className="h-4 w-4 mr-2" />
          {t("createDocument")}
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder={t("search_placeholder")}
                value={searchQuery || ''}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Status Filter */}
            <Select
              value={currentFilter || 'all'}
              onValueChange={handleStatusFilter}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={t("filter_by_status")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("allDocuments")}</SelectItem>
                <SelectItem value="waiting">{t("waiting")}</SelectItem>
                <SelectItem value="signed">{t("signed")}</SelectItem>
                <SelectItem value="drafted">{t("drafted")}</SelectItem>
              </SelectContent>
            </Select>

            {/* Advanced Filter */}
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              {t("advancedFilter")}
            </Button>

            {/* Clear Filters */}
            <Button variant="ghost" onClick={handleClearFilter}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Clear
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <span className="text-red-700">{error}</span>
              <Button variant="ghost" size="sm" onClick={clearError}>
                ×
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Documents Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-6 w-6 animate-spin mr-2" />
              <span>Loading documents...</span>
            </div>
          ) : documents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Eye className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {t("no_documents")}
              </h3>
              <p className="text-gray-500 mb-4">
                Start by creating your first document
              </p>
              <Button onClick={onCreateDocument}>
                <Plus className="h-4 w-4 mr-2" />
                {t("createDocument")}
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-gray-50">
                  <tr>
                    <th className="text-left p-4 font-medium text-gray-900">{t("title_column")}</th>
                    <th className="text-left p-4 font-medium text-gray-900">{t("sender")}</th>
                    <th className="text-left p-4 font-medium text-gray-900">{t("receiver")}</th>
                    <th className="text-left p-4 font-medium text-gray-900">{t("received")}</th>
                    <th className="text-left p-4 font-medium text-gray-900">Status</th>
                    <th className="text-left p-4 font-medium text-gray-900">{t("action")}</th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map((document, index) => (
                    <tr 
                      key={document.objectId} 
                      className={cn(
                        "border-b hover:bg-gray-50 transition-colors",
                        index % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                      )}
                    >
                      <td className="p-4">
                        <div className="font-medium text-gray-900">{document.Name}</div>
                        {document.Note && (
                          <div className="text-sm text-gray-500">{document.Note}</div>
                        )}
                      </td>
                      <td className="p-4 text-sm text-gray-600">
                        {document.ExtUserPtr?.Name || document.CreatedBy?.objectId || '-'}
                      </td>
                      <td className="p-4">
                        <ReceiverTooltip document={document} />
                      </td>
                      <td className="p-4 text-sm text-gray-600">
                        {new Date(document.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-4">
                        {getStatusBadge(document.status)}
                      </td>
                      <td className="p-4">
                        <ActionMenu
                          document={document}
                          onShare={handleShare}
                          onEdit={handleEdit}
                          onDownload={handleDownload}
                          onDuplicate={handleDuplicate}
                          onDelete={handleDelete}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Share Dialog */}
      <Dialog open={shareDialog.isOpen} onOpenChange={(open) => 
        setShareDialog({ ...shareDialog, isOpen: open })
      }>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("share")} {shareDialog.document?.Name}</DialogTitle>
            <DialogDescription>
              {t("shareTo")}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex space-x-2">
              <Input
                placeholder="Enter email address"
                value={newRecipient}
                onChange={(e) => setNewRecipient(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddRecipient()}
              />
              <Button onClick={handleAddRecipient}>Add</Button>
            </div>
            
            {shareDialog.recipients.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Recipients:</h4>
                {shareDialog.recipients.map((email, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm">{email}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveRecipient(email)}
                    >
                      ×
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShareDialog({ isOpen: false, document: null, recipients: [] })}
            >
              {t("cancel")}
            </Button>
            <Button onClick={handleShareSubmit}>
              {t("share")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
