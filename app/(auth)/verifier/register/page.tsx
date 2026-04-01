'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store/authStore'
import { Input } from '@/components/ui/input'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { motion } from 'framer-motion'

export default function VerifierRegisterPage() {
  const router = useRouter()
  const { registerVerifier, isLoading: authLoading, error: authError } = useAuthStore()
  const [formData, setFormData] = useState({
    company_pan: '',
    email: '',
    organization_name: '',
    business_type: 'bank',
    password: '',
    confirmPassword: '',
    registration_number: '',
    address: '',
    contact_phone: '',
  })
  const [error, setError] = useState<string | null>(null)

  const businessTypes = [
    { value: 'bank', label: 'Bank' },
    { value: 'pharmacy', label: 'Pharmacy' },
    { value: 'age_verification', label: 'Age Verification' },
  ]

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    const success = await registerVerifier({
      company_pan: formData.company_pan,
      email: formData.email,
      password: formData.password,
      organization_name: formData.organization_name,
      business_type: formData.business_type,
      registration_number: formData.registration_number || null,
      address: formData.address || null,
      contact_email: formData.email,
      contact_phone: formData.contact_phone || null,
    })

    if (success) {
      router.push('/verifier/login')
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm"
      >
        <div className="mb-12 text-center">
          <div className="text-lg font-medium font-nunito text-foreground mb-3">NagarikID</div>
          <h1 className="text-3xl font-light font-nunito text-balance">Register organization</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {(error || authError) && (
            <Alert variant="destructive" className="text-sm py-3">
              {error || authError}
            </Alert>
          )}

          <div className="space-y-3">
            <label className="block text-sm font-medium text-foreground">
              Company PAN
            </label>
            <Input
              type="text"
              name="company_pan"
              value={formData.company_pan}
              onChange={handleChange}
              placeholder="e.g., PAN001"
              required
              disabled={authLoading}
            />
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-medium text-foreground">
              Email
            </label>
            <Input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="org@example.com"
              required
              disabled={authLoading}
            />
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-medium text-foreground">
              Organization Name
            </label>
            <Input
              type="text"
              name="organization_name"
              value={formData.organization_name}
              onChange={handleChange}
              placeholder="Your organization name"
              required
              disabled={authLoading}
            />
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-medium text-foreground">
              Business Type
            </label>
            <select
              name="business_type"
              value={formData.business_type}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50"
              disabled={authLoading}
            >
              {businessTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-medium text-foreground">
              Registration Number
            </label>
            <Input
              type="text"
              name="registration_number"
              value={formData.registration_number}
              onChange={handleChange}
              placeholder="Optional"
              disabled={authLoading}
            />
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-medium text-foreground">
              Address
            </label>
            <Input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Optional"
              disabled={authLoading}
            />
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-medium text-foreground">
              Contact Phone
            </label>
            <Input
              type="tel"
              name="contact_phone"
              value={formData.contact_phone}
              onChange={handleChange}
              placeholder="Optional"
              disabled={authLoading}
            />
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-medium text-foreground">
              Password
            </label>
            <Input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="At least 8 characters"
              required
              disabled={authLoading}
            />
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-medium text-foreground">
              Confirm Password
            </label>
            <Input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm password"
              required
              disabled={authLoading}
            />
          </div>

          <Button 
            type="submit" 
            disabled={authLoading}
            className="w-full"
          >
            {authLoading ? 'Registering...' : 'Register Organization'}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-8">
          Already have an account?{' '}
          <Link href="/verifier/login" className="text-accent hover:underline">
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  )
}
