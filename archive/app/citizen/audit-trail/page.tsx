'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card } from '@/components/ui/card'
import { motion } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, XCircle, Clock, Building2, TrendingUp, Shield, Loader2 } from 'lucide-react'
import { staggerContainer, staggerItem } from '@/lib/motion'
import { apiClient } from '@/lib/api'
import { AuditEntry } from '@/lib/types/api'

const statusConfig = {
  APPROVED: { 
    bg: 'bg-green-50/80', 
    border: 'border-green-200', 
    icon: CheckCircle2, 
    text: 'text-green-700', 
    label: 'Approved',
    iconBg: 'bg-green-100',
  },
  BLOCKED: { 
    bg: 'bg-red-50/80', 
    border: 'border-red-200', 
    icon: XCircle, 
    text: 'text-red-700', 
    label: 'Blocked',
    iconBg: 'bg-red-100',
  },
  PENDING: { 
    bg: 'bg-yellow-50/80', 
    border: 'border-yellow-200', 
    icon: Clock, 
    text: 'text-yellow-700', 
    label: 'Pending',
    iconBg: 'bg-yellow-100',
  },
}

export default function AuditTrailPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError(null)

      const response = await apiClient.get<AuditEntry[]>('/citizen/audit-trail?limit=50&page=1')
      if (!response.success || !response.data) {
        setError(response.error || 'Failed to load audit trail')
        setLoading(false)
        return
      }

      setEntries(response.data)
      setLoading(false)
    }

    load()
  }, [])

  const approved = useMemo(() => entries.filter((x) => x.result_status === 'APPROVED').length, [entries])
  const blocked = useMemo(() => entries.filter((x) => x.result_status === 'BLOCKED').length, [entries])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 gap-3 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading access history...
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
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <Shield className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-light font-nunito">Access History</h1>
              <p className="text-muted-foreground">
                Complete audit trail of all verification requests
              </p>
            </div>
          </div>
        </div>
        
        {error && <p className="text-sm text-red-600">{error}</p>}
      </motion.div>

      {/* Stats Overview */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-3 gap-4"
      >
        {[
          { label: 'Total Accesses', value: entries.length, icon: TrendingUp, gradient: 'from-blue-500/10', hoverBorder: 'hover:border-blue-500/30', iconBg: 'bg-blue-500/10', iconColor: 'text-blue-600' },
          { label: 'Approved', value: approved, icon: CheckCircle2, gradient: 'from-green-500/10', hoverBorder: 'hover:border-green-500/30', iconBg: 'bg-green-500/10', iconColor: 'text-green-600' },
          { label: 'Blocked', value: blocked, icon: XCircle, gradient: 'from-red-500/10', hoverBorder: 'hover:border-red-500/30', iconBg: 'bg-red-500/10', iconColor: 'text-red-600' },
        ].map((stat, idx) => (
          <motion.div
            key={idx}
            variants={staggerItem}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className={`relative overflow-hidden bg-gradient-to-br ${stat.gradient} to-transparent border border-border/40 rounded-xl p-5 ${stat.hoverBorder} transition-all duration-300`}
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

      {/* Audit Trail List */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="space-y-4"
      >
        {entries.map((entry) => {
          const statusInfo = statusConfig[(entry.result_status || 'PENDING') as keyof typeof statusConfig]
          const StatusIcon = statusInfo.icon
          const dateObj = new Date(entry.created_at)
          const date = dateObj.toLocaleDateString()
          const time = dateObj.toLocaleTimeString()
          const fields = entry.fields_accessed || []

          return (
            <motion.div 
              key={entry.id} 
              variants={staggerItem}
              whileHover={{ y: -2, transition: { duration: 0.2 } }}
            >
              <Card className={`${statusInfo.bg} border-2 ${statusInfo.border} p-6 hover:shadow-lg transition-all duration-300 overflow-hidden`}>
                <div className="relative">
                  <div className="space-y-5">
                    {/* Header Row */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1">
                        <div className={`w-12 h-12 rounded-xl ${statusInfo.iconBg} flex items-center justify-center flex-shrink-0`}>
                          <Building2 className="h-6 w-6 text-accent" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-lg text-foreground truncate">{entry.organization_name || 'Unknown Organization'}</h3>
                          <p className="text-sm text-muted-foreground mt-0.5">{entry.purpose || entry.action}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <div className={`w-8 h-8 rounded-full ${statusInfo.iconBg} flex items-center justify-center`}>
                          <StatusIcon className={`h-4 w-4 ${statusInfo.text}`} />
                        </div>
                        <Badge className={`${statusInfo.bg} ${statusInfo.text} border-0 font-semibold`}>
                          {statusInfo.label}
                        </Badge>
                      </div>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-xl bg-white/50">
                      <div>
                        <p className="text-xs uppercase font-semibold text-muted-foreground tracking-wider mb-1">Date</p>
                        <p className="text-sm font-mono font-semibold text-foreground">{date}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase font-semibold text-muted-foreground tracking-wider mb-1">Time</p>
                        <p className="text-sm font-mono font-semibold text-foreground">{time}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase font-semibold text-muted-foreground tracking-wider mb-1">Fields Accessed</p>
                        <p className="text-sm font-semibold text-foreground">{fields.length} fields</p>
                      </div>
                      {(entry.biometric_score || 0) > 0 && (
                        <div>
                          <p className="text-xs uppercase font-semibold text-muted-foreground tracking-wider mb-1">Match Score</p>
                          <p className="text-sm font-mono font-bold text-green-600">{entry.biometric_score}%</p>
                        </div>
                      )}
                    </div>

                    {/* Fields Accessed */}
                    <div>
                      <p className="text-xs uppercase font-semibold text-muted-foreground tracking-wider mb-3">Data Accessed</p>
                      <div className="flex flex-wrap gap-2">
                        {fields.map((field) => (
                          <Badge
                            key={field}
                            variant="secondary"
                            className="text-xs bg-white/70 text-foreground/80 hover:bg-white transition-colors duration-200 capitalize"
                          >
                            {field.replace(/_/g, ' ')}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          )
        })}
      </motion.div>

      {entries.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-20"
        >
          <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-6">
            <Clock className="h-8 w-8 text-muted-foreground/50" />
          </div>
          <p className="text-muted-foreground mb-2 text-xl font-medium">No verification requests yet</p>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Your access log will appear here when organizations request your identity verification
          </p>
        </motion.div>
      )}
    </div>
  )
}
