'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { Approval, PaginatedResponse } from '@/types'
import { formatDateTime } from '@/lib/utils'
import { CheckCircle2, Clock3, Filter, ListChecks, XCircle } from 'lucide-react'

interface FilterOption {
  label: string
  value: string
}

const ENTITY_OPTIONS: FilterOption[] = [
  { label: 'All entities', value: 'all' },
  { label: 'Inspections', value: 'INSPECTION' },
  { label: 'Certificates', value: 'CERTIFICATE' },
  { label: 'Job Orders', value: 'JOB_ORDER' },
]

const DECISION_OPTIONS: FilterOption[] = [
  { label: 'All decisions', value: 'all' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Approved', value: 'APPROVED' },
  { label: 'Rejected', value: 'REJECTED' },
]

type DecisionSummary = {
  total: number
  PENDING: number
  APPROVED: number
  REJECTED: number
}

function getDecisionBadge(decision: Approval['decision']) {
  switch (decision) {
    case 'APPROVED':
      return 'bg-emerald-50 text-emerald-700'
    case 'REJECTED':
      return 'bg-red-50 text-red-700'
    default:
      return 'bg-amber-50 text-amber-700'
  }
}

function getDecisionIcon(decision: Approval['decision']) {
  switch (decision) {
    case 'APPROVED':
      return <CheckCircle2 className="h-4 w-4" />
    case 'REJECTED':
      return <XCircle className="h-4 w-4" />
    default:
      return <Clock3 className="h-4 w-4" />
  }
}

function getEntityLink(entityType: Approval['entity_type'], entityId: number | string): string | null {
  switch (entityType) {
    case 'INSPECTION':
      return `/dashboard/inspections/${entityId}`
    case 'JOB_ORDER':
      return `/dashboard/job-orders/${entityId}`
    default:
      return null
  }
}

export default function ApprovalsPage() {
  const [entityFilter, setEntityFilter] = useState<string>('all')
  const [decisionFilter, setDecisionFilter] = useState<string>('all')

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['approvals', entityFilter, decisionFilter],
    queryFn: () => {
      const params = new URLSearchParams({ page_size: '50' })
      if (entityFilter !== 'all') {
        params.set('entity_type', entityFilter)
      }
      if (decisionFilter !== 'all') {
        params.set('decision', decisionFilter)
      }
      return apiClient.get<PaginatedResponse<Approval>>(`/approvals/?${params.toString()}`)
    },
  })

  const approvals = data?.results ?? []

  const decisionCounts = useMemo<DecisionSummary>(() => {
    return approvals.reduce<DecisionSummary>(
      (acc, approval) => {
        acc.total += 1
        acc[approval.decision] = acc[approval.decision] + 1
        return acc
      },
      { total: 0, PENDING: 0, APPROVED: 0, REJECTED: 0 }
    )
  }, [approvals])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Approvals</h1>
          <p className="mt-2 text-gray-600">Track approval decisions across inspections, certificates, and job orders.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Total approvals</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">{decisionCounts.total}</p>
        </div>
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Approved</p>
          <p className="mt-2 text-2xl font-bold text-emerald-800">{decisionCounts.APPROVED}</p>
        </div>
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Pending</p>
          <p className="mt-2 text-2xl font-bold text-amber-800">{decisionCounts.PENDING}</p>
        </div>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-red-700">Rejected</p>
          <p className="mt-2 text-2xl font-bold text-red-800">{decisionCounts.REJECTED}</p>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block text-sm font-medium text-gray-700">
            <span className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
              <ListChecks className="h-4 w-4" /> Entity Type
            </span>
            <div className="relative">
              <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <select
                value={entityFilter}
                onChange={(event) => setEntityFilter(event.target.value)}
                className="w-full appearance-none rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-4 text-sm text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
              >
                {ENTITY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </label>

          <label className="block text-sm font-medium text-gray-700">
            <span className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
              <CheckCircle2 className="h-4 w-4" /> Decision
            </span>
            <div className="relative">
              <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <select
                value={decisionFilter}
                onChange={(event) => setDecisionFilter(event.target.value)}
                className="w-full appearance-none rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-4 text-sm text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
              >
                {DECISION_OPTIONS.map((option) => (
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
            <p className="text-lg font-semibold text-gray-900">Unable to load approvals</p>
            <p className="text-sm text-gray-500">
              {error instanceof Error ? error.message : 'Please try again later.'}
            </p>
          </div>
        ) : approvals.length === 0 ? (
          <div className="space-y-2 py-12 text-center">
            <p className="text-lg font-semibold text-gray-900">No approvals found</p>
            <p className="text-sm text-gray-500">Adjust filters or check back after more inspections are submitted.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Entity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Approver
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Decision
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Comment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Decided At
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Created At
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {approvals.map((approval) => {
                  const entityLink = getEntityLink(approval.entity_type, approval.entity_id)
                  return (
                    <tr key={approval.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div className="flex flex-col">
                          <span className="font-semibold tracking-wide text-gray-700">{approval.entity_type}</span>
                          {entityLink ? (
                            <Link href={entityLink} className="text-primary-600 hover:text-primary-900">
                              View #{approval.entity_id}
                            </Link>
                          ) : (
                            <span className="text-gray-500">ID #{approval.entity_id}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        <div className="font-medium text-gray-900">{approval.approver_name}</div>
                        <div className="text-xs text-gray-500">User #{approval.approver}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${getDecisionBadge(approval.decision)}`}>
                          {getDecisionIcon(approval.decision)}
                          {approval.decision}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {approval.comment ? approval.comment : <span className="text-gray-400">—</span>}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {approval.decided_at ? formatDateTime(approval.decided_at) : <span className="text-gray-400">Pending</span>}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{formatDateTime(approval.created_at)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
