'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import { Building2, Landmark, Pill, Smartphone, AlertCircle, Shield, CheckCircle2, XCircle, Hand, Loader2, FileWarning, type LucideIcon } from 'lucide-react'
import { staggerContainer, staggerItem } from '@/lib/motion'
import { Badge } from '@/components/ui/badge'
import { apiClient } from '@/lib/api'
import { AccessOverview, ConsentItem, CitizenDocument } from '@/lib/types/api'

const businessTypeLabel: Record<string, string> = {
  bank: 'Banking Services',
  pharmacy: 'Pharmacy and Health Retail',
  government: 'Government Services',
  age_verification: 'Age Verification Services',
  telecom: 'Telecom Providers',
}

export default function ConsentPage() {
  const [consents, setConsents] = useState<ConsentItem[]>([])
  const [accessOverview, setAccessOverview] = useState<AccessOverview | null>(null)
  const [documents, setDocuments] = useState<CitizenDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [pendingAction, setPendingAction] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const loadData = async () => {
    setLoading(true)
    setErrorMessage(null)

    const [consentRes, accessRes, docsRes] = await Promise.all([
      apiClient.get<ConsentItem[]>('/citizen/consents'),
      apiClient.get<AccessOverview>('/citizen/access-overview'),
      apiClient.get<CitizenDocument[]>('/citizen/documents'),
    ])

    if (!consentRes.success || !consentRes.data) {
      setErrorMessage(consentRes.error || 'Failed to load consent configuration')
      setLoading(false)
      return
    }

    setConsents(consentRes.data)
    if (accessRes.success && accessRes.data) {
      setAccessOverview(accessRes.data)
    }
    if (docsRes.success && docsRes.data) {
      setDocuments(docsRes.data)
    }

    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  const updateConsent = async (
    business_type: ConsentItem['business_type'],
    decision: 'GRANT' | 'REVOKE' | 'BLOCK'
  ) => {
    setPendingAction(`${business_type}:${decision}`)
    const response = await apiClient.patch('/citizen/consents', {
      business_type,
      decision,
    })

    if (!response.success) {
      setErrorMessage(response.error || 'Failed to update consent')
      setPendingAction(null)
      return
    }

    await loadData()
    setPendingAction(null)
  }

  const businessTypeIcons: Record<string, LucideIcon> = {
    bank: Landmark,
    pharmacy: Pill,
    government: Building2,
    age_verification: Shield,
    telecom: Smartphone,
  }

  const businessTypeConfig: Record<string, { gradient: string; iconBg: string; border: string }> = {
    bank: { gradient: 'from-blue-50/80', iconBg: 'bg-blue-100', border: 'border-blue-200/50' },
    pharmacy: { gradient: 'from-emerald-50/80', iconBg: 'bg-emerald-100', border: 'border-emerald-200/50' },
    government: { gradient: 'from-purple-50/80', iconBg: 'bg-purple-100', border: 'border-purple-200/50' },
    age_verification: { gradient: 'from-orange-50/80', iconBg: 'bg-orange-100', border: 'border-orange-200/50' },
    telecom: { gradient: 'from-cyan-50/80', iconBg: 'bg-cyan-100', border: 'border-cyan-200/50' },
  }

  const grantedCount = consents.filter((c) => c.status === 'GRANTED').length
  const blockedCount = consents.filter((c) => c.status === 'BLOCKED').length
  const approvedDocuments = useMemo(
    () => documents.filter((doc) => doc.upload_status === 'VERIFIED').length,
    [documents]
  )
  const pendingDocuments = useMemo(
    () => documents.filter((doc) => doc.upload_status === 'PENDING').length,
    [documents]
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 gap-3 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading consent configuration...
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col md:flex-row md:items-end md:justify-between gap-4"
      >
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
              <Shield className="h-6 w-6 text-accent" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-light font-nunito">Manage Consent</h1>
              <p className="text-muted-foreground">Grant, revoke, or block access by organization type</p>
            </div>
          </div>
        </div>
      </motion.div>

      {errorMessage && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {errorMessage}
        </div>
      )}

      {documents.length === 0 && (
        <div className="p-5 bg-gradient-to-r from-amber-50 to-transparent border border-amber-200 rounded-xl flex gap-4">
          <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
            <FileWarning className="h-5 w-5 text-amber-700" />
          </div>
          <div>
            <p className="text-sm font-semibold text-amber-900 mb-1">No documents submitted</p>
            <p className="text-sm text-amber-800">
              You cannot share any data until you upload documents and admin approves them.
            </p>
          </div>
        </div>
      )}

      {/* Stats Summary */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-3 gap-4"
      >
        {[
          { label: 'Organization Types', value: consents.length, icon: Building2, gradient: 'from-blue-500/10', iconBg: 'bg-blue-500/10', iconColor: 'text-blue-600' },
          { label: 'Granted', value: grantedCount, icon: CheckCircle2, gradient: 'from-green-500/10', iconBg: 'bg-green-500/10', iconColor: 'text-green-600' },
          { label: 'Blocked', value: blockedCount, icon: XCircle, gradient: 'from-red-500/10', iconBg: 'bg-red-500/10', iconColor: 'text-red-600' },
        ].map((stat, idx) => (
          <motion.div
            key={idx}
            variants={staggerItem}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className={`relative overflow-hidden bg-gradient-to-br ${stat.gradient} to-transparent border border-border/40 rounded-xl p-5 transition-all duration-300`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-3xl font-bold font-nunito text-foreground">{stat.value}</p>
                <p className="text-sm text-muted-foreground mt-1 font-medium">{stat.label}</p>
              </div>
              <div className={`w-10 h-10 rounded-lg ${stat.iconBg} flex items-center justify-center`}>
                <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Alert Info */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.5 }}
        className="p-5 bg-gradient-to-r from-blue-50/80 to-transparent border border-blue-200/50 rounded-xl flex gap-4"
      >
        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
          <AlertCircle className="h-5 w-5 text-blue-600" />
        </div>
        <div>
          <p className="text-sm font-semibold text-blue-900 mb-1">Access Enforcement</p>
          <p className="text-sm text-blue-800/80 leading-relaxed">
            Grant allows sharing, revoke removes permission, and block hard-denies access. Verification is also blocked when required approved document fields are missing.
          </p>
        </div>
      </motion.div>

      {/* Organizations List */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="space-y-4"
      >
        {consents.map((org) => {
          const Icon = businessTypeIcons[org.business_type] ?? Building2
          const config = businessTypeConfig[org.business_type] ?? { gradient: 'from-gray-50/80', iconBg: 'bg-gray-100', border: 'border-gray-200/50' }
          const overview = accessOverview?.items.find((item) => item.business_type === org.business_type)

          const statusClass =
            org.status === 'GRANTED'
              ? 'bg-green-100 text-green-700 border-green-200'
              : org.status === 'BLOCKED'
                ? 'bg-red-100 text-red-700 border-red-200'
                : 'bg-slate-100 text-slate-700 border-slate-200'

          return (
            <motion.div 
              key={org.business_type} 
              variants={staggerItem}
              whileHover={{ y: -2, transition: { duration: 0.2 } }}
            >
              <Card className={`relative bg-gradient-to-br ${config.gradient} to-white/50 border-2 ${config.border} p-6 transition-all duration-300 hover:shadow-lg overflow-hidden`}>
                <div className="relative space-y-5">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div className={`w-14 h-14 rounded-xl ${config.iconBg} flex items-center justify-center flex-shrink-0`}>
                        <Icon className="h-7 w-7 text-accent" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg text-foreground truncate">{businessTypeLabel[org.business_type]}</h3>
                        <div className="flex items-center gap-2 mt-1.5">
                          <Badge variant="secondary" className="text-xs capitalize">
                            {org.business_type.replace(/_/g, ' ')}
                          </Badge>
                          {(overview?.organization_count || 0) > 0 && (
                            <span className="text-xs text-muted-foreground">
                              {overview?.organization_count || 0} active organizations
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold px-3 py-1.5 rounded-full border ${statusClass}`}>
                        {org.status}
                      </span>
                    </div>
                  </div>

                  {!org.has_required_documents && (
                    <div className="flex items-start gap-2 text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-3">
                      <AlertCircle className="h-4 w-4 mt-0.5" />
                      <span>
                        Missing approved document fields: {org.missing_document_fields.map((f) => f.replace(/_/g, ' ')).join(', ')}
                      </span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <Button
                      disabled={pendingAction === `${org.business_type}:GRANT` || !org.has_required_documents || approvedDocuments === 0}
                      onClick={() => updateConsent(org.business_type, 'GRANT')}
                      className="bg-green-700 hover:bg-green-800 text-white"
                    >
                      {pendingAction === `${org.business_type}:GRANT` ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                      Grant
                    </Button>
                    <Button
                      variant="outline"
                      disabled={pendingAction === `${org.business_type}:REVOKE`}
                      onClick={() => updateConsent(org.business_type, 'REVOKE')}
                    >
                      {pendingAction === `${org.business_type}:REVOKE` ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Hand className="h-4 w-4 mr-2" />}
                      Revoke
                    </Button>
                    <Button
                      variant="destructive"
                      disabled={pendingAction === `${org.business_type}:BLOCK`}
                      onClick={() => updateConsent(org.business_type, 'BLOCK')}
                    >
                      {pendingAction === `${org.business_type}:BLOCK` ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <XCircle className="h-4 w-4 mr-2" />}
                      Block
                    </Button>
                  </div>

                  <div className="p-4 rounded-xl bg-white/60">
                    <p className="text-xs uppercase font-semibold text-muted-foreground tracking-wider mb-3">Policy Fields</p>
                    <div className="flex flex-wrap gap-2">
                      {org.allowed_fields.map((field) => (
                        <span
                          key={field}
                          className={`px-3 py-1.5 text-xs rounded-lg font-medium capitalize transition-all duration-300 ${
                            org.status === 'GRANTED' && org.has_required_documents
                              ? 'bg-accent/10 text-accent border border-accent/20' 
                              : 'bg-muted/70 text-muted-foreground line-through opacity-60'
                          }`}
                        >
                          {field.replace(/_/g, ' ')}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          )
        })}
      </motion.div>

      {/* Summary Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="p-5 bg-gradient-to-r from-muted/40 to-transparent border border-border/40 rounded-xl flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
            <Shield className="h-5 w-5 text-accent" />
          </div>
          <p className="text-sm text-muted-foreground">
            <span className="font-bold text-foreground text-lg">{grantedCount}</span> of <span className="font-semibold">{consents.length}</span> organization types are currently granted
          </p>
        </div>
        <div className="hidden md:flex gap-4 text-xs text-muted-foreground">
          <span>{approvedDocuments} approved docs</span>
          <span>{pendingDocuments} pending docs</span>
        </div>
      </motion.div>
    </div>
  )
}
