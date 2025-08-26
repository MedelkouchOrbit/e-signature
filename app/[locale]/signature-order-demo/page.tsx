/**
 * Signature Order Management Demo
 * 
 * This demonstrates the signature order permissions system:
 * 1. When sendInOrder = true: Only the first pending signer can sign
 * 2. When sendInOrder = false: All pending signers can sign simultaneously
 * 3. Visual indicators show who can sign next
 * 4. Status tracking: pending -> waiting -> signed -> declined
 */

'use client'

import { useState } from 'react'
import { TemplateSigner, Template, calculateSigningPermissions } from '@/app/lib/templates-store'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'

export default function SignatureOrderDemo() {
  const [sendInOrder, setSendInOrder] = useState(true)
  const [signers, setSigners] = useState<TemplateSigner[]>([
    {
      id: '1',
      role: 'TU',
      email: 'tu@example.com',
      color: '#3b82f6',
      order: 1,
      status: 'pending'
    },
    {
      id: '2',
      role: 'SM',
      email: 'sm@example.com',
      color: '#10b981',
      order: 2,
      status: 'pending'
    },
    {
      id: '3',
      role: 'TK',
      email: 'tk@example.com',
      color: '#8b5cf6',
      order: 3,
      status: 'pending'
    },
    {
      id: '4',
      role: 'HS',
      email: 'hs@example.com',
      color: '#f59e0b',
      order: 4,
      status: 'pending'
    }
  ])

  // Create a mock template and calculate permissions
  const template: Template = {
    id: 'demo',
    name: 'Demo Template',
    status: 'draft',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'demo-user',
    fields: [],
    signers,
    sendInOrder,
    otpEnabled: false,
    tourEnabled: false,
    reminderEnabled: false,
    reminderInterval: 7,
    completionDays: 30,
    bcc: [],
    allowModifications: true
  }

  const templateWithPermissions = calculateSigningPermissions(template)

  const handleSignerAction = (signerId: string, action: 'sign' | 'decline') => {
    const newStatus = action === 'sign' ? 'signed' : 'declined'
    const updatedSigners = signers.map(signer =>
      signer.id === signerId
        ? { ...signer, status: newStatus as TemplateSigner['status'], signedAt: new Date().toISOString() }
        : signer
    )
    setSigners(updatedSigners)
  }

  const resetDemo = () => {
    setSigners(signers.map(signer => ({ ...signer, status: 'pending', signedAt: undefined })))
  }

  const getStatusBadge = (status: TemplateSigner['status']) => {
    const variants = {
      pending: { variant: 'outline' as const, label: 'Pending', color: 'text-blue-600' },
      waiting: { variant: 'secondary' as const, label: 'Waiting', color: 'text-orange-600' },
      signed: { variant: 'default' as const, label: 'Signed', color: 'text-green-600' },
      declined: { variant: 'destructive' as const, label: 'Declined', color: 'text-red-600' }
    }
    const config = variants[status]
    return <Badge variant={config.variant} className={config.color}>{config.label}</Badge>
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Signature Order Management Demo
        </h1>
        <p className="text-gray-600">
          See how signature order controls who can sign when
        </p>
      </div>

      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-3">
            <Checkbox
              id="sendInOrder"
              checked={sendInOrder}
              onCheckedChange={(checked) => setSendInOrder(!!checked)}
            />
            <div>
              <label htmlFor="sendInOrder" className="font-medium">
                Send in Order
              </label>
              <p className="text-sm text-gray-600">
                {sendInOrder 
                  ? "Signers must sign sequentially. Only the next signer can sign."
                  : "All signers can sign simultaneously in any order."
                }
              </p>
            </div>
          </div>
          
          <Button onClick={resetDemo} variant="outline">
            Reset Demo
          </Button>
        </CardContent>
      </Card>

      {/* Signers Status */}
      <Card>
        <CardHeader>
          <CardTitle>Signature Status & Permissions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {templateWithPermissions.signers
              .sort((a, b) => a.order - b.order)
              .map((signer) => (
                <div key={signer.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div 
                      className="w-10 h-10 rounded-full text-white font-medium flex items-center justify-center"
                      style={{ backgroundColor: signer.color }}
                    >
                      {signer.role}
                    </div>
                    
                    <div>
                      <div className="font-medium">{signer.email}</div>
                      <div className="text-sm text-gray-500">Order: {signer.order}</div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(signer.status)}
                      {signer.canSign && (
                        <Badge variant="outline" className="text-green-600 border-green-600">
                          ✅ Can Sign Now
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    {signer.status === 'pending' && signer.canSign && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleSignerAction(signer.id, 'sign')}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          Sign
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSignerAction(signer.id, 'decline')}
                        >
                          Decline
                        </Button>
                      </>
                    )}
                    
                    {signer.status === 'waiting' && (
                      <div className="text-sm text-orange-600">
                        ⏳ Waiting for previous signer
                      </div>
                    )}
                    
                    {(signer.status === 'signed' || signer.status === 'declined') && (
                      <div className="text-sm text-gray-500">
                        {signer.status === 'signed' ? '✅ Completed' : '❌ Declined'} 
                        {signer.signedAt && ` at ${new Date(signer.signedAt).toLocaleTimeString()}`}
                      </div>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Explanation */}
      <Card className="bg-blue-50">
        <CardHeader>
          <CardTitle>How Signature Order Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="space-y-2">
            <h4 className="font-medium">When &quot;Send in Order&quot; is enabled:</h4>
            <ul className="list-disc list-inside space-y-1 text-gray-700">
              <li>Only the first pending signer can sign immediately</li>
              <li>Other signers must wait until the previous person signs</li>
              <li>If someone declines, the next person can still sign</li>
              <li>Perfect for approval workflows and legal processes</li>
            </ul>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium">When &quot;Send in Order&quot; is disabled:</h4>
            <ul className="list-disc list-inside space-y-1 text-gray-700">
              <li>All signers can sign immediately and simultaneously</li>
              <li>No waiting required - faster completion</li>
              <li>Good for simple agreements where order doesn&apos;t matter</li>
            </ul>
          </div>

          <div className="mt-4 p-3 bg-yellow-100 rounded border-l-4 border-yellow-500">
            <p className="text-yellow-800">
              <strong>Try it:</strong> Toggle &quot;Send in Order&quot; on/off and sign as different users to see how permissions change!
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
