'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuthStore } from '@/lib/store/authStore'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Building2, Scan, History, LogOut, Menu, X } from 'lucide-react'

const navLinks = [
  { href: '/verifier/scan', label: 'Scan ID', icon: Scan },
  { href: '/verifier/history', label: 'History', icon: History },
]

export default function VerifierLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, accessToken, logout } = useAuthStore()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    if (!accessToken || user?.role !== 'verifier') {
      router.push('/verifier/login')
    }
  }, [accessToken, user, router])

  const handleLogout = async () => {
    await logout()
    router.push('/verifier/login')
  }

  if (!user || user.role !== 'verifier') return null

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border/30 bg-card/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-16 flex items-center justify-between">
            {/* Logo & Nav */}
            <div className="flex items-center gap-10">
              <Link href="/verifier/scan" className="flex items-center gap-3 group">
                <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Building2 className="h-5 w-5 text-white" />
                </div>
                <span className="text-lg font-semibold font-nunito text-foreground">NagarikID</span>
              </Link>
              
              {/* Desktop Nav */}
              <div className="hidden md:flex items-center gap-1">
                {navLinks.map((link) => {
                  const isActive = pathname === link.href
                  return (
                    <Link key={link.href} href={link.href}>
                      <motion.div
                        whileHover={{ y: -2 }}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                          isActive
                            ? 'bg-blue-600/10 text-blue-600'
                            : 'text-muted-foreground hover:text-foreground hover:bg-accent/5'
                        }`}
                      >
                        <link.icon className="h-4 w-4" />
                        {link.label}
                      </motion.div>
                    </Link>
                  )
                })}
              </div>
            </div>

            {/* Right Side */}
            <div className="flex items-center gap-4">
              {/* Organization Info */}
              <div className="hidden sm:flex items-center gap-3 pr-4 border-r border-border/30">
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Organization</p>
                  <p className="text-sm font-semibold text-foreground capitalize">
                    {user.business_type?.replace(/_/g, ' ') || 'Verifier'}
                  </p>
                </div>
                <div className="w-9 h-9 rounded-lg bg-blue-600/10 flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-blue-600" />
                </div>
              </div>
              
              {/* Logout */}
              <button 
                onClick={handleLogout} 
                className="hidden sm:flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-lg hover:bg-accent/5 transition-colors"
              >
                {mobileMenuOpen ? (
                  <X className="h-5 w-5 text-foreground" />
                ) : (
                  <Menu className="h-5 w-5 text-foreground" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="md:hidden pb-4 space-y-1"
            >
              {navLinks.map((link) => {
                const isActive = pathname === link.href
                return (
                  <Link key={link.href} href={link.href} onClick={() => setMobileMenuOpen(false)}>
                    <div className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium ${
                      isActive
                        ? 'bg-blue-600/10 text-blue-600'
                        : 'text-muted-foreground hover:bg-accent/5'
                    }`}>
                      <link.icon className="h-5 w-5" />
                      {link.label}
                    </div>
                  </Link>
                )
              })}
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 w-full"
              >
                <LogOut className="h-5 w-5" />
                Sign out
              </button>
            </motion.div>
          )}
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          key={pathname}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {children}
        </motion.div>
      </main>
    </div>
  )
}
