"use client"

import { Badge } from "@/components/ui/badge"
import { Check, Star, BarChart3 } from "lucide-react"
import { useTranslations } from "next-intl"

export default function HeroSection() {
  const t = useTranslations("hero")

  return (
    <section className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8 animate-fade-in-left">
            <div className="space-y-6">
              <h1 className="text-5xl lg:text-6xl font-bold text-slate-900 leading-tight">{t("title")}</h1>

              <div className="w-32 h-1 bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full animate-scale-x" />

              <p className="text-xl text-slate-600 max-w-lg">{t("subtitle")}</p>
            </div>

            <div className="space-y-4">
              <h3 className="text-2xl font-semibold text-slate-900">{t("description")}</h3>
              <p className="text-slate-600">{t("descriptionText")}</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <span className="text-slate-600">4.9 / 5 {t("rating")}</span>
              </div>
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <div className="flex">
                  {[...Array(4)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                  <Star className="w-5 h-5 text-slate-300" />
                </div>
                <span className="text-slate-600">4.8 / 5 {t("rating")}</span>
              </div>
            </div>
          </div>

          <div className="relative animate-fade-in-right">
            <div className="relative bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-3xl p-8 shadow-2xl">
              <div className="absolute -top-4 -left-4 rtl:-left-auto rtl:-right-4 bg-white rounded-lg p-3 shadow-lg animate-float">
                <div className="text-sm font-medium text-slate-600">{t("signedPapers")}</div>
                <div className="text-2xl font-bold text-slate-900">135</div>
                <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">{t("send")}</Badge>
              </div>

              <div className="absolute -bottom-4 -right-4 rtl:-right-auto rtl:-left-4 bg-white rounded-lg p-3 shadow-lg animate-float-delayed">
                <div className="text-sm font-medium text-slate-600">{t("requestSignature")}</div>
                <div className="text-2xl font-bold text-slate-900">78</div>
                <BarChart3 className="w-5 h-5 text-slate-400" />
              </div>

              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-slate-800 rounded-full p-3 animate-pulse-slow">
                <Check className="w-6 h-6 text-white" />
              </div>

              <div className="w-full h-64 bg-emerald-300/30 rounded-2xl flex items-center justify-center">
                <div className="text-center text-white">
                  <BarChart3 className="w-16 h-16 mx-auto mb-4 opacity-60" />
                  <div className="text-lg font-medium">{t("analyticsDashboard")}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
