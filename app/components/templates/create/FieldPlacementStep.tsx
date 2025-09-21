'use client'

import React from 'react'
import { FieldPlacement, Signer } from './types'
import PDFViewer from './PDFViewer'
import FieldPlacementPanel from './FieldPlacementPanel'

interface FieldPlacementStepProps {
  templateData: { fileUrl: string | null }
  fieldPlacements: FieldPlacement[]
  selectedSigners: Signer[]
  selectedFieldType: string | null
  selectedField: FieldPlacement | null
  onFieldPlaced: (placement: Partial<FieldPlacement>) => void
  onFieldSelected: (field: FieldPlacement) => void
  onFieldTypeSelect: (type: string | null) => void
  onFieldRemove: (fieldId: string) => void
  onFieldUpdate: (fieldId: string, updates: Partial<FieldPlacement>) => void
  onNext: () => void
  onBack: () => void
}

const FieldPlacementStep: React.FC<FieldPlacementStepProps> = ({
  templateData,
  fieldPlacements,
  selectedSigners,
  selectedFieldType,
  selectedField,
  onFieldPlaced,
  onFieldSelected,
  onFieldTypeSelect,
  onFieldRemove,
  onFieldUpdate,
  onNext,
  onBack
}) => {
  const canProceed = fieldPlacements.length > 0

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Place Form Fields</h1>
        <p className="text-gray-600">Add signature fields and form elements to your document</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Panel - Field Tools */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg border p-4 h-fit">
            <FieldPlacementPanel
              fieldPlacements={fieldPlacements}
              selectedSigners={selectedSigners}
              selectedFieldType={selectedFieldType}
              onFieldTypeSelect={onFieldTypeSelect}
              onFieldRemove={onFieldRemove}
              onFieldUpdate={onFieldUpdate}
              selectedField={selectedField}
            />
          </div>
        </div>

        {/* Main Content - PDF Viewer */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-lg border">
            <PDFViewer
              fileUrl={templateData.fileUrl}
              fieldPlacements={fieldPlacements}
              selectedFieldType={selectedFieldType}
              onFieldPlaced={onFieldPlaced}
              onFieldSelected={onFieldSelected}
              selectedField={selectedField}
            />
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="text-sm text-blue-700">
          <p className="font-medium mb-2">How to place fields:</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Select a field type from the left panel</li>
            <li>Click on the document where you want to place the field</li>
            <li>Assign the field to a signer (if applicable)</li>
            <li>Repeat for all required fields</li>
          </ol>
        </div>
      </div>

      {/* Validation Messages */}
      {!canProceed && (
        <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="text-sm text-yellow-700">
            <p className="font-medium">Please add at least one field to continue.</p>
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between mt-8">
        <button
          onClick={onBack}
          className="px-6 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
        >
          Back
        </button>
        <button
          onClick={onNext}
          disabled={!canProceed}
          className="px-8 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          Continue to Review
        </button>
      </div>
    </div>
  )
}

export default FieldPlacementStep