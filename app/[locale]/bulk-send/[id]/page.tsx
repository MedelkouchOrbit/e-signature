"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { AuthGuard } from "@/app/components/auth/AuthGuard"
import { bulkSendApiService } from "@/app/lib/bulk-send-api-service"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  ArrowLeft, 
  Send, 
  Users, 
  FileText, 
  Calendar, 
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Download,
  Mail,
  Eye,
  MoreVertical
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "sonner"

interface BulkSendDetails {
  id: string
  name: string
  templateName: string
  status: 'draft' | 'sending' | 'completed' | 'failed'
  totalRecipients: number
  completedCount: number
  createdAt: string
  sentAt?: string
  completedAt?: string
  message?: string
  sendInOrder: boolean
  documents: Array<{
    id: string
    recipientName: string
    recipientEmail: string
    status: 'pending' | 'sent' | 'viewed' | 'signed' | 'completed' | 'declined' | 'expired'
    sentAt?: string
    viewedAt?: string
    signedAt?: string
    completedAt?: string
    order: number
  }>
}

export default function BulkSendDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const [bulkSend, setBulkSend] = useState<BulkSendDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const bulkSendId = params.id as string

  const loadBulkSendDetails = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const details = await bulkSendApiService.getBulkSendDetails(bulkSendId)
      setBulkSend(details)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load bulk send details'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [bulkSendId])

  useEffect(() => {
    loadBulkSendDetails()
  }, [loadBulkSendDetails])

  const handleSendBulkSend = async () => {
    if (!bulkSend || !confirm('Are you sure you want to send this bulk send?')) return
    
    try {
      await bulkSendApiService.sendBulkSend(bulkSendId)
      toast.success('Bulk send initiated successfully')
      loadBulkSendDetails() // Reload to get updated status
    } catch {
      toast.error('Failed to send bulk send')
    }
  }

  const handleResendDocument = async (documentId: string) => {
    try {
      await bulkSendApiService.resendDocument(documentId)
      toast.success('Document resent successfully')
      loadBulkSendDetails()
    } catch {
      toast.error('Failed to resend document')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
      case 'sending': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'failed': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'sent': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'viewed': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
      case 'signed': return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200'
      case 'declined': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'expired': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4" />
      case 'failed': return <XCircle className="w-4 h-4" />
      case 'declined': return <XCircle className="w-4 h-4" />
      case 'expired': return <AlertCircle className="w-4 h-4" />
      case 'sending': return <Send className="w-4 h-4" />
      case 'viewed': return <Eye className="w-4 h-4" />
      case 'signed': return <CheckCircle className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getProgressPercentage = () => {
    if (!bulkSend) return 0
    return Math.round((bulkSend.completedCount / bulkSend.totalRecipients) * 100)
  }

  if (isLoading) {
    return (
      <AuthGuard>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#47a3ad] mx-auto"></div>
            <p className="mt-2 text-gray-600 dark:text-gray-400">Loading bulk send details...</p>
          </div>
        </div>
      </AuthGuard>
    )
  }

  if (error) {
    return (
      <AuthGuard>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <p className="mb-4 text-red-600 dark:text-red-400">{error}</p>
            <Button onClick={loadBulkSendDetails} variant="outline">
              Try Again
            </Button>
          </div>
        </div>
      </AuthGuard>
    )
  }

  if (!bulkSend) {
    return (
      <AuthGuard>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <p className="mb-4 text-gray-600 dark:text-gray-400">Bulk send not found</p>
            <Button onClick={() => router.push('/bulk-send')} variant="outline">
              Back to Bulk Sends
            </Button>
          </div>
        </div>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push('/bulk-send')}
                  className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Bulk Sends
                </Button>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {bulkSend.name}
                  </h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Template: {bulkSend.templateName} • {bulkSend.totalRecipients} recipients
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Badge className={getStatusColor(bulkSend.status)}>
                  {getStatusIcon(bulkSend.status)}
                  <span className="ml-1 capitalize">{bulkSend.status}</span>
                </Badge>
                {bulkSend.status === 'draft' && (
                  <Button
                    onClick={handleSendBulkSend}
                    className="bg-[#47a3ad] hover:bg-[#3a8892] text-white"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Send Now
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Overview Cards */}
            <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 rounded-lg dark:bg-blue-900">
                      <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Total Recipients</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{bulkSend.totalRecipients}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-green-100 rounded-lg dark:bg-green-900">
                      <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Completed</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{bulkSend.completedCount}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-purple-100 rounded-lg dark:bg-purple-900">
                      <FileText className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Template</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white truncate">{bulkSend.templateName}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-orange-100 rounded-lg dark:bg-orange-900">
                      <Calendar className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Created</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{formatDate(bulkSend.createdAt)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Progress and Details */}
            <div className="lg:col-span-2">
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <div className="p-2 bg-[#47a3ad] bg-opacity-10 rounded-lg mr-3">
                      <Send className="w-5 h-5 text-[#47a3ad]" />
                    </div>
                    Progress Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Completion Rate</span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">{getProgressPercentage()}%</span>
                      </div>
                      <Progress value={getProgressPercentage()} className="h-2" />
                    </div>
                    
                    {bulkSend.message && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Message to Recipients</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                          {bulkSend.message}
                        </p>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Send Order</p>
                        <p className="font-medium">{bulkSend.sendInOrder ? 'Sequential' : 'Parallel'}</p>
                      </div>
                      {bulkSend.sentAt && (
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Sent At</p>
                          <p className="font-medium">{formatDate(bulkSend.sentAt)}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Documents List */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <div className="p-2 bg-[#47a3ad] bg-opacity-10 rounded-lg mr-3">
                      <FileText className="w-5 h-5 text-[#47a3ad]" />
                    </div>
                    Documents ({bulkSend.documents.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {bulkSend.documents.map((document) => (
                      <div key={document.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-[#47a3ad] bg-opacity-10 rounded-full flex items-center justify-center">
                            <span className="text-xs font-medium text-[#47a3ad]">{document.order}</span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{document.recipientName}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{document.recipientEmail}</p>
                            {document.sentAt && (
                              <p className="text-xs text-gray-500">Sent: {formatDate(document.sentAt)}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className={getStatusColor(document.status)}>
                            {getStatusIcon(document.status)}
                            <span className="ml-1 capitalize">{document.status}</span>
                          </Badge>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleResendDocument(document.id)}>
                                <Mail className="w-4 h-4 mr-2" />
                                Resend
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Download className="w-4 h-4 mr-2" />
                                Download PDF
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Activity Timeline */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <div className="p-2 bg-[#47a3ad] bg-opacity-10 rounded-lg mr-3">
                      <Clock className="w-5 h-5 text-[#47a3ad]" />
                    </div>
                    Activity Timeline
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                        <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">Bulk send created</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">{formatDate(bulkSend.createdAt)}</p>
                      </div>
                    </div>
                    
                    {bulkSend.sentAt && (
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                          <Send className="w-4 h-4 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">Documents sent</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">{formatDate(bulkSend.sentAt)}</p>
                        </div>
                      </div>
                    )}
                    
                    {bulkSend.completedAt && (
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                          <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">All documents completed</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">{formatDate(bulkSend.completedAt)}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}
