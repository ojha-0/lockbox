'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuthStore } from '@/lib/store/authStore'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, LayoutDashboard, History, Eye, Lock, LogOut, Fingerprint, ChevronRight, FileUp, FolderOpen } from 'lucide-react'

const NavLinks = [
  { href: '/citizen/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/citizen/upload-documents', label: 'Upload Documents', icon: FileUp },
  { href: '/citizen/my-documents', label: 'My Documents', icon: FolderOpen },
  { href: '/citizen/audit-trail', label: 'Access History', icon: History },
  { href: '/citizen/consent', label: 'Manage Consent', icon: Eye },
  { href: '/citizen/privacy', label: 'Privacy Settings', icon: Lock },
]

export default function CitizenLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, accessToken, logout } = useAuthStore()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    if (!accessToken || user?.role !== 'citizen') {
      router.push('/citizen/login')
    }
  }, [accessToken, user, router])

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      if (!mobile) setIsSidebarOpen(false)
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const handleLogout = async () => {
    await logout()
    router.push('/citizen/login')
  }

  if (!user || user.role !== 'citizen') return null

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <AnimatePresence mode="wait">
        {(!isMobile || isSidebarOpen) && (
          <>
            {/* Mobile Overlay */}
            {isMobile && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsSidebarOpen(false)}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
              />
            )}
            
            <motion.aside
              initial={isMobile ? { x: -280 } : false}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className={`w-72 border-r border-border/30 bg-card/50 backdrop-blur-xl flex flex-col ${
                isMobile ? 'fixed h-full z-50' : 'relative'
              }`}
            >
              {/* Header */}
              <div className="p-6 border-b border-border/20">
                <div className="flex items-center justify-between">
                  <Link href="/citizen/dashboard" className="flex items-center gap-3 group">
                    <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center group-hover:scale-105 transition-transform">
                      <Fingerprint className="h-5 w-5 text-accent-foreground" />
                    </div>
                    <span className="text-lg font-semibold font-nunito text-foreground">Lockbox</span>
                  </Link>
                  {isMobile && (
                    <button
                      onClick={() => setIsSidebarOpen(false)}
                      className="p-2 rounded-lg hover:bg-accent/10 transition-colors"
                    >
                      <X className="h-5 w-5 text-muted-foreground" />
                    </button>
                  )}
                </div>
              </div>

              {/* Navigation */}
              <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                {NavLinks.map((link) => {
                  const isActive = pathname === link.href
                  return (
                    <Link key={link.href} href={link.href} onClick={() => isMobile && setIsSidebarOpen(false)}>
                      <motion.div
                        whileHover={{ x: 4 }}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all duration-200 ${
                          isActive
                            ? 'bg-accent text-accent-foreground font-medium shadow-sm'
                            : 'text-muted-foreground hover:text-foreground hover:bg-accent/10'
                        }`}
                      >
                        <link.icon className={`h-5 w-5 ${isActive ? 'text-accent-foreground' : ''}`} />
                        {link.label}
                        {isActive && <ChevronRight className="h-4 w-4 ml-auto" />}
                      </motion.div>
                    </Link>
                  )
                })}
              </nav>

              {/* User Info */}
              <div className="border-t border-border/20 p-4 space-y-4 mt-auto">
                <div className="p-4 rounded-xl bg-muted/30 border border-border/20">
                  <p className="text-xs text-muted-foreground mb-1 font-medium">National ID</p>
                  <p className="font-mono text-sm text-foreground font-semibold tracking-wide">
                    {user.national_id}
                  </p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-muted-foreground hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200"
                >
                  <LogOut className="h-5 w-5" />
                  Sign out
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="border-b border-border/20 bg-background/80 backdrop-blur-xl h-16 flex items-center px-6 justify-between sticky top-0 z-30">
          <div className="flex items-center gap-4">
            {isMobile && (
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 -ml-2 rounded-lg hover:bg-accent/10 transition-colors"
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5 text-foreground" />
              </button>
            )}
            <div className="hidden sm:block">
              <h2 className="text-sm font-medium text-foreground">
                {NavLinks.find(l => l.href === pathname)?.label || 'Dashboard'}
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground">
              {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </div>
          </div>
        </div>

        {/* Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto p-6 md:p-8">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {children}
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  )
}

