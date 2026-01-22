'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { JobOrder } from '@/types'
import { formatDate, formatDateTime, getStatusColor } from '@/lib/utils'
import Link from 'next/link'
import { ArrowLeft, UserPlus, FileText, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'
import { useState } from 'react'

export default function JobOrderDetailPage({ params }: { params: { id: string } }) {
  const queryClient = useQueryClient()
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [selectedInspector, setSelectedInspector] = useState('')

  const { data: jobOrder, isLoading } = useQuery({
    queryKey: ['job-order', params.id],
    queryFn: () => apiClient.get<JobOrder>(`/job-orders/${params.id}/`),
  })

  const { data: inspectors } = useQuery({
    queryKey: ['users', 'inspectors'],
    queryFn: () => apiClient.get('/users/?role=INSPECTOR'),
  })

  const assignMutation = useMutation({
    mutationFn: (data: { inspector_id: number }) =>
      apiClient.post(`/job-orders/${params.id}/assign/`, data),
    onSuccess: () => {
      toast.success('Inspector assigned successfully')
      queryClient.invalidateQueries({ queryKey: ['job-order', params.id] })
      setShowAssignModal(false)
    },
    onError: () => {
      toast.error('Failed to assign inspector')
    },
  })

  const handleAssign = () => {
    if (!selectedInspector) {
      toast.error('Please select an inspector')
      return
    }
    assignMutation.mutate({ inspector_id: parseInt(selectedInspector) })
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="spinner"></div>
      </div>
    )
  }

  if (!jobOrder) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Job order not found</p>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href="/dashboard/job-orders"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {jobOrder.po_reference || `Job Order #${jobOrder.id}`}
            </h1>
            <p className="text-gray-600 mt-1">Created {formatDate(jobOrder.created_at)}</p>
          </div>
        </div>

        <button
          onClick={() => setShowAssignModal(true)}
          className="flex items-center space-x-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
        >
          <UserPlus className="w-5 h-5" />
          <span>Assign Inspector</span>
        </button>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Status</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                <span className={`px-3 py-1 text-sm rounded-full ${getStatusColor(jobOrder.status)}`}>
                  {jobOrder.status}
                </span>
              </p>
            </div>
            <FileText className="w-8 h-8 text-primary-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Line Items</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {jobOrder.line_items?.length || 0}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Finance Status</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                <span className={`px-3 py-1 text-sm rounded-full ${getStatusColor(jobOrder.finance_status)}`}>
                  {jobOrder.finance_status}
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Job Order Details */}
      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">Job Order Details</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm font-medium text-gray-500">Client</p>
            <p className="text-base text-gray-900 mt-1">{jobOrder.client_name}</p>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-500">PO Reference</p>
            <p className="text-base text-gray-900 mt-1">{jobOrder.po_reference || 'N/A'}</p>
          </div>

          <div className="md:col-span-2">
            <p className="text-sm font-medium text-gray-500">Site Location</p>
            <p className="text-base text-gray-900 mt-1">{jobOrder.site_location}</p>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-500">Scheduled Start</p>
            <p className="text-base text-gray-900 mt-1">
              {jobOrder.scheduled_start ? formatDateTime(jobOrder.scheduled_start) : 'Not scheduled'}
            </p>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-500">Scheduled End</p>
            <p className="text-base text-gray-900 mt-1">
              {jobOrder.scheduled_end ? formatDateTime(jobOrder.scheduled_end) : 'Not scheduled'}
            </p>
          </div>

          {jobOrder.notes && (
            <div className="md:col-span-2">
              <p className="text-sm font-medium text-gray-500">Notes</p>
              <p className="text-base text-gray-900 mt-1">{jobOrder.notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Line Items */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Line Items</h2>
        </div>
        
        {jobOrder.line_items && jobOrder.line_items.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Equipment</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Inspections</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {jobOrder.line_items.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.type}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{item.description}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.equipment_info?.tag_code || 'Not assigned'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.quantity}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(item.status)}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.inspections?.length || 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No line items added yet
          </div>
        )}
      </div>

      {/* Assign Inspector Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Assign Inspector</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Inspector
              </label>
              <select
                value={selectedInspector}
                onChange={(e) => setSelectedInspector(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">Choose an inspector</option>
                {inspectors?.results?.map((inspector: any) => (
                  <option key={inspector.id} value={inspector.id}>
                    {inspector.first_name} {inspector.last_name} ({inspector.username})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => setShowAssignModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAssign}
                disabled={assignMutation.isPending}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
              >
                {assignMutation.isPending ? 'Assigning...' : 'Assign'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
