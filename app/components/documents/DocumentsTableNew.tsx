"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
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
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Bell
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useDocumentsStore } from "@/app/lib/documents-store-new"
import { type Document, type DocumentStatus, checkUserSignPermission } from "@/app/lib/documents-api-service"
import { useToast } from "@/hooks/use-toast"
import { reminderApiService } from "@/app/lib/reminder-api-service"

// Custom hook to check user permissions for documents
function useDocumentPermissions(documents: Document[]) {
  const [permissions, setPermissions] = useState<Map<string, boolean>>(new Map())
  const [loading, setLoading] = useState<boolean>(false)

  useEffect(() => {
    async function checkPermissions() {
      if (documents.length === 0) return
      
      setLoading(true)
      const newPermissions = new Map<string, boolean>()
      
      // Check permissions for all waiting documents
      const waitingDocs = documents.filter(doc => doc.status === 'waiting')
      
      await Promise.all(
        waitingDocs.map(async (doc) => {
          try {
            const hasPermission = await checkUserSignPermission(doc)
            newPermissions.set(doc.objectId, hasPermission)
          } catch (error) {
            console.error(`Error checking permission for document ${doc.objectId}:`, error)
            newPermissions.set(doc.objectId, false)
          }
        })
      )
      
      setPermissions(newPermissions)
      setLoading(false)
    }
    
    checkPermissions()
  }, [documents])

  return { permissions, loading }
}

