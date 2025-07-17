"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check } from "lucide-react"
import { useTranslations } from "next-intl"
import { useState } from "react"

export default function PricingSection() {
  const t = useTranslations("pricing")
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("yearly")

  type Plan = {
    name: string
    monthlyPrice: string
    yearlyPrice: string
    description: string
    features: string[]
    buttonText: string
    buttonVariant: "outline" | "default"
    popular: boolean
    badge?: string
  }

  const plans: Plan[] = [
    {
      name: t("free.name"),
      monthlyPrice: "0",
      yearlyPrice: "0",
      description: t("free.description"),
      features: t.raw("free.features") as string[],
      buttonText: t("free.button"),
      buttonVariant: "default", // Changed to default for dark button
      popular: false,
    },
    {
      name: t("pro.name"),
      monthlyPrice: "10", // Example monthly price
      yearlyPrice: "8",
      description: t("pro.description"),
      features: t.raw("pro.features") as string[],
      buttonText: t("pro.button"),
      buttonVariant: "default",
      popular: true,
      badge: t("pro.badge"),
    },
    {
      name: t("business.name"),
      monthlyPrice: "20", // Example monthly price
      yearlyPrice: "16",
      description: t("business.description"),
      features: t.raw("business.features") as string[],
      buttonText: t("business.button"),
      buttonVariant: "default", // Changed to default for dark button
      popular: false,
    },
  ]

  return (
    <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16 animate-fade-in-up">
          <h2 className="text-4xl font-bold text-slate-900 mb-4">{t("title")}</h2>
          <p className="text-xl text-slate-600 mb-8">{t("subtitle")}</p>

          <div className="inline-flex bg-slate-100 rounded-lg p-1">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={`px-6 py-2 rounded-md transition-all ${
                billingCycle === "monthly" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600"
              }`}
            >
              {t("monthly")}
            </button>
            <button
              onClick={() => setBillingCycle("yearly")}
              className={`px-6 py-2 rounded-md transition-all ${
                billingCycle === "yearly" ? "bg-emerald-500 text-white shadow-sm" : "text-slate-600"
              }`}
            >
              {t("yearly")}
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <div
              key={plan.name}
              className={`relative animate-fade-in-up ${plan.popular ? "scale-105" : ""}`}
              style={{ animationDelay: `${index * 200}ms` }}
            >
              <Card
                className={`h-full transition-all duration-300 hover:shadow-xl ${
                  plan.popular
                    ? "border-emerald-500 shadow-xl bg-gradient-to-br from-emerald-50 to-emerald-100"
                    : "border-slate-200 hover:-translate-y-1"
                }`}
              >
                {plan.badge && billingCycle === "yearly" && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-emerald-500 text-white">{plan.badge}</Badge>
                  </div>
                )}

                <CardHeader className="text-center pb-8">
                  <CardTitle className={`text-2xl font-bold ${plan.popular ? "text-slate-900" : "text-slate-900"}`}>
                    {plan.name}
                  </CardTitle>
                  <CardDescription className={`mt-2 ${plan.popular ? "text-slate-700" : "text-slate-600"}`}>
                    {plan.description}
                  </CardDescription>
                  <div className="mt-6">
                    <span className="text-sm text-slate-500">$</span>
                    <span className={`text-5xl font-bold ${plan.popular ? "text-slate-900" : "text-slate-900"}`}>
                      {billingCycle === "monthly" ? plan.monthlyPrice : plan.yearlyPrice}
                    </span>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    {plan.features.map((feature, featureIndex) => (
                      <div key={featureIndex} className="flex items-center space-x-3 rtl:space-x-reverse">
                        <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                        <span className={`text-sm ${plan.popular ? "text-slate-700" : "text-slate-600"}`}>
                          {feature}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-6">
                    <Button
                      className={`w-full transition-all duration-300 ${
                        plan.popular
                          ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                          : "bg-slate-900 hover:bg-slate-800 text-white" // Apply dark button style
                      }`}
                    >
                      {plan.buttonText}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
