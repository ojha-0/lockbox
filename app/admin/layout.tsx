'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/lib/store/authStore'
import { ClipboardCheck, LogOut } from 'lucide-react'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, accessToken, logout } = useAuthStore()
  const isPublicAdminEntry = pathname === '/admin'

  useEffect(() => {
    if (isPublicAdminEntry) return

    if (!accessToken || user?.role !== 'admin') {
      router.push('/admin')
    }
  }, [accessToken, user, router, isPublicAdminEntry])

  useEffect(() => {
    if (isPublicAdminEntry && accessToken && user?.role === 'admin') {
      router.push('/admin/documents')
    }
  }, [isPublicAdminEntry, accessToken, user, router])

  const handleLogout = async () => {
    await logout()
    router.push('/admin')
  }

  if (isPublicAdminEntry) {
    return <div className="min-h-screen bg-background">{children}</div>
  }

  if (!user || user.role !== 'admin') return null

  return (
    <div className="min-h-screen bg-background">
      <nav className="h-16 border-b border-border/30 px-6 flex items-center justify-between">
        <Link href="/admin/documents" className="flex items-center gap-2 font-semibold">
          <ClipboardCheck className="h-5 w-5 text-slate-700" />
          Admin Panel
        </Link>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/documents"
            className={`text-sm px-3 py-1.5 rounded ${pathname === '/admin/documents' ? 'bg-slate-900 text-white' : 'text-muted-foreground'}`}
          >
            Document Queue
          </Link>
          <button onClick={handleLogout} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </nav>
      <main className="max-w-6xl mx-auto p-6">{children}</main>
    </div>
  )
}
