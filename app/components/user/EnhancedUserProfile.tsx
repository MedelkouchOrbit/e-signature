"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { RefreshCw, User, Mail, Building, Users, Shield } from "lucide-react"
import { userDetailsService, type EnhancedUserProfile } from "@/app/lib/documents-api-service"
import { useToast } from "@/hooks/use-toast"

export function EnhancedUserProfile() {
  const [profile, setProfile] = useState<EnhancedUserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const loadProfile = async () => {
    try {
      setLoading(true)
      const userProfile = await userDetailsService.getEnhancedUserProfile()
      setProfile(userProfile)
      
      if (userProfile) {
        toast({
          title: "Profile Loaded",
          description: `Welcome ${userProfile.name}! Your profile has been loaded with enhanced backend data.`,
        })
      }
    } catch (error) {
      console.error('Error loading user profile:', error)
      toast({
        title: "Profile Load Error",
        description: "Failed to load user profile. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProfile()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin mr-2" />
            Loading profile...
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!profile) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <p className="text-muted-foreground">Failed to load user profile</p>
            <Button onClick={loadProfile} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Enhanced User Profile
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{profile.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{profile.email}</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Building className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{profile.company || 'No company'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <Badge variant="outline">{profile.role}</Badge>
            </div>
          </div>
        </div>

        {/* Organization & Teams */}
        <div className="border-t pt-4">
          <h4 className="font-medium mb-2 flex items-center gap-2">
            <Users className="h-4 w-4" />
            Organization & Teams
          </h4>
          
          <div className="space-y-2">
            {profile.organizationId && (
              <div className="text-sm">
                <span className="text-muted-foreground">Organization ID: </span>
                <code className="bg-muted px-1 py-0.5 rounded text-xs">
                  {profile.organizationId}
                </code>
              </div>
            )}
            
            {profile.teamIds && profile.teamIds.length > 0 ? (
              <div className="text-sm">
                <span className="text-muted-foreground">Teams ({profile.teamIds.length}): </span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {profile.teamIds.map((teamId, index) => (
                    <Badge key={teamId} variant="secondary" className="text-xs">
                      Team {index + 1}
                    </Badge>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">No teams assigned</div>
            )}
          </div>
        </div>

        {/* Debug Info */}
        <div className="border-t pt-4">
          <details className="text-xs">
            <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
              Debug Information
            </summary>
            <div className="mt-2 bg-muted p-2 rounded text-xs">
              <div><strong>Extended ID:</strong> {profile.extendedId}</div>
              <div><strong>Backend Status:</strong> Enhanced getUserDetails API ✅</div>
              <div><strong>Auto ExtUserPtr:</strong> Enabled ✅</div>
              <div><strong>Enhanced ACL:</strong> Enabled ✅</div>
            </div>
          </details>
        </div>

        {/* Refresh Button */}
        <div className="border-t pt-4">
          <Button onClick={loadProfile} variant="outline" size="sm" className="w-full">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Profile
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
