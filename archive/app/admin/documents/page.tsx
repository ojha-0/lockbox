'use client'

import { useEffect, useState } from 'react'
import { apiClient } from '@/lib/api'
import { CitizenDocument } from '@/lib/types/api'
import { Card } from '@/components/ui/card'
import { CheckCircle2, XCircle, FileText, User, Clock3, RefreshCw } from 'lucide-react'

type AdminStatusFilter = 'ALL' | 'PENDING' | 'VERIFIED' | 'REJECTED'

const statusConfig: Record<Exclude<AdminStatusFilter, 'ALL'>, string> = {
  PENDING: 'bg-amber-100 text-amber-900 border-amber-200',
  VERIFIED: 'bg-green-100 text-green-900 border-green-200',
  REJECTED: 'bg-red-100 text-red-900 border-red-200',
}

export default function AdminDocumentsPage() {
  const [documents, setDocuments] = useState<CitizenDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<AdminStatusFilter>('PENDING')

  const loadQueue = async (status: AdminStatusFilter = statusFilter) => {
    setLoading(true)
    setError(null)
    const response = await apiClient.get<CitizenDocument[]>(`/admin/documents?status=${status}`)
    if (!response.success) {
      setError(response.error || 'Failed to load document queue')
      setLoading(false)
      return
    }
    setDocuments(response.data || [])
    setLoading(false)
  }

  useEffect(() => {
    loadQueue(statusFilter)
  }, [statusFilter])

  const reviewDocument = async (id: string, decision: 'APPROVE' | 'REJECT') => {
    const response = await apiClient.patch(`/admin/documents/${id}/review`, {
      decision,
      review_notes: decision === 'REJECT' ? 'Rejected by admin review' : 'Approved by admin review',
    })

    if (response.success) {
      await loadQueue(statusFilter)
    } else {
      setError(response.error || 'Failed to update document review')
    }
  }

  if (loading) {
    return <div className="py-12 text-center text-muted-foreground">Loading document queue...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
        <h1 className="text-3xl font-light">Pending Document Approvals</h1>
          <p className="text-muted-foreground mt-1">See who uploaded each document and review every request.</p>
        </div>
        <button
          onClick={() => loadQueue(statusFilter)}
          className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-border hover:bg-muted"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {(['PENDING', 'VERIFIED', 'REJECTED', 'ALL'] as AdminStatusFilter[]).map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-3 py-1.5 rounded text-sm border ${statusFilter === status ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}
          >
            {status}
          </button>
        ))}
      </div>

      {error && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded p-3">{error}</div>}

      {documents.length === 0 && (
        <Card className="p-8 text-center border border-border/40">
          <Clock3 className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="font-medium">No documents found</p>
          <p className="text-sm text-muted-foreground">No records match the selected filter.</p>
        </Card>
      )}

      <div className="space-y-4">
        {documents.map((doc) => (
          <Card key={doc.id} className="p-5 border border-border/40">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <p className="font-medium flex items-center gap-2">
                  <FileText className="h-4 w-4 text-slate-600" />
                  {doc.document_type.replace(/_/g, ' ')}
                </p>
                <p className="text-sm text-muted-foreground">{doc.file_name}</p>
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <User className="h-4 w-4" />
                  {doc.full_name || 'Citizen'} ({doc.national_id || 'N/A'})
                </p>
                {!!doc.citizen_email && <p className="text-xs text-muted-foreground">{doc.citizen_email}</p>}
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs px-2 py-1 rounded border ${statusConfig[(doc.upload_status || 'PENDING') as keyof typeof statusConfig] || statusConfig.PENDING}`}
                  >
                    {doc.upload_status}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Uploaded {new Date(doc.uploaded_at).toLocaleString()}
                  </span>
                </div>
              </div>

              {doc.upload_status === 'PENDING' ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => reviewDocument(doc.id, 'APPROVE')}
                    className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 flex items-center gap-2"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Approve
                  </button>
                  <button
                    onClick={() => reviewDocument(doc.id, 'REJECT')}
                    className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 flex items-center gap-2"
                  >
                    <XCircle className="h-4 w-4" />
                    Reject
                  </button>
                </div>
              ) : (
                <span className="text-xs text-muted-foreground">Already reviewed</span>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
