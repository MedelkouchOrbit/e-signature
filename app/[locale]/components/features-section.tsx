"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Cloud, FileText } from "lucide-react"
import { useTranslations } from "next-intl"

export default function FeaturesSection() {
  const t = useTranslations("features")

  const features = [
    {
      icon: Users,
      title: t("collaborationTeams.title"),
      description: t("collaborationTeams.description"),
      color: "from-blue-400 to-blue-600",
    },
    {
      icon: Cloud,
      title: t("cloudStorage.title"),
      description: t("cloudStorage.description"),
      color: "from-emerald-400 to-emerald-600",
    },
    {
      icon: FileText,
      title: t("organizedDocuments.title"),
      description: t("organizedDocuments.description"),
      color: "from-purple-400 to-purple-600",
    },
  ]

  return (
    <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16 animate-fade-in-up">
          <h2 className="text-4xl font-bold text-slate-900 mb-4">{t("title")}</h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">{t("subtitle")}</p>
          <Button className="mt-6 bg-emerald-600 hover:bg-emerald-700 transition-all duration-300">
            {t("getStarted")}
          </Button>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className={`group animate-fade-in-up hover:-translate-y-2 transition-all duration-300`}
              style={{ animationDelay: `${index * 200}ms` }}
            >
              <Card className="h-full border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardHeader className="text-center pb-4">
                  <div
                    className={`w-24 h-24 mx-auto rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}
                  >
                    <feature.icon className="w-12 h-12 text-white" />
                  </div>
                  <CardTitle className="text-xl font-semibold text-slate-900">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <CardDescription className="text-slate-600">{feature.description}</CardDescription>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
