"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Search, MoreHorizontal, Contact } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useContacts } from "@/app/lib/opensign/contact-services"
import { AddContactModal } from "./AddContactModal"
import { useToast } from "@/hooks/use-toast"

interface OpenSignContact {
  objectId: string
  Name: string
  Email: string
  Phone?: string
  Company?: string
  JobTitle?: string
  UserRole?: string
  createdAt: string
  updatedAt: string
}

export function Contacts() {
  const { toast } = useToast()

  // State
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)

  // Use React Query hook for contacts
  const { data: contacts = [], isLoading: loading, error, refetch } = useContacts(searchTerm)

  // Filter contacts based on search term (additional client-side filtering)
  const filteredContacts = useMemo(() => {
    if (!searchTerm.trim()) return contacts
    
    return contacts.filter((contact: OpenSignContact) =>
      contact.Name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.Email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.Phone?.includes(searchTerm)
    )
  }, [contacts, searchTerm])

  // Handle add contact success
  const handleAddContactSuccess = () => {
    setIsAddModalOpen(false)
    refetch() // Reload contacts after adding
    toast({
      title: "Success",
      description: "Contact has been added successfully.",
    })
  }

  // Generate contact initials
  const getContactInitials = (contact: OpenSignContact) => {
    if (!contact.Name) return 'UN'
    const words = contact.Name.trim().split(/\s+/)
    if (words.length >= 2) {
      return (words[0][0] + words[words.length - 1][0]).toUpperCase()
    }
    return contact.Name.substring(0, 2).toUpperCase()
  }

  if (loading) {
    return (
      <div className="bg-gray-50 rounded-lg p-6">
        <div className="flex items-center space-x-2 mb-6">
          <Contact className="h-5 w-5 text-green-600" />
          <h2 className="text-lg font-semibold text-gray-900">Contacts</h2>
        </div>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
          <p className="text-gray-600 mt-2">Loading contacts...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-gray-50 rounded-lg p-6">
        <div className="flex items-center space-x-2 mb-6">
          <Contact className="h-5 w-5 text-green-600" />
          <h2 className="text-lg font-semibold text-gray-900">Contacts</h2>
        </div>
        <div className="text-center py-8">
          <p className="text-red-600 mb-4">{error?.message || "An error occurred"}</p>
          <Button onClick={() => refetch()} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-50 rounded-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Contact className="h-5 w-5 text-green-600" />
          <h2 className="text-lg font-semibold text-gray-900">Contacts</h2>
          <Badge variant="secondary" className="bg-gray-200 text-gray-700">
            {filteredContacts.length}
          </Badge>
        </div>
        
        <Button 
          onClick={() => setIsAddModalOpen(true)} 
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Contact
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search contacts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-white border-gray-200"
          />
        </div>
      </div>

      {/* Contacts Table */}
      {filteredContacts.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <Contact className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {searchTerm ? 'No contacts found' : 'No contacts yet'}
          </h3>
          <p className="text-gray-600 mb-4">
            {searchTerm 
              ? 'Try adjusting your search terms.' 
              : 'Add your first contact to get started with document signing.'
            }
          </p>
          {!searchTerm && (
            <Button 
              onClick={() => setIsAddModalOpen(true)}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Contact
            </Button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="font-semibold text-gray-900">Contact</TableHead>
                <TableHead className="font-semibold text-gray-900">Email</TableHead>
                <TableHead className="font-semibold text-gray-900">Phone</TableHead>
                <TableHead className="font-semibold text-gray-900">Role</TableHead>
                <TableHead className="font-semibold text-gray-900">Added</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredContacts.map((contact: OpenSignContact) => (
                <TableRow key={contact.objectId} className="hover:bg-gray-50">
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-green-100 text-green-700 text-xs font-semibold">
                          {getContactInitials(contact)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium text-gray-900">{contact.Name}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-gray-900">{contact.Email}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-gray-600">{contact.Phone || '-'}</div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant="secondary" 
                      className={
                        contact.UserRole === 'contracts_Admin' 
                          ? 'bg-green-100 text-green-800'
                          : contact.UserRole === 'contracts_User'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }
                    >
                      {contact.UserRole?.replace('contracts_', '') || 'Guest'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-gray-600">
                      {new Date(contact.createdAt).toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          Send Document
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600">
                          Remove Contact
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Add Contact Modal */}
      <AddContactModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={handleAddContactSuccess}
      />
    </div>
  )
}