// Helper functions for avatar
const getInitials = (name: string) => {
  return name
    .split(' ')
    .map(part => part.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

const getAvatarColor = (name: string) => {
  const colors = [
    'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-red-500',
    'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-cyan-500'
  ]
  const index = name.length % colors.length
  return colors[index]
}

// Helper function to extract signers from placeholders
const extractSignersFromDocument = (document: Document) => {
  console.log('Processing document:', document.name);
  console.log('Document signers:', document.signers);
  console.log('Document placeholders:', document.placeholders);
  
  // If signers already exist, use them
  if (document.signers && document.signers.length > 0) {
    console.log('Using existing signers:', document.signers);
    return document.signers;
  }
  
  // Try to extract from placeholders with different possible structures
  type PlaceholderVariant = { Placeholders?: unknown[] };
  const placeholders = document.placeholders || (document as unknown as PlaceholderVariant).Placeholders || [];
  console.log('Trying placeholders:', placeholders);
  
  if (placeholders && placeholders.length > 0) {
    const uniqueEmails = new Set<string>();
    const signers: { id: string; name: string; email: string; role: string; color: string; status: string; order: number }[] = [];
    
    placeholders.forEach((placeholder: { id?: string; email?: string; Email?: string; signerRole?: string; SignerRole?: string }, index: number) => {
      console.log('Processing placeholder:', placeholder);
      const email = placeholder.email || placeholder.Email;
      if (email && !uniqueEmails.has(email)) {
        uniqueEmails.add(email);
        
        // Extract name from email
        const name = email.split('@')[0];
        
        const signer = {
          id: placeholder.id || `placeholder-${index}`,
          name: name,
          email: email,
          role: placeholder.signerRole || placeholder.SignerRole || 'Signer',
          color: getAvatarColor(name),
          status: 'waiting',
          order: signers.length + 1
        };
        
        console.log('Adding signer:', signer);
        signers.push(signer);
      }
    });
    
    console.log('Final signers extracted:', signers);
    return signers;
  }
  
  console.log('No placeholders found, returning empty array');
  return [];
};

// User avatar with initials component
function UserAvatar({ name, email, size = "sm" }: { 
  name: string
  email?: string
  size?: "sm" | "md" | "lg"
}) {
  const sizeClasses = {
    sm: "h-6 w-6 text-xs",
    md: "h-8 w-8 text-sm", 
    lg: "h-10 w-10 text-base"
  }
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Avatar className={cn(sizeClasses[size], getAvatarColor(name))}>
            <AvatarFallback className="text-white font-medium">
              {getInitials(name)}
            </AvatarFallback>
          </Avatar>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-center">
            <div className="font-medium">{name}</div>
            {email && <div className="text-xs text-gray-500">{email}</div>}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

// Status badge component
function StatusBadge({ status }: { status: DocumentStatus }) {
  const statusConfig = {
    waiting: {
      label: "Waiting",
      variant: "secondary" as const,
      icon: Clock,
      className: "bg-orange-100 text-orange-800 border-orange-200"
    },
    signed: {
      label: "Signed", 
      variant: "default" as const,
      icon: CheckCircle,
      className: "bg-green-100 text-green-800 border-green-200"
    },
    partially_signed: {
      label: "Partially Signed",
      variant: "secondary" as const,
      icon: Clock,
      className: "bg-blue-100 text-blue-800 border-blue-200"
    },
    drafted: {
      label: "Draft",
      variant: "outline" as const,
      icon: Edit,
      className: "bg-gray-100 text-gray-800 border-gray-200"
    },
    declined: {
      label: "Declined",
      variant: "destructive" as const, 
      icon: AlertCircle,
      className: "bg-red-100 text-red-800 border-red-200"
    },
    expired: {
      label: "Expired",
      variant: "secondary" as const,
      icon: AlertCircle,
      className: "bg-gray-100 text-gray-600 border-gray-200"
    }
  }
  
  const config = statusConfig[status]
  const Icon = config.icon
  
  return (
    <Badge variant={config.variant} className={cn("gap-1", config.className)}>
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  )
}

// Document action menu
// Document actions menu component
function DocumentActionMenu({ 
  document, 
  onShare, 
  onEdit,
  onDownload,
  onDuplicate,
  onDelete,
  onSign,
  onReminder,
  userCanSign = false
}: {
  document: Document
  onShare: (document: Document) => void
  onEdit: (document: Document) => void
  onDownload: (document: Document) => void
  onDuplicate: (document: Document) => void
  onDelete: (document: Document) => void
  onSign: (document: Document) => void
  onReminder: (document: Document) => void
  userCanSign?: boolean
}) {
  const getActionsByStatus = (status: DocumentStatus, canUserSign: boolean) => {
    if (canUserSign && status === 'waiting') {
      return (
        <>
          <DropdownMenuItem onClick={() => onSign(document)} className="text-green-600">
            <CheckCircle className="h-4 w-4 mr-2" />
            Sign now
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => onDownload(document)}>
            <Download className="h-4 w-4 mr-2" />
            Download
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onShare(document)}>
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </DropdownMenuItem>
        </>
      )
    }
    
    switch (status) {
      case 'waiting':
        return (
          <>
            <DropdownMenuItem onClick={() => onReminder(document)} className="text-blue-600">
              <Bell className="h-4 w-4 mr-2" />
              Send Reminder
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onShare(document)}>
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDownload(document)}>
              <Download className="h-4 w-4 mr-2" />
              Download
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDuplicate(document)}>
              <Copy className="h-4 w-4 mr-2" />
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="text-red-600"
              onClick={() => onDelete(document)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </>
        )
      case 'signed':
        return (
          <>
            <DropdownMenuItem onClick={() => onShare(document)} className="text-green-600">
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onDownload(document)}>
              <Download className="h-4 w-4 mr-2" />
              Download
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDuplicate(document)}>
              <Copy className="h-4 w-4 mr-2" />
              Duplicate
            </DropdownMenuItem>
          </>
        )
      case 'drafted':
        return (
          <>
            <DropdownMenuItem onClick={() => onEdit(document)} className="text-blue-600">
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onShare(document)}>
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDownload(document)}>
              <Download className="h-4 w-4 mr-2" />
              Download
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="text-red-600"
              onClick={() => onDelete(document)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </>
        )
      default:
        return (
          <>
            <DropdownMenuItem onClick={() => onDownload(document)}>
              <Download className="h-4 w-4 mr-2" />
              Download
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDuplicate(document)}>
              <Copy className="h-4 w-4 mr-2" />
              Duplicate
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
        {getActionsByStatus(document.status, userCanSign)}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// Filter tabs component
