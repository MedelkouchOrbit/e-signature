"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, FileText, Clock, Eye } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

// Mock document data for testing
const mockDocuments = [
  {
    objectId: "doc1",
    name: "Contract Agreement - No Order",
    status: "waiting" as const,
    sendInOrder: false,
    signers: [
      { id: "1", name: "Admin User", email: "admin@test.com", status: "waiting", order: 1, userId: "user1" },
      { id: "2", name: "Joe User", email: "joe@joe.com", status: "waiting", order: 2, userId: "user2" }
    ],
    createdBy: { id: "user1", name: "Admin User", email: "admin@test.com" },
    senderName: "Admin User",
    senderEmail: "admin@test.com",
    createdAt: "2024-01-15T10:00:00Z"
  },
  {
    objectId: "doc2", 
    name: "NDA Document - With Order (Joe's Turn)",
    status: "waiting" as const,
    sendInOrder: true,
    signers: [
      { id: "1", name: "Admin User", email: "admin@test.com", status: "signed", order: 1, userId: "user1" },
      { id: "2", name: "Joe User", email: "joe@joe.com", status: "waiting", order: 2, userId: "user2" },
      { id: "3", name: "Jane User", email: "jane@test.com", status: "waiting", order: 3, userId: "user3" }
    ],
    createdBy: { id: "user1", name: "Admin User", email: "admin@test.com" },
    senderName: "Admin User",
    senderEmail: "admin@test.com",
    createdAt: "2024-01-15T11:00:00Z"
  },
  {
    objectId: "doc3",
    name: "Service Agreement - Waiting for First Signer",
    status: "waiting" as const,
    sendInOrder: true,
    signers: [
      { id: "1", name: "Admin User", email: "admin@test.com", status: "waiting", order: 1, userId: "user1" },
      { id: "2", name: "Joe User", email: "joe@joe.com", status: "waiting", order: 2, userId: "user2" }
    ],
    createdBy: { id: "user1", name: "Admin User", email: "admin@test.com" },
    senderName: "Admin User",
    senderEmail: "admin@test.com",
    createdAt: "2024-01-15T12:00:00Z"
  },
  {
    objectId: "doc4",
    name: "Employee Handbook - Completed",
    status: "signed" as const,
    sendInOrder: false,
    signers: [
      { id: "1", name: "Admin User", email: "admin@test.com", status: "signed", order: 1, userId: "user1" },
      { id: "2", name: "Joe User", email: "joe@joe.com", status: "signed", order: 2, userId: "user2" }
    ],
    createdBy: { id: "user1", name: "Admin User", email: "admin@test.com" },
    senderName: "Admin User", 
    senderEmail: "admin@test.com",
    createdAt: "2024-01-14T09:00:00Z"
  }
]

// Mock users to test with
const testUsers = [
  { userId: "user1", email: "admin@test.com", name: "Admin User (Creator)" },
  { userId: "user2", email: "joe@joe.com", name: "Joe User (Signer)" },
  { userId: "user3", email: "jane@test.com", name: "Jane User (Signer)" }
]

type MockDocument = typeof mockDocuments[0]
type MockUser = typeof testUsers[0]

