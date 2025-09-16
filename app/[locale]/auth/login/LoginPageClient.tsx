"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Link, useRouter } from "@/app/i18n/navigation"
import { useState } from "react"
import { Eye, EyeOff, AlertTriangle, Loader2 } from "lucide-react"
import { authApiService } from "@/app/lib/auth/auth-api-service"
import { useAuthStore } from "@/app/lib/auth/auth-store"
import { useTranslations } from "next-intl"

export function LoginPageClient() {
  const router = useRouter()
  const { login } = useAuthStore()
  const t = useTranslations("LoginPage")
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState("admin@admin.com") // Pre-fill admin email for testing
  const [password, setPassword] = useState("admin@123") // Pre-fill admin password for testing
  const [rememberMe, setRememberMe] = useState(false)
  const [errors, setErrors] = useState({ email: false, password: false })
  const [isLoading, setIsLoading] = useState(false)
  const [loginError, setLoginError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError("")
    
    // Basic validation
    const newErrors = {
      email: !email || !email.includes("@"),
      password: !password || password.length < 6
    }
    setErrors(newErrors)
    
    if (!newErrors.email && !newErrors.password) {
      setIsLoading(true)
      
      try {
        console.log("🔐 Attempting login with:", { email, rememberMe })
        
        const response = await authApiService.login({
          email,
          password
        })
        
        console.log("✅ Login response:", response)
        
        if (response && response.sessionToken) {
          console.log("🎉 Login successful, redirecting to dashboard...")
          console.log("Session token:", response.sessionToken)
          
          // Update auth store with user data
          login(
            { 
              id: response.objectId || 'user', 
              email: email,
              ...(response.name && { name: response.name })
            },
            response.sessionToken
          )
          
          // Redirect to dashboard on successful login
          router.push("/dashboard")
        } else {
          console.log("❌ Login failed - no session token in response")
          setLoginError("Login failed. Please check your credentials.")
        }
        
      } catch (error) {
        console.error("❌ Login error:", error)
        
        // More detailed error handling
        if (error instanceof Error) {
          if (error.message.includes('network') || error.message.includes('fetch')) {
            setLoginError("Network error. Please check your connection and try again.")
          } else if (error.message.includes('401') || error.message.includes('unauthorized')) {
            setLoginError("Invalid email or password. Please try again.")
          } else if (error.message.includes('400')) {
            setLoginError("Invalid request. Please check your email format.")
          } else {
            setLoginError(`Login failed: ${error.message}`)
          }
        } else {
          setLoginError("An unexpected error occurred during login. Please try again.")
        }
      } finally {
        setIsLoading(false)
      }
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{
      background: "#E5F3F8"
    }}>
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
            {loginError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <div className="flex items-center">
                  <AlertTriangle className="h-4 w-4 text-red-500 mr-2" />
                  <span className="text-sm text-red-700">{loginError}</span>
                </div>
              </div>
            )}
            
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
                  placeholder="••••••••••••••"
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
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
                {errors.password && (
                  <AlertTriangle className="absolute right-3 top-3 h-4 w-4 text-red-500" />
                )}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={(checked: boolean) => setRememberMe(checked === true)}
                />
                <Label htmlFor="remember" className="text-sm text-gray-600">
                  Remember Me
                </Label>
              </div>
              <button 
                type="button"
                className="text-sm text-blue-600 hover:text-blue-800 underline"
              >
                {t("forgotPassword")}
              </button>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white py-3 rounded-md font-medium transition-colors"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Signing in...
                </div>
              ) : (
                t("loginButton")
              )}
            </Button>
          </div>
        </form>

        <div className="text-center">
          <span className="text-sm text-gray-600">{t("noAccount")} </span>
          <Link href="/auth/signup" className="text-sm font-semibold text-gray-800 hover:text-gray-600">
            {t("signupLink")}
          </Link>
        </div>
      </div>
    </div>
  )
}
