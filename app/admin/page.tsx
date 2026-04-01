'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/lib/store/authStore'
import { Input } from '@/components/ui/input'
import { Alert } from '@/components/ui/alert'
import { ShieldCheck, Eye, EyeOff, ArrowRight } from 'lucide-react'

export default function AdminRootPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const { loginAdmin, isLoading, error } = useAuthStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const ok = await loginAdmin(username, password)
    if (ok) {
      router.push('/admin/documents')
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="w-full max-w-md border border-border/40 rounded-2xl p-8 bg-card/60 backdrop-blur">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold">Admin Login</h1>
            <p className="text-sm text-muted-foreground">Review and approve citizen documents</p>
          </div>
        </div>

        {error && <Alert variant="destructive" className="mb-4">{error}</Alert>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Username</label>
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Admin username"
              className="h-11"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Password</label>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="h-11 pr-11"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !username.trim() || !password}
            className="w-full h-11 rounded-lg bg-slate-900 text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? 'Signing in...' : 'Sign in'}
            {!isLoading && <ArrowRight className="h-4 w-4" />}
          </button>
        </form>

        <p className="text-sm text-muted-foreground mt-6 text-center">
          Not an admin? <Link href="/citizen/login" className="text-accent hover:underline">Citizen login</Link>
        </p>
      </div>
    </div>
  )
}
