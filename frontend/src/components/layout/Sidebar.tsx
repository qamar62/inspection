'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import type { LucideIcon } from 'lucide-react'
import {
  LayoutDashboard,
  ClipboardList,
  FileText,
  CheckSquare,
  Users,
  Settings,
  Package,
  QrCode,
  FileCheck,
  BarChart3,
  LibraryBig,
  Sparkles,
  ArrowUpRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface NavItem {
  name: string
  href: string
  icon: LucideIcon
  roles?: string[]
}

const navigation: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Job Orders', href: '/dashboard/job-orders', icon: ClipboardList },
  { 
    name: 'Services',
    href: '/dashboard/services',
    icon: LibraryBig,
    roles: ['ADMIN', 'TEAM_LEAD', 'TECHNICAL_MANAGER']
  },
  { name: 'Inspections', href: '/dashboard/inspections', icon: FileText },
  { name: 'Equipment', href: '/dashboard/equipment', icon: Package },
  { 
    name: 'Approvals', 
    href: '/dashboard/approvals', 
    icon: CheckSquare,
    roles: ['ADMIN', 'TECHNICAL_MANAGER', 'TEAM_LEAD']
  },
  { name: 'Certificates', href: '/dashboard/certificates', icon: FileCheck },
  { name: 'Stickers', href: '/dashboard/stickers', icon: QrCode },
  { 
    name: 'Clients', 
    href: '/dashboard/clients', 
    icon: Users,
    roles: ['ADMIN', 'TEAM_LEAD']
  },
  { 
    name: 'Reports', 
    href: '/dashboard/reports', 
    icon: BarChart3,
    roles: ['ADMIN', 'TEAM_LEAD', 'TECHNICAL_MANAGER']
  },
  { 
    name: 'Settings', 
    href: '/dashboard/settings', 
    icon: Settings,
    roles: ['ADMIN']
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const userRole = session?.user?.role

  const filteredNavigation = navigation.filter((item) => {
    if (!item.roles) return true
    return item.roles.includes(userRole || '')
  })

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-72 lg:fixed lg:inset-y-0 lg:pt-20 bg-gradient-to-b from-white/90 via-white/60 to-white/40 border-r border-slate-200/60 backdrop-blur-xl">
      <div className="px-6 pb-6">
        <div className="rounded-2xl bg-gradient-to-br from-sky-500/10 via-white to-indigo-500/10 border border-white/60 shadow-sm shadow-sky-100/40 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400">Inspection Division</p>
              <p className="mt-1 text-lg font-semibold text-slate-800">Control Center</p>
            </div>
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-sky-500 shadow-inner shadow-white/70">
              <Sparkles className="h-5 w-5" />
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 font-medium text-emerald-600">
              Live
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </span>
            <span>Role: {userRole ?? '—'}</span>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
        {filteredNavigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'group relative flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200',
                isActive
                  ? 'bg-white text-slate-900 shadow-[0_10px_40px_-20px_rgba(56,189,248,0.65)] ring-1 ring-sky-200'
                  : 'text-slate-600 hover:bg-white/70 hover:text-slate-900'
              )}
            >
              <div
                className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-xl border transition-colors',
                  isActive
                    ? 'border-transparent bg-gradient-to-br from-sky-500 to-indigo-500 text-white shadow-inner shadow-indigo-300/50'
                    : 'border-slate-200 bg-white/80 text-slate-500'
                )}
              >
                <item.icon className="h-4 w-4" />
              </div>
              <span className="flex-1">{item.name}</span>
              <ArrowUpRight
                className={cn(
                  'h-4 w-4 transition-opacity duration-200',
                  isActive ? 'opacity-100 text-sky-500' : 'opacity-0 text-slate-300 group-hover:opacity-100'
                )}
              />
            </Link>
          )
        })}
      </nav>

      <div className="px-6 pb-8">
        <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-lg shadow-slate-200/50">
          <p className="text-sm font-semibold text-slate-800">Need a walkthrough?</p>
          <p className="mt-1 text-xs text-slate-500">
            Book a quick session with our onboarding team to explore new automations.
          </p>
          <button className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-sky-500 to-indigo-500 px-3 py-2 text-sm font-medium text-white shadow-sm hover:shadow transition-shadow">
            <Sparkles className="h-4 w-4" />
            Schedule demo
          </button>
        </div>
      </div>
    </aside>
  )
}
