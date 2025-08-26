"use client"

import { AuthGuard } from "../../../components/auth/AuthGuard"
import { Button } from "../../../../components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../../components/ui/card"
import { Badge } from "../../../../components/ui/badge"
import { Crown, Calendar, CreditCard, Download, AlertCircle } from "lucide-react"
import { useSubscriptionStore, type SubscriptionPlan } from "../../../lib/subscription/subscription-store"
import { useTranslations } from "next-intl"
import { useRouter } from "../../../i18n/navigation"

interface PlanDetails {
  name: string
  price: number
  description: string
  features: string[]
}

export default function BillingInfoPage() {
  const t = useTranslations("billing")
  const router = useRouter()
  const { plan: currentPlan, isActive, subscribedAt, expiresAt, cancelSubscription } = useSubscriptionStore()

  // Get translated plan data
  const plans: Record<SubscriptionPlan, PlanDetails> = {
    free: {
      name: t("plans.free.name"),
      price: 0,
      description: t("plans.free.description"),
      features: t.raw("plans.free.features") as string[]
    },
    pro: {
      name: t("plans.pro.name"),
      price: 8,
      description: t("plans.pro.description"),
      features: t.raw("plans.pro.features") as string[]
    },
    business: {
      name: t("plans.business.name"),
      price: 16,
      description: t("plans.business.description"),
      features: t.raw("plans.business.features") as string[]
    }
  }

  const currentPlanDetails = plans[currentPlan]

  const handleUpgrade = () => {
    router.push("/pricing")
  }

  const handleCancelSubscription = () => {
    if (confirm(t("cancelConfirmation"))) {
      cancelSubscription()
    }
  }

  const formatDate = (date: Date | null) => {
    if (!date) return ""
    return new Date(date).toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric"
    })
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {t("title")}
            </h1>
            <p className="text-gray-600">
              {t("subtitle")}
            </p>
          </div>

          <div className="grid gap-6">
            {/* Current Subscription */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="w-5 h-5 text-yellow-500" />
                  {t("currentSubscription")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-semibold">{currentPlanDetails.name}</h3>
                    <p className="text-gray-600">{currentPlanDetails.description}</p>
                    <div className="flex items-center gap-4 mt-2">
                      <Badge variant={isActive ? "default" : "secondary"}>
                        {isActive ? t("status.active") : t("status.inactive")}
                      </Badge>
                      <span className="text-2xl font-bold">
                        ${currentPlanDetails.price}
                        <span className="text-sm font-normal text-gray-500">
                          {currentPlan !== "free" ? `/${t("month")}` : ""}
                        </span>
                      </span>
                    </div>
                  </div>
                  
                  {currentPlan !== "business" && (
                    <Button onClick={handleUpgrade} className="bg-green-600 hover:bg-green-700">
                      {t("upgradeButton")}
                    </Button>
                  )}
                </div>

                {/* Subscription dates */}
                {isActive && subscribedAt && expiresAt && (
                  <div className="bg-gray-50 rounded-lg p-4 grid md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-500">{t("subscribedOn")}</p>
                        <p className="font-medium">{formatDate(subscribedAt)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-500">{t("renewsOn")}</p>
                        <p className="font-medium">{formatDate(expiresAt)}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Plan features */}
                <div className="mt-4">
                  <h4 className="font-medium mb-2">{t("planFeatures")}</h4>
                  <ul className="space-y-2">
                    {currentPlanDetails.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-2 text-sm text-gray-600">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Billing History */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  {t("billingHistory")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isActive && subscribedAt ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{currentPlanDetails.name} {t("subscription")}</p>
                        <p className="text-sm text-gray-600">{formatDate(subscribedAt)}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">${currentPlanDetails.price}</p>
                        <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
                          <Download className="w-4 h-4 mr-1" />
                          {t("downloadInvoice")}
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">
                    {t("noBillingHistory")}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Available Plans */}
            <Card>
              <CardHeader>
                <CardTitle>{t("availablePlans")}</CardTitle>
                <CardDescription>{t("availablePlansDescription")}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  {(Object.keys(plans) as SubscriptionPlan[]).map((planKey) => {
                    const plan = plans[planKey]
                    const isCurrentPlan = currentPlan === planKey
                    
                    return (
                      <div 
                        key={planKey} 
                        className={`border rounded-lg p-4 ${
                          isCurrentPlan ? "border-green-500 bg-green-50" : "border-gray-200"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-medium">{plan.name}</h3>
                          {isCurrentPlan && (
                            <Badge variant="default">{t("current")}</Badge>
                          )}
                        </div>
                        <p className="text-2xl font-bold mb-2">
                          ${plan.price}
                          <span className="text-sm font-normal text-gray-500">
                            {planKey !== "free" ? `/${t("month")}` : ""}
                          </span>
                        </p>
                        <p className="text-sm text-gray-600 mb-4">{plan.description}</p>
                        
                        {!isCurrentPlan && (
                          <Button 
                            variant={planKey === "free" ? "outline" : "default"}
                            size="sm" 
                            className="w-full"
                            onClick={planKey === "free" ? handleCancelSubscription : handleUpgrade}
                          >
                            {planKey === "free" ? t("downgrade") : t("upgrade")}
                          </Button>
                        )}
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Cancel Subscription */}
            {isActive && currentPlan !== "free" && (
              <Card className="border-red-200">
                <CardHeader>
                  <CardTitle className="text-red-600">{t("cancelSubscription")}</CardTitle>
                  <CardDescription>{t("cancelDescription")}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    variant="destructive" 
                    onClick={handleCancelSubscription}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    {t("cancelButton")}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}
