 'use client'

import { ChangeEvent, FormEvent, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import {
  PaginatedResponse,
  Service,
  ServiceCategory,
  ServiceVersion,
  RequirementLevel,
  StickerPolicy,
  ChecklistLevel,
} from '@/types'
import { cn, formatDate } from '@/lib/utils'
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Filter,
  Layers,
  Plus,
  RefreshCw,
  Search,
} from 'lucide-react'
import { toast } from 'sonner'

type ServiceStatus = 'ACTIVE' | 'INACTIVE'

interface ServiceFormState {
  code: string
  name_en: string
  name_ar: string
  category: ServiceCategory
  discipline: string
  status: ServiceStatus
  description: string
}

interface VersionFormState {
  effective_date: string
  is_published: boolean
  requires_equipment: RequirementLevel
  requires_person: RequirementLevel
  checklist_template: string
  default_checklist_level: ChecklistLevel
  minimum_checklist_level: ChecklistLevel
  allow_bulk_all_ok: boolean
  require_photo_evidence: boolean
  require_document_evidence: boolean
  sticker_policy: StickerPolicy
  approval_required: boolean
  approver_roles: string
  validity_max_months: string
  validity_options: string
  standards: string
  notes: string
}

const CATEGORY_LABELS: Record<ServiceCategory, string> = {
  INSPECTION: 'Inspection',
  TESTING: 'Testing',
  TRAINING: 'Training',
  OPERATOR_CERTIFICATION: 'Operator Certification',
  CALIBRATION: 'Calibration',
}

const REQUIREMENT_LEVEL_OPTIONS: Array<{ label: string; value: RequirementLevel }> = [
  { label: 'Mandatory', value: 'MANDATORY' },
  { label: 'Optional', value: 'OPTIONAL' },
  { label: 'Not Required', value: 'NOT_REQUIRED' },
]

const CHECKLIST_LEVEL_OPTIONS: Array<{ label: string; value: ChecklistLevel }> = [
  { label: 'Simplified', value: 'SIMPLIFIED' },
  { label: 'Expanded', value: 'EXPANDED' },
  { label: 'Critical', value: 'CRITICAL' },
]

const STICKER_POLICY_OPTIONS: Array<{ label: string; value: StickerPolicy }> = [
  { label: 'Required', value: 'REQUIRED' },
  { label: 'Optional', value: 'OPTIONAL' },
  { label: 'Not Applicable', value: 'NOT_APPLICABLE' },
]

const DEFAULT_SERVICE_FORM: ServiceFormState = {
  code: '',
  name_en: '',
  name_ar: '',
  category: 'INSPECTION',
  discipline: '',
  status: 'ACTIVE',
  description: '',
}

const DEFAULT_VERSION_FORM: VersionFormState = {
  effective_date: '',
  is_published: false,
  requires_equipment: 'NOT_REQUIRED',
  requires_person: 'NOT_REQUIRED',
  checklist_template: '',
  default_checklist_level: 'SIMPLIFIED',
  minimum_checklist_level: 'SIMPLIFIED',
  allow_bulk_all_ok: false,
  require_photo_evidence: false,
  require_document_evidence: false,
  sticker_policy: 'NOT_APPLICABLE',
  approval_required: false,
  approver_roles: '',
  validity_max_months: '',
  validity_options: '',
  standards: '',
  notes: '',
}

type FilterCategory = 'all' | ServiceCategory
type FilterStatus = 'all' | ServiceStatus

