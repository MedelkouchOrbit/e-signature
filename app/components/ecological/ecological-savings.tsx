"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, Zap } from "lucide-react"
import { useDataSyncStore } from "@/app/lib/data-sync-store"
import { dataSyncService, DataSyncService } from "@/app/lib/data-sync-service"
import { EnvironmentalCalculator } from "@/app/lib/environmental-calculator"
import { SyncStatusIndicator } from "@/app/components/data-sync/sync-status-indicator"
import { useTranslations } from "next-intl"
import { useEffect, useState } from "react"

interface EcologicalMetric {
  icon: React.ReactNode
  title: string
  key: keyof typeof metricConfig
  color: string
}

const metricConfig = {
  paperSaved: {
    icon: (
      <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 2L2 7l10 5 10-5-10-5z" />
        <path d="M2 17l10 5 10-5" />
        <path d="M2 12l10 5 10-5" />
      </svg>
    ),
  },
  waterSaved: {
    icon: (
      <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
      </svg>
    ),
  },
  woodSaved: {
    icon: (
      <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M10 2v20M14 2v20M4 7h16M4 17h16" />
      </svg>
    ),
  },
  carbonReduced: {
    icon: (
      <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v6l4 2" />
      </svg>
    ),
  },
  wastePrevented: {
    icon: (
      <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 6h18l-1.68 10.09A2 2 0 0 1 17.37 18H6.63a2 2 0 0 1-1.95-1.91L3 6z" />
        <path d="M8 14v4M12 14v4M16 14v4" />
      </svg>
    ),
  },
  energySaved: {
    icon: (
      <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    ),
  },
}

