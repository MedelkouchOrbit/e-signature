"use client"

import Image from "next/image"
import { Check, Upload, Clock, Scissors } from "lucide-react"
import { useTranslations } from "next-intl"

export default function BenefitsSection() {
  const t = useTranslations("benefits")
  const benefits = [t("benefit1"), t("benefit2"), t("benefit3"), t("benefit4"), t("benefit5")]

  const steps = [
    { icon: Upload, title: t("uploadDocument.title"), description: t("uploadDocument.description") },
    { icon: Clock, title: t("requestSignature.title"), description: t("requestSignature.description") },
    { icon: Scissors, title: t("signIt.title"), description: t("signIt.description") },
  ]

  return (
    <section id="benefits" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8 animate-fade-in-left">
            <h2 className="text-4xl font-bold text-gray-900">{t("title")}</h2>
            <div className="space-y-4">
              {benefits.map((benefit, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-3 rtl:space-x-reverse"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="w-6 h-6 bg-emerald-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-gray-700">{benefit}</span>
                </div>
              ))}
            </div>
            <div className="space-y-6">
              {steps.map((step, stepIndex) => (
                <div
                  key={step.title}
                  className="flex items-start space-x-4 rtl:space-x-reverse animate-fade-in-left"
                  style={{ animationDelay: `${stepIndex * 200}ms` }}
                >
                  <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <step.icon className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">{step.title}</h4>
                    <p className="text-sm text-gray-600">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="relative animate-fade-in-right">
            <div className="relative">
              {/* Embed the SVG directly */}
              <Image 
                src="/images/placeholder.svg" 
                alt="Workspace" 
                width={600}
                height={400}
                className="rounded-2xl shadow-2xl" 
              />
              <div className="absolute top-4 left-4 rtl:left-auto rtl:right-4 bg-white rounded-lg p-3 shadow-md animate-fade-in">
                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                  <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                  <div>
                    <div className="text-sm font-medium">Amanda Young</div>
                    <div className="text-xs text-gray-500">{t("pleaseSignHere")}</div>
                  </div>
                  <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                </div>
              </div>
              <div className="absolute bottom-4 right-4 rtl:right-auto rtl:left-4 bg-white rounded-lg p-3 shadow-md animate-fade-in-delayed">
                <div className="text-right">
                  <div className="text-sm text-gray-500">{t("totalAmount")}</div>
                  <div className="text-lg font-bold">$245.00</div>
                </div>
              </div>
              <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 bg-white rounded-lg p-3 shadow-md animate-slide-up">
                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                  <Check className="w-5 h-5 text-emerald-500" />
                  <span className="text-sm font-medium">{t("signedSuccessfully")}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
