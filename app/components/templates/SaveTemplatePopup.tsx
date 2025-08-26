"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { X, CheckCircle, Loader2 } from 'lucide-react'

interface SaveTemplatePopupProps {
  isOpen: boolean
  templateName: string
  onClose: () => void
  onSave: (templateData: { name: string; description?: string }) => Promise<void>
}

export function SaveTemplatePopup({
  isOpen,
  templateName,
  onClose,
  onSave
}: SaveTemplatePopupProps) {
  const [name, setName] = useState(templateName)
  const [description, setDescription] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  if (!isOpen) return null

  const handleSave = async () => {
    if (!name.trim()) return

    setIsSaving(true)
    try {
      await onSave({ name: name.trim(), description: description.trim() })
      setSaved(true)
      
      // Auto close after showing success
      setTimeout(() => {
        onClose()
        setSaved(false)
        setIsSaving(false)
      }, 1500)
    } catch (error) {
      console.error('Failed to save template:', error)
      setIsSaving(false)
    }
  }

  const handleClose = () => {
    if (!isSaving) {
      onClose()
      setSaved(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900">
            Save Template
          </h3>
          {!isSaving && (
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          {saved ? (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <CheckCircle className="w-16 h-16 text-green-500" />
              </div>
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-2">
                  Template Saved!
                </h4>
                <p className="text-gray-600">
                  Your template has been successfully created and saved.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Template Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter template name"
                  disabled={isSaving}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter template description..."
                  rows={3}
                  disabled={isSaving}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 resize-none"
                />
              </div>

              {isSaving && (
                <div className="text-center space-y-2">
                  <Loader2 className="w-6 h-6 mx-auto animate-spin text-blue-600" />
                  <p className="text-sm text-gray-600">
                    Saving template...
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {!saved && (
          <div className="flex justify-end space-x-3 p-6 border-t bg-gray-50">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isSaving}
              className="px-4 py-2"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!name.trim() || isSaving}
              className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Template'
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