export default function ServicesPage() {
  const queryClient = useQueryClient()

  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<FilterCategory>('all')
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all')
  const [expandedRows, setExpandedRows] = useState<number[]>([])

  const [isServiceModalOpen, setServiceModalOpen] = useState(false)
  const [serviceForm, setServiceForm] = useState<ServiceFormState>(DEFAULT_SERVICE_FORM)

  const [isVersionModalOpen, setVersionModalOpen] = useState(false)
  const [versionForm, setVersionForm] = useState<VersionFormState>(DEFAULT_VERSION_FORM)
  const [selectedService, setSelectedService] = useState<Service | null>(null)

  const {
    data,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['services', search, categoryFilter, statusFilter],
    queryFn: async () => {
      let url = '/services/?page_size=100'
      const params: string[] = []

      if (search.trim()) params.push(`search=${encodeURIComponent(search.trim())}`)
      if (categoryFilter !== 'all') params.push(`category=${categoryFilter}`)
      if (statusFilter !== 'all') params.push(`status=${statusFilter}`)

      if (params.length) url += `&${params.join('&')}`

      return apiClient.get<PaginatedResponse<Service>>(url)
    },
  })

  const services = useMemo(() => data?.results ?? [], [data])

  const toggleRow = (serviceId: number) => {
    setExpandedRows((previous) =>
      previous.includes(serviceId)
        ? previous.filter((id) => id !== serviceId)
        : [...previous, serviceId]
    )
  }

  const openCreateServiceModal = () => {
    setServiceForm(DEFAULT_SERVICE_FORM)
    setServiceModalOpen(true)
  }

  const openCreateVersionModal = (service: Service) => {
    setSelectedService(service)
    setVersionForm({
      ...DEFAULT_VERSION_FORM,
      approval_required: service.current_version?.approval_required ?? false,
    })
    setVersionModalOpen(true)
  }

  const createServiceMutation = useMutation({
    mutationFn: (payload: ServiceFormState) => apiClient.post<Service>('/services/', payload),
    onSuccess: () => {
      toast.success('Service created successfully')
      setServiceModalOpen(false)
      setServiceForm(DEFAULT_SERVICE_FORM)
      queryClient.invalidateQueries({ queryKey: ['services'] })
    },
    onError: (mutationError: unknown) => {
      const message =
        (mutationError as any)?.response?.data?.detail ?? 'Unable to create service at the moment.'
      toast.error(message)
    },
  })

  const createVersionMutation = useMutation({
    mutationFn: ({ serviceId, payload }: { serviceId: number; payload: Partial<ServiceVersion> }) =>
      apiClient.post<ServiceVersion>('/service-versions/', { ...payload, service: serviceId }),
    onSuccess: () => {
      toast.success('Service version saved')
      setVersionModalOpen(false)
      setSelectedService(null)
      setVersionForm(DEFAULT_VERSION_FORM)
      queryClient.invalidateQueries({ queryKey: ['services'] })
    },
    onError: (mutationError: unknown) => {
      const message =
        (mutationError as any)?.response?.data?.detail ?? 'Unable to create version at the moment.'
      toast.error(message)
    },
  })

  const handleServiceFormChange = (field: keyof ServiceFormState) =>
    (event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      setServiceForm((previous) => ({ ...previous, [field]: event.target.value }))
    }

  const handleVersionFormChange = (field: keyof VersionFormState) =>
    (event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const value =
        event.target.type === 'checkbox'
          ? (event as ChangeEvent<HTMLInputElement>).target.checked
          : event.target.value
      setVersionForm((previous) => ({ ...previous, [field]: value }))
    }

  const handleCreateService = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!serviceForm.code.trim() || !serviceForm.name_en.trim()) {
      toast.error('Service code and English name are required')
      return
    }
    createServiceMutation.mutate(serviceForm)
  }

  const handleCreateVersion = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selectedService) return

    const payload: Partial<ServiceVersion> = {
      effective_date: versionForm.effective_date || undefined,
      is_published: versionForm.is_published,
      requires_equipment: versionForm.requires_equipment,
      requires_person: versionForm.requires_person,
      checklist_template: versionForm.checklist_template || undefined,
      default_checklist_level: versionForm.default_checklist_level,
      minimum_checklist_level: versionForm.minimum_checklist_level,
      allow_bulk_all_ok: versionForm.allow_bulk_all_ok,
      require_photo_evidence: versionForm.require_photo_evidence,
      require_document_evidence: versionForm.require_document_evidence,
      sticker_policy: versionForm.sticker_policy,
      approval_required: versionForm.approval_required,
      approver_roles: versionForm.approval_required
        ? versionForm.approver_roles
            .split(',')
            .map((role) => role.trim())
            .filter(Boolean)
        : [],
      validity_max_months: versionForm.validity_max_months
        ? Number(versionForm.validity_max_months)
        : null,
      validity_options: versionForm.validity_options
        ? versionForm.validity_options
            .split(',')
            .map((value) => Number(value.trim()))
            .filter((value) => !Number.isNaN(value))
        : [],
      standards: versionForm.standards
        ? versionForm.standards
            .split(',')
            .map((value) => value.trim())
            .filter(Boolean)
        : [],
      notes: versionForm.notes || undefined,
      output_definitions: [],
    }

    createVersionMutation.mutate({ serviceId: selectedService.id, payload })
  }

  const closeServiceModal = () => {
    setServiceModalOpen(false)
    setServiceForm(DEFAULT_SERVICE_FORM)
  }

  const closeVersionModal = () => {
    setVersionModalOpen(false)
    setSelectedService(null)
    setVersionForm(DEFAULT_VERSION_FORM)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Service Master Registry</h1>
          <p className="text-gray-600 mt-2 max-w-3xl">
            Centrally control the services your organisation delivers. Published versions power
            quotations, job orders, forms, approvals, stickers, and certificates.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => queryClient.invalidateQueries({ queryKey: ['services'] })}
            className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
          <button
            type="button"
            onClick={openCreateServiceModal}
            className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
          >
            <Plus className="h-4 w-4" />
            New Service
          </button>
        </div>
      </div>

      <div className="grid gap-4 rounded-lg border border-gray-200 bg-white p-4 shadow">
        <div className="grid gap-4 md:grid-cols-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by code or name"
              className="w-full rounded-lg border border-gray-300 px-10 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
            />
          </div>

          <div className="relative">
            <Filter className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <select
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value as FilterCategory)}
              className="w-full appearance-none rounded-lg border border-gray-300 px-10 py-2 text-sm text-gray-700 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
            >
              <option value="all">All Categories</option>
              {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div className="relative">
            <Filter className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as FilterStatus)}
              className="w-full appearance-none rounded-lg border border-gray-300 px-10 py-2 text-sm text-gray-700 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
            >
              <option value="all">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>

          <div className="flex items-center gap-2 rounded-lg border border-primary-200 bg-primary-50 px-4 py-3 text-sm text-primary-700">
            <Layers className="h-5 w-5" />
            <span>
              {services.length} service{services.length === 1 ? '' : 's'}
            </span>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="spinner" />
        </div>
      ) : isError ? (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          <AlertCircle className="h-5 w-5" />
          <div>
            <p className="font-semibold">Unable to load services</p>
            <p className="text-sm">
              {error instanceof Error ? error.message : 'Check your connection and try again.'}
            </p>
          </div>
        </div>
      ) : services.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center shadow">
          <h2 className="text-lg font-semibold text-gray-800">No services found</h2>
          <p className="mt-2 text-gray-500">
            Create your first governed service to start using the inspection platform end to end.
          </p>
        </div>
      ) : (
        <div className="grid gap-5">
          {services.map((service) => {
            const isExpanded = expandedRows.includes(service.id)
            const currentVersion = service.current_version

            return (
              <div key={service.id} className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="flex flex-col gap-4 p-6 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-wide">
                      <span className="rounded-full bg-primary-50 px-3 py-1 font-semibold text-primary-700">
                        {service.code}
                      </span>
                      <span
                        className={cn(
                          'rounded-full px-3 py-1 font-medium',
                          service.status === 'ACTIVE'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-600'
                        )}
                      >
                        {service.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                      </span>
                      <span className="text-gray-500">{CATEGORY_LABELS[service.category]}</span>
                    </div>

                    <div className="space-y-1">
                      <h2 className="text-2xl font-semibold text-gray-900">{service.name_en}</h2>
                      {service.name_ar && <p className="text-sm text-gray-500">{service.name_ar}</p>}
                    </div>

                    {service.discipline && (
                      <p className="text-sm text-gray-600">
                        Discipline: <span className="font-medium">{service.discipline}</span>
                      </p>
                    )}

                    {service.description && (
                      <p className="max-w-2xl text-sm leading-relaxed text-gray-700">
                        {service.description}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                      <span>Created {formatDate(service.created_at)}</span>
                      {currentVersion && (
                        <span className="flex items-center gap-1 text-green-600">
                          <CheckCircle2 className="h-4 w-4" />
                          v{currentVersion.version_number} ·{' '}
                          {currentVersion.is_published ? 'Published' : 'Draft'}
                          {currentVersion.effective_date
                            ? ` · Effective ${formatDate(currentVersion.effective_date)}`
                            : ''}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex w-full flex-col gap-3 lg:w-56">
                    <button
                      type="button"
                      onClick={() => openCreateVersionModal(service)}
                      className="flex items-center justify-center gap-2 rounded-lg border border-primary-200 bg-primary-50 px-4 py-2 text-sm font-semibold text-primary-700 hover:bg-primary-100"
                    >
                      <Plus className="h-4 w-4" />
                      New Version
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleRow(service.id)}
                      className="flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                    >
                      {isExpanded ? (
                        <>
                          <ChevronUp className="h-4 w-4" />
                          Hide Versions
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-4 w-4" />
                          View Versions
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-gray-200 bg-gray-50">
                    <div className="px-6 py-3 text-sm font-semibold uppercase tracking-wide text-gray-600">
                      Version History
                    </div>
                    {service.versions && service.versions.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 text-sm">
                          <thead className="bg-gray-100 text-left text-xs uppercase text-gray-500">
                            <tr>
                              <th className="px-6 py-3">Version</th>
                              <th className="px-6 py-3">Effective</th>
                              <th className="px-6 py-3">Execution Rules</th>
                              <th className="px-6 py-3">Sticker</th>
                              <th className="px-6 py-3">Approval</th>
                              <th className="px-6 py-3">Updated</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200 bg-white">
                            {service.versions.map((version: ServiceVersion) => (
                              <tr key={version.id}>
                                <td className="px-6 py-4">
                                  <div className="font-semibold text-gray-900">v{version.version_number}</div>
                                  <span
                                    className={cn(
                                      'mt-1 inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium',
                                      version.is_published
                                        ? 'bg-green-100 text-green-700'
                                        : 'bg-amber-100 text-amber-700'
                                    )}
                                  >
                                    {version.is_published ? 'Published' : 'Draft'}
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-gray-600">
                                  {version.effective_date ? formatDate(version.effective_date) : 'Pending'}
                                </td>
                                <td className="px-6 py-4 text-gray-600">
                                  <div>Equipment: {version.requires_equipment.replace('_', ' ')}</div>
                                  <div>Person: {version.requires_person.replace('_', ' ')}</div>
                                  <div>Checklist: {version.minimum_checklist_level.toLowerCase()}</div>
                                </td>
                                <td className="px-6 py-4 text-gray-600">
                                  {version.sticker_policy.replace('_', ' ')}
                                </td>
                                <td className="px-6 py-4 text-gray-600">
                                  {version.approval_required ? (
                                    <div>
                                      <div className="font-medium text-gray-900">Required</div>
                                      <div className="text-xs text-gray-500">
                                        {version.approver_roles?.length
                                          ? version.approver_roles.join(', ')
                                          : 'Roles not configured'}
                                      </div>
                                    </div>
                                  ) : (
                                    'Not required'
                                  )}
                                </td>
                                <td className="px-6 py-4 text-gray-600">{formatDate(version.updated_at)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="px-6 py-6 text-sm text-gray-500">
                        No versions have been created yet for this service.
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {isServiceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">Create Service</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Capture the governed definition for a service before it can be quoted or executed.
                </p>
              </div>
              <button
                type="button"
                onClick={closeServiceModal}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleCreateService} className="mt-6 space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Service Code *</label>
                  <input
                    required
                    value={serviceForm.code}
                    onChange={handleServiceFormChange('code')}
                    placeholder="e.g., INS-MCRANE"
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Category *</label>
                  <select
                    value={serviceForm.category}
                    onChange={handleServiceFormChange('category')}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
                  >
                    {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">English Name *</label>
                  <input
                    required
                    value={serviceForm.name_en}
                    onChange={handleServiceFormChange('name_en')}
                    placeholder="Mobile Crane Inspection"
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Arabic Name</label>
                  <input
                    value={serviceForm.name_ar}
                    onChange={handleServiceFormChange('name_ar')}
                    placeholder="Arabic translation"
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Discipline</label>
                  <input
                    value={serviceForm.discipline}
                    onChange={handleServiceFormChange('discipline')}
                    placeholder="e.g., Lifting, NDT"
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <select
                    value={serviceForm.status}
                    onChange={handleServiceFormChange('status')}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  value={serviceForm.description}
                  onChange={handleServiceFormChange('description')}
                  rows={4}
                  placeholder="Outline the governed scope, references, or notes for this service."
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
                />
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={closeServiceModal}
                  className="rounded-lg px-5 py-2 text-sm font-medium text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createServiceMutation.isPending}
                  className="rounded-lg bg-primary-600 px-5 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-60"
                >
                  {createServiceMutation.isPending ? 'Saving…' : 'Create Service'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isVersionModalOpen && selectedService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">
                  New Version · {selectedService.name_en}
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Configure execution dependencies, evidence, approvals, and validity rules.
                </p>
              </div>
              <button
                type="button"
                onClick={closeVersionModal}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleCreateVersion} className="mt-6 space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Effective Date</label>
                  <input
                    type="date"
                    value={versionForm.effective_date}
                    onChange={handleVersionFormChange('effective_date')}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
                  />
                </div>
                <label className="mt-6 flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={versionForm.is_published}
                    onChange={handleVersionFormChange('is_published')}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  Publish immediately
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Requires Equipment</label>
                  <select
                    value={versionForm.requires_equipment}
                    onChange={handleVersionFormChange('requires_equipment')}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
                  >
                    {REQUIREMENT_LEVEL_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Requires Person</label>
                  <select
                    value={versionForm.requires_person}
                    onChange={handleVersionFormChange('requires_person')}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
                  >
                    {REQUIREMENT_LEVEL_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Checklist Template</label>
                  <input
                    value={versionForm.checklist_template}
                    onChange={handleVersionFormChange('checklist_template')}
                    placeholder="e.g., lifting/mobile_crane_v1"
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Default Checklist Level</label>
                    <select
                      value={versionForm.default_checklist_level}
                      onChange={handleVersionFormChange('default_checklist_level')}
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
                    >
                      {CHECKLIST_LEVEL_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Minimum Checklist Level</label>
                    <select
                      value={versionForm.minimum_checklist_level}
                      onChange={handleVersionFormChange('minimum_checklist_level')}
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
                    >
                      {CHECKLIST_LEVEL_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={versionForm.allow_bulk_all_ok}
                    onChange={handleVersionFormChange('allow_bulk_all_ok')}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  Allow “All OK” bulk completion
                </label>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Sticker Policy</label>
                  <select
                    value={versionForm.sticker_policy}
                    onChange={handleVersionFormChange('sticker_policy')}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
                  >
                    {STICKER_POLICY_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={versionForm.require_photo_evidence}
                    onChange={handleVersionFormChange('require_photo_evidence')}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  Require photo evidence
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={versionForm.require_document_evidence}
                    onChange={handleVersionFormChange('require_document_evidence')}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  Require document evidence
                </label>
              </div>

              <div className="space-y-4">
                <div className="space-y-3">
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={versionForm.approval_required}
                      onChange={handleVersionFormChange('approval_required')}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    Requires approval routing
                  </label>
                  {versionForm.approval_required && (
                    <input
                      value={versionForm.approver_roles}
                      onChange={handleVersionFormChange('approver_roles')}
                      placeholder="Comma separated roles e.g., TECHNICAL_MANAGER,NDT_MANAGER"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
                    />
                  )}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Max Validity (months)</label>
                    <input
                      type="number"
                      min={0}
                      value={versionForm.validity_max_months}
                      onChange={handleVersionFormChange('validity_max_months')}
                      placeholder="e.g., 12"
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Allowed Validity Options</label>
                    <input
                      value={versionForm.validity_options}
                      onChange={handleVersionFormChange('validity_options')}
                      placeholder="Comma separated months e.g., 1,3,6,12"
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Linked Standards</label>
                  <input
                    value={versionForm.standards}
                    onChange={handleVersionFormChange('standards')}
                    placeholder="Comma separated e.g., ISO/IEC 17020,ASME B30.5"
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Notes</label>
                  <textarea
                    value={versionForm.notes}
                    onChange={handleVersionFormChange('notes')}
                    rows={3}
                    placeholder="Version rationale, standards references, or change summary"
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={closeVersionModal}
                  className="rounded-lg px-5 py-2 text-sm font-medium text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createVersionMutation.isPending}
                  className="rounded-lg bg-primary-600 px-5 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-60"
                >
                  {createVersionMutation.isPending ? 'Saving…' : 'Create Version'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
