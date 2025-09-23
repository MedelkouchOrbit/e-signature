"use client"

import { AuthGuard } from "@/app/components/auth/AuthGuard"
import { TeamsAndMembers } from "@/app/components/team/TeamsAndMembers"
import { Contacts } from "@/app/components/team/Contacts"
import { SuperAdminManagement } from "@/app/components/team/SuperAdminManagement"
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
        
        // Call getUserDetails using direct fetch like the working curl command
        const payload = {
          "_ApplicationId": "opensign",
          "_ClientVersion": "js6.1.1", 
          "_InstallationId": "22ad0a9b-a8a2-400b-99f0-d979c070ea35",
          "_SessionToken": sessionToken
        }
        
        // Use direct fetch to match the working curl format
        const response = await fetch('http://94.249.71.89:9000/api/app/functions/getUserDetails', {
          method: 'POST',
          headers: {
            'Accept': '*/*',
            'Accept-Language': 'en-US,en;q=0.9,fr-FR;q=0.8,fr;q=0.7',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Content-Type': 'text/plain',
            'Origin': 'http://94.249.71.89:9000',
            'Pragma': 'no-cache',
            'Referer': 'http://94.249.71.89:9000/dashboard/35KBoSgoAK',
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36'
          },
          body: JSON.stringify(payload)
        })
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        
        const userDetails = await response.json()
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
