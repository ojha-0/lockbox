'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { CircleCheckBig, CircleX, Clock3, User, Shield, FileText, Fingerprint, Calendar, ArrowRight, History, Scan, type LucideIcon, BadgeInfo, Home, Phone, Mail, Droplets, VenusAndMars } from 'lucide-react'
import { staggerContainer, staggerItem } from '@/lib/motion'
import { VerificationResult } from '@/lib/types/api'
const fieldIcons: Record<string, LucideIcon> = {
  full_name: User,
  date_of_birth: Calendar,
  address: Home,
  phone_number: Phone,
  email: Mail,
  gender: VenusAndMars,
  blood_group: Droplets,
}

export default function VerificationResultsPage() {
  const searchParams = useSearchParams()
  const auditId = searchParams.get('audit_id')
  const nid = searchParams.get('nid')
  const purpose = searchParams.get('purpose')
  const [result, setResult] = useState<VerificationResult | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadResult = async () => {
      if (!auditId) {
        setLoading(false)
        return
      }

      if (typeof window !== 'undefined') {
        const cached = sessionStorage.getItem(`verification:${auditId}`)
        if (cached) {
          setResult(JSON.parse(cached))
          setLoading(false)
          return
        }
      }
      setLoading(false)
    }

    loadResult()
  }, [auditId])

  const statusConfig = {
    APPROVED: { 
      bg: 'bg-gradient-to-br from-green-50 to-green-100/50',
      border: 'border-green-300',
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      title: 'Verification Approved',
      desc: 'Citizen biometric verified and policy requirements met',
    },
    BLOCKED: { 
      bg: 'bg-gradient-to-br from-red-50 to-red-100/50',
      border: 'border-red-300',
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
      title: 'Verification Blocked',
      desc: 'Verification failed due to policy, consent, or missing approved document data',
    },
    PENDING: { 
      bg: 'bg-gradient-to-br from-yellow-50 to-yellow-100/50',
      border: 'border-yellow-300',
      iconBg: 'bg-yellow-100',
      iconColor: 'text-yellow-600',
      title: 'Verification Pending',
      desc: 'Awaiting citizen biometric verification',
    },
  }

  const statusIcons: Record<string, LucideIcon> = {
    APPROVED: CircleCheckBig,
    BLOCKED: CircleX,
    PENDING: Clock3,
  }

  const status = (result?.status || 'PENDING') as keyof typeof statusConfig
  const StatusIcon = statusIcons[status]
  const config = statusConfig[status]

  if (loading) {
    return <div className="py-20 text-center text-muted-foreground">Loading verification result...</div>
  }

  if (!result) {
    return <div className="py-20 text-center text-muted-foreground">Verification result not found.</div>
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-start gap-4"
      >
        <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center flex-shrink-0">
          <Shield className="h-7 w-7 text-blue-600" />
        </div>
        <div>
          <h1 className="text-3xl md:text-4xl font-light font-nunito mb-2">Verification Result</h1>
          <div className="flex items-center gap-2 text-muted-foreground">
            <span className="font-mono text-sm bg-muted px-2 py-0.5 rounded">{nid}</span>
            <span>•</span>
            <span className="capitalize">{purpose?.replace(/_/g, ' ')}</span>
          </div>
        </div>
      </motion.div>

      {/* Status Banner */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1, duration: 0.5 }}
        className={`p-8 rounded-2xl border-2 ${config.bg} ${config.border} relative overflow-hidden`}
      >
        {/* Background decoration */}
        {status === 'APPROVED' && (
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-green-200/30 rounded-full blur-3xl" />
        )}
        
        <div className="relative flex items-center gap-6">
          <div className={`w-16 h-16 rounded-2xl ${config.iconBg} flex items-center justify-center flex-shrink-0`}>
            <StatusIcon className={`h-8 w-8 ${config.iconColor}`} />
          </div>
          <div>
            <h2 className="text-2xl font-bold font-nunito text-foreground mb-1">
              {config.title}
            </h2>
            <p className="text-sm text-muted-foreground max-w-lg">
              {config.desc}
            </p>
          </div>
          
          {status === 'APPROVED' && result.biometric_score && (
            <div className="hidden md:block ml-auto text-right">
              <div className="text-4xl font-bold font-nunito text-green-600">
                {result.biometric_score}%
              </div>
              <p className="text-sm text-green-700">Match confidence</p>
            </div>
          )}
        </div>
      </motion.div>

      {result.status === 'BLOCKED' && result.message && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl border border-amber-300 bg-amber-50"
        >
          <p className="text-sm font-medium text-amber-900">{result.message}</p>
          {result.missing_document_fields && result.missing_document_fields.length > 0 && (
            <p className="text-xs text-amber-800 mt-1">
              Missing approved fields: {result.missing_document_fields.map((field) => field.replace(/_/g, ' ')).join(', ')}.
            </p>
          )}
        </motion.div>
      )}

      {result.status === 'APPROVED' && (
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="grid lg:grid-cols-3 gap-6"
        >
          {/* Verification Details */}
          <motion.div variants={staggerItem} className="lg:col-span-2">
            <Card className="p-6 md:p-8 border border-border/50 hover:shadow-lg transition-shadow duration-300">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                  <User className="h-5 w-5 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold font-nunito">Verified Identity Data</h3>
              </div>

              <div className="space-y-4">
                {Object.entries(result.filtered_data).map(([key, value]) => {
                  const FieldIcon = fieldIcons[key] || BadgeInfo
                  return (
                  <motion.div 
                    key={key} 
                    whileHover={{ x: 4, transition: { duration: 0.2 } }}
                    className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-muted/30 to-transparent border border-border/30 hover:border-accent/20 transition-all duration-300"
                  >
                    <div className="flex items-center gap-3">
                      <FieldIcon className="h-4 w-4 text-muted-foreground" />
                      <label className="text-sm font-medium text-muted-foreground capitalize">
                        {key.replace(/_/g, ' ')}
                      </label>
                    </div>
                    <span className="text-sm font-semibold text-foreground">
                      {value}
                    </span>
                  </motion.div>
                )})}
              </div>

              <div className="mt-6 pt-6 border-t border-border/50">
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                    Allowed Fields (by Policy)
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {result.allowed_fields.map((field) => (
                    <Badge 
                      key={field} 
                      variant="secondary" 
                      className="text-xs bg-accent/10 text-accent border border-accent/20 capitalize"
                    >
                      {field.replace(/_/g, ' ')}
                    </Badge>
                  ))}
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Biometric Score - Mobile */}
            <motion.div variants={staggerItem}>
              <Card className="p-6 border border-green-200 bg-gradient-to-br from-green-50 to-transparent md:hidden">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                    <Fingerprint className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold font-nunito text-green-600">
                      {result.biometric_score}%
                    </p>
                    <p className="text-sm text-green-700">Face match confidence</p>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Biometric - Desktop */}
            <motion.div variants={staggerItem} className="hidden md:block">
              <Card className="p-6 border border-green-200 bg-gradient-to-br from-green-50 to-transparent">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                    <Fingerprint className="h-5 w-5 text-green-600" />
                  </div>
                  <h4 className="font-semibold">Biometric Verification</h4>
                </div>
                <div className="text-center py-4">
                  <p className="text-5xl font-bold font-nunito text-green-600 mb-2">
                    {result.biometric_score}%
                  </p>
                  <p className="text-sm text-green-700">Face match confidence</p>
                  
                  {/* Progress bar */}
                  <div className="mt-4 h-2 bg-green-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${result.biometric_score}%` }}
                      transition={{ delay: 0.5, duration: 1, ease: 'easeOut' }}
                      className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full"
                    />
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Audit Information */}
            <motion.div variants={staggerItem}>
              <Card className="p-6 border border-border/50">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                    <FileText className="h-5 w-5 text-purple-600" />
                  </div>
                  <h4 className="font-semibold">Audit Information</h4>
                </div>
                <div className="space-y-4">
                  <div className="p-3 rounded-lg bg-muted/30">
                    <p className="text-muted-foreground text-xs mb-1 font-semibold uppercase tracking-wider">Audit ID</p>
                    <code className="block font-mono text-sm font-semibold text-foreground">
                      {result.audit_id}
                    </code>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/30">
                    <p className="text-muted-foreground text-xs mb-1 font-semibold uppercase tracking-wider">Timestamp</p>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <p className="font-mono text-sm font-semibold text-foreground">
                        {new Date(result.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>
        </motion.div>
      )}

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.4 }}
        className="flex flex-col sm:flex-row gap-4"
      >
        <Link href="/verifier/scan" className="flex-1 sm:flex-none">
          <Button className="w-full sm:w-auto bg-accent hover:bg-accent/90 text-accent-foreground font-semibold h-12 px-6 gap-2 group">
            <Scan className="h-4 w-4" />
            Verify Another ID
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Button>
        </Link>
        <Link href="/verifier/history" className="flex-1 sm:flex-none">
          <Button variant="outline" className="w-full sm:w-auto border-border/50 h-12 px-6 gap-2">
            <History className="h-4 w-4" />
            View History
          </Button>
        </Link>
      </motion.div>
    </div>
  )
}
