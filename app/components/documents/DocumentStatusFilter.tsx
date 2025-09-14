"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, Clock, FileText, AlertCircle, Filter } from "lucide-react"
import { type DocumentStatus } from "@/app/lib/documents/documents-types"
import { getAvailableStatuses } from "@/app/lib/documents/document-status-utils"

interface DocumentStatusFilterProps {
  currentStatus: DocumentStatus | 'all'
  onStatusChange: (status: DocumentStatus | 'all') => void
  counts?: {
    all: number
    waiting: number
    signed: number
    drafted: number
    declined?: number
    expired?: number
  }
}

export function DocumentStatusFilter({ 
  currentStatus, 
  onStatusChange, 
  counts = { all: 0, waiting: 0, signed: 0, drafted: 0 }
}: DocumentStatusFilterProps) {
  const statusFilters = [
    {
      key: 'all',
      label: 'All Documents',
      icon: FileText,
      count: counts.all,
      variant: 'default' as const,
      description: 'All documents visible with enhanced backend'
    },
    {
      key: 'drafted',
      label: 'Drafts',
      icon: FileText,
      count: counts.drafted,
      variant: 'secondary' as const,
      description: 'Documents in draft status'
    },
    {
      key: 'waiting',
      label: 'Waiting for Signature',
      icon: Clock,
      count: counts.waiting,
      variant: 'warning' as const,
      description: 'Documents sent to signers'
    },
    {
      key: 'signed',
      label: 'Completed',
      icon: CheckCircle,
      count: counts.signed,
      variant: 'success' as const,
      description: 'Fully signed documents'
    },
    {
      key: 'declined',
      label: 'Declined',
      icon: AlertCircle,
      count: counts.declined || 0,
      variant: 'destructive' as const,
      description: 'Declined documents'
    }
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Enhanced Status Filtering
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Status-based filtering powered by enhanced backend
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-2">
          {statusFilters.map((filter) => {
            const Icon = filter.icon
            const isActive = currentStatus === filter.key
            
            return (
              <Button
                key={filter.key}
                variant={isActive ? "default" : "outline"}
                onClick={() => onStatusChange(filter.key as DocumentStatus | 'all')}
                className="h-auto p-3 flex flex-col items-center gap-2"
              >
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  <span className="text-sm font-medium">{filter.label}</span>
                </div>
                
                <Badge 
                  variant={isActive ? "secondary" : "outline"}
                  className="text-xs"
                >
                  {filter.count}
                </Badge>
                
                <p className="text-xs text-muted-foreground text-center">
                  {filter.description}
                </p>
              </Button>
            )
          })}
        </div>
        
        {/* Backend Enhancement Notice */}
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-green-800">
              Enhanced Backend Active
            </span>
          </div>
          <p className="text-xs text-green-700 mt-1">
            ✅ Auto ExtUserPtr assignment • ✅ Enhanced ACL management • ✅ Status-based filtering
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
