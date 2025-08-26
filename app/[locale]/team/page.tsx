import { AuthGuard } from "@/app/components/auth/AuthGuard"
import { TeamsAndMembers } from "./components/TeamsAndMembers"
import { Contacts } from "./components/Contacts"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Building2, Contact } from "lucide-react"

export default function TeamPage() {
  return (
    <AuthGuard>
      <div className="container mx-auto px-4 md:px-6 py-6 md:py-12">
        <div className="mb-6 md:mb-10">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Team Management</h1>
          <p className="text-sm md:text-base text-gray-600">Manage your teams, members, and contacts.</p>
        </div>
        
        <Tabs defaultValue="teams" className="space-y-6 md:space-y-8">
          <TabsList className="grid w-full grid-cols-2 max-w-sm md:max-w-md">
            <TabsTrigger value="teams" className="flex items-center space-x-1 md:space-x-2 text-sm">
              <Building2 className="h-3 w-3 md:h-4 md:w-4" />
              <span>Teams</span>
            </TabsTrigger>
            <TabsTrigger value="contacts" className="flex items-center space-x-1 md:space-x-2 text-sm">
              <Contact className="h-3 w-3 md:h-4 md:w-4" />
              <span>Contacts</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="teams" className="space-y-6 md:space-y-8">
            <TeamsAndMembers />
          </TabsContent>
          
          <TabsContent value="contacts" className="space-y-6 md:space-y-8">
            <Contacts />
          </TabsContent>
        </Tabs>
      </div>
    </AuthGuard>
  )
}
