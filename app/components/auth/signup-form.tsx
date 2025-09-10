"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Link, useRouter } from "@/app/i18n/navigation"
import { useState } from "react"
import { Eye, EyeOff, AlertTriangle, Loader2 } from "lucide-react"
import { authApiService } from "@/app/lib/auth/auth-api-service"
import { useTranslations } from "next-intl"
import { useToast } from "@/hooks/use-toast"

export function SignupForm() {
  const t = useTranslations("SignupPage")
  const router = useRouter()
  const { toast } = useToast()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [errors, setErrors] = useState({ 
    name: false, 
    email: false, 
    password: false, 
    confirmPassword: false,
    terms: false 
  })
  const [isLoading, setIsLoading] = useState(false)
  const [signupError, setSignupError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSignupError("")
    
    // Basic validation
    const newErrors = {
      name: !name || name.length < 2,
      email: !email || !email.includes("@"),
      password: !password || password.length < 8,
      confirmPassword: !confirmPassword || password !== confirmPassword,
      terms: !termsAccepted
    }
    setErrors(newErrors)
    
    if (!Object.values(newErrors).some(error => error)) {
      setIsLoading(true)
      
      try {
        console.log("🔐 Attempting signup with:", { name, email })
        
        const response = await authApiService.signup({
          name,
          email,
          password,
          role: "contracts_User",
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        })
        
        console.log("✅ Signup response:", response)
        
        toast({
          title: t("signupSuccessTitle"),
          description: t("signupSuccessDescription"),
          variant: "default",
        })
        
        // Redirect to login page after successful signup
        router.push("/auth/login")
        
      } catch (error) {
        console.error("❌ Signup error:", error)
        
        if (error instanceof Error) {
          if (error.message.includes('network') || error.message.includes('fetch')) {
            setSignupError("Network error. Please check your connection and try again.")
          } else if (error.message.includes('409') || error.message.includes('exists')) {
            setSignupError("An account with this email already exists.")
          } else if (error.message.includes('400')) {
            setSignupError("Invalid information. Please check your details.")
          } else {
            setSignupError(`Signup failed: ${error.message}`)
          }
        } else {
          setSignupError("An unexpected error occurred. Please try again.")
        }
        
        toast({
          title: t("signupErrorTitle"),
          description: signupError || t("signupErrorDescription"),
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#E5F3F8" }}>
      <div 
        className="flex flex-col items-center bg-white rounded-lg"
        style={{
          width: "438px",
          padding: "48px 32px",
          gap: "56px",
          borderRadius: "8px",
          background: "#FFF",
          boxShadow: "0px 2px 12.1px 6px rgba(66, 66, 96, 0.05)"
        }}
      >
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-gray-800">{t("title")}</h1>
        </div>
        
        <form onSubmit={handleSubmit} className="w-full">
          <div className="space-y-6">
            {signupError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <div className="flex items-center">
                  <AlertTriangle className="h-4 w-4 text-red-500 mr-2" />
                  <span className="text-sm text-red-700">{signupError}</span>
                </div>
              </div>
            )}
            
            <div>
              <Label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                {t("nameLabel")}
              </Label>
              <div className="relative">
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t("namePlaceholder")}
                  className={`w-full px-3 py-2 border-b-2 border-gray-300 bg-transparent focus:border-blue-500 focus:outline-none ${
                    errors.name ? "border-red-500" : ""
                  }`}
                  style={{ borderTop: "none", borderLeft: "none", borderRight: "none", borderRadius: "0" }}
                />
                {errors.name && (
                  <AlertTriangle className="absolute right-3 top-3 h-4 w-4 text-red-500" />
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                {t("emailLabel")}
              </Label>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("emailPlaceholder")}
                  className={`w-full px-3 py-2 border-b-2 border-gray-300 bg-transparent focus:border-blue-500 focus:outline-none ${
                    errors.email ? "border-red-500" : ""
                  }`}
                  style={{ borderTop: "none", borderLeft: "none", borderRight: "none", borderRadius: "0" }}
                />
                {errors.email && (
                  <AlertTriangle className="absolute right-3 top-3 h-4 w-4 text-red-500" />
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                {t("passwordLabel")}
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t("passwordPlaceholder")}
                  className={`w-full px-3 py-2 pr-20 border-b-2 border-gray-300 bg-transparent focus:border-blue-500 focus:outline-none ${
                    errors.password ? "border-red-500" : ""
                  }`}
                  style={{ borderTop: "none", borderLeft: "none", borderRight: "none", borderRadius: "0" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-12 top-3 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
                {errors.password && (
                  <AlertTriangle className="absolute right-3 top-3 h-4 w-4 text-red-500" />
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                {t("confirmPasswordLabel")}
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={t("confirmPasswordPlaceholder")}
                  className={`w-full px-3 py-2 pr-20 border-b-2 border-gray-300 bg-transparent focus:border-blue-500 focus:outline-none ${
                    errors.confirmPassword ? "border-red-500" : ""
                  }`}
                  style={{ borderTop: "none", borderLeft: "none", borderRight: "none", borderRadius: "0" }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-12 top-3 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
                {errors.confirmPassword && (
                  <AlertTriangle className="absolute right-3 top-3 h-4 w-4 text-red-500" />
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="terms"
                checked={termsAccepted}
                onCheckedChange={(checked: boolean) => setTermsAccepted(checked === true)}
                className={errors.terms ? "border-red-500" : ""}
              />
              <Label htmlFor="terms" className="text-sm text-gray-600">
                {t("termsLabel")}{" "}
                <Link href="/auth/terms" className="text-blue-600 hover:text-blue-800 underline">
                  {t("termsLink")}
                </Link>
              </Label>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white py-3 rounded-md font-medium transition-colors"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  {t("signingUp")}
                </div>
              ) : (
                t("signupButton")
              )}
            </Button>
          </div>
        </form>

        <div className="text-center">
          <span className="text-sm text-gray-600">{t("alreadyHaveAccount")} </span>
          <Link href="/auth/login" className="text-sm font-semibold text-gray-800 hover:text-gray-600">
            {t("loginLink")}
          </Link>
        </div>
      </div>
    </div>
  )
}
