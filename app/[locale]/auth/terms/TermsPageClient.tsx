"use client"

import { useTranslations } from "next-intl"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
// Assuming ScrollArea is a custom component or will be added
// import { ScrollArea } from "@/components/ui/scroll-area"

export function TermsPageClient() {
  const t = useTranslations("TermsPage")

  return (
    <main className="flex-1 py-12 md:py-24 lg:py-32">
      <div className="container px-4 md:px-6">
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">{t("title")}</h1>
            <p className="mt-4 text-gray-500 dark:text-gray-400">{t("lastUpdated", { date: "July 24, 2025" })}</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{t("section1Title")}</CardTitle>
            </CardHeader>
            <CardContent>
              {/* <ScrollArea className="h-[400px] pr-4"> */}
              <div className="space-y-4 text-gray-600 dark:text-gray-300">
                <p>{t("section1Paragraph1")}</p>
                <p>{t("section1Paragraph2")}</p>
                <p>{t("section1Paragraph3")}</p>
                <p>{t("section1Paragraph4")}</p>
              </div>
              {/* </ScrollArea> */}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("section2Title")}</CardTitle>
            </CardHeader>
            <CardContent>
              {/* <ScrollArea className="h-[400px] pr-4"> */}
              <div className="space-y-4 text-gray-600 dark:text-gray-300">
                <p>{t("section2Paragraph1")}</p>
                <p>{t("section2Paragraph2")}</p>
                <p>{t("section2Paragraph3")}</p>
              </div>
              {/* </ScrollArea> */}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("section3Title")}</CardTitle>
            </CardHeader>
            <CardContent>
              {/* <ScrollArea className="h-[400px] pr-4"> */}
              <div className="space-y-4 text-gray-600 dark:text-gray-300">
                <p>{t("section3Paragraph1")}</p>
                <p>{t("section3Paragraph2")}</p>
                <p>{t("section3Paragraph3")}</p>
              </div>
              {/* </ScrollArea> */}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("section4Title")}</CardTitle>
            </CardHeader>
            <CardContent>
              {/* <ScrollArea className="h-[400px] pr-4"> */}
              <div className="space-y-4 text-gray-600 dark:text-gray-300">
                <p>{t("section4Paragraph1")}</p>
                <p>{t("section4Paragraph2")}</p>
                <p>{t("section4Paragraph3")}</p>
              </div>
              {/* </ScrollArea> */}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}
