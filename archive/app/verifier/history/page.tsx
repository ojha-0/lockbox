'use client'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { CheckCircle2, XCircle, Clock, TrendingUp, Search, Filter, Calendar, History, User, Fingerprint, ArrowUpDown } from 'lucide-react'
import { staggerContainer, staggerItem } from '@/lib/motion'
import { apiClient } from '@/lib/api'

const mockHistory = [
  {
    id: '1',
    nid: '550112345678',
    citizen: 'Ramesh Kumar Sharma',
    purpose: 'KYC Verification',
    status: 'APPROVED',
    timestamp: '2026-03-28 14:30:45',
    biometricScore: 97.5,
  },
  {
    id: '2',
    nid: '551234567890',
    citizen: 'Priya Sharma',
    purpose: 'Account Opening',
    status: 'APPROVED',
    timestamp: '2026-03-28 13:15:20',
    biometricScore: 96.2,
  },
  {
    id: '3',
    nid: '552345678901',
    citizen: 'Amit Patel',
    purpose: 'Loan Application',
    status: 'BLOCKED',
    timestamp: '2026-03-28 11:45:00',
    biometricScore: 0,
  },
  {
    id: '4',
    nid: '553456789012',
    citizen: 'Sunita Devi',
    purpose: 'KYC Verification',
    status: 'APPROVED',
    timestamp: '2026-03-27 16:20:30',
    biometricScore: 98.1,
  },
  {
    id: '5',
    nid: '554567890123',
    citizen: 'Krishna Bahadur',
    purpose: 'Document Verification',
    status: 'APPROVED',
    timestamp: '2026-03-27 10:05:15',
    biometricScore: 95.8,
  },
]

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

