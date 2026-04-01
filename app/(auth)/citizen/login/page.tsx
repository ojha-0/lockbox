'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store/authStore'
import { Input } from '@/components/ui/input'
import { Alert } from '@/components/ui/alert'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Fingerprint, ArrowRight, Eye, EyeOff, Shield } from 'lucide-react'
import { staggerContainer, staggerItem } from '@/lib/motion'

export default function CitizenLoginPage() {
  const router = useRouter()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const { loginCitizen, isLoading, error } = useAuthStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const success = await loginCitizen(identifier, password)
    if (success) {
      router.push('/citizen/dashboard')
    }
  }

  return (
    <div className="min-h-screen bg-background flex overflow-hidden">
      {/* Left Panel - Decorative */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-accent/10 via-background to-background">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            className="absolute top-1/4 left-1/4 w-72 h-72 rounded-full"
            style={{ background: 'radial-gradient(circle, hsl(var(--accent) / 0.2) 0%, transparent 70%)' }}
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full"
            style={{ background: 'radial-gradient(circle, hsl(var(--accent) / 0.15) 0%, transparent 70%)' }}
            animate={{ scale: [1.2, 1, 1.2], opacity: [0.2, 0.4, 0.2] }}
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
              <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center">
                <Fingerprint className="h-6 w-6 text-accent-foreground" />
              </div>
              <span className="text-2xl font-semibold font-nunito">Lockbox</span>
            </div>

            <div className="space-y-4">
              <h1 className="text-4xl lg:text-5xl font-light font-nunito leading-tight">
                Your identity,
                <br />
                <span className="text-accent font-medium">your control.</span>
              </h1>
              <p className="text-muted-foreground text-lg max-w-md">
                Access your secure digital identity portal. Track who views your data and manage your privacy settings.
              </p>
            </div>

            <div className="space-y-4 pt-4">
              {[
                { icon: Shield, text: 'End-to-end encrypted' },
                { icon: Eye, text: 'Full access transparency' },
              ].map((item, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + idx * 0.1, duration: 0.5 }}
                  className="flex items-center gap-3 text-muted-foreground"
                >
                  <item.icon className="h-5 w-5 text-accent" />
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
              <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
                <Fingerprint className="h-5 w-5 text-accent-foreground" />
              </div>
              <span className="text-xl font-semibold font-nunito">Lockbox</span>
            </Link>
          </motion.div>

          <motion.div variants={staggerItem} className="mb-10">
            <h2 className="text-3xl font-light font-nunito text-foreground mb-2">Welcome back</h2>
            <p className="text-muted-foreground">Sign in to access your citizen portal</p>
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
                {error.toLowerCase().includes('create an account') && (
                  <p className="text-sm mt-2 text-muted-foreground">
                    New user? <Link href="/citizen/register" className="text-accent font-medium hover:underline">Create your account</Link> and complete document upload.
                  </p>
                )}
              </motion.div>
            )}

            <motion.div variants={staggerItem} className="space-y-2">
              <label className="block text-sm font-medium text-foreground">
                Email or Phone
              </label>
              <div className="relative">
                <Input
                  type="text"
                  placeholder="you@example.com or +97798XXXXXXXX"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  disabled={isLoading}
                  className="h-12 pl-4 pr-4 rounded-xl border-2 border-border/50 focus:border-accent transition-all duration-200"
                />
              </div>
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
                  className="h-12 pl-4 pr-12 rounded-xl border-2 border-border/50 focus:border-accent transition-all duration-200"
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
                disabled={isLoading || !identifier || !password}
                className="w-full h-12 bg-accent text-accent-foreground font-semibold rounded-xl hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 group"
              >
                {isLoading ? (
                  <>
                    <div className="h-5 w-5 border-2 border-accent-foreground/30 border-t-accent-foreground rounded-full animate-spin" />
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
              New to Lockbox?{' '}
              <Link href="/citizen/register" className="text-accent font-medium hover:underline">
                Create account
              </Link>
            </p>
            <p className="text-sm text-muted-foreground">
              <Link href="/verifier/login" className="text-accent/80 hover:text-accent hover:underline">
                Sign in as organization →
              </Link>
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}

