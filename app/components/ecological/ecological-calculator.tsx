"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useTranslations } from "next-intl"
import { EnvironmentalCalculator } from "@/app/lib/environmental-calculator"

export function EcologicalCalculator() {
  const t = useTranslations("EcologicalCalculator")
  const [documents, setDocuments] = useState(1000)
  const [users, setUsers] = useState(100)
  const [years, setYears] = useState(1)
  const [impact, setImpact] = useState({ paperSaved: 0, treesSaved: 0, co2Reduced: 0, waterSaved: 0 })

  const calculateImpact = () => {
    const calculatedImpact = EnvironmentalCalculator.calculateEnvironmentalImpact(documents, users, years)
    setImpact(calculatedImpact)
  }

  return (
    <section className="w-full py-12 md:py-24 lg:py-32 bg-white dark:bg-gray-950">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">{t("title")}</h2>
            <p className="max-w-[900px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
              {t("description")}
            </p>
          </div>
        </div>
        <div className="mx-auto mt-12 grid max-w-4xl gap-8 md:grid-cols-2">
          <Card className="p-6">
            <CardHeader>
              <CardTitle>{t("inputTitle")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label htmlFor="documents" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t("documentsLabel")}
                </label>
                <Input
                  id="documents"
                  type="number"
                  value={documents}
                  onChange={(e) => setDocuments(Number(e.target.value))}
                  placeholder="1000"
                  className="mt-1"
                />
              </div>
              <div>
                <label htmlFor="users" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t("usersLabel")}
                </label>
                <Input
                  id="users"
                  type="number"
                  value={users}
                  onChange={(e) => setUsers(Number(e.target.value))}
                  placeholder="100"
                  className="mt-1"
                />
              </div>
              <div>
                <label htmlFor="years" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t("yearsLabel")}
                </label>
                <Input
                  id="years"
                  type="number"
                  value={years}
                  onChange={(e) => setYears(Number(e.target.value))}
                  placeholder="1"
                  className="mt-1"
                />
              </div>
              <Button onClick={calculateImpact} className="w-full">
                {t("calculateButton")}
              </Button>
            </CardContent>
          </Card>
          <Card className="p-6">
            <CardHeader>
              <CardTitle>{t("resultsTitle")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-lg">
              <p>
                <strong>{t("paperSaved")}:</strong> {impact.paperSaved} {t("kg")}
              </p>
              <p>
                <strong>{t("treesSaved")}:</strong> {impact.treesSaved} {t("trees")}
              </p>
              <p>
                <strong>{t("co2Reduced")}:</strong> {impact.co2Reduced} {t("kgCo2e")}
              </p>
              <p>
                <strong>{t("waterSaved")}:</strong> {impact.waterSaved} {t("liters")}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
