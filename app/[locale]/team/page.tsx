"use client"

import { AuthGuard } from "@/app/components/auth/AuthGuard"
import { TeamsAndMembers } from "./components/TeamsAndMembers"
import { Contacts } from "./components/Contacts"
import { SuperAdminManagement } from "./components/SuperAdminManagement"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Building2, Contact, Crown } from "lucide-react"
import { useState, useEffect } from "react"
import { openSignApiService } from "@/app/lib/api-service"

// Disable static generation for this page since it requires authentication
export const dynamic = 'force-dynamic'

export default function TeamPage() {
  const [userEmail, setUserEmail] = useState<string>('')
  const [isUserDataLoaded, setIsUserDataLoaded] = useState(false)

  // Check if current user is super admin - only after data is loaded
  const isSuperAdmin = isUserDataLoaded && userEmail === 'superadmin@superadmin.com'

  // Fetch current user details
  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        // Get the current session token
        const sessionToken = openSignApiService.getSessionToken()
        if (!sessionToken) {
          console.error('No session token available')
          return
        }
        
        // Call getUserDetails with Parse Server payload structure (simplified)
        const payload = {
          "_ApplicationId": "opensign",
          "_ClientVersion": "js6.1.1", 
          "_InstallationId": "5b57e02d-5015-4c69-bede-06310ad8bae9"
        }
        
        // callFunction will automatically add _SessionToken to payload
        const userDetails = await openSignApiService.callFunction('getUserDetails', payload)
        console.log('Current user details:', userDetails)
        
        // Handle different possible response structures
        let email = ''
        if (userDetails && typeof userDetails === 'object') {
          // Try different possible email field names
          if ('Email' in userDetails) {
            email = (userDetails as { Email: string }).Email
          } else if ('email' in userDetails) {
            email = (userDetails as { email: string }).email
          } else if ('result' in userDetails && typeof userDetails.result === 'object' && userDetails.result) {
            const result = userDetails.result as Record<string, unknown>
            if ('Email' in result) {
              email = (result as { Email: string }).Email
            } else if ('email' in result) {
              email = (result as { email: string }).email
            }
          }
        }
        
        if (email) {
          setUserEmail(email)
          console.log('User email extracted:', email)
        } else {
          console.warn('Could not extract email from user details:', userDetails)
        }
      } catch (error) {
        console.error('Failed to get user details:', error)
      } finally {
        setIsUserDataLoaded(true)
      }
    }

    getCurrentUser()
  }, [])

  return (
    <AuthGuard>
      <div className="container px-4 py-6 mx-auto md:px-6 md:py-12">
        <div className="mb-6 md:mb-10">
          <h1 className="mb-2 text-2xl font-bold text-gray-900 md:text-3xl">Team Management</h1>
          <p className="text-sm text-gray-600 md:text-base">Manage your teams, members, contacts, and organizations.</p>
        </div>
        
        {!isUserDataLoaded ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-gray-500">Loading...</div>
          </div>
        ) : (
          <Tabs defaultValue={isSuperAdmin ? "super-admin" : "teams"} className="space-y-6 md:space-y-8">
            <TabsList className={`grid w-full max-w-lg ${isSuperAdmin ? 'grid-cols-3' : 'grid-cols-2'} md:max-w-xl`}>
              <TabsTrigger value="teams" className="flex items-center space-x-1 text-sm md:space-x-2">
                <Building2 className="w-3 h-3 md:h-4 md:w-4" />
                <span>Teams</span>
              </TabsTrigger>
              <TabsTrigger value="contacts" className="flex items-center space-x-1 text-sm md:space-x-2">
                <Contact className="w-3 h-3 md:h-4 md:w-4" />
                <span>Contacts</span>
              </TabsTrigger>
              {isSuperAdmin && (
                <TabsTrigger value="super-admin" className="flex items-center space-x-1 text-sm md:space-x-2">
                  <Crown className="w-3 h-3 md:h-4 md:w-4" />
                  <span>Super Admin</span>
                </TabsTrigger>
              )}
            </TabsList>
            
            <TabsContent value="teams" className="space-y-6 md:space-y-8">
              <TeamsAndMembers />
            </TabsContent>
            
            <TabsContent value="contacts" className="space-y-6 md:space-y-8">
              <Contacts />
            </TabsContent>
            
            {isSuperAdmin && (
              <TabsContent value="super-admin" className="space-y-6 md:space-y-8">
                <SuperAdminManagement />
              </TabsContent>
            )}
          </Tabs>
        )}
      </div>
    </AuthGuard>
  )
}
