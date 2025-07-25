"use client"

import { Badge } from "@/components/ui/badge"
import { Check, Star, BarChart3 } from "lucide-react"
import { useTranslations } from "next-intl"

export default function HeroSection() {
  const t = useTranslations("hero")
  return (
    <section id="hero" className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8 animate-fade-in-left">
            <div className="space-y-6">
              <h1 className="text-5xl lg:text-6xl font-bold text-slate-900 leading-tight">
                {t("mainTitle")}
              </h1>

              <div className="w-32 h-1 bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full animate-scale-x" />

              <p className="text-xl text-slate-600 max-w-lg">
                {t("mainSubtitle")}
              </p>
            </div>

            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-2xl font-semibold text-slate-900">
                  {t("secondaryTitle")}
                </h3>
                <p className="text-slate-600 max-w-lg">
                  {t("secondaryDescription")}
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-6">
              <div className="flex flex-col space-y-2">
                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <span className="text-slate-600">4.9 / 5 {t("rating")}</span>
                </div>
                <span className="text-sm text-slate-500">{t("clientName")}</span>
              </div>
              <div className="flex flex-col space-y-2">
                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                  <div className="flex">
                    {[...Array(4)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    ))}
                    <Star className="w-5 h-5 text-slate-300" />
                  </div>
                  <span className="text-slate-600">4.8 / 5 {t("rating")}</span>
                </div>
                <span className="text-sm text-slate-500">{t("clientName")}</span>
              </div>
            </div>
          </div>

          <div className="relative animate-fade-in-right">
            {/* Top Section with Analytics Dashboard */}
            <div className="relative bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-3xl p-8 shadow-2xl mb-8">
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

            {/* Bottom Section with Process Steps */}
            <div className="space-y-6 p-6 bg-white rounded-2xl shadow-lg border border-slate-200">
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                    <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-slate-900 mb-1">{t("uploadDocument")}</h4>
                    <p className="text-sm text-slate-600">{t("uploadDocumentDesc")}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                    <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-slate-900 mb-1">{t("requestSignatureStep")}</h4>
                    <p className="text-sm text-slate-600">{t("requestSignatureStepDesc")}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                    <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-slate-900 mb-1">{t("signIt")}</h4>
                    <p className="text-sm text-slate-600">{t("signItDesc")}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
