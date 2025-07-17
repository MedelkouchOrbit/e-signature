"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, Zap } from "lucide-react"
import { useEnvironmentalData } from "@/hooks/use-environmental-data"
import { EnvironmentalCalculator } from "@/lib/environmental-calculator"
import SyncStatusIndicator from "./sync-status-indicator"
import { useTranslations } from "next-intl"

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
  const t = useTranslations("ecological")
  const {
    environmentalImpact,
    usageData,
    loading,
    error,
    syncStatus,
    triggerManualSync,
    toggleAutoSync,
    updateSyncInterval,
  } = useEnvironmentalData()

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
              . For real-time data, deploy your API routes separately (e.g., on Vercel).
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
    <section id="ecological" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-emerald-50 to-green-50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 animate-fade-in-up">
          <div className="flex items-center justify-center gap-2 mb-4">
            <h2 className="text-4xl font-bold text-slate-900">
              {t("title")}
              <br />
              <span className="text-emerald-600">{t("subtitle")}</span>
            </h2>
            <Zap className="w-8 h-8 text-emerald-600" />
          </div>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto mb-6">{t("description")}</p>

          {/* Sync Status Indicator */}
          <div className="max-w-md mx-auto mb-6">
            <SyncStatusIndicator
              status={syncStatus}
              onManualSync={triggerManualSync}
              onToggleAutoSync={toggleAutoSync}
              onUpdateInterval={updateSyncInterval}
              loading={loading}
            />
          </div>

          {usageData && (
            <div className="flex items-center justify-center gap-4 text-sm text-slate-600">
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
        </div>

        {/* Metrics Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {ecologicalMetrics.map((metric, index) => {
            const value = environmentalImpact?.[metric.key] || 0
            const formattedValue = EnvironmentalCalculator.formatNumber(value)
            const comparison = environmentalImpact
              ? EnvironmentalCalculator.getComparisonText(metric.key, environmentalImpact)
              : ""

            return (
              <div
                key={metric.title}
                className="group animate-fade-in-up hover:-translate-y-2 transition-all duration-300"
                style={{ animationDelay: `${index * 150}ms` }}
              >
                <Card className="h-full border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur-sm relative overflow-hidden">
                  {/* Live indicator */}
                  {syncStatus?.isActive && (
                    <div className="absolute top-2 right-2 rtl:right-auto rtl:left-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    </div>
                  )}

                  <CardContent className="p-6 text-center">
                    {/* Icon */}
                    <div
                      className={`w-20 h-20 mx-auto rounded-full bg-gradient-to-br ${metric.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 text-white`}
                    >
                      {metric.icon}
                    </div>

                    {/* Title */}
                    <h3 className="text-xl font-semibold text-slate-900 mb-2">{metric.title}</h3>

                    {/* Values */}
                    <div className="space-y-2">
                      <div className="text-3xl font-bold text-slate-900 font-mono">
                        {loading && !environmentalImpact ? "..." : formattedValue}
                      </div>
                      <div className="text-sm text-slate-600 font-medium">{t(`units.${metric.key}`)}</div>
                      {comparison && environmentalImpact && (
                        <div className="text-sm text-emerald-600 italic font-medium">{comparison}</div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )
          })}
        </div>

        {/* Calculation Information */}
        <div className="text-center animate-fade-in-up" style={{ animationDelay: "900ms" }}>
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-8 border border-emerald-200">
            <div className="flex items-center justify-center gap-2 mb-4">
              <h3 className="text-2xl font-bold text-slate-900">{t("systemTitle")}</h3>
              <Badge className="bg-emerald-500 text-white">
                <Zap className="w-3 h-3 mr-1 rtl:mr-0 rtl:ml-1" />
                {t("autoUpdated")}
              </Badge>
            </div>

            <p className="text-slate-600 mb-4">
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

            <div className="grid md:grid-cols-2 gap-6 text-sm text-slate-600">
              <div className="space-y-2">
                <h4 className="font-semibold text-slate-900">{t("calculationTitle")}</h4>
                <p>{t("calculationFormula")}</p>
                <p>{t("pageWeight")}</p>
                {environmentalImpact && (
                  <p className="text-emerald-600 font-medium">
                    {t("current")}: {environmentalImpact.totalPages} {t("pagesSaved")} ={" "}
                    {EnvironmentalCalculator.formatNumber(environmentalImpact.totalWeightKg)} {t("kgSaved")}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-slate-900">{t("systemFeatures")}</h4>
                <p>{t("feature1")}</p>
                <p>{t("feature2")}</p>
                <p>{t("feature3")}</p>
                <p>{t("feature4")}</p>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-center gap-4">
              <Button
                variant="outline"
                className="border-emerald-500 text-emerald-600 hover:bg-emerald-50 bg-transparent"
              >
                <a
                  href="https://c.environmentalpaper.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-600 hover:underline"
                >
                  {t("viewSource")}
                </a>
              </Button>

              <Badge variant="secondary" className="bg-emerald-100 text-emerald-800">
                <Zap className="w-3 h-3 mr-1 rtl:mr-0 rtl:ml-1" />
                {t("systematicUpdates")}
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
