'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { JobOrder, PaginatedResponse } from '@/types'
import { formatDate, getStatusColor } from '@/lib/utils'
import Link from 'next/link'
import { Plus, Search, Filter } from 'lucide-react'

export default function JobOrdersPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['job-orders', searchTerm, statusFilter],
    queryFn: () => {
      let url = '/job-orders/?page_size=50'
      if (searchTerm) url += `&search=${searchTerm}`
      if (statusFilter !== 'all') url += `&status=${statusFilter}`
      return apiClient.get<PaginatedResponse<JobOrder>>(url)
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Job Orders</h1>
          <p className="text-gray-600 mt-2">Manage inspection job orders</p>
        </div>
        <Link
          href="/dashboard/job-orders/create"
          className="flex items-center space-x-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Create Job Order</span>
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by PO reference or client..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none bg-white text-gray-900 cursor-pointer"
            >
              <option value="all" className="text-gray-900">All Status</option>
              <option value="DRAFT" className="text-gray-900">Draft</option>
              <option value="SCHEDULED" className="text-gray-900">Scheduled</option>
              <option value="IN_PROGRESS" className="text-gray-900">In Progress</option>
              <option value="COMPLETED" className="text-gray-900">Completed</option>
              <option value="PUBLISHED" className="text-gray-900">Published</option>
              <option value="CANCELLED" className="text-gray-900">Cancelled</option>
            </select>
          </div>

          <button
            onClick={() => refetch()}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Job Orders List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="spinner"></div>
          </div>
        ) : data?.results.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No job orders found</p>
            <Link
              href="/dashboard/job-orders/create"
              className="text-primary-600 hover:text-primary-700 mt-2 inline-block"
            >
              Create your first job order
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    PO Reference
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Site Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Scheduled Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Finance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data?.results.map((jobOrder) => (
                  <tr key={jobOrder.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {jobOrder.po_reference || `JO-${jobOrder.id}`}
                      </div>
                      <div className="text-xs text-gray-500">
                        Created {formatDate(jobOrder.created_at)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{jobOrder.client_name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">
                        {jobOrder.site_location}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {jobOrder.scheduled_start ? formatDate(jobOrder.scheduled_start) : 'Not scheduled'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(jobOrder.status)}`}>
                        {jobOrder.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(jobOrder.finance_status)}`}>
                        {jobOrder.finance_status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Link
                        href={`/dashboard/job-orders/${jobOrder.id}`}
                        className="text-primary-600 hover:text-primary-900"
                      >
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination Info */}
      {data && data.results.length > 0 && (
        <div className="bg-white rounded-lg shadow px-6 py-4">
          <p className="text-sm text-gray-700">
            Showing <span className="font-medium">{data.results.length}</span> of{' '}
            <span className="font-medium">{data.count}</span> job orders
          </p>
        </div>
      )}
    </div>
  )
}
