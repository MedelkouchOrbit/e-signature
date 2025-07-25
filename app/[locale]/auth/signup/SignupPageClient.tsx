"use client"
import { SignupForm } from "@/app/components/auth/signup-form"

export function SignupPageClient() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-gray-100 px-4 py-12 dark:bg-gray-950">
      <SignupForm />
    </div>
  )
}
