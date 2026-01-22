'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
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
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface NavItem {
  name: string
  href: string
  icon: any
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

  const filteredNavigation = navigation.filter(item => {
    if (!item.roles) return true
    return item.roles.includes(userRole || '')
  })

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:pt-16 bg-white border-r border-gray-200">
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {filteredNavigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-700 hover:bg-gray-100'
              )}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.name}</span>
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-gray-200">
        <div className="bg-primary-50 rounded-lg p-4">
          <p className="text-xs font-semibold text-primary-900">Need Help?</p>
          <p className="text-xs text-primary-700 mt-1">
            Contact support for assistance
          </p>
          <button className="mt-3 w-full bg-primary-600 text-white text-xs py-2 rounded-md hover:bg-primary-700">
            Get Support
          </button>
        </div>
      </div>
    </aside>
  )
}
