"use client"

import { WatiqaSignLogo } from "@/components/shared/watiqa-logo"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useTranslations } from "next-intl"

export default function Footer() {
  const t = useTranslations("footer")

  const footerLinks: {
    support: string[],
    helpAndSolution: string[],
    product: string[],
  } = {
    support: t.raw("supportLinks") as string[],
    helpAndSolution: t.raw("helpLinks") as string[],
    product: t.raw("productLinks") as string[],
  }

  return (
    <footer className="bg-slate-900 border-t border-slate-800 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
          <div className="lg:col-span-2">
            <div className="flex items-center space-x-2 rtl:space-x-reverse mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-lg flex items-center justify-center">
                <WatiqaSignLogo className="h-12 w-12" />
              </div>
              <span className="text-emerald-400 font-semibold text-xl">{t("companyName")}</span>
            </div>
            <p className="text-slate-400 mb-6">{t("description")}</p>
            <div className="flex">
              <Input
                type="email"
                placeholder={t("emailPlaceholder")}
                className="bg-slate-800 border-slate-700 text-white placeholder-slate-500 rounded-r-none rtl:rounded-r rtl:rounded-l-none"
              />
              <Button className="bg-emerald-600 hover:bg-emerald-700 rounded-l-none rtl:rounded-l rtl:rounded-r-none transition-all duration-300">
                →
              </Button>
            </div>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">{t("support")}</h4>
            <ul className="space-y-2">
              {footerLinks.support.map((item) => (
                <li key={item}>
                  <a href="#" className="text-slate-400 hover:text-white transition-colors duration-300">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">{t("helpAndSolution")}</h4>
            <ul className="space-y-2">
              {footerLinks.helpAndSolution.map((item) => (
                <li key={item}>
                  <a href="#" className="text-slate-400 hover:text-white transition-colors duration-300">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">{t("product")}</h4>
            <ul className="space-y-2">
              {footerLinks.product.map((item) => (
                <li key={item}>
                  <a href="#" className="text-slate-400 hover:text-white transition-colors duration-300">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-slate-400 text-sm">
            © 2025 {t("companyName")}. {t("copyright")}
          </p>
          <div className="flex space-x-6 rtl:space-x-reverse mt-4 md:mt-0">
            <a href="#" className="text-slate-400 hover:text-white text-sm transition-colors duration-300">
              {t("terms")}
            </a>
            <span className="text-slate-600">•</span>
            <a href="#" className="text-slate-400 hover:text-white text-sm transition-colors duration-300">
              {t("privacy")}
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
