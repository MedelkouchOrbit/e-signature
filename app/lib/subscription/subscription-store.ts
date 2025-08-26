import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"

export type SubscriptionPlan = "free" | "pro" | "business"

interface SubscriptionState {
  plan: SubscriptionPlan
  isActive: boolean
  subscribedAt: Date | null
  expiresAt: Date | null
  updateSubscription: (plan: SubscriptionPlan) => void
  cancelSubscription: () => void
  isSubscribed: () => boolean
  hasActivePlan: (plan: SubscriptionPlan) => boolean
}

export const useSubscriptionStore = create<SubscriptionState>()(
  persist(
    (set, get) => ({
      plan: "free",
      isActive: false,
      subscribedAt: null,
      expiresAt: null,

      updateSubscription: (plan: SubscriptionPlan) => {
        const now = new Date()
        const expiresAt = new Date()
        expiresAt.setMonth(expiresAt.getMonth() + 1) // Set expiry to 1 month from now

        set({
          plan,
          isActive: plan !== "free",
          subscribedAt: plan !== "free" ? now : null,
          expiresAt: plan !== "free" ? expiresAt : null,
        })
      },

      cancelSubscription: () => {
        set({
          plan: "free",
          isActive: false,
          subscribedAt: null,
          expiresAt: null,
        })
      },

      isSubscribed: () => {
        const state = get()
        return state.isActive && state.plan !== "free"
      },

      hasActivePlan: (plan: SubscriptionPlan) => {
        const state = get()
        return state.plan === plan && state.isActive
      },
    }),
    {
      name: "subscription-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
)