export default function EcologicalSavings() {
  const t = useTranslations("EcologicalSavings")
  const {
    environmentalImpact,
    usageData,
    isSyncing: loading,
    syncError: error,
  } = useDataSyncStore()

  const [syncService] = useState(() => DataSyncService.getInstance())
  const [serviceStatus, setServiceStatus] = useState(syncService.getStatus())

  useEffect(() => {
    // Subscribe to sync service status updates
    const unsubscribe = syncService.subscribeToStatus(setServiceStatus)
    return unsubscribe
  }, [syncService])

  const triggerManualSync = async () => {
    try {
      await dataSyncService.syncEnvironmentalData()
    } catch (error) {
      console.error("Manual sync failed:", error)
    }
  }

  const ecologicalMetrics: EcologicalMetric[] = [
    {
      icon: metricConfig.paperSaved.icon,
      title: t("paperSavings"),
      key: "paperSaved",
      color: "from-green-400 to-green-600",
    },
    {
      icon: metricConfig.waterSaved.icon,
      title: t("water"),
      key: "waterSaved",
      color: "from-blue-400 to-blue-600",
    },
    {
      icon: metricConfig.woodSaved.icon,
      title: t("wood"),
      key: "woodSaved",
      color: "from-amber-400 to-amber-600",
    },
    {
      icon: metricConfig.carbonReduced.icon,
      title: t("carbonEmissions"),
      key: "carbonReduced",
      color: "from-slate-400 to-slate-600",
    },
    {
      icon: metricConfig.wastePrevented.icon,
      title: t("waste"),
      key: "wastePrevented",
      color: "from-red-400 to-red-600",
    },
    {
      icon: metricConfig.energySaved.icon,
      title: t("energy"),
      key: "energySaved",
      color: "from-yellow-400 to-yellow-600",
    },
  ]

  if (error && !environmentalImpact) {
    return (
      <section id="ecological" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-emerald-50 to-green-50">
        <div className="max-w-7xl mx-auto text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-8">
            <h3 className="text-xl font-semibold text-red-800 mb-2">{t("unableToLoad")}</h3>
            <p className="text-red-600 mb-4">
              {error}. {t("systemDescription")}{" "}
              <a
                href="https://c.environmentalpaper.org/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-600 hover:text-emerald-700 underline"
              >
                Environmental Paper Network
              </a>
              .
            </p>
            <Button
              onClick={triggerManualSync}
              variant="outline"
              className="border-red-300 text-red-700 bg-transparent"
            >
              <TrendingUp className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2" />
              {t("retryConnection")}
            </Button>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section id="ecological" className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-emerald-50 to-green-50">
      <div className="max-w-7xl mx-auto">
        {/* Hero Header Section */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-2">
            {t("heroTitle")}
          </h2>
          <div className="text-2xl font-semibold text-emerald-600 mb-4 flex items-center justify-center gap-2">
            {t("heroSubtitle")}
            <Zap className="w-6 h-6" />
          </div>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            {t("heroDescription")}
          </p>
        </div>

        {/* Sync Status Indicator */}
        <div className="flex justify-center mb-12">
          <div className="w-full max-w-lg">
            <SyncStatusIndicator />
          </div>
        </div>

        {/* Usage Data Badges */}
        {usageData && (
          <div className="flex items-center justify-center gap-4 text-sm text-slate-600 mb-8">
            <Badge variant="outline" className="bg-white/50">
              <TrendingUp className="w-3 h-3 mr-1 rtl:mr-0 rtl:ml-1" />
              {usageData.signRequests} {t("signRequests")}
            </Badge>
            <Badge variant="outline" className="bg-white/50">
              {usageData.sheetsPerDocument} {t("sheetsPerDoc")}
            </Badge>
            <Badge variant="outline" className="bg-white/50">
              {usageData.contactsToSign + usageData.contactsInCopy} {t("totalContacts")}
            </Badge>
          </div>
        )}

        {/* Metrics Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {ecologicalMetrics.map((metric) => {
            const value = environmentalImpact?.[metric.key] || 0
            const formattedValue = EnvironmentalCalculator.formatNumber(value)
            const comparison = environmentalImpact
              ? EnvironmentalCalculator.getComparisonText(metric.key, environmentalImpact)
              : ""

            return (
              <div key={metric.title} className="relative">
                {/* Live indicator dot */}
                {serviceStatus?.isActive && (
                  <div className="absolute top-4 right-4 z-10">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  </div>
                )}

                <Card className="h-full border-0 shadow-sm bg-white/80 backdrop-blur-sm rounded-2xl p-6 text-center hover:shadow-md transition-shadow">
                  {/* Icon */}
                  <div className="mb-6">
                    <div className={`w-16 h-16 mx-auto rounded-full bg-gradient-to-br ${metric.color} flex items-center justify-center`}>
                      {metric.icon}
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {metric.title}
                  </h3>

                  {/* Value */}
                  <div className="text-3xl font-bold text-gray-900 mb-1">
                    {loading && !environmentalImpact ? "..." : formattedValue}
                  </div>

                  {/* Unit */}
                  <div className="text-sm text-gray-600 mb-2">
                    {t(`units.${metric.key}`)}
                  </div>

                  {/* Comparison */}
                  {comparison && environmentalImpact && (
                    <div className="text-sm text-emerald-600 italic font-medium">
                      {comparison}
                    </div>
                  )}
                </Card>
              </div>
            )
          })}
        </div>

        {/* System Information */}
        <div className="max-w-4xl mx-auto">
          <Card className="bg-white/60 backdrop-blur-sm border border-emerald-200 rounded-2xl p-8">
            <div className="text-center mb-6">
              <div className="flex items-center justify-center gap-2 mb-4">
                <h3 className="text-2xl font-bold text-gray-900">{t("systemTitle")}</h3>
                <Badge className="bg-emerald-500 text-white">
                  <Zap className="w-3 h-3 mr-1 rtl:mr-0 rtl:ml-1" />
                  {t("autoUpdated")}
                </Badge>
              </div>
              
              <p className="text-gray-600 mb-6">
                {t("systemDescription")}{" "}
                <a
                  href="https://c.environmentalpaper.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-600 hover:text-emerald-700 underline"
                >
                  Environmental Paper Network
                </a>
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 text-sm text-gray-600">
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">{t("calculationTitle")}</h4>
                <div className="space-y-2">
                  <p>{t("calculationFormula")}</p>
                  <p>{t("pageWeight")}</p>
                  {environmentalImpact && (
                    <p className="text-emerald-600 font-medium">
                      {t("current")}: {environmentalImpact.totalPages} {t("pagesSaved")} ={" "}
                      {EnvironmentalCalculator.formatNumber(environmentalImpact.totalWeightKg)} {t("kgSaved")}
                    </p>
                  )}
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">{t("systemFeatures")}</h4>
                <div className="space-y-2">
                  <p>• {t("feature1")}</p>
                  <p>• {t("feature2")}</p>
                  <p>• {t("feature3")}</p>
                  <p>• {t("feature4")}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-4 mt-8">
              <Button
                variant="outline"
                className="border-emerald-500 text-emerald-600 hover:bg-emerald-50 bg-transparent"
              >
                <a
                  href="https://c.environmentalpaper.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2"
                >
                  {t("viewSource")}
                </a>
              </Button>

              <Badge variant="secondary" className="bg-emerald-100 text-emerald-800">
                <Zap className="w-3 h-3 mr-1 rtl:mr-0 rtl:ml-1" />
                {t("systematicUpdates")}
              </Badge>
            </div>
          </Card>
        </div>
      </div>
    </section>
  )
}
