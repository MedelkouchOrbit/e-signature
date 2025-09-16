"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Upload, FileText, CheckCircle, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { useDocumentsStore } from "@/app/lib/documents-store"
import { useToast } from "@/hooks/use-toast"

interface DocumentUploadProps {
  onUploadComplete?: (fileUrl: string) => void
  onCancel?: () => void
  className?: string
}

export function DocumentUpload({ 
  onUploadComplete, 
  onCancel, 
  className 
}: DocumentUploadProps) {
  const t = useTranslations("documents")
  const { toast } = useToast()
  
  const {
    isUploading,
    uploadProgress,
    uploadDocument,
    error
  } = useDocumentsStore()

  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return

    const file = acceptedFiles[0]
    
    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]
    
    if (!allowedTypes.includes(file.type)) {
      setUploadError('Only PDF, DOC, DOCX, and image files are allowed')
      toast({
        title: t("upload_error"),
        description: "Only PDF, DOC, DOCX, and image files are allowed",
        variant: "destructive",
      })
      return
    }

    // Validate file size (100MB max based on backend)
    const maxSize = 100 * 1024 * 1024 // 100MB
    if (file.size > maxSize) {
      setUploadError('File size must be less than 100MB')
      toast({
        title: t("upload_error"),
        description: "File size must be less than 100MB",
        variant: "destructive",
      })
      return
    }

    try {
      setUploadError(null)
      
      const document = await uploadDocument({
        name: file.name,
        file: file,
        signers: [],
        message: `Document uploaded on ${new Date().toLocaleDateString()}`,
      })
      setUploadedFileUrl(document.url || '')
      
      toast({
        title: t("upload_success"),
        description: `${file.name} has been uploaded successfully`,
      })
      
      onUploadComplete?.(document.url || '')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed'
      setUploadError(errorMessage)
      toast({
        title: t("upload_error"),
        description: errorMessage,
        variant: "destructive",
      })
    }
  }, [uploadDocument, onUploadComplete, t, toast])

  const {
    getRootProps,
    getInputProps,
    isDragActive,
    isDragAccept,
    isDragReject
  } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    multiple: false,
    disabled: isUploading || !!uploadedFileUrl
  })

  const handleCancel = () => {
    setUploadedFileUrl(null)
    setUploadError(null)
    onCancel?.()
  }

  return (
    <Card className={cn("w-full max-w-2xl mx-auto", className)}>
      <CardContent className="p-6">
        {!uploadedFileUrl ? (
          <div className="space-y-4">
            <div
              {...getRootProps()}
              className={cn(
                "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
                "hover:bg-gray-50 dark:hover:bg-gray-800",
                isDragActive && "border-blue-500 bg-blue-50 dark:bg-blue-900/20",
                isDragAccept && "border-green-500 bg-green-50 dark:bg-green-900/20",
                isDragReject && "border-red-500 bg-red-50 dark:bg-red-900/20",
                (isUploading || uploadedFileUrl) && "cursor-not-allowed opacity-50"
              )}
            >
              <input {...getInputProps()} />
              
              <div className="flex flex-col items-center space-y-4">
                <div className="p-4 rounded-full bg-gray-100 dark:bg-gray-800">
                  <Upload className="h-8 w-8 text-gray-600 dark:text-gray-400" />
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {t("uploadDocument")}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {isDragActive ? (
                      isDragAccept ? (
                        "Drop your document here"
                      ) : (
                        "This file type is not supported"
                      )
                    ) : (
                      t("uploadDescription")
                    )}
                  </p>
                </div>
                
                <Button type="button" variant="outline" disabled={isUploading}>
                  {isUploading ? "Uploading..." : t("selectFile")}
                </Button>
                
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Supported: PDF, DOC, DOCX, JPG, PNG (max 100MB)
                </p>
              </div>
            </div>

            {isUploading && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Uploading...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="w-full" />
              </div>
            )}

            {(uploadError || error) && (
              <div className="flex items-center space-x-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                <span className="text-sm text-red-700 dark:text-red-300">
                  {uploadError || error}
                </span>
              </div>
            )}

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={handleCancel}>
                {t("cancel")}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-center p-8 border-2 border-dashed border-green-300 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="flex flex-col items-center space-y-4">
                <div className="p-4 rounded-full bg-green-100 dark:bg-green-800">
                  <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
                
                <div className="text-center space-y-2">
                  <h3 className="text-lg font-semibold text-green-900 dark:text-green-100">
                    Upload Complete
                  </h3>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    Your document has been uploaded successfully
                  </p>
                </div>
                
                <div className="flex items-center space-x-2 p-3 bg-white dark:bg-gray-800 rounded-lg border">
                  <FileText className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                  <span className="text-sm font-medium">Document Ready</span>
                </div>
              </div>
            </div>

            <div className="flex justify-between space-x-2">
              <Button variant="outline" onClick={handleCancel}>
                Upload Another
              </Button>
              <Button onClick={() => onUploadComplete?.(uploadedFileUrl)}>
                {t("continue")}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
