"use client"

import { AuthGuard } from "@/app/components/auth/AuthGuard"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Check, Crown, X } from "lucide-react"
import { useState } from "react"
import { useSubscriptionStore, type SubscriptionPlan } from "@/app/lib/subscription/subscription-store"
import { useTranslations } from "next-intl"

type Plan = SubscriptionPlan

interface PlanDetails {
  name: string
  price: number
  yearlyPrice: number
  description: string
  features: string[]
  buttonText: string
  highlighted: boolean
}

export default function PricingPage() {
  const t = useTranslations("pricing")
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("yearly")
  const [showPopup, setShowPopup] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<Plan>("free")
  const { plan: currentPlan, isActive, updateSubscription, hasActivePlan } = useSubscriptionStore()

  // Get translated plan data
  const plans: Record<Plan, PlanDetails> = {
    free: {
      name: t("free.name"),
      price: 0,
      yearlyPrice: 0,
      description: t("free.description"),
      features: t.raw("free.features") as string[],
      buttonText: t("free.button"),
      highlighted: false
    },
    pro: {
      name: t("pro.name"),
      price: 8,
      yearlyPrice: 8,
      description: t("pro.description"),
      features: t.raw("pro.features") as string[],
      buttonText: t("pro.button"),
      highlighted: true
    },
    business: {
      name: t("business.name"), 
      price: 16,
      yearlyPrice: 16,
      description: t("business.description"),
      features: t.raw("business.features") as string[],
      buttonText: t("business.button"),
      highlighted: false
    }
  }

  function SubscriptionPopup({ 
    isOpen, 
    onClose, 
    plan,
    onSubscribe 
  }: { 
    isOpen: boolean
    onClose: () => void
    plan: Plan
    onSubscribe: (plan: Plan) => void
  }) {
    if (!isOpen) return null

    const planDetails = plans[plan]
    
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg p-6 max-w-md w-full relative">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="text-center">
            <Crown className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">
              {t("subscriptionPopup.title", { plan: planDetails.name })}
            </h3>
            <p className="text-gray-600 mb-6">
              {t("subscriptionPopup.description", { 
                plan: planDetails.name, 
                price: planDetails.price 
              })}
            </p>
            
            <div className="space-y-3 mb-6">
              <Button 
                onClick={() => onSubscribe(plan)}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                {t("subscriptionPopup.confirmButton")}
              </Button>
              <Button 
                onClick={onClose}
                variant="outline" 
                className="w-full"
              >
                {t("subscriptionPopup.cancelButton")}
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const handleSubscribe = (plan: Plan) => {
    if (plan === "free") {
      updateSubscription("free")
      return
    }
    
    setSelectedPlan(plan)
    setShowPopup(true)
  }

  const confirmSubscription = (plan: Plan) => {
    updateSubscription(plan)
    setShowPopup(false)
    // Here you would typically call your backend API
    console.log(`Subscribed to ${plan} plan`)
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-6xl mx-auto py-12">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              {t("mainTitle")}
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              {t("mainSubtitle")}
            </p>

            {/* Billing Toggle */}
            <div className="inline-flex bg-gray-200 rounded-lg p-1">
              <button
                onClick={() => setBillingCycle("monthly")}
                className={`px-6 py-2 rounded-md transition-all ${
                  billingCycle === "monthly" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600"
                }`}
              >
                {t("monthly")}
              </button>
              <button
                onClick={() => setBillingCycle("yearly")}
                className={`px-6 py-2 rounded-md transition-all ${
                  billingCycle === "yearly" ? "bg-gray-800 text-white shadow-sm" : "text-gray-600"
                }`}
              >
                {t("yearly")}
              </button>
            </div>
          </div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {(Object.keys(plans) as Plan[]).map((planKey) => {
              const plan = plans[planKey]
              const isCurrentPlan = hasActivePlan(planKey)
              
              return (
                <div key={planKey} className="relative">
                  <Card
                    className={`h-full transition-all duration-300 hover:shadow-xl ${
                      plan.highlighted
                        ? "border-green-400 shadow-xl bg-gradient-to-br from-green-400 to-green-600 text-white scale-105"
                        : "border-gray-300 hover:-translate-y-1 bg-white"
                    }`}
                  >
                    <CardHeader className="text-center pb-8">
                      <CardTitle className={`text-2xl font-bold ${plan.highlighted ? "text-white" : "text-gray-900"}`}>
                        {plan.name}
                      </CardTitle>
                      <CardDescription className={`mt-2 ${plan.highlighted ? "text-white/90" : "text-gray-600"}`}>
                        {plan.description}
                      </CardDescription>
                      <div className="mt-6">
                        <span className={`text-sm ${plan.highlighted ? "text-white/80" : "text-gray-500"}`}>$</span>
                        <span className={`text-5xl font-bold ${plan.highlighted ? "text-white" : "text-gray-900"}`}>
                          {billingCycle === "monthly" ? plan.price : plan.yearlyPrice}
                        </span>
                        {plan.highlighted && billingCycle === "yearly" && (
                          <div className="text-sm text-white/80 mt-2">{t("savePerYearAmount")}</div>
                        )}
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        {plan.features.map((feature, featureIndex) => (
                          <div key={featureIndex} className="flex items-center space-x-3">
                            <div className={`w-5 h-5 ${plan.highlighted ? "bg-white/20" : "bg-green-500"} rounded-full flex items-center justify-center flex-shrink-0`}>
                              <Check className={`w-3 h-3 ${plan.highlighted ? "text-white" : "text-white"}`} />
                            </div>
                            <span className={`text-sm ${plan.highlighted ? "text-white/90" : "text-gray-600"}`}>
                              {feature}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="pt-6">
                        <Button
                          onClick={() => handleSubscribe(planKey)}
                          disabled={isCurrentPlan}
                          className={`w-full transition-all duration-300 ${
                            isCurrentPlan
                              ? "bg-gray-400 text-gray-600 cursor-not-allowed"
                              : plan.highlighted
                              ? "bg-white hover:bg-gray-100 text-green-600 font-semibold"
                              : "bg-green-600 hover:bg-green-700 text-white"
                          }`}
                        >
                          {isCurrentPlan ? t("currentPlan") : plan.buttonText}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )
            })}
          </div>

          {/* Current Subscription Status */}
          {isActive && (
            <div className="mt-12 text-center">
              <div className="inline-flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-full">
                <Crown className="w-4 h-4 mr-2" />
                {t("currentSubscription", { 
                  plan: currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1) 
                })}
              </div>
            </div>
          )}
        </div>

        <SubscriptionPopup
          isOpen={showPopup}
          onClose={() => setShowPopup(false)}
          plan={selectedPlan}
          onSubscribe={confirmSubscription}
        />
      </div>
    </AuthGuard>
  )
}
