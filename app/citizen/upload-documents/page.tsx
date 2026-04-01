'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { apiClient } from '@/lib/api'
import { motion } from 'framer-motion'
import { Upload, FileText, CheckCircle2, AlertCircle } from 'lucide-react'

const documentTypes = [
  { id: 'national_id', label: 'National Identity Card', required: true },
  { id: 'citizenship', label: 'Citizenship Certificate', required: true },
  { id: 'passport', label: 'Passport', required: false },
  { id: 'driving_license', label: 'Driving License', required: false },
  { id: 'insurance_card', label: 'Insurance / Health Card', required: false },
  { id: 'medical_report', label: 'Medical Report (Blood Group)', required: false },
  { id: 'proof_of_residence', label: 'Proof of Residence', required: false },
]

export default function UploadDocumentsPage() {
  const [uploadedDocuments, setUploadedDocuments] = useState<{[key: string]: File | null}>({})
  const [submittedTypes, setSubmittedTypes] = useState<string[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFileSelect = (docId: string, file: File | null) => {
    setUploadedDocuments(prev => ({
      ...prev,
      [docId]: file
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validate required documents
    const allRequired = documentTypes
      .filter(doc => doc.required)
      .every(doc => uploadedDocuments[doc.id])

    if (!allRequired) {
      setError('Please upload all required documents before submitting.')
      return
    }

    setIsUploading(true)

    try {
      const uploads = Object.entries(uploadedDocuments).filter(([, file]) => Boolean(file))
      const submittedNow: string[] = []

      for (const [document_type, file] of uploads) {
        if (!file) continue

        const response = await apiClient.post('/citizen/documents', {
          document_type,
          file_name: file.name,
          file_type: file.type || 'application/octet-stream',
          file_size: file.size,
          storage_url: null,
        })

        if (!response.success) {
          throw new Error(response.error || `Failed to upload ${file.name}`)
        }

        submittedNow.push(document_type)
      }

      setUploadSuccess(true)
      setSubmittedTypes((prev) => Array.from(new Set([...prev, ...submittedNow])))
      setUploadedDocuments({})

      setTimeout(() => {
        setUploadSuccess(false)
      }, 2000)
    } catch (uploadError: any) {
      setError(uploadError.message || 'Upload failed. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="space-y-8 max-w-2xl">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-4xl font-light font-nunito mb-3">Upload Documents</h1>
        <p className="text-muted-foreground">
          Submit your identity documents for verification. Required documents are marked with a <span className="text-accent font-medium">*</span>
        </p>
      </motion.div>

      {uploadSuccess && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3"
        >
          <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-green-900">Documents uploaded successfully</p>
            <p className="text-sm text-green-800">Your documents are pending admin approval before they can be shared</p>
          </div>
        </motion.div>
      )}

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3"
        >
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-red-900">Upload failed</p>
            <p className="text-sm text-red-800">{error}</p>
          </div>
        </motion.div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {documentTypes.map((docType, idx) => (
          <motion.div
            key={docType.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1, duration: 0.5 }}
          >
            <Card className="p-6 border border-border/40 hover:border-accent/40 transition-colors">
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-1">
                  <label className="block text-sm font-medium text-foreground">
                    {docType.label}
                  </label>
                  {docType.required && (
                    <span className="text-accent font-bold text-xs">*</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {docType.required ? 'Required for verification' : 'Optional'}
                </p>
              </div>

              <div className="relative">
                <input
                  type="file"
                  id={docType.id}
                  accept="image/*,.pdf"
                  onChange={(e) => handleFileSelect(docType.id, e.target.files?.[0] || null)}
                  disabled={isUploading}
                  className="hidden"
                />
                <label
                  htmlFor={docType.id}
                  className="block border-2 border-dashed border-border/50 rounded-lg p-8 text-center cursor-pointer hover:border-accent/50 hover:bg-accent/5 transition-all"
                >
                  <div className="space-y-3">
                    {uploadedDocuments[docType.id] ? (
                      <>
                        <FileText className="h-10 w-10 text-slate-600 mx-auto" />
                        <div>
                          <p className="font-medium text-foreground text-sm">
                            {uploadedDocuments[docType.id]?.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {(uploadedDocuments[docType.id]!.size / 1024 / 1024).toFixed(2)} MB • Selected (not submitted)
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
                        <Upload className="h-10 w-10 text-muted-foreground mx-auto" />
                        <div>
                          <p className="font-medium text-foreground text-sm">
                            Click to upload or drag and drop
                          </p>
                          <p className="text-xs text-muted-foreground">
                            PDF, JPG, PNG up to 10MB
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </label>

                {submittedTypes.includes(docType.id) && (
                  <p className="mt-2 text-xs text-green-700 flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Submitted successfully. Waiting for admin review.
                  </p>
                )}
              </div>
            </Card>
          </motion.div>
        ))}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="flex gap-4"
        >
          <button
            type="submit"
            disabled={isUploading || !documentTypes.filter(d => d.required).every(d => uploadedDocuments[d.id])}
            className="flex-1 px-6 py-3 bg-accent text-accent-foreground font-medium rounded-lg hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isUploading ? 'Uploading...' : 'Submit Documents'}
          </button>
        </motion.div>
      </form>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3"
      >
        <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-blue-900 text-sm">Document Requirements</p>
          <ul className="text-xs text-blue-800 mt-2 space-y-1 list-disc list-inside">
            <li>Documents must be clear and legible</li>
            <li>All pages must be visible (no folded corners)</li>
            <li>Admin approval is required before any verifier can access your data</li>
            <li>Verification typically takes 24-48 hours</li>
            <li>You'll receive an email when verification is complete</li>
          </ul>
        </div>
      </motion.div>
    </div>
  )
}