function FilterTabs({ 
  currentFilter, 
  onFilterChange, 
  counts 
}: {
  currentFilter: DocumentStatus | 'all' | 'inbox'
  onFilterChange: (filter: DocumentStatus | 'all' | 'inbox') => void
  counts: {
    all: number
    inbox: number
    waiting: number
    signed: number
    drafted: number
  }
}) {
  const filters = [
    { key: 'all', label: 'All', count: counts.all },
    { key: 'inbox', label: 'Inbox', count: counts.inbox },
    { key: 'waiting', label: 'Waiting', count: counts.waiting },
    { key: 'signed', label: 'Signed', count: counts.signed },
    { key: 'drafted', label: 'Draft', count: counts.drafted }
  ]
  
  return (
    <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
      {filters.map((filter) => (
        <button
          key={filter.key}
          onClick={() => onFilterChange(filter.key as DocumentStatus | 'all' | 'inbox')}
          className={cn(
            "px-3 py-1.5 text-sm font-medium rounded-md transition-colors flex items-center gap-2",
            currentFilter === filter.key
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-600 hover:text-gray-900 hover:bg-white/50"
          )}
        >
          {filter.label}
          <span className={cn(
            "px-1.5 py-0.5 text-xs rounded-full",
            currentFilter === filter.key
              ? "bg-blue-100 text-blue-800"
              : "bg-gray-200 text-gray-600"
          )}>
            {filter.count}
          </span>
        </button>
      ))}
    </div>
  )
}

