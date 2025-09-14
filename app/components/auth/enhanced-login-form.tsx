/**
 * ✅ Enhanced Login Form with Activation Status Checking
 * Based on OpenSign Login.jsx but with superadmin approval gate
 */

"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Eye, EyeOff, XCircle, AlertCircle, Clock } from "lucide-react"
import { useEnhancedUserLogin, useInitializeSuperAdmin } from "@/app/lib/opensign/enhanced-auth-services"
import Link from "next/link"

interface LoginFormData {
  email: string
  password: string
}

export default function EnhancedLoginForm() {
  const router = useRouter()
  const loginMutation = useEnhancedUserLogin()
  const initSuperAdminMutation = useInitializeSuperAdmin()

  const [formData, setFormData] = useState<LoginFormData>({
    email: "",
    password: ""
  })
  const [showPassword, setShowPassword] = useState(false)
  const [pendingApproval, setPendingApproval] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    
    // Email normalization (from OpenSign patterns)
    if (name === "email") {
      const normalizedValue = value.toLowerCase().replace(/\s/g, "")
      setFormData(prev => ({ ...prev, [name]: normalizedValue }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  const isFormValid = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return (
      emailRegex.test(formData.email) &&
      formData.password.length > 0
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setPendingApproval(false)
    
    if (!isFormValid()) {
      return
    }

    try {
      const result = await loginMutation.mutateAsync({
        email: formData.email,
        password: formData.password
      })

      if (result.success) {
        // Successful login - redirect based on user role
        const userRole = result.user.UserRole?.replace('contracts_', '') || 'User'
        
        if (userRole === 'SuperAdmin') {
          router.push('/admin/dashboard')
        } else {
          router.push('/dashboard')
        }
      } else if (result.requiresActivation) {
        // Account pending approval
        setPendingApproval(true)
      }
    } catch (error) {
      console.error("Login error:", error)
      // Check if it's an activation error
      if (error instanceof Error && error.message.includes('pending approval')) {
        setPendingApproval(true)
      }
    }
  }

  const handleInitializeSuperAdmin = async () => {
    try {
      const result = await initSuperAdminMutation.mutateAsync()
      if (result.success) {
        // Auto-fill superadmin credentials for convenience
        setFormData({
          email: "superadmin@superadmin.com",
          password: "Superadmin12@"
        })
      }
    } catch (error) {
      console.error("SuperAdmin initialization error:", error)
    }
  }

  // Pending approval state
  if (pendingApproval) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
            <CardTitle className="text-2xl text-yellow-900">Account Pending Approval</CardTitle>
            <CardDescription className="text-gray-600">
              Your account is awaiting administrator activation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Your account has been created but requires administrator approval before you can access the platform.
              </AlertDescription>
            </Alert>
            
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">What to do next:</h4>
              <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                <li>Wait for email notification of account approval</li>
                <li>Contact your administrator if urgent</li>
                <li>Try signing in again once approved</li>
              </ul>
            </div>

            <div className="pt-4 border-t space-y-3">
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => setPendingApproval(false)}
              >
                Try Different Account
              </Button>
              
              <Link href="/signup">
                <Button variant="ghost" className="w-full">
                  Create New Account
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Welcome Back</CardTitle>
          <CardDescription className="text-center">
            Sign in to your e-signature account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  autoComplete="username"
                  placeholder="Enter your email"
                />
              </div>

              <div>
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    autoComplete="current-password"
                    placeholder="Enter your password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* Forgot Password Link */}
            <div className="flex items-center justify-between">
              <div></div>
              <Link href="/forgot-password" className="text-sm text-blue-600 hover:underline">
                Forgot your password?
              </Link>
            </div>

            {/* Error Display */}
            {loginMutation.error && !pendingApproval && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  {loginMutation.error.message}
                </AlertDescription>
              </Alert>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full"
              disabled={!isFormValid() || loginMutation.isPending}
            >
              {loginMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>

            {/* Signup Link */}
            <div className="text-center">
              <p className="text-sm text-gray-600">
                Don&apos;t have an account?{" "}
                <Link href="/signup" className="text-blue-600 hover:underline">
                  Create one here
                </Link>
              </p>
            </div>

            {/* SuperAdmin Setup (Development) */}
            {process.env.NODE_ENV === 'development' && (
              <div className="pt-4 border-t">
                <div className="text-center">
                  <p className="text-xs text-gray-500 mb-2">Development Mode</p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleInitializeSuperAdmin}
                    disabled={initSuperAdminMutation.isPending}
                    className="text-xs"
                  >
                    {initSuperAdminMutation.isPending ? (
                      <>
                        <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                        Initializing...
                      </>
                    ) : (
                      "Initialize SuperAdmin"
                    )}
                  </Button>
                </div>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
