"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2, RefreshCw, Play, Pause, CheckCircle, AlertCircle, Clock } from "lucide-react"
import type { SyncStatus } from "@/lib/data-sync-store" // Updated import
import { useTranslations } from "next-intl"

interface SyncStatusIndicatorProps {
  status: SyncStatus | null
  onManualSync: () => void
  onToggleAutoSync: () => void
  onUpdateInterval: (interval: number) => void
  loading?: boolean
}

export default function SyncStatusIndicator({
  status,
  onManualSync,
  onToggleAutoSync,
  onUpdateInterval,
  loading = false,
}: SyncStatusIndicatorProps) {
  const t = useTranslations("sync")

  if (!status) return null

  const getStatusColor = () => {
    if (loading) return "bg-blue-100 text-blue-800"
    if (status.lastError) return "bg-red-100 text-red-800"
    if (status.isActive) return "bg-green-100 text-green-800"
    return "bg-gray-100 text-gray-800"
  }

  const getStatusIcon = () => {
    if (loading) return <Loader2 className="w-3 h-3 animate-spin" />
    if (status.lastError) return <AlertCircle className="w-3 h-3" />
    if (status.isActive) return <CheckCircle className="w-3 h-3" />
    return <Clock className="w-3 h-3" />
  }

  const getStatusText = () => {
    if (loading) return t("syncing")
    if (status.lastError) return t("syncError")
    if (status.isActive) return t("autoSyncActive")
    return t("autoSyncPaused")
  }

  const formatTime = (date: Date | null) => {
    if (!date) return t("never")
    return date.toLocaleTimeString()
  }

  const getNextSyncCountdown = () => {
    if (!status.nextSync || !status.isActive) return null

    const now = new Date()
    const diff = status.nextSync.getTime() - now.getTime()

    if (diff <= 0) return t("now")

    const seconds = Math.ceil(diff / 1000)
    return `${seconds}s`
  }

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-4">
          {/* Status Badge */}
          <div className="flex items-center gap-2">
            <Badge className={`${getStatusColor()} flex items-center gap-1`}>
              {getStatusIcon()}
              {getStatusText()}
            </Badge>

            {status.isActive && (
              <Badge variant="outline" className="text-xs">
                {t("next")}: {getNextSyncCountdown()}
              </Badge>
            )}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            <Button
              onClick={onManualSync}
              variant="ghost"
              size="sm"
              disabled={loading}
              className="text-emerald-600 hover:text-emerald-700"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </Button>

            <Button
              onClick={onToggleAutoSync}
              variant="ghost"
              size="sm"
              className="text-slate-600 hover:text-slate-700"
            >
              {status.isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </Button>

            <select
              onChange={(e) => onUpdateInterval(Number(e.target.value))}
              className="text-xs border rounded px-2 py-1 bg-white"
              defaultValue={status.syncInterval} // Set default value from Zustand store
            >
              <option value="10000">10s</option>
              <option value="30000">30s</option>
              <option value="60000">1m</option>
              <option value="300000">5m</option>
            </select>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 mt-3 text-xs text-slate-600">
          <span>
            {t("lastSync")}: {formatTime(status.lastSync)}
          </span>
          <span>•</span>
          <span>
            {t("syncs")}: {status.syncCount}
          </span>
          {status.errorCount > 0 && (
            <>
              <span>•</span>
              <span className="text-red-600">
                {t("errors")}: {status.errorCount}
              </span>
            </>
          )}
        </div>

        {/* Error Message */}
        {status.lastError && (
          <div className="mt-2 text-xs text-red-600 bg-red-50 rounded px-2 py-1">{status.lastError}</div>
        )}
      </CardContent>
    </Card>
  )
}
