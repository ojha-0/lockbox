'use client'

import { useEffect, useMemo, useState } from 'react'
import { useAuthStore } from '@/lib/store/authStore'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Lock, History, Eye, Shield, CheckCircle, TrendingUp, FileUp } from 'lucide-react'
import { staggerContainer, staggerItem } from '@/lib/motion'
import { apiClient } from '@/lib/api'
import { CitizenDocument } from '@/lib/types/api'

export default function CitizenDashboard() {
  const { user } = useAuthStore()
  const [documents, setDocuments] = useState<CitizenDocument[]>([])

  const actions = [
    {
      href: '/citizen/audit-trail',
      icon: History,
      title: 'Access History',
      description: 'Complete log of which organizations have accessed your information',
      gradient: 'from-blue-500/10 to-blue-500/5',
      iconBg: 'bg-blue-500/10',
      iconColor: 'text-blue-600',
      hoverBorder: 'hover:border-blue-500/30',
    },
    {
      href: '/citizen/consent',
      icon: Eye,
      title: 'Manage Consent',
      description: 'Control permissions for each organization accessing your data',
      gradient: 'from-emerald-500/10 to-emerald-500/5',
      iconBg: 'bg-emerald-500/10',
      iconColor: 'text-emerald-600',
      hoverBorder: 'hover:border-emerald-500/30',
    },
    {
      href: '/citizen/privacy',
      icon: Lock,
      title: 'Privacy Settings',
      description: 'Configure your account security and privacy preferences',
      gradient: 'from-violet-500/10 to-violet-500/5',
      iconBg: 'bg-violet-500/10',
      iconColor: 'text-violet-600',
      hoverBorder: 'hover:border-violet-500/30',
    },
  ]

  useEffect(() => {
    const loadDocuments = async () => {
      const response = await apiClient.get<CitizenDocument[]>('/citizen/documents')
      if (response.success && response.data) {
        setDocuments(response.data)
      }
    }
    loadDocuments()
  }, [])

  const approvedCount = useMemo(
    () => documents.filter((doc) => doc.upload_status === 'VERIFIED').length,
    [documents]
  )
  const pendingCount = useMemo(
    () => documents.filter((doc) => doc.upload_status === 'PENDING').length,
    [documents]
  )
  const rejectedCount = useMemo(
    () => documents.filter((doc) => doc.upload_status === 'REJECTED').length,
    [documents]
  )

  const stats = [
    { label: 'Uploaded Documents', value: String(documents.length), icon: TrendingUp, trend: `${pendingCount} pending review`, trendUp: null },
    { label: 'Approved Documents', value: String(approvedCount), icon: CheckCircle, trend: approvedCount > 0 ? 'Ready for sharing' : 'No approved documents yet', trendUp: approvedCount > 0 },
    { label: 'Rejected Documents', value: String(rejectedCount), icon: Shield, trend: rejectedCount > 0 ? 'Please re-upload rejected files' : 'No rejected uploads', trendUp: rejectedCount === 0 },
  ]

  return (
    <div className="space-y-10">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-2"
      >
        <div className="flex items-baseline gap-2">
          <h1 className="text-4xl md:text-5xl font-light font-nunito">Welcome back</h1>
        </div>
        <p className="text-muted-foreground text-lg">
          Manage your identity and control your data privacy
        </p>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        {stats.map((stat, idx) => (
          <motion.div
            key={idx}
            variants={staggerItem}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className="relative overflow-hidden rounded-xl border border-border/40 bg-card/50 p-6 hover:border-accent/30 transition-all duration-300"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground font-medium">{stat.label}</p>
                <p className="text-3xl font-bold font-nunito mt-2 text-foreground">{stat.value}</p>
                <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${
                  stat.trendUp === true ? 'text-green-600' : stat.trendUp === false ? 'text-red-600' : 'text-muted-foreground'
                }`}>
                  {stat.trendUp === true && <TrendingUp className="h-3 w-3" />}
                  {stat.trend}
                </div>
              </div>
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <stat.icon className="h-5 w-5 text-accent" />
              </div>
            </div>
            {/* Decorative gradient */}
            <div className="absolute -bottom-10 -right-10 w-32 h-32 rounded-full bg-accent/5 blur-2xl" />
          </motion.div>
        ))}
      </motion.div>

      {/* Primary Actions Grid */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="grid md:grid-cols-3 gap-6"
      >
        {actions.map((action, idx) => (
          <motion.div
            key={idx}
            variants={staggerItem}
            whileHover={{ y: -8, transition: { duration: 0.3 } }}
          >
            <Link href={action.href} className="group h-full block">
              <div className={`relative overflow-hidden rounded-2xl border border-border/40 bg-gradient-to-br ${action.gradient} p-8 h-full transition-all duration-300 ${action.hoverBorder} hover:shadow-lg`}>
                {/* Background glow effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                {/* Floating decoration */}
                <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-gradient-to-br from-accent/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-2xl" />

                <div className="relative z-10 space-y-6 h-full flex flex-col">
                  <div className={`w-14 h-14 rounded-xl ${action.iconBg} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                    <action.icon className={`h-7 w-7 ${action.iconColor}`} />
                  </div>

                  <div className="flex-1">
                    <h2 className="text-xl font-semibold font-nunito text-foreground group-hover:text-accent transition-colors duration-300 mb-3">
                      {action.title}
                    </h2>
                    <p className="text-muted-foreground leading-relaxed group-hover:text-foreground/70 transition-colors duration-300">
                      {action.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 text-accent opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-[-10px] group-hover:translate-x-0">
                    <span className="text-sm font-medium">View details</span>
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </motion.div>

      {documents.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="rounded-2xl border border-amber-200 bg-amber-50 p-6"
        >
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-xl bg-amber-100 flex items-center justify-center">
              <FileUp className="h-5 w-5 text-amber-700" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-amber-900">New account setup required</h3>
              <p className="text-sm text-amber-800 mt-1">
                Upload your government documents so an admin can review and approve them before any organization can access your data.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link href="/citizen/upload-documents" className="px-4 py-2 rounded-lg bg-amber-700 text-white text-sm font-medium hover:bg-amber-800 transition-colors">
                  Upload Documents
                </Link>
                <Link href="/citizen/audit-trail" className="px-4 py-2 rounded-lg border border-amber-300 text-amber-900 text-sm font-medium hover:bg-amber-100 transition-colors">
                  Monitor Access Logs
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Account Status Card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="relative overflow-hidden rounded-2xl border border-border/40 bg-gradient-to-br from-card to-card/50 p-8 backdrop-blur-sm"
      >
        <div className="absolute top-0 right-0 w-40 h-40 bg-accent/5 rounded-full blur-3xl -mr-20 -mt-20" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
              <Shield className="h-5 w-5 text-accent" />
            </div>
            <h2 className="text-xl font-semibold font-nunito">Account Status</h2>
          </div>

          <div className="space-y-8">
            {/* National ID Field */}
            <div>
              <p className="text-xs uppercase font-semibold text-muted-foreground tracking-wider mb-3">
                National ID
              </p>
              <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/30 border border-border/30">
                <code className="text-lg font-mono font-semibold text-foreground flex-1 tracking-wider">
                  {user?.national_id || '••••••••••••'}
                </code>
                <span className="px-3 py-1.5 rounded-full bg-green-100/70 text-green-700 text-xs font-bold flex items-center gap-1.5">
                  <CheckCircle className="h-3.5 w-3.5" />
                  Verified
                </span>
              </div>
            </div>

            <div className="h-px bg-gradient-to-r from-border via-border/50 to-transparent" />

            {/* Verification Status */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { label: 'Verification Status', value: 'Verified', dotClass: 'bg-green-500' },
                { label: 'Account Status', value: 'Active', dotClass: 'bg-blue-500' },
                { label: 'Biometric', value: 'Enrolled', dotClass: 'bg-violet-500' },
                { label: 'Last Login', value: 'Today', dotClass: 'bg-slate-500' },
              ].map((item, idx) => (
                <div key={idx}>
                  <p className="text-xs uppercase font-semibold text-muted-foreground tracking-wider mb-2">
                    {item.label}
                  </p>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${item.dotClass}`} />
                    <span className="text-sm font-semibold text-foreground">{item.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
