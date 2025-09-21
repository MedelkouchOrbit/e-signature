'use client'

import React from 'react'
import { CreateTemplateFormData, SigningMode, Signer } from './types'

interface TemplateSettingsProps {
  templateData: CreateTemplateFormData
  onTemplateDataChange: (updates: Partial<CreateTemplateFormData>) => void
  signingMode: SigningMode
  onSigningModeChange: (mode: SigningMode) => void
  selectedSigners: Signer[]
  sessionToken: string
  onNext: () => void
  onBack: () => void
}

const TemplateSettings: React.FC<TemplateSettingsProps> = ({
  templateData,
  onTemplateDataChange,
  signingMode,
  onSigningModeChange,
  selectedSigners,
  onNext,
  onBack
}) => {
  const canProceed = templateData.name.trim() !== '' && 
    (signingMode === 'sign_yourself' || selectedSigners.length > 0)

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Template Settings</h1>
        <p className="text-gray-600">Configure your template details and signing options</p>
      </div>

      <div className="bg-white rounded-lg border p-6 space-y-6">
        {/* Template Name */}
        <div>
          <label htmlFor="templateName" className="block text-sm font-medium text-gray-700 mb-2">
            Template Name *
          </label>
          <input
            type="text"
            id="templateName"
            value={templateData.name}
            onChange={(e) => onTemplateDataChange({ name: e.target.value })}
            placeholder="Enter template name"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>

        {/* Template Description */}
        <div>
          <label htmlFor="templateDescription" className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            id="templateDescription"
            value={templateData.description}
            onChange={(e) => onTemplateDataChange({ description: e.target.value })}
            placeholder="Enter template description (optional)"
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
          />
        </div>

        {/* Signing Mode Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Signing Mode *
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
              onClick={() => onSigningModeChange('add_signers')}
              className={`cursor-pointer rounded-lg border-2 p-4 transition-all ${
                signingMode === 'add_signers'
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                  signingMode === 'add_signers' ? 'border-green-500' : 'border-gray-300'
                }`}>
                  {signingMode === 'add_signers' && (
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                  )}
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Add Signers</h3>
                  <p className="text-sm text-gray-500">Send to others for signing</p>
                </div>
              </div>
            </div>

            <div
              onClick={() => onSigningModeChange('sign_yourself')}
              className={`cursor-pointer rounded-lg border-2 p-4 transition-all ${
                signingMode === 'sign_yourself'
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                  signingMode === 'sign_yourself' ? 'border-green-500' : 'border-gray-300'
                }`}>
                  {signingMode === 'sign_yourself' && (
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                  )}
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Sign Yourself</h3>
                  <p className="text-sm text-gray-500">Sign the document yourself</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Advanced Settings */}
        <div className="border-t pt-6 space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Advanced Settings</h3>
          
          <div className="space-y-4">
            {/* Send in Order */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="sendInOrder"
                checked={templateData.sendInOrder}
                onChange={(e) => onTemplateDataChange({ sendInOrder: e.target.checked })}
                className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
              />
              <label htmlFor="sendInOrder" className="ml-3 text-sm text-gray-700">
                Send documents in order (signers must sign sequentially)
              </label>
            </div>

            {/* OTP Enabled */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="otpEnabled"
                checked={templateData.otpEnabled}
                onChange={(e) => onTemplateDataChange({ otpEnabled: e.target.checked })}
                className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
              />
              <label htmlFor="otpEnabled" className="ml-3 text-sm text-gray-700">
                Enable OTP verification for signing
              </label>
            </div>
          </div>
        </div>

        {/* Validation Messages */}
        {!canProceed && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="text-sm text-yellow-700">
              <p className="font-medium">Please complete the following:</p>
              <ul className="mt-2 list-disc list-inside space-y-1">
                {!templateData.name.trim() && <li>Enter a template name</li>}
                {signingMode === 'add_signers' && selectedSigners.length === 0 && (
                  <li>Add at least one signer</li>
                )}
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
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
          Continue
        </button>
      </div>
    </div>
  )
}

export default TemplateSettings