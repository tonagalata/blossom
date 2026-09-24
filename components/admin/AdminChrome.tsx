'use client'

import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'
import AdminSidebar from './AdminSidebar'
import AdminTopbar from './AdminTopbar'
import { AuthProvider } from '@/lib/auth-context'
import { Toaster } from '@/components/ui/Toaster'

export default function AdminChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const isLogin = pathname === '/admin/login'

  return (
    <AuthProvider>
      {isLogin ? (
        <>
          {children}
          <Toaster />
        </>
      ) : (
        <div className="flex min-h-screen bg-bloom-bg">
          <AdminSidebar />
          <div className="flex min-h-screen flex-1 flex-col">
            <AdminTopbar />
            <main className="flex-1 overflow-y-auto p-6">{children}</main>
          </div>
          <Toaster />
        </div>
      )}
    </AuthProvider>
  )
}
