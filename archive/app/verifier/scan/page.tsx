'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { AlertCircle, CheckCircle2, Scan, Shield, FileSearch, Sparkles, SearchCheck, FileBadge2, HandCoins, HeartPulse, Cake, ClipboardList, Lock } from 'lucide-react'
import { staggerContainer, staggerItem } from '@/lib/motion'
import { apiClient } from '@/lib/api'
import { VerificationResult } from '@/lib/types/api'

const purposes = [
  { value: 'kyc', label: 'KYC Verification', icon: SearchCheck },
  { value: 'account_opening', label: 'Account Opening', icon: FileBadge2 },
  { value: 'loan_application', label: 'Loan Application', icon: HandCoins },
  { value: 'health_check', label: 'Health Check', icon: HeartPulse },
  { value: 'age_verification', label: 'Age Verification', icon: Cake },
  { value: 'other', label: 'Other', icon: ClipboardList },
]

export default function VerifierScanPage() {
  const router = useRouter()
  const [national_id, setNationalId] = useState('')
  const [purpose, setPurpose] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [validated, setValidated] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleNidChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 12)
    setNationalId(value)
    setValidated(value.length === 12)
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!national_id || !purpose) return

    setIsLoading(true)
    setError(null)

    const response = await apiClient.post<VerificationResult>('/verifications/execute', {
      national_id,
      purpose,
    })

    setIsLoading(false)

    if (!response.success || !response.data) {
      setError(response.error || 'Verification failed')
      return
    }

    if (typeof window !== 'undefined') {
      sessionStorage.setItem(`verification:${response.data.audit_id}`, JSON.stringify(response.data))
    }

    router.push(`/verifier/results?audit_id=${response.data.audit_id}&nid=${national_id}&purpose=${purpose}`)
  }

  const canSubmit = national_id.length === 12 && purpose && !isLoading

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-10 space-y-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-blue-600/10 flex items-center justify-center">
            <Scan className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-light font-nunito">Verify Identity</h1>
            <p className="text-muted-foreground">
              Enter the citizen&apos;s National ID to initiate verification
            </p>
          </div>
        </div>
      </motion.div>

      {/* Form Container */}
      <motion.form
        onSubmit={handleVerify}
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="space-y-8"
      >
        {/* National ID Field */}
        <motion.div variants={staggerItem} className="space-y-3">
          <label className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <FileSearch className="h-4 w-4 text-muted-foreground" />
            National ID Number
          </label>
          <div className="relative">
            <Input
              type="text"
              placeholder="Enter 12-digit National ID"
              value={national_id}
              onChange={handleNidChange}
              maxLength={12}
              disabled={isLoading}
              className={`h-14 text-lg font-mono tracking-wider bg-background px-5 rounded-xl border-2 transition-all duration-300 ${
                national_id.length === 0
                  ? 'border-border/50 focus:border-blue-500 focus:shadow-lg focus:shadow-blue-500/10'
                  : validated
                    ? 'border-green-500/60 bg-green-50/50 focus:border-green-500'
                    : 'border-yellow-500/40 bg-yellow-50/30'
              }`}
              aria-label="National ID"
            />
            <AnimatePresence mode="wait">
              {validated && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="absolute right-4 top-1/2 -translate-y-1/2"
                >
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <AnimatePresence>
            {national_id.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center justify-between"
              >
                <div className="flex gap-1">
                  {[...Array(12)].map((_, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: idx * 0.02 }}
                      className={`w-2 h-2 rounded-full transition-colors duration-200 ${
                        idx < national_id.length
                          ? validated
                            ? 'bg-green-500'
                            : 'bg-yellow-500'
                          : 'bg-border'
                      }`}
                    />
                  ))}
                </div>
                <p className={`text-xs font-semibold transition-colors duration-300 ${
                  validated ? 'text-green-600' : 'text-yellow-600'
                }`}>
                  {national_id.length}/12 digits
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Purpose Field */}
        <motion.div variants={staggerItem} className="space-y-3">
          <label className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Shield className="h-4 w-4 text-muted-foreground" />
            Purpose of Verification
          </label>
          <Select value={purpose} onValueChange={setPurpose} disabled={isLoading}>
            <SelectTrigger className="h-14 rounded-xl bg-background border-2 border-border/50 hover:border-blue-500/40 focus:border-blue-500 transition-all duration-300 text-base">
              <SelectValue placeholder="Select verification purpose..." />
            </SelectTrigger>
            <SelectContent className="border-2 border-border/40 rounded-xl">
              {purposes.map((p) => (
                <SelectItem key={p.value} value={p.value} className="cursor-pointer py-3">
                  <span className="flex items-center gap-3">
                    <p.icon className="h-4 w-4" />
                    <span>{p.label}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </motion.div>

        {/* Info Box */}
        <AnimatePresence>
          {purpose && (
            <motion.div
              initial={{ opacity: 0, y: -10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              className="overflow-hidden"
            >
              <div className="p-5 bg-blue-50/70 border-l-4 border-blue-500 rounded-xl flex gap-4">
                <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-blue-900">
                    {purposes.find(p => p.value === purpose)?.label}
                  </p>
                  <p className="text-sm text-blue-800 mt-1">
                    This verification will be logged and the citizen will be notified. Only policy-allowed fields will be returned.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Submit Button */}
        <motion.div variants={staggerItem}>
          <button
            type="submit"
            disabled={!canSubmit}
            className={`w-full h-14 font-semibold rounded-xl transition-all duration-300 flex items-center justify-center gap-3 text-base ${
              canSubmit
                ? 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-600/30 active:scale-[0.98]'
                : 'bg-muted text-muted-foreground cursor-not-allowed'
            }`}
          >
            {isLoading ? (
              <>
                <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Verifying Identity...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5" />
                <span>Verify Identity</span>
              </>
            )}
          </button>
        </motion.div>
      </motion.form>

      {/* Helper Text */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="mt-10 p-4 rounded-xl bg-muted/30 border border-border/30"
      >
        <p className="text-center text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-2"><Lock className="h-4 w-4" /> All verifications are encrypted and logged for audit purposes.</span>
          <br />
          <span className="text-xs">Citizens will be notified of this access request.</span>
        </p>
      </motion.div>
    </div>
  )
}
