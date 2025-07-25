"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Database } from "lucide-react"
import { useTranslations } from "next-intl"

export default function ContactSection() {
  const t = useTranslations("contact")

  return (
    <section id="contact" className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-900">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8 animate-fade-in-left">
            <h2 className="text-4xl font-bold text-white">{t("title")}</h2>
          </div>

          <div className="relative animate-fade-in-right">
            <div className="bg-slate-800 border border-blue-500 rounded-2xl p-8">
              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Database className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white">{t("getStarted")}</h3>
              </div>

              <form className="space-y-4">
                <div>
                  <label className="block text-white text-sm font-medium mb-2">{t("email")}</label>
                  <Input
                    type="email"
                    placeholder={t("emailPlaceholder")}
                    className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                  />
                </div>

                <div>
                  <label className="block text-white text-sm font-medium mb-2">{t("message")}</label>
                  <Textarea
                    placeholder={t("messagePlaceholder")}
                    className="bg-slate-700 border-slate-600 text-white placeholder-slate-400 min-h-[100px]"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 transition-all duration-300"
                >
                  {t("requestDemo")}
                </Button>

                <div className="text-center">
                  <span className="text-slate-400 text-sm">{t("or")} </span>
                  <a href="#" className="text-emerald-400 text-sm hover:underline">
                    {t("startFreeTrial")}
                  </a>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
