'use client'

import { ChangeEvent, useMemo, useState } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { FieldInspectionReport, PaginatedResponse } from '@/types'
import { formatDateTime, formatDate } from '@/lib/utils'
import { Download, Filter, FileText, Share2, FileSearch } from 'lucide-react'

interface FilterOption {
  label: string
  value: string
}

const DATE_FILTERS: FilterOption[] = [
  { label: 'Any time', value: 'all' },
  { label: 'Last 7 days', value: '7d' },
  { label: 'Last 30 days', value: '30d' },
  { label: 'This year', value: 'year' },
]

function filterParamsFromDateValue(value: string): Record<string, string> {
  const params: Record<string, string> = {}
  const now = new Date()
  switch (value) {
    case '7d':
      params.created_after = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
      break
    case '30d':
      params.created_after = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
      break
    case 'year':
      params.created_after = new Date(now.getFullYear(), 0, 1).toISOString()
      break
    default:
      break
  }
  return params
}

function getReportShareUrl(token: string) {
  if (typeof window === 'undefined') return `#share-${token}`
  const baseUrl = window.location.origin
  return `${baseUrl}/fir/public/${token}`
}

export default function ReportsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [dateFilter, setDateFilter] = useState('all')

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['field-reports', searchTerm, dateFilter],
    queryFn: () => {
      const params = new URLSearchParams({ page_size: '50' })
      if (searchTerm.trim()) {
        params.set('search', searchTerm.trim())
      }
      const dateParams = filterParamsFromDateValue(dateFilter)
      Object.entries(dateParams).forEach(([key, value]) => params.set(key, value))
      return apiClient.get<PaginatedResponse<FieldInspectionReport>>(`/field-reports/?${params.toString()}`)
    },
  })

  const reports = data?.results ?? []

  const summary = useMemo(() => {
    if (reports.length === 0) {
      return {
        total: 0,
        sentCount: 0,
        uniqueClients: 0,
      }
    }

    const sentCount = reports.filter((report: FieldInspectionReport) => !!report.sent_to).length
    const clientSet = new Set(
      reports
        .map((report: FieldInspectionReport) => report.job_order_info?.client_name)
        .filter((value): value is string => Boolean(value))
    )

    return {
      total: reports.length,
      sentCount,
      uniqueClients: clientSet.size,
    }
  }, [reports])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Field Inspection Reports</h1>
          <p className="mt-2 text-gray-600">
            Download consolidated inspection reports and track distribution to clients.
          </p>
        </div>
        <Link
          href="/dashboard/job-orders"
          className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-700"
        >
          <FileText className="h-4 w-4" />
          Manage Job Orders
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Reports generated</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">{summary.total}</p>
        </div>
        <div className="rounded-lg border border-primary-200 bg-primary-50 p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary-700">Shared with clients</p>
          <p className="mt-2 text-2xl font-bold text-primary-900">{summary.sentCount}</p>
        </div>
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Clients covered</p>
          <p className="mt-2 text-2xl font-bold text-emerald-900">{summary.uniqueClients}</p>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block text-sm font-medium text-gray-700">
            <span className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
              <FileSearch className="h-4 w-4" /> Search by Job Order / Client
            </span>
            <input
              value={searchTerm}
              onChange={(event: ChangeEvent<HTMLInputElement>) => setSearchTerm(event.target.value)}
              placeholder="e.g. PO reference, client name"
              className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
            />
          </label>

          <label className="block text-sm font-medium text-gray-700">
            <span className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
              <Filter className="h-4 w-4" /> Date Range
            </span>
            <div className="relative">
              <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <select
                value={dateFilter}
                onChange={(event: ChangeEvent<HTMLSelectElement>) => setDateFilter(event.target.value)}
                className="w-full appearance-none rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-4 text-sm text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
              >
                {DATE_FILTERS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </label>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="spinner" />
          </div>
        ) : isError ? (
          <div className="space-y-2 py-12 text-center">
            <p className="text-lg font-semibold text-gray-900">Unable to load reports</p>
            <p className="text-sm text-gray-500">
              {error instanceof Error ? error.message : 'Please try again later.'}
            </p>
          </div>
        ) : reports.length === 0 ? (
          <div className="space-y-2 py-12 text-center">
            <p className="text-lg font-semibold text-gray-900">No reports generated yet</p>
            <p className="text-sm text-gray-500">
              Generate a job order report to see it listed here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Job Order
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Summary
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Generated
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Sent To
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {reports.map((report: FieldInspectionReport) => (
                  <tr key={report.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="flex flex-col">
                        <span className="font-semibold text-gray-800">
                          {report.job_order_info?.po_reference || `Job Order #${report.job_order}`}
                        </span>
                        <span className="text-xs text-gray-500">
                          Client: {report.job_order_info?.client_name || 'Unknown'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      <p className="line-clamp-3 text-sm text-gray-600">{report.summary}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{formatDateTime(report.created_at)}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {report.sent_to ? report.sent_to : <span className="text-gray-400">Not sent</span>}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      <div className="flex flex-wrap items-center gap-3">
                        {report.fir_pdf && (
                          <a
                            href={report.fir_pdf}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 rounded-md border border-primary-200 bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700 transition-colors hover:bg-primary-100"
                          >
                            <Download className="h-4 w-4" /> Download PDF
                          </a>
                        )}
                        <a
                          href={getReportShareUrl(report.share_link_token)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-100"
                        >
                          <Share2 className="h-4 w-4" /> Share Link
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
