'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { Inspection, InspectionAnswer, JobLineItem, PhotoRef } from '@/types'
import { formatDateTime, getStatusColor } from '@/lib/utils'
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ClipboardSignature,
  FileText,
  ImageIcon,
  Loader2,
  MapPin,
  XCircle,
} from 'lucide-react'
import { toast } from 'sonner'

interface PageProps {
  params: {
    id: string
  }
}

export default function InspectionDetailPage({ params }: PageProps) {
  const queryClient = useQueryClient()
  const { data: session } = useSession()
  const userRole = session?.user?.role
  const [rejectComment, setRejectComment] = useState('')

  const {
    data: inspection,
    isLoading: isInspectionLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['inspection', params.id],
    queryFn: () => apiClient.get<Inspection>(`/inspections/${params.id}/`),
  })

  const { data: lineItem, isLoading: isLineItemLoading } = useQuery({
    queryKey: ['inspection', params.id, 'line-item'],
    enabled: !!inspection?.job_line_item,
    queryFn: () => apiClient.get<JobLineItem>(`/line-items/${inspection?.job_line_item}/`),
  })

  const approveMutation = useMutation({
    mutationFn: (comment?: string) =>
      apiClient.post<Inspection>(`/inspections/${params.id}/approve/`, comment ? { comment } : undefined),
    onSuccess: () => {
      toast.success('Inspection approved')
      queryClient.invalidateQueries({ queryKey: ['inspection', params.id] })
      queryClient.invalidateQueries({ queryKey: ['inspections'] })
    },
    onError: (mutationError: unknown) => {
      const message = (mutationError as any)?.response?.data?.error ?? 'Unable to approve inspection'
      toast.error(message)
    },
  })

  const rejectMutation = useMutation({
    mutationFn: (comment: string) =>
      apiClient.post<Inspection>(`/inspections/${params.id}/reject/`, { comment }),
    onSuccess: () => {
      toast.success('Inspection rejected')
      setRejectComment('')
      queryClient.invalidateQueries({ queryKey: ['inspection', params.id] })
      queryClient.invalidateQueries({ queryKey: ['inspections'] })
    },
    onError: (mutationError: unknown) => {
      const message = (mutationError as any)?.response?.data?.error ?? 'Unable to reject inspection'
      toast.error(message)
    },
  })

  const canReviewInspection = ['ADMIN', 'TECHNICAL_MANAGER', 'TEAM_LEAD'].includes(userRole || '')
  const showReviewActions = canReviewInspection && inspection?.status === 'SUBMITTED'

  const checklistAnswers = useMemo<InspectionAnswer[]>(() => inspection?.answers ?? [], [inspection?.answers])
  const photoEvidence = useMemo<PhotoRef[]>(() => inspection?.photos ?? [], [inspection?.photos])

  if (isInspectionLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

  if (isError || !inspection) {
    return (
      <div className="space-y-4 rounded-lg border border-red-200 bg-red-50 p-6 text-red-700">
        <p className="text-lg font-semibold">Unable to load inspection</p>
        <p className="text-sm">
          {error instanceof Error ? error.message : 'Please refresh the page or try again later.'}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/inspections" className="rounded-lg p-2 text-gray-600 hover:bg-gray-100">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Inspection #{inspection.id}</h1>
            <p className="mt-1 text-sm text-gray-500">
              Created {inspection.created_at ? formatDateTime(inspection.created_at) : '—'}
            </p>
          </div>
        </div>

        <span
          className={`rounded-full px-4 py-2 text-sm font-semibold uppercase tracking-wide ${getStatusColor(
            inspection.status
          )}`}
        >
          {inspection.status}
        </span>
      </div>

      {showReviewActions && (
        <div className="flex flex-col gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium text-amber-800">Action required</p>
            <p className="text-sm text-amber-700">
              Review the submitted inspection and approve or reject with a comment.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => approveMutation.mutate()}
              disabled={approveMutation.isPending}
              className="flex items-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-60"
            >
              {approveMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              Approve
            </button>
            <div className="flex items-center gap-2">
              <input
                value={rejectComment}
                onChange={(event) => setRejectComment(event.target.value)}
                placeholder="Rejection comment"
                className="w-48 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
              />
              <button
                type="button"
                onClick={() => rejectMutation.mutate(rejectComment)}
                disabled={!rejectComment.trim() || rejectMutation.isPending}
                className="flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-60"
              >
                {rejectMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <XCircle className="h-4 w-4" />
                )}
                Reject
              </button>
            </div>
          </div>
        </div>
      )}

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm lg:col-span-2">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
            <FileText className="h-5 w-5 text-primary-600" /> Inspection Details
          </h2>
          <dl className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-gray-500">Inspector</dt>
              <dd className="text-base text-gray-900">{inspection.inspector_name || 'Unassigned'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Checklist Template</dt>
              <dd className="text-base text-gray-900">{inspection.checklist_template || 'Not set'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Start Time</dt>
              <dd className="text-base text-gray-900">
                {inspection.start_time ? formatDateTime(inspection.start_time) : 'Not started'}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">End Time</dt>
              <dd className="text-base text-gray-900">
                {inspection.end_time ? formatDateTime(inspection.end_time) : 'Not finished'}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Geo Location</dt>
              <dd className="flex items-center gap-2 text-base text-gray-900">
                <MapPin className="h-4 w-4 text-primary-600" />
                {typeof inspection.geo_location_lat === 'number' && typeof inspection.geo_location_lng === 'number' ? (
                  <span>
                    {inspection.geo_location_lat.toFixed(6)}, {inspection.geo_location_lng.toFixed(6)}
                  </span>
                ) : (
                  <span className="text-gray-500">Not recorded</span>
                )}
              </dd>
            </div>
          </dl>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Line Item & Equipment</h2>
          {isLineItemLoading ? (
            <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
          ) : lineItem ? (
            <dl className="space-y-3 text-sm text-gray-700">
              <div>
                <dt className="font-medium text-gray-500">Line Item Type</dt>
                <dd className="text-gray-900">{lineItem.type}</dd>
              </div>
              <div>
                <dt className="font-medium text-gray-500">Description</dt>
                <dd className="text-gray-900">{lineItem.description}</dd>
              </div>
              <div>
                <dt className="font-medium text-gray-500">Equipment</dt>
                <dd className="text-gray-900">{lineItem.equipment_info?.tag_code ?? 'Not assigned'}</dd>
              </div>
              <div>
                <dt className="font-medium text-gray-500">Quantity</dt>
                <dd className="text-gray-900">{lineItem.quantity}</dd>
              </div>
              <div>
                <dt className="font-medium text-gray-500">Line Item Status</dt>
                <dd>
                  <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusColor(
                    lineItem.status
                  )}`}>
                    {lineItem.status}
                  </span>
                </dd>
              </div>
            </dl>
          ) : (
            <p className="text-sm text-gray-500">Line item information unavailable.</p>
          )}
        </div>
      </section>

      <section className="space-y-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-gray-900">Checklist Answers</h2>
          {checklistAnswers.length === 0 && (
            <span className="text-sm text-gray-500">No answers recorded</span>
          )}
        </div>
        {checklistAnswers.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-3">Question</th>
                  <th className="px-4 py-3">Result</th>
                  <th className="px-4 py-3">Comment</th>
                  <th className="px-4 py-3">Photos</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {checklistAnswers.map((answer: InspectionAnswer) => (
                  <tr key={answer.id}>
                    <td className="px-4 py-3 font-medium text-gray-900">{answer.question_key}</td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          answer.result === 'SAFE'
                            ? 'rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700'
                            : answer.result === 'NOT_SAFE'
                              ? 'rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700'
                              : 'rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700'
                        }
                      >
                        {answer.result.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{answer.comment || '—'}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {answer.photos && answer.photos.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {answer.photos.map((photo: PhotoRef) => (
                            <a
                              key={photo.id}
                              href={photo.file}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 rounded border border-gray-200 bg-gray-50 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100"
                            >
                              <ImageIcon className="h-4 w-4 text-primary-600" />
                              View ({photo.slot_name})
                            </a>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-500">No photos</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="space-y-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Evidence & Attachments</h2>
          {photoEvidence.length === 0 && <span className="text-sm text-gray-500">No evidence uploaded</span>}
        </div>

        {photoEvidence.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {photoEvidence.map((photo: PhotoRef) => (
              <a
                key={photo.id}
                href={photo.file}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative overflow-hidden rounded-lg border border-gray-200 bg-gray-50 shadow-sm"
              >
                <div className="relative h-40 w-full overflow-hidden">
                  <img
                    src={photo.file}
                    alt={photo.slot_name}
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  />
                </div>
                <div className="flex items-center justify-between border-t border-gray-200 px-3 py-2 text-sm text-gray-600">
                  <span className="font-medium text-gray-800">{photo.slot_name}</span>
                  {typeof photo.geotag_lat === 'number' && typeof photo.geotag_lng === 'number' ? (
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                      <MapPin className="h-3 w-3" />
                      {photo.geotag_lat.toFixed(3)}, {photo.geotag_lng.toFixed(3)}
                    </span>
                  ) : null}
                </div>
              </a>
            ))}
          </div>
        )}
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
            <ClipboardSignature className="h-5 w-5 text-primary-600" /> Inspector Signature
          </h2>
          {inspection.inspector_signature ? (
            <div className="relative h-56 w-full overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
              <img
                src={inspection.inspector_signature}
                alt="Inspector signature"
                className="h-full w-full object-contain p-4"
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 p-6 text-gray-500">
              <AlertTriangle className="h-6 w-6" />
              <p className="text-sm">No inspector signature provided</p>
            </div>
          )}
        </div>

        <div className="space-y-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
            <ClipboardSignature className="h-5 w-5 text-primary-600" /> Client Signature
          </h2>
          {inspection.client_signature ? (
            <div className="relative h-56 w-full overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
              <img
                src={inspection.client_signature}
                alt="Client signature"
                className="h-full w-full object-contain p-4"
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 p-6 text-gray-500">
              <AlertTriangle className="h-6 w-6" />
              <p className="text-sm">No client signature provided</p>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
