'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Header } from '@/components/layout/Header'
import { Sidebar } from '@/components/layout/Sidebar'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner"></div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-100 via-white to-slate-200/60">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.12),_transparent_45%),_radial-gradient(circle_at_bottom_right,_rgba(129,140,248,0.12),_transparent_40%)]" />
      <Header />
      <div className="relative flex">
        <Sidebar />
        <main className="flex-1 px-4 pb-10 pt-24 lg:ml-72 lg:px-10">
          {children}
        </main>
      </div>
    </div>
  )
}
