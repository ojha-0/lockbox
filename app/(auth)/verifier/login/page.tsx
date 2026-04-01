'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store/authStore'
import { Input } from '@/components/ui/input'
import { Alert } from '@/components/ui/alert'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Building2, ArrowRight, Eye, EyeOff, ShieldCheck, FileCheck } from 'lucide-react'
import { staggerContainer, staggerItem } from '@/lib/motion'

export default function VerifierLoginPage() {
  const router = useRouter()
  const [company_pan, setCompanyPan] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const { loginVerifier, isLoading, error } = useAuthStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const success = await loginVerifier(company_pan, password)
    if (success) {
      router.push('/verifier/scan')
    }
  }

  return (
    <div className="min-h-screen bg-background flex overflow-hidden">
      {/* Left Panel - Decorative */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-blue-500/10 via-background to-background">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            className="absolute top-1/3 left-1/3 w-80 h-80 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(59, 130, 246, 0.2) 0%, transparent 70%)' }}
            animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute bottom-1/3 right-1/4 w-64 h-64 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%)' }}
            animate={{ scale: [1.1, 1, 1.1], opacity: [0.2, 0.4, 0.2] }}
            transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-12 lg:px-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-8"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-semibold font-nunito">NagarikID</span>
            </div>

            <div className="space-y-4">
              <h1 className="text-4xl lg:text-5xl font-light font-nunito leading-tight">
                Organization
                <br />
                <span className="text-blue-600 font-medium">verification portal.</span>
              </h1>
              <p className="text-muted-foreground text-lg max-w-md">
                Securely verify citizen identities with policy-based access control and complete audit trails.
              </p>
            </div>

            <div className="space-y-4 pt-4">
              {[
                { icon: ShieldCheck, text: 'Policy-based data access' },
                { icon: FileCheck, text: 'Complete audit logging' },
              ].map((item, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + idx * 0.1, duration: 0.5 }}
                  className="flex items-center gap-3 text-muted-foreground"
                >
                  <item.icon className="h-5 w-5 text-blue-600" />
                  <span>{item.text}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="w-full max-w-md"
        >
          {/* Mobile Logo */}
          <motion.div variants={staggerItem} className="lg:hidden mb-12 text-center">
            <Link href="/" className="inline-flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-semibold font-nunito">NagarikID</span>
            </Link>
          </motion.div>

          <motion.div variants={staggerItem} className="mb-10">
            <h2 className="text-3xl font-light font-nunito text-foreground mb-2">Organization access</h2>
            <p className="text-muted-foreground">Sign in to verify citizen identities</p>
          </motion.div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Alert variant="destructive" className="text-sm py-3">
                  {error}
                </Alert>
              </motion.div>
            )}

            <motion.div variants={staggerItem} className="space-y-2">
              <label className="block text-sm font-medium text-foreground">
                Company PAN
              </label>
              <Input
                type="text"
                placeholder="Enter your company PAN"
                value={company_pan}
                onChange={(e) => setCompanyPan(e.target.value)}
                disabled={isLoading}
                className="h-12 px-4 rounded-xl border-2 border-border/50 focus:border-blue-500 transition-all duration-200"
              />
            </motion.div>

            <motion.div variants={staggerItem} className="space-y-2">
              <label className="block text-sm font-medium text-foreground">
                Password
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className="h-12 pl-4 pr-12 rounded-xl border-2 border-border/50 focus:border-blue-500 transition-all duration-200"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </motion.div>

            <motion.div variants={staggerItem}>
              <button
                type="submit"
                disabled={isLoading || !company_pan || !password}
                className="w-full h-12 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 group"
              >
                {isLoading ? (
                  <>
                    <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign in
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </motion.div>
          </form>

          <motion.div variants={staggerItem} className="mt-10 pt-8 border-t border-border/30 space-y-4 text-center">
            <p className="text-muted-foreground">
              New organization?{' '}
              <Link href="/verifier/register" className="text-blue-600 font-medium hover:underline">
                Register now
              </Link>
            </p>
            <p className="text-sm text-muted-foreground">
              <Link href="/citizen/login" className="text-blue-600/80 hover:text-blue-600 hover:underline">
                Sign in as citizen →
              </Link>
            </p>
            <p className="text-sm text-muted-foreground">
              <Link href="/admin/login" className="text-blue-600/80 hover:text-blue-600 hover:underline">
                Admin review portal →
              </Link>
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}
