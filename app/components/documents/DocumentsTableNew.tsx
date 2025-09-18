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
import { useDocumentsStore } from "@/app/lib/documents-store"
import { type Document, type DocumentStatus } from "@/app/lib/documents-api-service"
import { useToast } from "@/hooks/use-toast"
import { reminderApiService } from "@/app/lib/reminder-api-service"

// Enhanced with OpenSign patterns: now using getDrive function for document listing
// This component integrates OpenSign's getDrive cloud function for efficient document management
// Maintains compatibility with existing UI/UX while leveraging OpenSign's backend architecture

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
            <AvatarFallback className="font-medium text-white">
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
      <Icon className="w-3 h-3" />
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
            <CheckCircle className="w-4 h-4 mr-2" />
            Sign now
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => onDownload(document)}>
            <Download className="w-4 h-4 mr-2" />
            Download
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onShare(document)}>
            <Share2 className="w-4 h-4 mr-2" />
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
              <Bell className="w-4 h-4 mr-2" />
              Send Reminder
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onShare(document)}>
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDownload(document)}>
              <Download className="w-4 h-4 mr-2" />
              Download
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDuplicate(document)}>
              <Copy className="w-4 h-4 mr-2" />
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="text-red-600"
              onClick={() => onDelete(document)}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </>
        )
      case 'signed':
        return (
          <>
            <DropdownMenuItem onClick={() => onShare(document)} className="text-green-600">
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onDownload(document)}>
              <Download className="w-4 h-4 mr-2" />
              Download
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDuplicate(document)}>
              <Copy className="w-4 h-4 mr-2" />
              Duplicate
            </DropdownMenuItem>
          </>
        )
      case 'drafted':
        return (
          <>
            <DropdownMenuItem onClick={() => onEdit(document)} className="text-blue-600">
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onShare(document)}>
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDownload(document)}>
              <Download className="w-4 h-4 mr-2" />
              Download
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="text-red-600"
              onClick={() => onDelete(document)}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </>
        )
      default:
        return (
          <>
            <DropdownMenuItem onClick={() => onDownload(document)}>
              <Download className="w-4 h-4 mr-2" />
              Download
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDuplicate(document)}>
              <Copy className="w-4 h-4 mr-2" />
              Duplicate
            </DropdownMenuItem>
          </>
        )
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="w-8 h-8 p-0">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="w-4 h-4" />
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
    partially_signed: number
    declined: number
    expired: number
  }
}) {
  const filters = [
    { key: 'all', label: 'All', count: counts.all, description: 'All documents' },
    { key: 'inbox', label: 'Inbox', count: counts.inbox, description: 'Documents requiring your action' },
    { key: 'waiting', label: 'Waiting', count: counts.waiting, description: 'All documents with waiting status' },
    { key: 'signed', label: 'Signed', count: counts.signed, description: 'Completed documents' },
    { key: 'drafted', label: 'Draft', count: counts.drafted, description: 'Draft documents' },
    { key: 'partially_signed', label: 'Partially Signed', count: counts.partially_signed, description: 'Documents with some signatures' },
    { key: 'declined', label: 'Declined', count: counts.declined, description: 'Declined documents' },
    { key: 'expired', label: 'Expired', count: counts.expired, description: 'Expired documents' }
  ]
  
  return (
    <div className="flex p-1 space-x-1 bg-gray-100 rounded-lg">
      {filters.map((filter) => (
        <TooltipProvider key={filter.key}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
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
            </TooltipTrigger>
            <TooltipContent>
              <p>{filter.description}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
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
    setPage,
    downloadDocument,
    deleteDocument,
    getDocumentCounts
  } = useDocumentsStore()
  
  // Local state
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm)
  
  // Check user permissions for signing documents (temporarily disabled due to type conflicts)
  // const { permissions } = useDocumentPermissions(documents)
  
  // Helper function to check if user can sign a specific document (simplified)
  const canUserSignDocument = useCallback((document: Document) => {
    if (document.status !== 'waiting') return false
    // Simplified check - use the canUserSign property from the document
    return document.canUserSign || false
  }, [])
  
  // Load documents on mount
  useEffect(() => {
    loadDocuments()
  }, [loadDocuments])
  
  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearchTerm !== searchTerm) {
        setSearchTerm(localSearchTerm)
      }
    }, 300)
    
    return () => clearTimeout(timer)
  }, [localSearchTerm, searchTerm, setSearchTerm])
  
  // Get document counts
  const counts = getDocumentCounts()
  
  // 🐛 DEBUG: Log filter data to understand inbox vs waiting difference
  useEffect(() => {
    console.log('=== FILTER DEBUG ===')
    console.log('Current filter:', currentFilter)
    console.log('Total documents loaded:', documents.length)
    console.log('Document counts:', counts)
    
    if (documents.length > 0) {
      console.log('Sample document analysis:')
      documents.slice(0, 3).forEach((doc, index) => {
        console.log(`Document ${index + 1}:`, {
          name: doc.name,
          status: doc.status,
          canUserSign: doc.canUserSign,
          userRole: doc.userRole,
          isCurrentUserCreator: doc.isCurrentUserCreator
        })
      })
      
      // Show specific filtering criteria
      const inboxDocs = documents.filter(doc => doc.canUserSign || doc.userRole === 'assignee')
      const waitingDocs = documents.filter(doc => doc.status === 'waiting')
      
      console.log('Inbox filter would show:', inboxDocs.length, 'documents')
      console.log('Waiting filter would show:', waitingDocs.length, 'documents')
      
      console.log('Inbox documents:', inboxDocs.map(d => ({ 
        name: d.name, 
        canUserSign: d.canUserSign, 
        userRole: d.userRole 
      })))
      console.log('Waiting documents:', waitingDocs.map(d => ({ 
        name: d.name, 
        status: d.status 
      })))
    }
    console.log('===================')
  }, [documents, currentFilter, counts])
  
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
      console.log('📥 Downloading document:', document.name);
      
      // Enhanced download following OpenSign patterns
      // Download signed version if document is completed, otherwise original
      const shouldDownloadSigned = document.status === 'signed' || 
                                   document.status === 'partially_signed';
      
      const url = await downloadDocument(document.objectId, shouldDownloadSigned)
      if (url) {
        // OpenSign style: open in new tab or trigger download
        if (shouldDownloadSigned) {
          console.log('📄 Opening signed document in new tab');
        } else {
          console.log('📄 Opening original document in new tab');
        }
        window.open(url, '_blank')
      } else {
        throw new Error('No download URL received')
      }
    } catch (error) {
      console.error('Error downloading document:', error)
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
      // Enhanced sign handler following OpenSign patterns
      console.log('🖊️ Initiating document signing:', document.name);
      
      // Check if user can sign (enhanced validation)
      if (!document.canUserSign) {
        toast({
          title: "Permission Denied",
          description: "You do not have permission to sign this document.",
          variant: "destructive"
        })
        return
      }
      
      // Check document status for signing eligibility
      if (document.status !== 'waiting' && document.status !== 'partially_signed') {
        toast({
          title: "Document Not Available",
          description: `This document is ${document.status} and cannot be signed.`,
          variant: "destructive"
        })
        return
      }
      
      // Check if sendInOrder is enabled and if it's the user's turn
      if (document.sendInOrder) {
        const currentUserSigner = document.signers.find(signer => 
          signer.email === /* Get from auth or localStorage */
          (typeof window !== 'undefined' ? 
            JSON.parse(localStorage.getItem('auth-storage') || '{}')?.state?.user?.email : 
            null)
        );
        
        if (currentUserSigner) {
          const waitingSigners = document.signers
            .filter(signer => signer.status === 'waiting')
            .sort((a, b) => (a.order || 0) - (b.order || 0));
          
          const nextSigner = waitingSigners[0];
          if (nextSigner && nextSigner.email !== currentUserSigner.email) {
            toast({
              title: "Signing Order",
              description: `Please wait for ${nextSigner.name} to sign first.`,
              variant: "destructive"
            })
            return
          }
        }
      }
      
      // Navigate to signing page (OpenSign style: /recipientSignPdf or /placeHolderSign)
      const signUrl = document.isCurrentUserCreator 
        ? `/documents/${document.objectId}/placeholder-sign`  // For document creator (PlaceHolderSign)
        : `/documents/${document.objectId}/sign`;              // For recipients (SignyourselfPdf)
      
      console.log(`📋 Navigating to: ${signUrl}`);
      router.push(signUrl)
      
    } catch (error) {
      console.error('Error initiating document signing:', error)
      toast({
        title: "Signing Error",
        description: "Could not open the signing page. Please try again.",
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
    console.log('🔄 Refreshing documents using getDrive function...')
    loadDocuments()
  }, [loadDocuments])
  
  const handlePageChange = (page: number) => {
    // Since we now use client-side pagination, just set the page
    // The store will update the displayed documents automatically
    setPage(page)
  }
  
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
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Documents</h2>
            <p className="mt-1 text-sm text-gray-500">
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
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute w-4 h-4 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
            <Input
              placeholder="Search documents..."
              value={localSearchTerm}
              onChange={(e) => setLocalSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={currentFilter} onValueChange={setFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <Filter className="w-4 h-4 mr-2" />
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
          <div className="p-4 text-red-700 border-l-4 border-red-400 bg-red-50">
            <p className="font-medium">Error loading documents</p>
            <p className="text-sm">{error}</p>
          </div>
        )}
        
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-5 h-5 animate-spin" />
              <span>Loading documents...</span>
            </div>
          </div>
        ) : documents.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <FileText className="w-12 h-12 mb-4" />
            <h3 className="mb-2 text-lg font-medium">No documents found</h3>
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
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                      Title
                    </th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                      Sender
                    </th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                      Receiver
                    </th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                      Received
                    </th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {documents.map((document) => (
                    <tr key={document.objectId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <FileText className="w-5 h-5 mr-3 text-gray-400" />
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
                                      <AvatarFallback className="font-medium text-white">
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
                                    <div className="flex items-center justify-center w-8 h-8 text-xs font-medium text-gray-600 bg-gray-200 border-2 border-white rounded-full">
                                      +{extractSignersFromDocument(document).length - 4}
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent side="top">
                                    <div className="max-w-48">
                                      <p className="mb-1 font-medium">Additional signers:</p>
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
                      <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                        {formatDate(document.createdAt)}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          {document.status === 'waiting' && !document.isCurrentUserCreator && (
                            <>
                              {canUserSignDocument(document) ? (
                                <Button
                                  size="sm"
                                  onClick={() => handleSign(document)}
                                  className="text-white bg-green-600 hover:bg-green-700"
                                >
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  Sign
                                </Button>
                              ) : (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        size="sm"
                                        disabled
                                        className="text-gray-400 bg-gray-100 cursor-not-allowed"
                                      >
                                        <AlertCircle className="w-4 h-4 mr-1" />
                                        Sign
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>You are not authorized to sign this document</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                            </>
                          )}
                          {canUserSignDocument(document) && document.status === 'signed' && !document.isCurrentUserCreator && (
                            <Badge variant="outline" className="text-green-600 bg-green-50">
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Signed
                            </Badge>
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
            <div className="p-4 space-y-4 md:hidden">
              {documents.map((document) => (
                <Card key={document.objectId} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="w-4 h-4 text-gray-400" />
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
                      {document.status === 'waiting' && !document.isCurrentUserCreator && (
                        <>
                          {canUserSignDocument(document) ? (
                            <Button
                              size="sm"
                              onClick={() => handleSign(document)}
                              className="text-white bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Sign
                            </Button>
                          ) : (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="sm"
                                    disabled
                                    className="text-gray-400 bg-gray-100 cursor-not-allowed"
                                  >
                                    <AlertCircle className="w-4 h-4 mr-1" />
                                    Sign
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>You are not authorized to sign this document</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </>
                      )}
                      {canUserSignDocument(document) && document.status === 'signed' && !document.isCurrentUserCreator && (
                        <Badge variant="outline" className="text-green-600 bg-green-50">
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Signed
                        </Badge>
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
                    <ChevronLeft className="w-4 h-4" />
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
                    <ChevronRight className="w-4 h-4" />
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