export default function SignButtonTestPage() {
  const { toast } = useToast()
  const [currentUser, setCurrentUser] = useState(testUsers[1]) // Start with Joe

  // Function to check if user can sign (replicating our API logic)
  const checkCanUserSign = (document: MockDocument, user: MockUser) => {
    if (document.status !== 'waiting') return false
    
    // Find user signer by ID first, then by email
    let userSigner = document.signers.find(s => s.userId === user.userId)
    if (!userSigner) {
      userSigner = document.signers.find(s => s.email === user.email)
    }
    
    if (!userSigner || userSigner.status !== 'waiting') return false
    
    if (document.sendInOrder && userSigner.order) {
      // Check if all previous signers have signed
      const previousSigners = document.signers.filter(s => s.order && s.order < userSigner.order!)
      return previousSigners.every(s => s.status === 'signed')
    }
    
    return true
  }

  // Check if current user is creator
  const isCurrentUserCreator = (document: MockDocument, user: MockUser) => {
    return document.createdBy.email === user.email || document.createdBy.id === user.userId
  }

  const handleSign = (document: MockDocument) => {
    toast({
      title: "Sign Document",
      description: `Navigating to sign "${document.name}"...`
    })
  }

  const handleView = (document: MockDocument) => {
    toast({
      title: "View Document", 
      description: `Opening "${document.name}" for viewing...`
    })
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Sign Button Logic Test</h1>
        <p className="text-gray-600 mb-4">
          Test the sign button visibility logic for different users and document scenarios.
        </p>
        
        {/* User Selector */}
        <div className="flex gap-2 mb-6">
          <span className="font-medium">Test as:</span>
          {testUsers.map((user) => (
            <Button
              key={user.userId}
              variant={currentUser.userId === user.userId ? "default" : "outline"}
              size="sm"
              onClick={() => setCurrentUser(user)}
            >
              {user.name}
            </Button>
          ))}
        </div>
      </div>

      {/* Documents List */}
      <div className="space-y-4">
        {mockDocuments.map((document) => {
          const canUserSign = checkCanUserSign(document, currentUser)
          const isCreator = isCurrentUserCreator(document, currentUser)
          const userSigner = document.signers.find(s => 
            s.userId === currentUser.userId || s.email === currentUser.email
          )
          const shouldShowSignButton = canUserSign && !isCreator

          return (
            <Card key={document.objectId} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="h-4 w-4 text-gray-400" />
                    <h3 className="font-medium text-gray-900">{document.name}</h3>
                  </div>
                  
                  <div className="flex items-center gap-2 mb-3">
                    <Badge 
                      variant={document.status === 'signed' ? 'default' : 'secondary'}
                      className={document.status === 'waiting' ? 'bg-orange-100 text-orange-800' : ''}
                    >
                      <Clock className="h-3 w-3 mr-1" />
                      {document.status}
                    </Badge>
                    
                    {shouldShowSignButton && (
                      <Badge variant="outline" className="text-xs text-green-700 bg-green-50">
                        Action Required
                      </Badge>
                    )}
                  </div>
                  
                  <div className="space-y-1 text-sm text-gray-600">
                    <div><strong>Send in Order:</strong> {document.sendInOrder ? 'Yes' : 'No'}</div>
                    <div><strong>Created by:</strong> {document.senderName}</div>
                    <div><strong>Current user is creator:</strong> {isCreator ? 'Yes' : 'No'}</div>
                    <div><strong>Current user is signer:</strong> {userSigner ? `Yes (Order: ${userSigner.order}, Status: ${userSigner.status})` : 'No'}</div>
                    <div><strong>Can sign:</strong> {canUserSign ? 'Yes' : 'No'}</div>
                    <div><strong>Should show Sign button:</strong> {shouldShowSignButton ? 'Yes ✅' : 'No ❌'}</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {shouldShowSignButton && (
                    <Button
                      size="sm"
                      onClick={() => handleSign(document)}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Sign
                    </Button>
                  )}
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleView(document)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Button>
                </div>
              </div>
            </Card>
          )
        })}
      </div>
      
      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-medium text-blue-900 mb-2">Test Scenarios:</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• <strong>Admin User:</strong> Creator of documents - should NOT see Sign button even if they&apos;re signers</li>
          <li>• <strong>Joe User:</strong> Can sign doc1 (no order), doc2 (his turn in order), but NOT doc3 (waiting for admin to sign first)</li>
          <li>• <strong>Jane User:</strong> Can sign doc1 (no order), but NOT doc2 (waiting for Joe) or doc3 (waiting for admin)</li>
        </ul>
      </div>
    </div>
  )
}
