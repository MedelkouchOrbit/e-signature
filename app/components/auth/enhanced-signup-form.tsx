/**
 * ✅ Enhanced Signup Form with Superadmin Approval Workflow
 * Based on OpenSign AddAdmin.jsx patterns but for regular user registration
 */

"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Eye, EyeOff, CheckCircle, XCircle, AlertCircle } from "lucide-react"
import { useEnhancedUserSignup } from "@/app/lib/opensign/enhanced-auth-services"
import Link from "next/link"

interface PasswordValidation {
  length: boolean
  caseAndDigit: boolean  
  specialChar: boolean
}

export default function EnhancedSignupForm() {
  const signupMutation = useEnhancedUserSignup()

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    company: "",
    jobTitle: "",
    phone: "",
    // Geographic info (optional)
    address: "",
    city: "",
    state: "",
    country: "",
    pincode: ""
  })

  const [showPassword, setShowPassword] = useState(false)
  const [passwordValidation, setPasswordValidation] = useState<PasswordValidation>({
    length: false,
    caseAndDigit: false,
    specialChar: false
  })
  const [isTermsAccepted, setIsTermsAccepted] = useState(false)
  const [registrationComplete, setRegistrationComplete] = useState(false)

  // Password validation logic (from OpenSign AddAdmin.jsx)
  const validatePassword = (password: string) => {
    const lengthValid = password.length >= 8
    const caseDigitValid = /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)
    const specialCharValid = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
    
    setPasswordValidation({
      length: lengthValid,
      caseAndDigit: caseDigitValid,
      specialChar: specialCharValid
    })

    return lengthValid && caseDigitValid && specialCharValid
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    
    // Email normalization (from OpenSign patterns)
    if (name === "email") {
      const normalizedValue = value.toLowerCase().replace(/\s/g, "")
      setFormData(prev => ({ ...prev, [name]: normalizedValue }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }

    // Validate password on change
    if (name === "password") {
      validatePassword(value)
    }
  }

  const isFormValid = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return (
      formData.name.trim() &&
      emailRegex.test(formData.email) &&
      passwordValidation.length &&
      passwordValidation.caseAndDigit &&
      passwordValidation.specialChar &&
      formData.company.trim() &&
      formData.jobTitle.trim() &&
      isTermsAccepted
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isFormValid()) {
      return
    }

    try {
      const result = await signupMutation.mutateAsync({
        userDetails: {
          ...formData,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        }
      })

      if (result.success) {
        setRegistrationComplete(true)
      }
    } catch (error) {
      console.error("Signup error:", error)
    }
  }

  // Success state - show approval message
  if (registrationComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl text-green-900">Registration Submitted!</CardTitle>
            <CardDescription className="text-gray-600">
              Your account has been created successfully
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Pending Approval:</strong> Your account is awaiting administrator approval. 
                You will receive an email notification once your account has been activated.
              </AlertDescription>
            </Alert>
            
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">What happens next?</h4>
              <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                <li>Administrator reviews your registration</li>
                <li>You receive email notification of approval</li>
                <li>You can then sign in to access the platform</li>
              </ol>
            </div>

            <div className="pt-4 border-t">
              <Link href="/login">
                <Button variant="outline" className="w-full">
                  Return to Sign In
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
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Create Your Account</CardTitle>
          <CardDescription className="text-center">
            Join our e-signature platform. Your account will require administrator approval.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Personal Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    placeholder="John Doe"
                  />
                </div>
                
                <div>
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    placeholder="john@company.com"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="+1 (555) 123-4567"
                />
              </div>

              <div>
                <Label htmlFor="password">Password *</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter a strong password"
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
                
                {/* Password Requirements */}
                <div className="mt-2 space-y-1">
                  <div className={`text-sm flex items-center gap-2 ${passwordValidation.length ? 'text-green-600' : 'text-gray-500'}`}>
                    {passwordValidation.length ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                    At least 8 characters
                  </div>
                  <div className={`text-sm flex items-center gap-2 ${passwordValidation.caseAndDigit ? 'text-green-600' : 'text-gray-500'}`}>
                    {passwordValidation.caseAndDigit ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                    Uppercase, lowercase, and number
                  </div>
                  <div className={`text-sm flex items-center gap-2 ${passwordValidation.specialChar ? 'text-green-600' : 'text-gray-500'}`}>
                    {passwordValidation.specialChar ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                    Special character
                  </div>
                </div>
              </div>
            </div>

            {/* Company Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Company Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="company">Company Name *</Label>
                  <Input
                    id="company"
                    name="company"
                    type="text"
                    value={formData.company}
                    onChange={handleInputChange}
                    required
                    placeholder="Acme Corporation"
                  />
                </div>
                
                <div>
                  <Label htmlFor="jobTitle">Job Title *</Label>
                  <Input
                    id="jobTitle"
                    name="jobTitle"
                    type="text"
                    value={formData.jobTitle}
                    onChange={handleInputChange}
                    required
                    placeholder="CEO, Manager, etc."
                  />
                </div>
              </div>
            </div>

            {/* Optional Address Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Address (Optional)</h3>
              
              <div>
                <Label htmlFor="address">Street Address</Label>
                <Input
                  id="address"
                  name="address"
                  type="text"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="123 Main Street"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    name="city"
                    type="text"
                    value={formData.city}
                    onChange={handleInputChange}
                    placeholder="New York"
                  />
                </div>
                
                <div>
                  <Label htmlFor="state">State/Province</Label>
                  <Input
                    id="state"
                    name="state"
                    type="text"
                    value={formData.state}
                    onChange={handleInputChange}
                    placeholder="NY"
                  />
                </div>
                
                <div>
                  <Label htmlFor="pincode">ZIP/Postal Code</Label>
                  <Input
                    id="pincode"
                    name="pincode"
                    type="text"
                    value={formData.pincode}
                    onChange={handleInputChange}
                    placeholder="10001"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  name="country"
                  type="text"
                  value={formData.country}
                  onChange={handleInputChange}
                  placeholder="United States"
                />
              </div>
            </div>

            {/* Terms and Conditions */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  id="terms"
                  type="checkbox"
                  checked={isTermsAccepted}
                  onChange={(e) => setIsTermsAccepted(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                />
                <Label htmlFor="terms" className="text-sm">
                  I agree to the{" "}
                  <Link href="/terms" className="text-blue-600 hover:underline">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy" className="text-blue-600 hover:underline">
                    Privacy Policy
                  </Link>
                </Label>
              </div>
            </div>

            {/* Error Display */}
            {signupMutation.error && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  {signupMutation.error.message}
                </AlertDescription>
              </Alert>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full"
              disabled={!isFormValid() || signupMutation.isPending}
            >
              {signupMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Account...
                </>
              ) : (
                "Create Account"
              )}
            </Button>

            {/* Login Link */}
            <div className="text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{" "}
                <Link href="/login" className="text-blue-600 hover:underline">
                  Sign in here
                </Link>
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
