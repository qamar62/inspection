'use client'

import { useSession } from 'next-auth/react'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { JobOrder, Inspection } from '@/types'
import { 
  ClipboardList, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  TrendingUp 
} from 'lucide-react'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'

export default function DashboardPage() {
  const { data: session } = useSession()

  const { data: jobOrders, isLoading: loadingJobs } = useQuery({
    queryKey: ['job-orders', 'recent'],
    queryFn: () => apiClient.get<{ results: JobOrder[] }>('/job-orders/?page_size=10'),
  })

  const { data: inspections, isLoading: loadingInspections } = useQuery({
    queryKey: ['inspections', 'recent'],
    queryFn: () => apiClient.get<{ results: Inspection[] }>('/inspections/?page_size=10'),
  })

  const stats = [
    {
      name: 'Total Job Orders',
      value: jobOrders?.results.length || 0,
      icon: ClipboardList,
      color: 'bg-blue-500',
    },
    {
      name: 'Completed Inspections',
      value: inspections?.results.filter(i => i.status === 'APPROVED').length || 0,
      icon: CheckCircle,
      color: 'bg-green-500',
    },
    {
      name: 'Pending Inspections',
      value: inspections?.results.filter(i => i.status === 'SUBMITTED').length || 0,
      icon: Clock,
      color: 'bg-yellow-500',
    },
    {
      name: 'In Progress',
      value: inspections?.results.filter(i => i.status === 'IN_PROGRESS').length || 0,
      icon: TrendingUp,
      color: 'bg-purple-500',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {session?.user?.name}!
        </h1>
        <p className="text-gray-600 mt-2">
          Here's what's happening with your inspections today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div
            key={stat.name}
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{stat.name}</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
              </div>
              <div className={`${stat.color} p-3 rounded-lg`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Job Orders */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Recent Job Orders</h2>
        </div>
        <div className="p-6">
          {loadingJobs ? (
            <div className="flex justify-center py-8">
              <div className="spinner"></div>
            </div>
          ) : jobOrders?.results.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No job orders found</p>
          ) : (
            <div className="space-y-4">
              {jobOrders?.results.slice(0, 5).map((job) => (
                <Link
                  key={job.id}
                  href={`/dashboard/job-orders/${job.id}`}
                  className="block p-4 border border-gray-200 rounded-lg hover:border-primary-500 hover:shadow-md transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">{job.po_reference}</h3>
                      <p className="text-sm text-gray-600">{job.client_name}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDate(job.created_at)}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      job.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                      job.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {job.status}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Inspections */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Recent Inspections</h2>
        </div>
        <div className="p-6">
          {loadingInspections ? (
            <div className="flex justify-center py-8">
              <div className="spinner"></div>
            </div>
          ) : inspections?.results.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No inspections found</p>
          ) : (
            <div className="space-y-4">
              {inspections?.results.slice(0, 5).map((inspection) => (
                <Link
                  key={inspection.id}
                  href={`/dashboard/inspections/${inspection.id}`}
                  className="block p-4 border border-gray-200 rounded-lg hover:border-primary-500 hover:shadow-md transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        Inspection #{inspection.id}
                      </h3>
                      <p className="text-sm text-gray-600">{inspection.inspector_name}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {inspection.start_time ? formatDate(inspection.start_time) : 'Not started'}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      inspection.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                      inspection.status === 'SUBMITTED' ? 'bg-purple-100 text-purple-800' :
                      inspection.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                      inspection.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {inspection.status}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
