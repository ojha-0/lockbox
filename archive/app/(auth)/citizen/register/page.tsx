'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/lib/store/authStore'
import { apiClient } from '@/lib/api'
import { Input } from '@/components/ui/input'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Fingerprint, Shield, User, Mail, Phone, Lock, Eye, EyeOff, CheckCircle2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'

export default function CitizenRegisterPage() {
  const router = useRouter()
  const { registerCitizen, isLoading, error: authError } = useAuthStore()

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const [otpVerified, setOtpVerified] = useState(false)
  const [isSendingOtp, setIsSendingOtp] = useState(false)
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [devOtpHint, setDevOtpHint] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone_number: '',
    otp_code: '',
    password: '',
    confirmPassword: '',
  })

  const updateField = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
    setFormError(null)

    if (name === 'phone_number') {
      setOtpSent(false)
      setOtpVerified(false)
      setDevOtpHint(null)
      setFormData((prev) => ({ ...prev, otp_code: '' }))
    }
  }

  const sendOtp = async () => {
    if (!formData.phone_number || formData.phone_number.length < 10) {
      setFormError('Enter a valid phone number first')
      return
    }

    setIsSendingOtp(true)
    setFormError(null)

    const response = await apiClient.post('/auth/citizen/send-otp', {
      phone_number: formData.phone_number,
    }, { requireAuth: false })

    setIsSendingOtp(false)

    if (!response.success) {
      setFormError(response.error || 'Could not send OTP')
      return
    }

    setOtpSent(true)
    setOtpVerified(false)
    setDevOtpHint((response.data as any)?.dev_otp || null)
    toast.success('OTP sent to your phone number')
  }

  const verifyOtp = async () => {
    if (!otpSent) {
      setFormError('Send OTP first')
      return
    }

    if (formData.otp_code.length !== 6) {
      setFormError('OTP must be 6 digits')
      return
    }

    setIsVerifyingOtp(true)
    setFormError(null)

    const response = await apiClient.post('/auth/citizen/verify-otp', {
      phone_number: formData.phone_number,
      otp_code: formData.otp_code,
    }, { requireAuth: false })

    setIsVerifyingOtp(false)

    if (!response.success) {
      setFormError(response.error || 'OTP verification failed')
      return
    }

    setOtpVerified(true)
    toast.success('Phone number verified')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    if (!formData.full_name.trim()) {
      setFormError('Full name is required')
      return
    }

    if (!formData.email.includes('@')) {
      setFormError('Please enter a valid email')
      return
    }

    if (!formData.phone_number || formData.phone_number.length < 10) {
      setFormError('Valid phone number is required')
      return
    }

    if (!otpVerified) {
      setFormError('Verify your phone number with OTP before creating account')
      return
    }

    if (formData.password.length < 8) {
      setFormError('Password must be at least 8 characters')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setFormError('Passwords do not match')
      return
    }

    const success = await registerCitizen({
      full_name: formData.full_name,
      email: formData.email,
      phone_number: formData.phone_number,
      password: formData.password,
      phone_otp_verified: true,
    })

    if (!success) return

    toast.success('Account created. Upload documents to complete KYC verification.')
    router.push('/citizen/upload-documents')
  }

  return (
    <div className="min-h-screen bg-background flex overflow-hidden">
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-accent/10 via-background to-background">
        <div className="relative z-10 flex flex-col justify-center px-12 lg:px-16 space-y-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center">
              <Fingerprint className="h-6 w-6 text-accent-foreground" />
            </div>
            <span className="text-2xl font-semibold font-nunito">Lockbox</span>
          </div>
          <div className="space-y-4">
            <h1 className="text-4xl font-light font-nunito leading-tight">
              Create your account first,
              <br />
              <span className="text-accent font-medium">verify documents later.</span>
            </h1>
            <p className="text-muted-foreground max-w-md">
              Start with name, email, phone, and password. National ID details are captured after document upload and admin verification.
            </p>
          </div>
          <div className="space-y-3 text-muted-foreground">
            <div className="flex items-center gap-2"><Shield className="h-4 w-4 text-accent" /> Phone OTP validation</div>
            <div className="flex items-center gap-2"><Shield className="h-4 w-4 text-accent" /> Admin document approval workflow</div>
            <div className="flex items-center gap-2"><Shield className="h-4 w-4 text-accent" /> Privacy-controlled sharing</div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="lg:hidden mb-8 text-center">
            <div className="inline-flex items-center gap-2">
              <Fingerprint className="h-6 w-6 text-accent" />
              <span className="text-lg font-semibold font-nunito">Lockbox</span>
            </div>
          </div>

          <h2 className="text-3xl font-light font-nunito mb-2">Create Account</h2>
          <p className="text-muted-foreground mb-8">Register with name, email, and phone first</p>

          {(formError || authError) && (
            <Alert variant="destructive" className="mb-6 text-sm">
              {formError || authError}
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2"><User className="h-4 w-4" /> Full Name</label>
              <Input
                value={formData.full_name}
                onChange={(e) => updateField('full_name', e.target.value)}
                placeholder="Your full name"
                disabled={isLoading}
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2"><Mail className="h-4 w-4" /> Email</label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => updateField('email', e.target.value)}
                placeholder="you@example.com"
                disabled={isLoading}
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2"><Phone className="h-4 w-4" /> Phone Number</label>
              <div className="flex gap-2">
                <Input
                  type="tel"
                  value={formData.phone_number}
                  onChange={(e) => updateField('phone_number', e.target.value)}
                  placeholder="+97798XXXXXXXX"
                  disabled={isLoading}
                  className="h-11"
                />
                <Button type="button" variant="outline" onClick={sendOtp} disabled={isSendingOtp || isLoading}>
                  {isSendingOtp ? 'Sending...' : 'Send OTP'}
                </Button>
              </div>
            </div>

            {otpSent && (
              <div className="space-y-2 rounded-xl border border-border p-3 bg-muted/30">
                <label className="text-sm font-medium">OTP Code</label>
                <div className="flex gap-2">
                  <Input
                    value={formData.otp_code}
                    onChange={(e) => updateField('otp_code', e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="6-digit OTP"
                    disabled={isLoading || otpVerified}
                    className="h-11"
                  />
                  <Button type="button" variant={otpVerified ? 'secondary' : 'default'} onClick={verifyOtp} disabled={isVerifyingOtp || otpVerified || isLoading}>
                    {otpVerified ? <CheckCircle2 className="h-4 w-4" /> : isVerifyingOtp ? 'Checking...' : 'Verify'}
                  </Button>
                </div>
                {devOtpHint && <p className="text-xs text-muted-foreground">Dev OTP: {devOtpHint}</p>}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2"><Lock className="h-4 w-4" /> Password</label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => updateField('password', e.target.value)}
                  placeholder="At least 8 characters"
                  disabled={isLoading}
                  className="h-11 pr-10"
                />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => setShowPassword((v) => !v)}>
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Confirm Password</label>
              <div className="relative">
                <Input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => updateField('confirmPassword', e.target.value)}
                  placeholder="Repeat password"
                  disabled={isLoading}
                  className="h-11 pr-10"
                />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => setShowConfirmPassword((v) => !v)}>
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full h-11" disabled={isLoading}>
              {isLoading ? 'Creating account...' : 'Create Account'}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Already have an account?{' '}
            <Link href="/citizen/login" className="text-accent font-medium hover:underline">Sign in</Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}

