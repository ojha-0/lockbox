'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { motion } from 'framer-motion'
import { Download, Eye, Trash2, Calendar, FileText, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { apiClient } from '@/lib/api'
import { CitizenDocument } from '@/lib/types/api'

const statusConfig = {
  VERIFIED: { color: 'bg-green-100 text-green-900 border border-green-200', label: 'Verified' },
  PENDING: { color: 'bg-yellow-100 text-yellow-900 border border-yellow-200', label: 'Pending Review' },
  REJECTED: { color: 'bg-red-100 text-red-900 border border-red-200', label: 'Rejected' },
}

export default function MyDocumentsPage() {
  const [documents, setDocuments] = useState<CitizenDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadDocuments = async () => {
    setLoading(true)
    setError(null)

    const response = await apiClient.get<CitizenDocument[]>('/citizen/documents')
    if (!response.success) {
      setError(response.error || 'Failed to load documents')
      setLoading(false)
      return
    }

    setDocuments(response.data || [])
    setLoading(false)
  }

  useEffect(() => {
    loadDocuments()
  }, [])

  const verifiedDocs = useMemo(() => documents.filter((d) => d.upload_status === 'VERIFIED'), [documents])
  const pendingDocs = useMemo(() => documents.filter((d) => d.upload_status === 'PENDING'), [documents])
  const rejectedDocs = useMemo(() => documents.filter((d) => d.upload_status === 'REJECTED'), [documents])

  const formatSize = (size: number) => `${(size / 1024 / 1024).toFixed(2)} MB`
  const formatLabel = (type: string) => type.replace(/_/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase())

  const handleDelete = async (id: string) => {
    const response = await apiClient.delete(`/citizen/documents/${id}`)
    if (response.success) {
      setDocuments((prev) => prev.filter((doc) => doc.id !== id))
    }
  }

  const handleView = (document: CitizenDocument) => {
    const details = [
      `Document: ${document.file_name}`,
      `Type: ${formatLabel(document.document_type)}`,
      `Status: ${document.upload_status}`,
      `Uploaded: ${new Date(document.uploaded_at).toLocaleString()}`,
      `Size: ${formatSize(document.file_size)}`,
    ].join('\n')

    window.alert(details)
  }

  const handleDownload = (document: CitizenDocument) => {
    const content = JSON.stringify(document, null, 2)
    const blob = new Blob([content], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = window.document.createElement('a')
    a.href = url
    a.download = `${document.document_type}-${document.id}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-4xl font-light font-nunito mb-3">My Documents</h1>
        <p className="text-muted-foreground">
          Manage and review all uploaded identity documents
        </p>
      </motion.div>

      {error && (
        <div className="p-4 rounded-lg border border-red-200 bg-red-50 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-900">Unable to load documents</p>
            <p className="text-sm text-red-800">{error}</p>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.5 }}
        className="grid md:grid-cols-3 gap-4"
      >
        {[
          { label: 'Verified', value: verifiedDocs.length, color: 'bg-green-50 border-green-200' },
          { label: 'Pending', value: pendingDocs.length, color: 'bg-yellow-50 border-yellow-200' },
          { label: 'Rejected', value: rejectedDocs.length, color: 'bg-red-50 border-red-200' },
        ].map((stat, idx) => (
          <Card key={stat.label} className={`p-6 border ${stat.color}`}>
            <p className="text-xs text-muted-foreground mb-2">{stat.label}</p>
            <p className="text-3xl font-light font-nunito">{stat.value}</p>
          </Card>
        ))}
      </motion.div>

      {/* Verified Documents */}
      {verifiedDocs.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.5 }}
          className="space-y-4"
        >
          <h2 className="text-lg font-medium font-nunito">Verified Documents</h2>
          {verifiedDocs.map((doc, idx) => (
            <Card key={doc.id} className="p-6 border border-border/40 hover:border-accent/40 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 flex-1">
                  <FileText className="h-10 w-10 text-green-600 flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="font-medium text-foreground mb-1">{formatLabel(doc.document_type)}</h3>
                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Verified {doc.verified_at ? new Date(doc.verified_at).toLocaleDateString() : 'Pending'}
                      </span>
                      <span>•</span>
                      <span>{formatSize(doc.file_size)}</span>
                    </div>
                  </div>
                </div>
                <Badge className={statusConfig.VERIFIED.color}>
                  {statusConfig.VERIFIED.label}
                </Badge>
              </div>

              <div className="mt-4 flex gap-2">
                <button onClick={() => handleView(doc)} className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent/5 rounded-lg transition-colors">
                  <Eye className="h-4 w-4" />
                  View
                </button>
                <button onClick={() => handleDownload(doc)} className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent/5 rounded-lg transition-colors">
                  <Download className="h-4 w-4" />
                  Download
                </button>
                <button onClick={() => handleDelete(doc.id)} className="flex items-center gap-2 px-3 py-2 text-sm text-red-700 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors">
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              </div>
            </Card>
          ))}
        </motion.div>
      )}

      {/* Pending Documents */}
      {pendingDocs.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="space-y-4"
        >
          <h2 className="text-lg font-medium font-nunito">Under Review</h2>
          {pendingDocs.map((doc) => (
            <Card key={doc.id} className="p-6 border border-yellow-200 bg-yellow-50/50">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 flex-1">
                  <FileText className="h-10 w-10 text-yellow-600 flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="font-medium text-foreground mb-1">{formatLabel(doc.document_type)}</h3>
                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Uploaded {new Date(doc.uploaded_at).toLocaleDateString()}
                      </span>
                      <span>•</span>
                      <span>{formatSize(doc.file_size)}</span>
                    </div>
                  </div>
                </div>
                <Badge className={statusConfig.PENDING.color}>
                  {statusConfig.PENDING.label}
                </Badge>
              </div>

              <div className="mt-4 p-3 bg-yellow-100/50 border border-yellow-200 rounded text-xs text-yellow-900 rounded">
                Your document is being reviewed. Verification typically takes 24-48 hours.
              </div>
            </Card>
          ))}
        </motion.div>
      )}

      {/* Empty State */}
      {!loading && documents.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5 }}
          className="text-center py-16"
        >
          <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium text-foreground mb-2">No documents uploaded</h3>
          <p className="text-muted-foreground text-sm mb-6">
            Start by uploading your identity documents to complete your profile
          </p>
          <Link href="/citizen/upload-documents">
            <button className="px-6 py-2 bg-accent text-accent-foreground font-medium rounded-lg hover:bg-accent/90 transition-colors">
              Upload Documents
            </button>
          </Link>
        </motion.div>
      )}

      {/* Upload More Button */}
      {!loading && documents.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="flex justify-center"
        >
          <Link href="/citizen/upload-documents">
            <button className="px-8 py-3 border border-border/50 text-foreground hover:border-accent/50 hover:bg-accent/5 transition-all rounded-lg font-medium">
              Upload More Documents
            </button>
          </Link>
        </motion.div>
      )}
    </div>
  )
}
