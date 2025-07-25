"use client"

import type React from "react"

import { Card } from "@/components/ui/card"
import { useTranslations } from "next-intl"
import { useDataSyncStore } from "@/app/lib/data-sync-store"

const formatNumber = (value: number) =>
  new Intl.NumberFormat().format(value)

export function EcologicalSavingsSimple() {
  const t = useTranslations("EcologicalSavings")
  const { environmentalImpact, isSyncing } = useDataSyncStore()
  
  const totalPaperSaved = environmentalImpact?.paperSaved || 0
  const totalTreesSaved = environmentalImpact?.treesSaved || 0
  const totalCo2Reduced = environmentalImpact?.co2Reduced || 0

  return (
    <section className="w-full py-12 md:py-24 lg:py-32 bg-gray-50 dark:bg-gray-900">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">{t("simpleTitle")}</h2>
            <p className="max-w-[900px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
              {t("simpleDescription")}
            </p>
          </div>
        </div>
        <div className="mx-auto grid max-w-5xl items-start gap-6 py-12 lg:grid-cols-3 lg:gap-12">
          <Card className="flex flex-col items-center p-6 text-center">
            <LeafIcon className="h-12 w-12 text-green-500" />
            <h3 className="mt-4 text-2xl font-bold">
              {isSyncing ? "..." : formatNumber(totalTreesSaved)} {t("treesSaved")}
            </h3>
            <p className="text-gray-500 dark:text-gray-400">{t("treesSavedDescription")}</p>
          </Card>
          <Card className="flex flex-col items-center p-6 text-center">
            <PaperclipIcon className="h-12 w-12 text-blue-500" />
            <h3 className="mt-4 text-2xl font-bold">
              {isSyncing ? "..." : formatNumber(totalPaperSaved)} {t("paperSaved")}
            </h3>
            <p className="text-gray-500 dark:text-gray-400">{t("paperSavedDescription")}</p>
          </Card>
          <Card className="flex flex-col items-center p-6 text-center">
            <CloudRainIcon className="h-12 w-12 text-purple-500" />
            <h3 className="mt-4 text-2xl font-bold">
              {isSyncing ? "..." : formatNumber(totalCo2Reduced)} {t("co2Reduced")}
            </h3>
            <p className="text-gray-500 dark:text-gray-400">{t("co2ReducedDescription")}</p>
          </Card>
        </div>
      </div>
    </section>
  )
}

function LeafIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 18.3 2c0 0 1 2.5-2.8 4.3M2 13f 8 8 0 0 0 12-12V2z" />
    </svg>
  )
}

function PaperclipIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
    </svg>
  )
}

function CloudRainIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 14.899A7 7 0 0 1 15 9h1a5 5 0 0 1 4.546 6.411 6 6 0 0 1-8.634 4.917 6 6 0 0 1-11.112-4.04M9 16v3M12 16v3M15 16v3" />
    </svg>
  )
}
