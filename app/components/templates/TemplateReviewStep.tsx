"use client"

import { TemplatePDFViewerWrapper } from './TemplatePDFViewerWrapper'
import { Button } from '@/components/ui/button'
import { FileText } from 'lucide-react'

interface FieldPlacement {
  id: string
  type: string
  x: number
  y: number
  width: number
  height: number
  page: number
  required: boolean
  placeholder?: string
}

interface TemplateReviewStepProps {
  fileUrl: string
  templateName: string
  fieldPlacements: FieldPlacement[]
  onCancel: () => void
  onSaveTemplate: () => void
  onBack: () => void
}

export function TemplateReviewStep({
  fileUrl,
  templateName,
  fieldPlacements,
  onCancel,
  onSaveTemplate,
  onBack
}: TemplateReviewStepProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Review & Finish</h2>
      
      <div className="bg-white border rounded-lg">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-medium text-gray-900">{templateName || 'Document.pdf'}</h3>
          <button 
            onClick={onCancel}
            className="text-sm text-red-500 hover:underline"
          >
            Cancel
          </button>
        </div>
        
        <div className="p-4">
          {fileUrl ? (
            <div className="border rounded-lg overflow-hidden" style={{ height: '600px' }}>
              <TemplatePDFViewerWrapper
                fileUrl={fileUrl}
                fieldPlacements={fieldPlacements}
                className="w-full h-full"
              />
            </div>
          ) : (
            <div className="p-8 border rounded-lg min-h-96 bg-gray-50">
              <div className="space-y-6 text-center text-gray-500">
                <FileText className="w-16 h-16 mx-auto" />
                <div>
                  <p className="mb-2 font-medium">Template Review</p>
                  <p className="mb-4 text-sm">Review your template before finalizing</p>
                  <div className="max-w-md mx-auto space-y-2 text-xs text-gray-400">
                    <p>Documentso Supporter Pledge</p>
                    <p>Our mission is to create an open signing infrastructure that empowers the world. We believe openness and cooperation are the way every business should be conducted.</p>
                  </div>
                </div>
                
                {fieldPlacements.length > 0 && (
                  <div className="flex items-center justify-center mt-8 space-x-12">
                    {fieldPlacements.slice(0, 2).map((field) => (
                      <div key={field.id} className="text-center">
                        <div className="flex items-center justify-center w-12 h-8 mx-auto mb-2 bg-gray-200 rounded">
                          <span className="text-xs">
                            {field.type === 'signature' ? '📝' : field.type === 'stamp' ? '🔖' : '📄'}
                          </span>
                        </div>
                        <span className="text-xs capitalize">{field.type}</span>
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="mt-6 text-xs text-gray-400">
                  <p>Timur Ercan & Lucas Smith</p>
                  <p>Co-Founders, Documentso</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={onBack}
          className="px-6 py-2"
        >
          ← Back
        </Button>
        
        <Button
          onClick={onSaveTemplate}
          className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white"
        >
          Send
        </Button>
      </div>
    </div>
  )
}