export default function VerifierHistoryPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'APPROVED' | 'BLOCKED'>('ALL')
  const [historyData, setHistoryData] = useState(mockHistory)

  useEffect(() => {
    const loadHistory = async () => {
      const response = await apiClient.get<any[]>('/verifications/history')
      if (!response.success || !response.data) return

      const transformed = response.data.map((item) => ({
        id: item.id,
        nid: item.citizen_national_id || 'Hidden',
        citizen: item.citizen_name || 'Citizen',
        purpose: item.purpose || 'Verification',
        status: item.result_status || 'PENDING',
        timestamp: new Date(item.created_at).toLocaleString(),
        biometricScore: item.biometric_score || 0,
      }))

      setHistoryData(transformed)
    }

    loadHistory()
  }, [])

  const approved = historyData.filter(x => x.status === 'APPROVED').length
  const blocked = historyData.filter(x => x.status === 'BLOCKED').length
  const avgScore = historyData.filter(x => x.biometricScore > 0).reduce((acc, x) => acc + x.biometricScore, 0) / approved || 0

  const filteredHistory = historyData.filter(item => {
    const matchesSearch = searchQuery === '' || 
      item.nid.includes(searchQuery) || 
      item.citizen.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter
    return matchesSearch && matchesStatus
  })

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
              <History className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-light font-nunito">Verification History</h1>
              <p className="text-muted-foreground">
                Complete record of all verifications performed
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats Overview */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        {[
          {
            label: 'Total Verifications',
            value: historyData.length,
            icon: TrendingUp,
            gradient: 'from-blue-500/10',
            hoverBorder: 'hover:border-blue-500/30',
            iconBg: 'bg-blue-500/10',
            iconColor: 'text-blue-600',
          },
          {
            label: 'Approved',
            value: approved,
            icon: CheckCircle2,
            gradient: 'from-green-500/10',
            hoverBorder: 'hover:border-green-500/30',
            iconBg: 'bg-green-500/10',
            iconColor: 'text-green-600',
          },
          {
            label: 'Blocked',
            value: blocked,
            icon: XCircle,
            gradient: 'from-red-500/10',
            hoverBorder: 'hover:border-red-500/30',
            iconBg: 'bg-red-500/10',
            iconColor: 'text-red-600',
          },
          {
            label: 'Avg. Match Score',
            value: `${avgScore.toFixed(1)}%`,
            icon: Fingerprint,
            gradient: 'from-purple-500/10',
            hoverBorder: 'hover:border-purple-500/30',
            iconBg: 'bg-purple-500/10',
            iconColor: 'text-purple-600',
          },
        ].map((stat, idx) => (
          <motion.div
            key={idx}
            variants={staggerItem}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className={`relative overflow-hidden bg-gradient-to-br ${stat.gradient} to-transparent border border-border/40 rounded-xl p-5 ${stat.hoverBorder} transition-all duration-300`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-2xl font-bold font-nunito text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-1 font-medium">{stat.label}</p>
              </div>
              <div className={`w-10 h-10 rounded-lg ${stat.iconBg} flex items-center justify-center`}>
                <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Filters & Search */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="flex flex-col md:flex-row gap-4"
      >
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by NID or citizen name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-11 h-12 border-border/50 focus:border-accent"
          />
        </div>
        <div className="flex gap-2">
          {['ALL', 'APPROVED', 'BLOCKED'].map((status) => (
            <Button
              key={status}
              variant={statusFilter === status ? 'default' : 'outline'}
              onClick={() => setStatusFilter(status as typeof statusFilter)}
              className={`h-12 ${
                statusFilter === status 
                  ? 'bg-accent text-accent-foreground' 
                  : 'border-border/50'
              }`}
            >
              {status === 'ALL' ? 'All' : status === 'APPROVED' ? 'Approved' : 'Blocked'}
            </Button>
          ))}
        </div>
      </motion.div>

      {/* History List */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="space-y-3"
      >
        {filteredHistory.map((item) => {
          const statusInfo = statusConfig[item.status as keyof typeof statusConfig]
          const StatusIcon = statusInfo.icon

          return (
            <motion.div 
              key={item.id} 
              variants={staggerItem}
              whileHover={{ y: -2, transition: { duration: 0.2 } }}
            >
              <Card className={`${statusInfo.bg} border-2 ${statusInfo.border} p-5 md:p-6 hover:shadow-lg transition-all duration-300 overflow-hidden`}>
                <div className="grid grid-cols-2 md:grid-cols-6 gap-4 items-center">
                  {/* NID */}
                  <div className="col-span-1">
                    <p className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider mb-1">National ID</p>
                    <p className="font-mono font-bold text-sm text-foreground bg-white/50 px-2 py-1 rounded inline-block">{item.nid}</p>
                  </div>
                  
                  {/* Citizen */}
                  <div className="col-span-1 md:col-span-1">
                    <p className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider mb-1">Citizen</p>
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-accent/10 flex items-center justify-center">
                        <User className="h-3.5 w-3.5 text-accent" />
                      </div>
                      <p className="text-sm font-medium text-foreground truncate">{item.citizen}</p>
                    </div>
                  </div>
                  
                  {/* Purpose */}
                  <div className="col-span-1 hidden md:block">
                    <p className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider mb-1">Purpose</p>
                    <Badge variant="secondary" className="text-xs">
                      {item.purpose}
                    </Badge>
                  </div>
                  
                  {/* Date & Time */}
                  <div className="col-span-1 hidden md:block">
                    <p className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider mb-1">Date & Time</p>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                      <p className="text-xs font-mono text-foreground">{item.timestamp}</p>
                    </div>
                  </div>
                  
                  {/* Biometric Score */}
                  <div className="col-span-1 text-center">
                    <p className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider mb-1">Match</p>
                    {item.biometricScore > 0 ? (
                      <div className="flex items-center justify-center gap-1.5">
                        <Fingerprint className="h-4 w-4 text-green-600" />
                        <span className="font-bold text-sm text-green-600">{item.biometricScore}%</span>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">N/A</span>
                    )}
                  </div>
                  
                  {/* Status */}
                  <div className="col-span-1 flex justify-end">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-lg ${statusInfo.iconBg} flex items-center justify-center`}>
                        <StatusIcon className={`h-4 w-4 ${statusInfo.text}`} />
                      </div>
                      <Badge className={`${statusInfo.bg} ${statusInfo.text} border-0 font-semibold`}>
                        {statusInfo.label}
                      </Badge>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          )
        })}
      </motion.div>

      {filteredHistory.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-20"
        >
          <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-6">
            {searchQuery || statusFilter !== 'ALL' ? (
              <Search className="h-8 w-8 text-muted-foreground/50" />
            ) : (
              <Clock className="h-8 w-8 text-muted-foreground/50" />
            )}
          </div>
          <p className="text-muted-foreground mb-2 text-xl font-medium">
            {searchQuery || statusFilter !== 'ALL' ? 'No matching results' : 'No verifications yet'}
          </p>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            {searchQuery || statusFilter !== 'ALL' 
              ? 'Try adjusting your search or filter criteria' 
              : 'Your verification history will appear here as you perform identity checks'}
          </p>
          {(searchQuery || statusFilter !== 'ALL') && (
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => { setSearchQuery(''); setStatusFilter('ALL'); }}
            >
              Clear Filters
            </Button>
          )}
        </motion.div>
      )}

      {/* Results count */}
      {filteredHistory.length > 0 && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-sm text-muted-foreground text-center"
        >
          Showing <span className="font-semibold text-foreground">{filteredHistory.length}</span> of <span className="font-semibold">{historyData.length}</span> verifications
        </motion.p>
      )}
    </div>
  )
}
