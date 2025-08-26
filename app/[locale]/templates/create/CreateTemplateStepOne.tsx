'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { AlertCircle, Upload, FileText, Settings } from 'lucide-react'

interface CreateTemplateFormData {
  name: string
  description: string
  file: File | null
  sendInOrder: boolean
  otpEnabled: boolean
}

interface CreateTemplateStepOneProps {
  onNext: (data: CreateTemplateFormData) => void
  onCancel: () => void
}

export default function CreateTemplateStepOne({ onNext, onCancel }: CreateTemplateStepOneProps) {
  const t = useTranslations('templates')
  
  const [formData, setFormData] = useState<CreateTemplateFormData>({
    name: '',
    description: '',
    file: null,
    sendInOrder: false,
    otpEnabled: false,
  })
  
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [dragActive, setDragActive] = useState(false)

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.name.trim()) {
      newErrors.name = t('errors.nameRequired')
    } else if (formData.name.length > 100) {
      newErrors.name = t('errors.nameTooLong')
    }
    
    if (!formData.file) {
      newErrors.file = t('errors.fileRequired')
    } else {
      const allowedTypes = ['application/pdf']
      if (!allowedTypes.includes(formData.file.type)) {
        newErrors.file = t('errors.invalidFileType')
      } else if (formData.file.size > 25 * 1024 * 1024) { // 25MB limit
        newErrors.file = t('errors.fileTooLarge')
      }
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleFileSelect = (file: File) => {
    setFormData(prev => ({ ...prev, file }))
    setErrors(prev => ({ ...prev, file: '' }))
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setIsLoading(true)
    try {
      // Proceed to next step with form data
      onNext(formData)
    } catch (error) {
      console.error('Error:', error)
      setErrors({ submit: t('errors.uploadFailed') })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Progress indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2 text-teal-600">
            <div className="w-8 h-8 bg-teal-600 text-white rounded-full flex items-center justify-center font-medium">
              1
            </div>
            <span className="font-medium">{t('createSteps.upload')}</span>
          </div>
          <div className="flex items-center space-x-2 text-gray-400">
            <div className="w-8 h-8 bg-gray-200 text-gray-500 rounded-full flex items-center justify-center font-medium">
              2
            </div>
            <span className="font-medium">{t('createSteps.addSigners')}</span>
          </div>
          <div className="flex items-center space-x-2 text-gray-400">
            <div className="w-8 h-8 bg-gray-200 text-gray-500 rounded-full flex items-center justify-center font-medium">
              3
            </div>
            <span className="font-medium">{t('createSteps.placeFields')}</span>
          </div>
          <div className="flex items-center space-x-2 text-gray-400">
            <div className="w-8 h-8 bg-gray-200 text-gray-500 rounded-full flex items-center justify-center font-medium">
              4
            </div>
            <span className="font-medium">{t('createSteps.review')}</span>
          </div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div className="bg-teal-600 h-2 rounded-full" style={{ width: '25%' }}></div>
        </div>
      </div>

      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-teal-100 rounded-lg">
              <Upload className="h-6 w-6 text-teal-600" />
            </div>
            <div>
              <CardTitle className="text-xl font-semibold text-gray-900">
                {t('create.uploadDocument')}
              </CardTitle>
              <CardDescription className="text-gray-600">
                {t('create.uploadDocumentDescription')}
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-4">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Template Name */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                {t('create.templateName')} <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder={t('create.templateNamePlaceholder')}
                className={`${errors.name ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-teal-500'}`}
                disabled={isLoading}
              />
              {errors.name && (
                <p className="text-sm text-red-600 flex items-center space-x-1">
                  <AlertCircle className="h-4 w-4" />
                  <span>{errors.name}</span>
                </p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium text-gray-700">
                {t('create.description')}
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder={t('create.descriptionPlaceholder')}
                rows={3}
                className="border-gray-300 focus:border-teal-500"
                disabled={isLoading}
              />
            </div>

            {/* File Upload */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">
                {t('create.document')} <span className="text-red-500">*</span>
              </Label>
              <div
                className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragActive
                    ? 'border-teal-500 bg-teal-50'
                    : errors.file
                    ? 'border-red-300 bg-red-50'
                    : 'border-gray-300 hover:border-teal-400 hover:bg-teal-50'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={isLoading}
                />
                
                {formData.file ? (
                  <div className="flex items-center justify-center space-x-3">
                    <FileText className="h-12 w-12 text-teal-600" />
                    <div className="text-left">
                      <p className="font-medium text-gray-900">{formData.file.name}</p>
                      <p className="text-sm text-gray-500">
                        {(formData.file.size / 1024 / 1024).toFixed(1)} MB
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                      <Upload className="h-8 w-8 text-gray-400" />
                    </div>
                    <div>
                      <p className="text-lg font-medium text-gray-700">
                        {t('create.dragDropFile')}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        {t('create.or')} <span className="text-teal-600 font-medium">{t('create.browseFiles')}</span>
                      </p>
                      <p className="text-xs text-gray-400 mt-2">
                        {t('create.supportedFormats')}
                      </p>
                    </div>
                  </div>
                )}
              </div>
              {errors.file && (
                <p className="text-sm text-red-600 flex items-center space-x-1">
                  <AlertCircle className="h-4 w-4" />
                  <span>{errors.file}</span>
                </p>
              )}
            </div>

            {/* Template Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <span>{t('create.templateSettings')}</span>
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="sendInOrder"
                    checked={formData.sendInOrder}
                    onCheckedChange={(checked) => 
                      setFormData(prev => ({ ...prev, sendInOrder: !!checked }))
                    }
                    disabled={isLoading}
                  />
                  <div className="flex-1">
                    <Label htmlFor="sendInOrder" className="text-sm font-medium text-gray-700">
                      {t('create.sendInOrder')}
                    </Label>
                    <p className="text-xs text-gray-500">{t('create.sendInOrderDescription')}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="otpEnabled"
                    checked={formData.otpEnabled}
                    onCheckedChange={(checked) => 
                      setFormData(prev => ({ ...prev, otpEnabled: !!checked }))
                    }
                    disabled={isLoading}
                  />
                  <div className="flex-1">
                    <Label htmlFor="otpEnabled" className="text-sm font-medium text-gray-700">
                      {t('create.enableOtp')}
                    </Label>
                    <p className="text-xs text-gray-500">{t('create.enableOtpDescription')}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Error */}
            {errors.submit && (
              <div className="rounded-md bg-red-50 p-4 border border-red-200">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-red-400" />
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{errors.submit}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-between pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isLoading}
                className="px-6"
              >
                {t('actions.cancel')}
              </Button>
              
              <Button
                type="submit"
                disabled={isLoading || !formData.name.trim() || !formData.file}
                className="px-8 bg-teal-600 hover:bg-teal-700"
              >
                {isLoading ? t('actions.uploading') : t('actions.next')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