export function DocumentsTable() {
  const router = useRouter()
  const { toast } = useToast()
  
  // Store state
  const { 
    documents,
    isLoading,
    error,
    currentFilter,
    searchTerm,
    currentPage,
    totalPages,
    totalCount,
    itemsPerPage,
    loadDocuments,
    setFilter,
    setSearchTerm,
    downloadDocument,
    deleteDocument,
    getDocumentCounts
  } = useDocumentsStore()
  
  // Local state
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm)
  
  // Check user permissions for signing documents
  const { permissions } = useDocumentPermissions(documents)
  
  // Helper function to check if user can sign a specific document
  const canUserSignDocument = useCallback((document: Document) => {
    if (document.status !== 'waiting') return false
    return permissions.get(document.objectId) || false
  }, [permissions])
  
  // Load documents on mount
  useEffect(() => {
    loadDocuments()
  }, [loadDocuments])
  
  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearchTerm !== searchTerm) {
        setSearchTerm(localSearchTerm)
        loadDocuments({ searchTerm: localSearchTerm })
      }
    }, 300)
    
    return () => clearTimeout(timer)
  }, [localSearchTerm, searchTerm, setSearchTerm, loadDocuments])
  
  // Get document counts
  const counts = getDocumentCounts()
  
  // Action handlers
  const handleShare = useCallback(async (document: Document) => {
    // Implement share functionality
    console.log('Share document:', document.objectId)
    toast({
      title: "Share Document",
      description: "Share functionality would be implemented here"
    })
  }, [toast])
  
  const handleEdit = useCallback((document: Document) => {
    router.push(`/documents/${document.objectId}/edit`)
  }, [router])
  
  const handleDownload = useCallback(async (document: Document) => {
    try {
      const url = await downloadDocument(document.objectId, document.status === 'signed')
      if (url) {
        window.open(url, '_blank')
      }
    } catch {
      toast({
        title: "Download Error",
        description: "Failed to download document",
        variant: "destructive"
      })
    }
  }, [downloadDocument, toast])
  
  const handleDuplicate = useCallback((document: Document) => {
    console.log('Duplicate document:', document.objectId)
    toast({
      title: "Duplicate Document", 
      description: "Duplicate functionality would be implemented here"
    })
  }, [toast])
  
  const handleDelete = useCallback(async (document: Document) => {
    if (confirm(`Are you sure you want to delete "${document.name}"?`)) {
      try {
        await deleteDocument(document.objectId)
        toast({
          title: "Document Deleted",
          description: `"${document.name}" has been deleted`
        })
      } catch {
        toast({
          title: "Delete Error",
          description: "Failed to delete document",
          variant: "destructive"
        })
      }
    }
  }, [deleteDocument, toast])
  
  const handleSign = useCallback(async (document: Document) => {
    try {
      // Check if user has permission to sign this document
      const hasPermission = await checkUserSignPermission(document)
      
      if (!hasPermission) {
        toast({
          title: "Permission Denied",
          description: "You do not have permission to sign this document. Only authorized signers can sign.",
          variant: "destructive"
        })
        return
      }
      
      // If permission is granted, navigate to sign page
      router.push(`/documents/${document.objectId}/sign`)
    } catch (error) {
      console.error('Error checking sign permission:', error)
      toast({
        title: "Permission Check Error",
        description: "Could not verify your permission to sign this document. Please try again.",
        variant: "destructive"
      })
    }
  }, [router, toast])
  
  const handleReminder = useCallback(async (document: Document) => {
    try {
      await reminderApiService.sendReminderToAll(document.objectId)
      toast({
        title: "Reminder Sent",
        description: `Reminder has been sent to all pending signers for "${document.name}"`
      })
    } catch {
      toast({
        title: "Reminder Error",
        description: "Failed to send reminder",
        variant: "destructive"
      })
    }
  }, [toast])
  
  const handleRefresh = useCallback(() => {
    loadDocuments({ page: 1 })
  }, [loadDocuments])
  
  const handlePageChange = useCallback((page: number) => {
    loadDocuments({ page })
  }, [loadDocuments])
  
  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }
  
  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Documents</h2>
            <p className="text-sm text-gray-500 mt-1">
              Manage your documents and signatures
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
            >
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            </Button>
          </div>
        </div>
        
        {/* Filter tabs */}
        <FilterTabs 
          currentFilter={currentFilter}
          onFilterChange={setFilter}
          counts={counts}
        />
        
        {/* Search and filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search documents..."
              value={localSearchTerm}
              onChange={(e) => setLocalSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={currentFilter} onValueChange={setFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Documents</SelectItem>
              <SelectItem value="inbox">Inbox</SelectItem>
              <SelectItem value="waiting">Waiting</SelectItem>
              <SelectItem value="signed">Signed</SelectItem>
              <SelectItem value="drafted">Draft</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        {error && (
          <div className="p-4 bg-red-50 border-l-4 border-red-400 text-red-700">
            <p className="font-medium">Error loading documents</p>
            <p className="text-sm">{error}</p>
          </div>
        )}
        
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 animate-spin" />
              <span>Loading documents...</span>
            </div>
          </div>
        ) : documents.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <FileText className="h-12 w-12 mb-4" />
            <h3 className="text-lg font-medium mb-2">No documents found</h3>
            <p className="text-sm text-center">
              {searchTerm ? "Try adjusting your search terms" : "No documents found"}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Title
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sender
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Receiver
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Received
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {documents.map((document) => (
                    <tr key={document.objectId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <FileText className="h-5 w-5 text-gray-400 mr-3" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {document.name}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <StatusBadge status={document.status} />
                              {canUserSignDocument(document) && !document.isCurrentUserCreator && (
                                <Badge variant="outline" className="text-xs">
                                  Action Required
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <UserAvatar 
                            name={document.senderName} 
                            email={document.senderEmail}
                            size="md"
                          />
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">
                              {document.senderName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {document.senderEmail}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {(() => {
                          const documentSigners = extractSignersFromDocument(document);
                          console.log('Document signers for', document.name, ':', documentSigners);
                          return documentSigners.length > 0;
                        })() ? (
                          <TooltipProvider>
                            <div className="flex -space-x-1">
                              {extractSignersFromDocument(document).slice(0, 4).map((signer) => (
                                <Tooltip key={signer.id}>
                                  <TooltipTrigger>
                                    <Avatar className={cn("h-8 w-8 text-sm", getAvatarColor(signer.name))}>
                                      <AvatarFallback className="text-white font-medium">
                                        {getInitials(signer.name)}
                                      </AvatarFallback>
                                    </Avatar>
                                  </TooltipTrigger>
                                  <TooltipContent side="top">
                                    <p className="font-medium">{signer.name}</p>
                                    <p className="text-xs text-gray-400">{signer.email}</p>
                                  </TooltipContent>
                                </Tooltip>
                              ))}
                              {extractSignersFromDocument(document).length > 4 && (
                                <Tooltip>
                                  <TooltipTrigger>
                                    <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600 border-2 border-white">
                                      +{extractSignersFromDocument(document).length - 4}
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent side="top">
                                    <div className="max-w-48">
                                      <p className="font-medium mb-1">Additional signers:</p>
                                      {extractSignersFromDocument(document).slice(4).map((signer) => (
                                        <p key={signer.id} className="text-xs">
                                          {signer.name} ({signer.email})
                                        </p>
                                      ))}
                                    </div>
                                  </TooltipContent>
                                </Tooltip>
                              )}
                            </div>
                          </TooltipProvider>
                        ) : (
                          <span className="text-gray-400">- (No signers: {JSON.stringify(document.signers)})</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(document.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          {canUserSignDocument(document) && document.status === 'waiting' && !document.isCurrentUserCreator && (
                            <Button
                              size="sm"
                              onClick={() => handleSign(document)}
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Sign
                            </Button>
                          )}
                          <DocumentActionMenu
                            document={document}
                            onShare={handleShare}
                            onEdit={handleEdit}
                            onDownload={handleDownload}
                            onDuplicate={handleDuplicate}
                            onDelete={handleDelete}
                            onSign={handleSign}
                            onReminder={handleReminder}
                            userCanSign={canUserSignDocument(document)}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Mobile cards */}
            <div className="md:hidden space-y-4 p-4">
              {documents.map((document) => (
                <Card key={document.objectId} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="h-4 w-4 text-gray-400" />
                        <h3 className="font-medium text-gray-900 truncate">
                          {document.name}
                        </h3>
                      </div>
                      
                      <div className="flex items-center gap-2 mb-3">
                        <StatusBadge status={document.status} />
                        {canUserSignDocument(document) && !document.isCurrentUserCreator && (
                          <Badge variant="outline" className="text-xs">
                            Action Required
                          </Badge>
                        )}
                      </div>
                      
                      <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">From:</span>
                          <UserAvatar 
                            name={document.senderName}
                            email={document.senderEmail}
                            size="sm"
                          />
                          <span>{document.senderName}</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <span className="font-medium">To:</span>
                          <div className="flex -space-x-1">
                            {document.signers.slice(0, 3).map((signer) => (
                              <UserAvatar 
                                key={signer.id}
                                name={signer.name}
                                email={signer.email}
                                size="sm"
                              />
                            ))}
                            {document.signers.length > 3 && (
                              <span className="ml-2 text-xs">
                                +{document.signers.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div>
                          <span className="font-medium">Received:</span>
                          <span className="ml-2">{formatDate(document.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {canUserSignDocument(document) && document.status === 'waiting' && !document.isCurrentUserCreator && (
                        <Button
                          size="sm"
                          onClick={() => handleSign(document)}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Sign
                        </Button>
                      )}
                      <DocumentActionMenu
                        document={document}
                        onShare={handleShare}
                        onEdit={handleEdit}
                        onDownload={handleDownload}
                        onDuplicate={handleDuplicate}
                        onDelete={handleDelete}
                        onSign={handleSign}
                        onReminder={handleReminder}
                        userCanSign={canUserSignDocument(document)}
                      />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t">
                <div className="text-sm text-gray-500">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
                  {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} results
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(page => 
                        page === 1 || 
                        page === totalPages || 
                        Math.abs(page - currentPage) <= 1
                      )
                      .map((page, index, array) => (
                        <div key={page} className="flex items-center">
                          {index > 0 && array[index - 1] !== page - 1 && (
                            <span className="px-2 text-gray-400">...</span>
                          )}
                          <Button
                            variant={page === currentPage ? "default" : "outline"}
                            size="sm"
                            onClick={() => handlePageChange(page)}
                            className="w-8 h-8 p-0"
                          >
                            {page}
                          </Button>
                        </div>
                      ))}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
