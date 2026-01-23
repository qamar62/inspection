'use client'

import { signOut, useSession } from 'next-auth/react'
import { Menu, LogOut, Bell, ChevronDown, ShieldCheck, CircleUser } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useOfflineStorage } from '@/hooks/useOfflineStorage'

export function Header() {
  const { data: session } = useSession()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const { getPendingCount } = useOfflineStorage()
  const pendingCount = getPendingCount()
  const roleLabel = useMemo(() => session?.user?.role?.replace(/_/g, ' ') ?? 'Team Member', [session?.user?.role])
  const initials = useMemo(() => {
    const name = session?.user?.name || roleLabel
    return name
      .split(' ')
      .map((part) => part.charAt(0))
      .join('')
      .slice(0, 2)
      .toUpperCase()
  }, [session?.user?.name, roleLabel])

  return (
    <header className="sticky top-0 z-40 border-b border-white/40 bg-white/70 backdrop-blur-xl supports-[backdrop-filter]:bg-white/60">
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-sky-200/60 to-transparent" />
      <div className="flex items-center justify-between px-4 py-3 lg:px-10 lg:pl-[20rem]">
        <div className="flex items-center gap-3">
          <button className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white/80 text-slate-500 shadow-sm transition hover:border-sky-200 hover:text-slate-900 lg:hidden">
            <Menu className="h-5 w-5" />
          </button>
          <div>
            <p className="text-xs uppercase tracking-widest text-slate-400">Operations Overview</p>
            <h1 className="text-xl font-semibold text-slate-800 lg:text-2xl">Inspection Division Dashboard</h1>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {pendingCount > 0 && (
            <div className="hidden items-center gap-2 rounded-full border border-amber-200 bg-amber-50/80 px-3 py-1 text-sm font-medium text-amber-700 sm:flex">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75 animate-ping" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
              </span>
              {pendingCount} pending sync
            </div>
          )}

          <button className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:border-sky-200 hover:text-slate-900 md:inline-flex">
            <ShieldCheck className="h-4 w-4 text-sky-500" />
            Compliance mode
          </button>

          <button className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white/80 text-slate-500 shadow-sm transition hover:border-sky-200 hover:text-slate-900">
            <Bell className="h-5 w-5" />
            <span className="absolute top-2 right-2 inline-flex h-2 w-2 rounded-full bg-rose-500" />
          </button>

          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="inline-flex items-center gap-3 rounded-2xl border border-slate-200 bg-white/90 px-3 py-2 text-left shadow-sm transition hover:border-sky-200 hover:shadow"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-indigo-500 text-white shadow-inner shadow-indigo-300/50">
                {initials.length > 1 ? (
                  <span className="text-sm font-semibold">{initials}</span>
                ) : (
                  <CircleUser className="h-5 w-5" />
                )}
              </div>
              <div className="hidden min-w-[8rem] text-left sm:block">
                <p className="text-sm font-semibold text-slate-900">{session?.user?.name ?? 'Team Member'}</p>
                <p className="text-xs uppercase tracking-wide text-slate-400">{roleLabel}</p>
              </div>
              <ChevronDown className="h-4 w-4 text-slate-400" />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-3 w-52 overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95 shadow-xl backdrop-blur">
                <div className="border-b border-slate-100/80 px-4 py-3 text-sm text-slate-500">
                  Signed in as
                  <p className="font-semibold text-slate-800">{session?.user?.email ?? '—'}</p>
                </div>
                <button
                  onClick={() => signOut({ callbackUrl: '/login' })}
                  className="flex w-full items-center gap-2 px-4 py-3 text-sm font-medium text-rose-500 transition hover:bg-rose-50"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
