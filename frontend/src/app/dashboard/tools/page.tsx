'use client'

import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  AlertTriangle,
  Boxes,
  ClipboardSignature,
  Edit2,
  Hammer,
  Layers,
  ListChecks,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  Sparkles,
  Trash2,
  Wrench,
} from 'lucide-react'
import { toast } from 'sonner'
import { CrudDrawer } from '@/components/admin/CrudDrawer'
import { FormField } from '@/components/admin/FormField'
import { cn, formatDate, formatDateTime } from '@/lib/utils'
import { apiClient } from '@/lib/api-client'
import type {
  Client,
  Equipment,
  JobOrderListItem,
  PaginatedResponse,
  Tool,
  ToolAssignment,
  ToolAssignmentStatus,
  ToolAssignmentType,
  ToolCategory,
  ToolCategoryAssignmentMode,
  ToolIncident,
  ToolIncidentSeverity,
  ToolIncidentType,
  ToolStatus,
  User,
} from '@/types'
import {
  useCreateTool,
  useCreateToolAssignment,
  useCreateToolCategory,
  useCreateToolIncident,
  useDeleteTool,
  useDeleteToolAssignment,
  useDeleteToolCategory,
  useDeleteToolIncident,
  useToolAssignments,
  useToolIncidents,
  useToolCategories,
  useTools,
  useUpdateTool,
  useUpdateToolAssignment,
  useUpdateToolCategory,
  useUpdateToolIncident,
} from '@/hooks/tools'

type ToolFormState = {
  name: string
  serial_number: string
  category: string
  status: ToolStatus
  assignment_mode: ToolCategoryAssignmentMode
  location: string
  calibration_due: string
  assigned_to: string
}

const EMPTY_FORM: ToolFormState = {
  name: '',
  serial_number: '',
  category: '',
  status: 'AVAILABLE',
  assignment_mode: 'INDIVIDUAL',
  location: '',
  calibration_due: '',
  assigned_to: '',
}

type CategoryFormState = {
  code: string
  name: string
  description: string
  requires_calibration: boolean
  calibration_interval_days: string
  default_assignment_type: Tool['assignment_mode']
  notes: string
}

const EMPTY_CATEGORY_FORM: CategoryFormState = {
  code: '',
  name: '',
  description: '',
  requires_calibration: false,
  calibration_interval_days: '',
  default_assignment_type: 'INDIVIDUAL',
  notes: '',
}

type AssignmentFormState = {
  tool: string
  assignment_type: ToolAssignmentType
  status: ToolAssignmentStatus
  assigned_user: string
  job_order: string
  equipment: string
  client: string
  assigned_on: string
  expected_return: string
  returned_on: string
  notes: string
}

const EMPTY_ASSIGNMENT_FORM: AssignmentFormState = {
  tool: '',
  assignment_type: 'USER',
  status: 'ACTIVE',
  assigned_user: '',
  job_order: '',
  equipment: '',
  client: '',
  assigned_on: '',
  expected_return: '',
  returned_on: '',
  notes: '',
}

type IncidentFormState = {
  tool: string
  incident_type: ToolIncidentType
  severity: ToolIncidentSeverity
  occurred_on: string
  description: string
  resolved_on: string
  resolution_notes: string
}

const EMPTY_INCIDENT_FORM: IncidentFormState = {
  tool: '',
  incident_type: 'LOSS',
  severity: 'MEDIUM',
  occurred_on: '',
  description: '',
  resolved_on: '',
  resolution_notes: '',
}

const STATUS_OPTIONS: Array<{ value: ToolStatus | 'ALL'; label: string }> = [
  { value: 'ALL', label: 'All statuses' },
  { value: 'AVAILABLE', label: 'Available' },
  { value: 'ASSIGNED', label: 'Assigned' },
  { value: 'MAINTENANCE', label: 'Maintenance' },
  { value: 'CALIBRATION', label: 'Under Calibration' },
  { value: 'LOST', label: 'Lost' },
  { value: 'RETIRED', label: 'Retired' },
]

const ASSIGNMENT_MODE_OPTIONS: Array<{
  value: ToolCategoryAssignmentMode | 'ALL'
  label: string
}> = [
  { value: 'ALL', label: 'All assignment modes' },
  { value: 'INDIVIDUAL', label: 'Individual' },
  { value: 'TEAM', label: 'Team' },
  { value: 'JOB_ORDER', label: 'Job order' },
  { value: 'POOL', label: 'Shared pool' },
]

const STATUS_BADGES: Record<ToolStatus, string> = {
  AVAILABLE: 'bg-emerald-50 text-emerald-600 border border-emerald-200',
  ASSIGNED: 'bg-sky-50 text-sky-600 border border-sky-200',
  MAINTENANCE: 'bg-amber-50 text-amber-600 border border-amber-200',
  CALIBRATION: 'bg-indigo-50 text-indigo-600 border border-indigo-200',
  LOST: 'bg-rose-50 text-rose-600 border border-rose-200',
  RETIRED: 'bg-slate-100 text-slate-500 border border-slate-200',
}

type Nullable<T> = T | null | undefined

type ToolAssignmentFilters = Parameters<typeof useToolAssignments>[0]

type AssignmentStatusFilter = ToolAssignmentStatus | 'ALL'
type AssignmentTypeFilter = ToolAssignmentType | 'ALL'
type IncidentTypeFilter = ToolIncidentType | 'ALL'
type IncidentSeverityFilter = ToolIncidentSeverity | 'ALL'

const ASSIGNMENT_TYPE_LABELS: Record<ToolAssignmentType, string> = {
  USER: 'User custody',
  JOB_ORDER: 'Job order',
  EQUIPMENT: 'Equipment link',
  CLIENT: 'Client loan',
}

const INCIDENT_TYPE_LABELS: Record<ToolIncidentType, string> = {
  LOSS: 'Loss',
  DAMAGE: 'Damage',
  CALIBRATION_FAILURE: 'Calibration failure',
  OTHER: 'Other',
}

const INCIDENT_SEVERITY_LABELS: Record<ToolIncidentSeverity, string> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
}

const ASSIGNMENT_STATUS_OPTIONS: Array<{ value: ToolAssignmentStatus | 'ALL'; label: string }> = [
  { value: 'ALL', label: 'All statuses' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'RETURNED', label: 'Returned' },
  { value: 'LOST', label: 'Lost' },
  { value: 'DAMAGED', label: 'Damaged' },
]

const ASSIGNMENT_TYPE_OPTIONS: Array<{ value: ToolAssignmentType | 'ALL'; label: string }> = [
  { value: 'ALL', label: 'All assignment types' },
  { value: 'USER', label: 'User custody' },
  { value: 'JOB_ORDER', label: 'Job order' },
  { value: 'EQUIPMENT', label: 'Equipment link' },
  { value: 'CLIENT', label: 'Client loan' },
]

const INCIDENT_TYPE_OPTIONS: Array<{ value: ToolIncidentType | 'ALL'; label: string }> = [
  { value: 'ALL', label: 'All incident types' },
  { value: 'LOSS', label: 'Loss' },
  { value: 'DAMAGE', label: 'Damage' },
  { value: 'CALIBRATION_FAILURE', label: 'Calibration failure' },
  { value: 'OTHER', label: 'Other' },
]

const INCIDENT_SEVERITY_OPTIONS: Array<{ value: ToolIncidentSeverity | 'ALL'; label: string }> = [
  { value: 'ALL', label: 'All severities' },
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
]

const ASSIGNMENT_STATUS_BADGES: Record<ToolAssignmentStatus, string> = {
  ACTIVE: 'bg-sky-50 text-sky-600 border border-sky-200',
  RETURNED: 'bg-emerald-50 text-emerald-600 border border-emerald-200',
  LOST: 'bg-rose-50 text-rose-600 border border-rose-200',
  DAMAGED: 'bg-amber-50 text-amber-600 border border-amber-200',
}

const INCIDENT_SEVERITY_BADGES: Record<ToolIncidentSeverity, string> = {
  LOW: 'bg-emerald-50 text-emerald-600 border border-emerald-200',
  MEDIUM: 'bg-amber-50 text-amber-600 border border-amber-200',
  HIGH: 'bg-rose-50 text-rose-600 border border-rose-200',
}

function toDateInputValue(value?: string | null): string {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toISOString().slice(0, 10)
}

function toDateTimeInputValue(value?: string | null): string {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const tzOffset = date.getTimezoneOffset()
  const localDate = new Date(date.getTime() - tzOffset * 60000)
  return localDate.toISOString().slice(0, 16)
}

export default function ToolsGovernancePage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<ToolStatus | 'ALL'>('ALL')
  const [assignmentFilter, setAssignmentFilter] = useState<ToolFormState['assignment_mode'] | 'ALL'>(
    'ALL'
  )
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL')

  const [isDrawerOpen, setDrawerOpen] = useState(false)
  const [editingTool, setEditingTool] = useState<Tool | null>(null)
  const [toolIdForUpdate, setToolIdForUpdate] = useState<number | null>(null)
  const [formState, setFormState] = useState<ToolFormState>(EMPTY_FORM)

  const [isCategoryDrawerOpen, setCategoryDrawerOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<ToolCategory | null>(null)
  const [categoryIdForUpdate, setCategoryIdForUpdate] = useState<number | null>(null)
  const [categoryFormState, setCategoryFormState] = useState<CategoryFormState>(EMPTY_CATEGORY_FORM)

  const [isAssignmentDrawerOpen, setAssignmentDrawerOpen] = useState(false)
  const [editingAssignment, setEditingAssignment] = useState<ToolAssignment | null>(null)
  const [assignmentIdForUpdate, setAssignmentIdForUpdate] = useState<number | null>(null)
  const [assignmentFormState, setAssignmentFormState] = useState<AssignmentFormState>(EMPTY_ASSIGNMENT_FORM)

  const [isIncidentDrawerOpen, setIncidentDrawerOpen] = useState(false)
  const [editingIncident, setEditingIncident] = useState<ToolIncident | null>(null)
  const [incidentIdForUpdate, setIncidentIdForUpdate] = useState<number | null>(null)
  const [incidentFormState, setIncidentFormState] = useState<IncidentFormState>(EMPTY_INCIDENT_FORM)

  const [assignmentSearch, setAssignmentSearch] = useState('')
  const [assignmentStatus, setAssignmentStatus] = useState<AssignmentStatusFilter>('ALL')
  const [assignmentType, setAssignmentType] = useState<AssignmentTypeFilter>('ALL')

  const [incidentTypeFilter, setIncidentTypeFilter] = useState<IncidentTypeFilter>('ALL')
  const [incidentSeverityFilter, setIncidentSeverityFilter] = useState<IncidentSeverityFilter>('ALL')

  const filters = useMemo(
    () => ({
      search: search.trim() || undefined,
      status: statusFilter === 'ALL' ? undefined : statusFilter,
      assignment_mode: assignmentFilter === 'ALL' ? undefined : assignmentFilter,
      category: categoryFilter === 'ALL' ? undefined : Number(categoryFilter),
      page_size: 50,
    }),
    [search, statusFilter, assignmentFilter, categoryFilter]
  )

  const { data, isLoading } = useTools(filters)
  const tools = data?.results ?? []

  const { data: categoriesResponse } = useToolCategories()
  const categories = categoriesResponse?.results ?? []

  const toolOptionsFilters = useMemo(() => ({ page_size: 200 }), [])
  const { data: toolOptionsResponse } = useTools(toolOptionsFilters)
  const toolOptions = toolOptionsResponse?.results ?? []

  const { data: usersResponse } = useQuery({
    queryKey: ['users', 'all-active'],
    queryFn: () => apiClient.get<PaginatedResponse<User>>('/users/?page_size=200'),
  })
  const allUsers = usersResponse?.results ?? []

  const { data: clientsResponse } = useQuery({
    queryKey: ['clients', 'all-active'],
    queryFn: () => apiClient.get<PaginatedResponse<Client>>('/clients/?page_size=200'),
  })
  const clients = clientsResponse?.results ?? []

  const { data: equipmentResponse } = useQuery({
    queryKey: ['equipment', 'all-active'],
    queryFn: () => apiClient.get<PaginatedResponse<Equipment>>('/equipment/?page_size=200'),
  })
  const equipmentItems = equipmentResponse?.results ?? []

  const { data: jobOrdersResponse } = useQuery({
    queryKey: ['job-orders', 'all-active'],
    queryFn: () => apiClient.get<PaginatedResponse<JobOrderListItem>>('/job-orders/?page_size=200'),
  })
  const jobOrders = jobOrdersResponse?.results ?? []

  const createTool = useCreateTool()
  const updateTool = useUpdateTool(toolIdForUpdate ?? 0)
  const deleteTool = useDeleteTool()

  const createCategory = useCreateToolCategory()
  const updateCategory = useUpdateToolCategory(categoryIdForUpdate ?? 0)
  const deleteCategory = useDeleteToolCategory()

  const createAssignment = useCreateToolAssignment()
  const updateAssignment = useUpdateToolAssignment(assignmentIdForUpdate ?? 0)
  const deleteAssignment = useDeleteToolAssignment()

  const createIncident = useCreateToolIncident()
  const updateIncident = useUpdateToolIncident(incidentIdForUpdate ?? 0)
  const deleteIncident = useDeleteToolIncident()

  const resetForm = () => {
    setFormState(EMPTY_FORM)
    setToolIdForUpdate(null)
    setEditingTool(null)
  }

  const openCreateDrawer = () => {
    resetForm()
    setDrawerOpen(true)
  }

  const openEditDrawer = (tool: Tool) => {
    setEditingTool(tool)
    setToolIdForUpdate(tool.id)
    setFormState({
      name: tool.name ?? '',
      serial_number: tool.serial_number ?? '',
      category: tool.category ? String(tool.category) : '',
      status: tool.status,
      assignment_mode: tool.assignment_mode,
      location: tool.location ?? '',
      calibration_due: tool.calibration_due ?? '',
      assigned_to: tool.assigned_to ? String(tool.assigned_to) : '',
    })
    setDrawerOpen(true)
  }

  const closeDrawer = () => {
    setDrawerOpen(false)
    resetForm()
  }

  const handleChange = (field: keyof ToolFormState) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setFormState((prev) => ({ ...prev, [field]: event.target.value }))
    }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!formState.name.trim() || !formState.serial_number.trim()) {
      toast.error('Name and serial number are required')
      return
    }

    const payload: Partial<Tool> = {
      name: formState.name.trim(),
      serial_number: formState.serial_number.trim(),
      category: formState.category ? Number(formState.category) : undefined,
      status: formState.status,
      assignment_mode: formState.assignment_mode,
      location: formState.location?.trim() || undefined,
      calibration_due: formState.calibration_due || undefined,
      assigned_to: formState.assigned_to ? Number(formState.assigned_to) : undefined,
    }

    try {
      if (editingTool && toolIdForUpdate) {
        await updateTool.mutateAsync(payload)
        toast.success('Tool updated successfully')
      } else {
        await createTool.mutateAsync(payload)
        toast.success('Tool added to inventory')
      }
      closeDrawer()
    } catch (error: unknown) {
      const detail = (error as any)?.response?.data?.detail
      toast.error(detail || 'Unable to save tool record')
    }
  }

  const handleDelete = async (tool: Tool) => {
    const confirmed = window.confirm(`Remove ${tool.name} (${tool.serial_number}) from inventory?`)
    if (!confirmed) return

    try {
      await deleteTool.mutateAsync(tool.id)
      toast.success('Tool removed')
    } catch (error: unknown) {
      const detail = (error as any)?.response?.data?.detail
      toast.error(detail || 'Failed to delete tool')
    }
  }

  const isSaving = createTool.isPending || updateTool.isPending

  const resetCategoryForm = () => {
    setCategoryFormState(EMPTY_CATEGORY_FORM)
    setCategoryIdForUpdate(null)
    setEditingCategory(null)
  }

  const openCreateCategoryDrawer = () => {
    resetCategoryForm()
    setCategoryDrawerOpen(true)
  }

  const openEditCategoryDrawer = (category: ToolCategory) => {
    setEditingCategory(category)
    setCategoryIdForUpdate(category.id)
    setCategoryFormState({
      code: category.code ?? '',
      name: category.name ?? '',
      description: category.description ?? '',
      requires_calibration: Boolean(category.requires_calibration),
      calibration_interval_days: category.calibration_interval_days
        ? String(category.calibration_interval_days)
        : '',
      default_assignment_type: category.default_assignment_type,
      notes: category.notes ?? '',
    })
    setCategoryDrawerOpen(true)
  }

  const closeCategoryDrawer = () => {
    setCategoryDrawerOpen(false)
    resetCategoryForm()
  }

  const handleCategoryChange = (
    field: keyof CategoryFormState
  ) =>
    (
      event:
        | React.ChangeEvent<HTMLInputElement>
        | React.ChangeEvent<HTMLTextAreaElement>
        | React.ChangeEvent<HTMLSelectElement>
    ) => {
      const value =
        field === 'requires_calibration'
          ? (event.target as HTMLInputElement).checked
          : event.target.value
      setCategoryFormState((prev) => ({
        ...prev,
        [field]: value,
      }))
    }

  const handleCategorySubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!categoryFormState.code.trim() || !categoryFormState.name.trim()) {
      toast.error('Code and name are required for a category')
      return
    }

    const payload: Partial<ToolCategory> = {
      code: categoryFormState.code.trim(),
      name: categoryFormState.name.trim(),
      description: categoryFormState.description?.trim() || undefined,
      requires_calibration: Boolean(categoryFormState.requires_calibration),
      calibration_interval_days: categoryFormState.calibration_interval_days
        ? Number(categoryFormState.calibration_interval_days)
        : undefined,
      default_assignment_type: categoryFormState.default_assignment_type,
      notes: categoryFormState.notes?.trim() || undefined,
    }

    try {
      if (editingCategory && categoryIdForUpdate) {
        await updateCategory.mutateAsync(payload)
        toast.success('Category updated successfully')
      } else {
        await createCategory.mutateAsync(payload)
        toast.success('Category created successfully')
      }
      closeCategoryDrawer()
    } catch (error: unknown) {
      const detail = (error as any)?.response?.data?.detail
      toast.error(detail || 'Unable to save category')
    }
  }

  const handleCategoryDelete = async (category: ToolCategory) => {
    const confirmed = window.confirm(`Delete category ${category.code} — ${category.name}?`)
    if (!confirmed) return

    try {
      await deleteCategory.mutateAsync(category.id)
      toast.success('Category deleted')
    } catch (error: unknown) {
      const detail = (error as any)?.response?.data?.detail
      toast.error(detail || 'Unable to delete category')
    }
  }

  const resetAssignmentForm = () => {
    const nowIso = new Date().toISOString()
    setAssignmentFormState({
      ...EMPTY_ASSIGNMENT_FORM,
      assigned_on: toDateTimeInputValue(nowIso),
    })
    setAssignmentIdForUpdate(null)
    setEditingAssignment(null)
  }

  const openCreateAssignmentDrawer = () => {
    resetAssignmentForm()
    setAssignmentDrawerOpen(true)
  }

  const openEditAssignmentDrawer = (assignment: ToolAssignment) => {
    setEditingAssignment(assignment)
    setAssignmentIdForUpdate(assignment.id)
    setAssignmentFormState({
      tool: assignment.tool ? String(assignment.tool) : '',
      assignment_type: assignment.assignment_type,
      status: assignment.status,
      assigned_user: assignment.assigned_user ? String(assignment.assigned_user) : '',
      job_order: assignment.job_order ? String(assignment.job_order) : '',
      equipment: assignment.equipment ? String(assignment.equipment) : '',
      client: assignment.client ? String(assignment.client) : '',
      assigned_on: toDateTimeInputValue(assignment.assigned_on),
      expected_return: toDateInputValue(assignment.expected_return),
      returned_on: toDateTimeInputValue(assignment.returned_on),
      notes: assignment.notes ?? '',
    })
    setAssignmentDrawerOpen(true)
  }

  const closeAssignmentDrawer = () => {
    setAssignmentDrawerOpen(false)
    resetAssignmentForm()
  }

  const handleAssignmentChange = (
    field: keyof AssignmentFormState
  ) =>
    (
      event:
        | React.ChangeEvent<HTMLInputElement>
        | React.ChangeEvent<HTMLTextAreaElement>
        | React.ChangeEvent<HTMLSelectElement>
    ) => {
      setAssignmentFormState((prev) => ({ ...prev, [field]: event.target.value }))
    }

  const handleAssignmentSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!assignmentFormState.tool) {
      toast.error('Select a tool for this assignment')
      return
    }

    const payload: Partial<ToolAssignment> = {
      tool: Number(assignmentFormState.tool),
      assignment_type: assignmentFormState.assignment_type,
      status: assignmentFormState.status,
      assigned_user: assignmentFormState.assigned_user ? Number(assignmentFormState.assigned_user) : undefined,
      job_order: assignmentFormState.job_order ? Number(assignmentFormState.job_order) : undefined,
      equipment: assignmentFormState.equipment ? Number(assignmentFormState.equipment) : undefined,
      client: assignmentFormState.client ? Number(assignmentFormState.client) : undefined,
      assigned_on: assignmentFormState.assigned_on ? new Date(assignmentFormState.assigned_on).toISOString() : undefined,
      expected_return: assignmentFormState.expected_return ? assignmentFormState.expected_return : undefined,
      returned_on: assignmentFormState.returned_on ? new Date(assignmentFormState.returned_on).toISOString() : undefined,
      notes: assignmentFormState.notes?.trim() || undefined,
    }

    try {
      if (editingAssignment && assignmentIdForUpdate) {
        await updateAssignment.mutateAsync(payload)
        toast.success('Assignment updated successfully')
      } else {
        await createAssignment.mutateAsync(payload)
        toast.success('Assignment created successfully')
      }
      closeAssignmentDrawer()
    } catch (error: unknown) {
      const detail = (error as any)?.response?.data?.detail
      toast.error(detail || 'Unable to save assignment')
    }
  }

  const handleAssignmentDelete = async (assignment: ToolAssignment) => {
    const confirmed = window.confirm(`Delete assignment record for ${assignment.tool_info?.name ?? 'tool'}?`)
    if (!confirmed) return

    try {
      await deleteAssignment.mutateAsync(assignment.id)
      toast.success('Assignment deleted')
    } catch (error: unknown) {
      const detail = (error as any)?.response?.data?.detail
      toast.error(detail || 'Unable to delete assignment')
    }
  }

  const resetIncidentForm = () => {
    const todayIso = new Date().toISOString()
    setIncidentFormState({
      ...EMPTY_INCIDENT_FORM,
      occurred_on: toDateInputValue(todayIso),
    })
    setIncidentIdForUpdate(null)
    setEditingIncident(null)
  }

  const openCreateIncidentDrawer = () => {
    resetIncidentForm()
    setIncidentDrawerOpen(true)
  }

  const openEditIncidentDrawer = (incident: ToolIncident) => {
    setEditingIncident(incident)
    setIncidentIdForUpdate(incident.id)
    setIncidentFormState({
      tool: incident.tool ? String(incident.tool) : '',
      incident_type: incident.incident_type,
      severity: incident.severity,
      occurred_on: toDateInputValue(incident.occurred_on),
      description: incident.description ?? '',
      resolved_on: toDateInputValue(incident.resolved_on),
      resolution_notes: incident.resolution_notes ?? '',
    })
    setIncidentDrawerOpen(true)
  }

  const closeIncidentDrawer = () => {
    setIncidentDrawerOpen(false)
    resetIncidentForm()
  }

  const handleIncidentChange = (
    field: keyof IncidentFormState
  ) =>
    (
      event:
        | React.ChangeEvent<HTMLInputElement>
        | React.ChangeEvent<HTMLTextAreaElement>
        | React.ChangeEvent<HTMLSelectElement>
    ) => {
      setIncidentFormState((prev) => ({ ...prev, [field]: event.target.value }))
    }

  const handleIncidentSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!incidentFormState.tool) {
      toast.error('Select the impacted tool')
      return
    }

    if (!incidentFormState.occurred_on) {
      toast.error('Provide the incident date')
      return
    }

    const payload: Partial<ToolIncident> = {
      tool: Number(incidentFormState.tool),
      incident_type: incidentFormState.incident_type,
      severity: incidentFormState.severity,
      occurred_on: incidentFormState.occurred_on,
      description: incidentFormState.description?.trim() || undefined,
      resolved_on: incidentFormState.resolved_on || undefined,
      resolution_notes: incidentFormState.resolution_notes?.trim() || undefined,
    }

    try {
      if (editingIncident && incidentIdForUpdate) {
        await updateIncident.mutateAsync(payload)
        toast.success('Incident updated successfully')
      } else {
        await createIncident.mutateAsync(payload)
        toast.success('Incident reported successfully')
      }
      closeIncidentDrawer()
    } catch (error: unknown) {
      const detail = (error as any)?.response?.data?.detail
      toast.error(detail || 'Unable to save incident')
    }
  }

  const handleIncidentDelete = async (incident: ToolIncident) => {
    const confirmed = window.confirm(`Delete incident for ${incident.tool_info?.name ?? 'tool'}?`)
    if (!confirmed) return

    try {
      await deleteIncident.mutateAsync(incident.id)
      toast.success('Incident removed')
    } catch (error: unknown) {
      const detail = (error as any)?.response?.data?.detail
      toast.error(detail || 'Unable to delete incident')
    }
  }

  const activeAssignmentFilters: ToolAssignmentFilters = useMemo(
    () => ({
      status: 'ACTIVE',
      page_size: 10,
    }),
    []
  )

  const assignmentListFilters = useMemo(
    () => ({
      search: assignmentSearch.trim() || undefined,
      status: assignmentStatus === 'ALL' ? undefined : assignmentStatus,
      assignment_type: assignmentType === 'ALL' ? undefined : assignmentType,
      page_size: 20,
    }),
    [assignmentSearch, assignmentStatus, assignmentType]
  )

  const incidentFilters = useMemo(
    () => ({
      incident_type: incidentTypeFilter === 'ALL' ? undefined : incidentTypeFilter,
      severity: incidentSeverityFilter === 'ALL' ? undefined : incidentSeverityFilter,
      page_size: 20,
    }),
    [incidentTypeFilter, incidentSeverityFilter]
  )

  const { data: activeAssignments } = useToolAssignments(activeAssignmentFilters)
  const { data: assignmentsResponse, isLoading: isAssignmentsLoading } = useToolAssignments(assignmentListFilters)
  const assignments = assignmentsResponse?.results ?? []

  const { data: incidentsResponse, isLoading: isIncidentsLoading } = useToolIncidents(incidentFilters)
  const incidents = incidentsResponse?.results ?? []

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-wide text-slate-400">Tools governance</p>
          <h1 className="mt-1 text-3xl font-bold text-slate-900">Tool Inventory</h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-500">
            Track calibration windows, assignment modes, and custody for every inspection tool. Admins and
            technical managers can add new instruments, update statuses, and off-board retired gear from this
            workspace.
          </p>
        </div>
        <button
          onClick={openCreateDrawer}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-200/45 transition hover:shadow-xl"
        >
          <Plus className="h-4 w-4" />
          Add Tool
        </button>
      </header>

      <section className="grid gap-4 rounded-3xl border border-slate-200/80 bg-white/80 p-6 shadow-[0_20px_60px_-40px_rgba(56,189,248,0.45)] backdrop-blur-sm lg:grid-cols-4">
        <div className="lg:col-span-2">
          <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Search</label>
          <div className="relative mt-2">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name, serial number, or location"
              className="w-full rounded-2xl border border-slate-200 bg-white/80 py-3 pl-11 pr-4 text-sm text-slate-700 shadow-inner focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Status</label>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as ToolStatus | 'ALL')}
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white/80 py-3 px-4 text-sm text-slate-700 shadow-inner focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Assignment mode
          </label>
          <select
            value={assignmentFilter}
            onChange={(event) =>
              setAssignmentFilter(
                event.target.value as ToolFormState['assignment_mode'] | 'ALL'
              )
            }
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white/80 py-3 px-4 text-sm text-slate-700 shadow-inner focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
          >
            {ASSIGNMENT_MODE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Category</label>
          <select
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white/80 py-3 px-4 text-sm text-slate-700 shadow-inner focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
          >
            <option value="ALL">All categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.code} — {category.name}
              </option>
            ))}
          </select>
        </div>
      </section>

      <CrudDrawer
        open={isAssignmentDrawerOpen}
        onClose={closeAssignmentDrawer}
        title={editingAssignment ? 'Update assignment' : 'Log assignment'}
        description={
          editingAssignment
            ? 'Adjust custody, return expectations, or linked records for this assignment.'
            : 'Capture where the instrument is heading so custody is transparent to the entire team.'
        }
        footer={
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={closeAssignmentDrawer}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:border-slate-300 hover:text-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="assignment-form"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-sky-500 to-indigo-500 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-70"
              disabled={createAssignment.isPending || updateAssignment.isPending}
            >
              {createAssignment.isPending || updateAssignment.isPending
                ? 'Saving...'
                : editingAssignment
                ? 'Save changes'
                : 'Log assignment'}
            </button>
          </div>
        }
      >
        <form id="assignment-form" className="space-y-6" onSubmit={handleAssignmentSubmit}>
          <div className="grid gap-6 md:grid-cols-2">
            <FormField label="Tool" required>
              <select
                value={assignmentFormState.tool}
                onChange={handleAssignmentChange('tool')}
                className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-700 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
              >
                <option value="">Select tool</option>
                {toolOptions.map((toolOption) => (
                  <option key={toolOption.id} value={toolOption.id}>
                    {toolOption.name} — SN {toolOption.serial_number}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Assignment type" required>
              <select
                value={assignmentFormState.assignment_type}
                onChange={handleAssignmentChange('assignment_type')}
                className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-700 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
              >
                {ASSIGNMENT_TYPE_OPTIONS.filter((option) => option.value !== 'ALL').map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </FormField>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <FormField label="Status" required>
              <select
                value={assignmentFormState.status}
                onChange={handleAssignmentChange('status')}
                className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-700 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
              >
                {ASSIGNMENT_STATUS_OPTIONS.filter((option) => option.value !== 'ALL').map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Custodian">
              <select
                value={assignmentFormState.assigned_user}
                onChange={handleAssignmentChange('assigned_user')}
                className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-700 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
              >
                <option value="">Unassigned</option>
                {allUsers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : user.username}
                  </option>
                ))}
              </select>
            </FormField>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <FormField label="Job order">
              <select
                value={assignmentFormState.job_order}
                onChange={handleAssignmentChange('job_order')}
                className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-700 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
              >
                <option value="">None</option>
                {jobOrders.map((job) => (
                  <option key={job.id} value={job.id}>
                    {job.po_reference ?? `JO-${job.id}`} — {job.client_name}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Equipment">
              <select
                value={assignmentFormState.equipment}
                onChange={handleAssignmentChange('equipment')}
                className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-700 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
              >
                <option value="">None</option>
                {equipmentItems.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.tag_code} — {item.type}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Client">
              <select
                value={assignmentFormState.client}
                onChange={handleAssignmentChange('client')}
                className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-700 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
              >
                <option value="">None</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Assigned on" required>
              <input
                type="datetime-local"
                value={assignmentFormState.assigned_on}
                onChange={handleAssignmentChange('assigned_on')}
                className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-700 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
              />
            </FormField>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <FormField label="Expected return">
              <input
                type="date"
                value={assignmentFormState.expected_return}
                onChange={handleAssignmentChange('expected_return')}
                className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-700 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
              />
            </FormField>

            <FormField label="Returned on">
              <input
                type="datetime-local"
                value={assignmentFormState.returned_on}
                onChange={handleAssignmentChange('returned_on')}
                className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-700 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
              />
            </FormField>
          </div>

          <FormField label="Notes">
            <textarea
              value={assignmentFormState.notes}
              onChange={handleAssignmentChange('notes')}
              placeholder="Add custodial instructions or follow-up tasks"
              className="h-24 w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-700 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
            />
          </FormField>
        </form>
      </CrudDrawer>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Inventory overview</h2>
          <div className="text-xs uppercase tracking-wide text-slate-400">
            {tools.length} tool{tools.length === 1 ? '' : 's'}
          </div>
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="h-48 rounded-3xl border border-slate-200/70 bg-white/70 p-6 shadow-inner shadow-slate-200/60 animate-pulse"
              />
            ))}
          </div>
        ) : tools.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-slate-300 bg-white/70 px-10 py-16 text-center">
            <Sparkles className="h-8 w-8 text-slate-400" />
            <h3 className="text-base font-semibold text-slate-800">No tools match the current filters</h3>
            <p className="text-sm text-slate-500">
              Adjust the filters or add a new tool to start building the inventory record.
            </p>
            <button
              onClick={openCreateDrawer}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-sky-200 hover:text-slate-900"
            >
              <Plus className="h-4 w-4" />
              Add tool
            </button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {tools.map((tool) => {
              const calibrationDue = tool.calibration_due
                ? formatDate(tool.calibration_due)
                : '—'
              const isOverdue = Boolean(tool.is_overdue_for_calibration)
              const statusClasses = STATUS_BADGES[tool.status]

              return (
                <article
                  key={tool.id}
                  className="group relative flex h-full flex-col justify-between rounded-3xl border border-slate-200/80 bg-white/90 p-6 shadow-lg shadow-slate-200/60 backdrop-blur transition hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500/15 to-indigo-500/15 text-sky-600">
                        <Wrench className="h-4 w-4" />
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-slate-900">{tool.name}</h3>
                        <p className="text-xs uppercase tracking-wide text-slate-400">
                          SN {tool.serial_number}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEditDrawer(tool)}
                        className="rounded-full border border-slate-200 p-2 text-slate-400 transition hover:border-sky-200 hover:text-sky-600"
                        aria-label={`Edit ${tool.name}`}
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(tool)}
                        className="rounded-full border border-slate-200 p-2 text-slate-400 transition hover:border-rose-200 hover:text-rose-500"
                        aria-label={`Delete ${tool.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 space-y-3 text-sm text-slate-600">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide">
                        <span className={cn('rounded-full px-2 py-1', statusClasses)}>{tool.status}</span>
                      </span>
                      {tool.assignment_mode && (
                        <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                          <Layers className="h-3 w-3" />
                          {tool.assignment_mode.replace('_', ' ')}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs uppercase tracking-wide text-slate-400">
                      <div className="rounded-2xl bg-slate-100/70 p-3 text-[11px] font-semibold text-slate-600">
                        <div className="text-[10px] text-slate-400">Category</div>
                        <div className="mt-1 text-xs text-slate-800">
                          {tool.category_info ? `${tool.category_info.code} — ${tool.category_info.name}` : '—'}
                        </div>
                      </div>
                      <div className="rounded-2xl bg-slate-100/70 p-3 text-[11px] font-semibold text-slate-600">
                        <div className="text-[10px] text-slate-400">Custodian</div>
                        <div className="mt-1 text-xs text-slate-800">
                          {tool.assigned_to_name ?? 'Unassigned'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-white/80 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      <div className="inline-flex items-center gap-2">
                        <RefreshCw className="h-3.5 w-3.5 text-slate-400" />
                        Calibration due
                      </div>
                      <div className={cn('text-sm font-medium', isOverdue ? 'text-rose-500' : 'text-slate-700')}>
                        {calibrationDue}
                      </div>
                    </div>

                    {tool.location && (
                      <div className="rounded-2xl border border-slate-200/80 bg-slate-50/60 px-4 py-3 text-xs text-slate-600">
                        <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                          Location
                        </div>
                        <div className="mt-1 text-sm font-medium text-slate-700">{tool.location}</div>
                      </div>
                    )}

                    {isOverdue && (
                      <div className="inline-flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50/70 px-4 py-2 text-xs font-semibold text-rose-600">
                        <ShieldAlert className="h-4 w-4" />
                        Calibration overdue. Escalate to technical manager.
                      </div>
                    )}
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>

      <CrudDrawer
        open={isIncidentDrawerOpen}
        onClose={closeIncidentDrawer}
        title={editingIncident ? 'Update incident' : 'Report incident'}
        description={
          editingIncident
            ? 'Update the status or resolution details for this incident record.'
            : 'Document an instrument issue so it can be escalated and investigated.'
        }
        footer={
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={closeIncidentDrawer}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:border-slate-300 hover:text-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="incident-form"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-rose-500 to-orange-500 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-70"
              disabled={createIncident.isPending || updateIncident.isPending}
            >
              {createIncident.isPending || updateIncident.isPending
                ? 'Saving...'
                : editingIncident
                ? 'Save changes'
                : 'Report incident'}
            </button>
          </div>
        }
      >
        <form id="incident-form" className="space-y-6" onSubmit={handleIncidentSubmit}>
          <div className="grid gap-6 md:grid-cols-2">
            <FormField label="Tool" required>
              <select
                value={incidentFormState.tool}
                onChange={handleIncidentChange('tool')}
                className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-700 focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-200"
              >
                <option value="">Select tool</option>
                {toolOptions.map((toolOption) => (
                  <option key={toolOption.id} value={toolOption.id}>
                    {toolOption.name} — SN {toolOption.serial_number}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Incident type" required>
              <select
                value={incidentFormState.incident_type}
                onChange={handleIncidentChange('incident_type')}
                className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-700 focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-200"
              >
                {INCIDENT_TYPE_OPTIONS.filter((option) => option.value !== 'ALL').map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </FormField>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <FormField label="Severity" required>
              <select
                value={incidentFormState.severity}
                onChange={handleIncidentChange('severity')}
                className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-700 focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-200"
              >
                {INCIDENT_SEVERITY_OPTIONS.filter((option) => option.value !== 'ALL').map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Occurred on" required>
              <input
                type="date"
                value={incidentFormState.occurred_on}
                onChange={handleIncidentChange('occurred_on')}
                className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-700 focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-200"
              />
            </FormField>
          </div>

          <FormField label="Description">
            <textarea
              value={incidentFormState.description}
              onChange={handleIncidentChange('description')}
              placeholder="Describe what happened and the immediate impact"
              className="h-28 w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-700 focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-200"
            />
          </FormField>

          <div className="grid gap-6 md:grid-cols-2">
            <FormField label="Resolved on">
              <input
                type="date"
                value={incidentFormState.resolved_on}
                onChange={handleIncidentChange('resolved_on')}
                className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-700 focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-200"
              />
            </FormField>

            <FormField label="Resolution notes">
              <textarea
                value={incidentFormState.resolution_notes}
                onChange={handleIncidentChange('resolution_notes')}
                placeholder="Summarize how the issue was addressed"
                className="h-24 w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-700 focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-200"
              />
            </FormField>
          </div>
        </form>
      </CrudDrawer>

      {activeAssignments?.results && activeAssignments.results.length > 0 && (
        <section className="rounded-3xl border border-slate-200/70 bg-white/80 p-6 shadow-lg shadow-slate-200/50 backdrop-blur">
          <h2 className="text-lg font-semibold text-slate-900">Active custody snapshot</h2>
          <p className="mt-1 text-sm text-slate-500">
            Quick pulse on the latest 10 tool custody transactions across the field team.
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {activeAssignments.results.map((assignment) => (
              <div
                key={assignment.id}
                className="rounded-2xl border border-slate-200/70 bg-slate-50/60 px-4 py-3 text-xs text-slate-600"
              >
                <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  <span>{assignment.assignment_type}</span>
                  <span className="text-slate-500">{assignment.status}</span>
                </div>
                <div className="mt-2 space-y-1 text-sm text-slate-700">
                  <div className="font-semibold text-slate-900">
                    {assignment.tool_info?.name ?? 'Tool'}
                  </div>
                  {assignment.assigned_user_name && (
                    <div className="text-xs text-slate-500">Custodian: {assignment.assigned_user_name}</div>
                  )}
                  {assignment.job_order_reference && (
                    <div className="text-xs text-slate-500">Job order: {assignment.job_order_reference}</div>
                  )}
                  {assignment.equipment_tag && (
                    <div className="text-xs text-slate-500">Equipment: {assignment.equipment_tag}</div>
                  )}
                  {assignment.client_name && (
                    <div className="text-xs text-slate-500">Client: {assignment.client_name}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Tool categories</h2>
            <p className="text-sm text-slate-500">
              Define reusable groupings that drive default assignment behavior and calibration guardrails.
            </p>
          </div>
          <button
            onClick={openCreateCategoryDrawer}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-sky-200 hover:text-slate-900"
          >
            <Boxes className="h-4 w-4" />
            Add category
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {categories.map((category) => (
            <article
              key={category.id}
              className="group relative flex h-full flex-col justify-between rounded-3xl border border-slate-200/70 bg-white/90 p-5 shadow-lg shadow-slate-200/60 transition hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/10 to-sky-500/10 text-sky-600">
                    <Hammer className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">{category.name}</h3>
                    <p className="text-xs uppercase tracking-wide text-slate-400">{category.code}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEditCategoryDrawer(category)}
                    className="rounded-full border border-slate-200 p-2 text-slate-400 transition hover:border-sky-200 hover:text-sky-600"
                    aria-label={`Edit category ${category.name}`}
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleCategoryDelete(category)}
                    className="rounded-full border border-slate-200 p-2 text-slate-400 transition hover:border-rose-200 hover:text-rose-500"
                    aria-label={`Delete category ${category.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="mt-4 space-y-3 text-sm text-slate-600">
                {category.description && (
                  <p className="rounded-2xl border border-slate-200/70 bg-slate-50/70 px-4 py-3 text-xs text-slate-600">
                    {category.description}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1">
                    <Layers className="h-3 w-3" />
                    {category.default_assignment_type.replace('_', ' ')}
                  </span>
                  {category.requires_calibration && (
                    <span className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-amber-600 border border-amber-200">
                      <ShieldAlert className="h-3.5 w-3.5" />
                      Calibration required
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-slate-500">
                  <div className="rounded-2xl border border-slate-200/70 bg-white/80 px-4 py-3">
                    <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                      Calibration interval
                    </div>
                    <div className="mt-1 text-sm font-medium text-slate-700">
                      {category.calibration_interval_days
                        ? `${category.calibration_interval_days} days`
                        : 'Not set'}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-slate-200/70 bg-white/80 px-4 py-3">
                    <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Notes</div>
                    <div className="mt-1 text-sm font-medium text-slate-700">
                      {category.notes ? category.notes : '—'}
                    </div>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <CrudDrawer
        open={isDrawerOpen}
        onClose={closeDrawer}
        title={editingTool ? 'Update tool' : 'Add tool'}
        description={
          editingTool
            ? 'Adjust status, assignment, or calibration schedule for this instrument.'
            : 'Register a new instrument in the governance inventory so assignments can be tracked end-to-end.'
        }
        size="lg"
        footer={
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={closeDrawer}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:border-slate-300 hover:text-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="tool-form"
              disabled={isSaving}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-sky-500 to-indigo-500 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSaving ? 'Saving...' : editingTool ? 'Save changes' : 'Create tool'}
            </button>
          </div>
        }
      >
        <form id="tool-form" className="space-y-6" onSubmit={handleSubmit}>
          <div className="grid gap-6 md:grid-cols-2">
            <FormField label="Tool name" required>
              <input
                value={formState.name}
                onChange={handleChange('name')}
                placeholder="e.g. Fluke 87V"
                className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-700 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
              />
            </FormField>

            <FormField label="Serial number" required>
              <input
                value={formState.serial_number}
                onChange={handleChange('serial_number')}
                placeholder="Unique serial or asset ID"
                className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-700 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
              />
            </FormField>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <FormField label="Category">
              <select
                value={formState.category}
                onChange={handleChange('category')}
                className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-700 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
              >
                <option value="">Unassigned</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.code} — {category.name}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Custodian">
              <select
                value={formState.assigned_to}
                onChange={handleChange('assigned_to')}
                className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-700 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
              >
                <option value="">Unassigned</option>
                {allUsers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.first_name && user.last_name
                      ? `${user.first_name} ${user.last_name}`
                      : user.username}
                  </option>
                ))}
              </select>
            </FormField>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <FormField label="Status" required>
              <select
                value={formState.status}
                onChange={handleChange('status')}
                className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-700 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
              >
                {STATUS_OPTIONS.filter((option) => option.value !== 'ALL').map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Assignment mode" required>
              <select
                value={formState.assignment_mode}
                onChange={handleChange('assignment_mode')}
                className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-700 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
              >
                {ASSIGNMENT_MODE_OPTIONS.filter((option) => option.value !== 'ALL').map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </FormField>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <FormField label="Calibration due">
              <input
                type="date"
                value={formState.calibration_due}
                onChange={handleChange('calibration_due')}
                className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-700 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
              />
            </FormField>

            <FormField label="Location">
              <input
                value={formState.location}
                onChange={handleChange('location')}
                placeholder="Warehouse A, Kit 3, etc."
                className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-700 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
              />
            </FormField>
          </div>
        </form>
      </CrudDrawer>

      <CrudDrawer
        open={isCategoryDrawerOpen}
        onClose={closeCategoryDrawer}
        title={editingCategory ? 'Update category' : 'Add category'}
        description={
          editingCategory
            ? 'Refine calibration cadence or assignment defaults for this category.'
            : 'Create a category to drive assignment defaults, calibration intervals, and reporting.'
        }
        footer={
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={closeCategoryDrawer}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:border-slate-300 hover:text-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="category-form"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-sky-500 to-indigo-500 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-70"
              disabled={createCategory.isPending || updateCategory.isPending}
            >
              {createCategory.isPending || updateCategory.isPending
                ? 'Saving...'
                : editingCategory
                ? 'Save changes'
                : 'Create category'}
            </button>
          </div>
        }
      >
        <form id="category-form" className="space-y-6" onSubmit={handleCategorySubmit}>
          <div className="grid gap-6 md:grid-cols-2">
            <FormField label="Category code" required>
              <input
                value={categoryFormState.code}
                onChange={handleCategoryChange('code')}
                placeholder="e.g. CAL-IND"
                className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-700 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
              />
            </FormField>
            <FormField label="Category name" required>
              <input
                value={categoryFormState.name}
                onChange={handleCategoryChange('name')}
                placeholder="Calibration instruments"
                className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-700 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
              />
            </FormField>
          </div>

          <FormField label="Description">
            <textarea
              value={categoryFormState.description}
              onChange={handleCategoryChange('description')}
              placeholder="Explain the type of instruments in this category."
              className="h-28 w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-700 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
            />
          </FormField>

          <div className="grid gap-6 md:grid-cols-2">
            <FormField label="Default assignment mode" required>
              <select
                value={categoryFormState.default_assignment_type}
                onChange={handleCategoryChange('default_assignment_type')}
                className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-700 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
              >
                {ASSIGNMENT_MODE_OPTIONS.filter((option) => option.value !== 'ALL').map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField
              label="Calibration interval (days)"
              description="Leave blank for no automatic reminders"
            >
              <input
                type="number"
                min={0}
                value={categoryFormState.calibration_interval_days}
                onChange={handleCategoryChange('calibration_interval_days')}
                className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-700 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
              />
            </FormField>
          </div>

          <div className="rounded-2xl border border-slate-200/70 bg-slate-50/70 px-4 py-3">
            <label className="flex items-center gap-3 text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                checked={categoryFormState.requires_calibration}
                onChange={handleCategoryChange('requires_calibration')}
                className="h-4 w-4 rounded border-slate-300 text-sky-500 focus:ring-sky-200"
              />
              <span>Requires periodic calibration</span>
            </label>
          </div>

          <FormField label="Notes">
            <textarea
              value={categoryFormState.notes}
              onChange={handleCategoryChange('notes')}
              placeholder="Operational notes, escalation contacts, or linked procedures."
              className="h-24 w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-700 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
            />
          </FormField>
        </form>
      </CrudDrawer>

      <section className="space-y-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Assignments ledger</h2>
            <p className="text-sm text-slate-500">
              Track who currently has custody, expected returns, and any linked work orders or equipment.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={assignmentSearch}
                onChange={(event) => setAssignmentSearch(event.target.value)}
                placeholder="Search by tool, custodian, or notes"
                className="w-full rounded-xl border border-slate-200 bg-white/90 py-2.5 pl-10 pr-4 text-sm text-slate-700 shadow-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
              />
            </div>
            <div className="flex gap-3">
              <select
                value={assignmentStatus}
                onChange={(event) => setAssignmentStatus(event.target.value as AssignmentStatusFilter)}
                className="rounded-xl border border-slate-200 bg-white/90 px-4 py-2.5 text-sm text-slate-700 shadow-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
              >
                {ASSIGNMENT_STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <select
                value={assignmentType}
                onChange={(event) => setAssignmentType(event.target.value as AssignmentTypeFilter)}
                className="rounded-xl border border-slate-200 bg-white/90 px-4 py-2.5 text-sm text-slate-700 shadow-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
              >
                {ASSIGNMENT_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={openCreateAssignmentDrawer}
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-sky-500 to-indigo-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-sky-200/50 transition hover:shadow-xl"
            >
              <ClipboardSignature className="h-4 w-4" />
              Log assignment
            </button>
          </div>
        </div>

        {isAssignmentsLoading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="h-48 rounded-3xl border border-slate-200/70 bg-white/80 shadow-inner shadow-slate-200/60 animate-pulse"
              />
            ))}
          </div>
        ) : assignments.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white/70 px-10 py-16 text-center">
            <ListChecks className="mx-auto h-8 w-8 text-slate-400" />
            <h3 className="mt-3 text-base font-semibold text-slate-800">No assignment history found</h3>
            <p className="mt-1 text-sm text-slate-500">
              Start logging custody events so the team knows where instruments are heading next.
            </p>
            <button
              onClick={openCreateAssignmentDrawer}
              className="mt-4 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-sky-200 hover:text-slate-900"
            >
              <Plus className="h-4 w-4" />
              Log first assignment
            </button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {assignments.map((assignment) => (
              <article
                key={assignment.id}
                className="relative flex h-full flex-col justify-between rounded-3xl border border-slate-200/70 bg-white/90 p-5 shadow-lg shadow-slate-200/60 transition hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                      <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-slate-600">
                        <Layers className="h-3 w-3" />
                        {ASSIGNMENT_TYPE_LABELS[assignment.assignment_type]}
                      </span>
                      <span
                        className={cn(
                          'inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide',
                          ASSIGNMENT_STATUS_BADGES[assignment.status]
                        )}
                      >
                        {assignment.status}
                      </span>
                    </div>
                    <h3 className="mt-3 text-base font-semibold text-slate-900">
                      {assignment.tool_info?.name ?? 'Tool'}
                    </h3>
                    <p className="text-xs uppercase tracking-wide text-slate-400">
                      SN {assignment.tool_info?.serial_number ?? assignment.tool}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEditAssignmentDrawer(assignment)}
                      className="rounded-full border border-slate-200 p-2 text-slate-400 transition hover:border-sky-200 hover:text-sky-600"
                      aria-label="Edit assignment"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleAssignmentDelete(assignment)}
                      className="rounded-full border border-slate-200 p-2 text-slate-400 transition hover:border-rose-200 hover:text-rose-500"
                      aria-label="Delete assignment"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-4 space-y-3 text-sm text-slate-600">
                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-500">
                    <div className="rounded-2xl border border-slate-200/70 bg-slate-50/70 px-4 py-3">
                      <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Custodian</div>
                      <div className="mt-1 text-sm font-medium text-slate-700">
                        {assignment.assigned_user_name ?? 'Not assigned'}
                      </div>
                    </div>
                    <div className="rounded-2xl border border-slate-200/70 bg-slate-50/70 px-4 py-3">
                      <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Assigned on</div>
                      <div className="mt-1 text-sm font-medium text-slate-700">
                        {formatDateTime(assignment.assigned_on)}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-500">
                    <div className="rounded-2xl border border-slate-200/70 bg-white/80 px-4 py-3">
                      <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Expected return</div>
                      <div className="mt-1 text-sm font-medium text-slate-700">
                        {assignment.expected_return ? formatDate(assignment.expected_return) : 'Not set'}
                      </div>
                    </div>
                    <div className="rounded-2xl border border-slate-200/70 bg-white/80 px-4 py-3">
                      <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Returned on</div>
                      <div className="mt-1 text-sm font-medium text-slate-700">
                        {assignment.returned_on ? formatDateTime(assignment.returned_on) : '—'}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1 text-xs text-slate-500">
                    {assignment.job_order_reference && (
                      <div>Job order: {assignment.job_order_reference}</div>
                    )}
                    {assignment.equipment_tag && <div>Equipment: {assignment.equipment_tag}</div>}
                    {assignment.client_name && <div>Client: {assignment.client_name}</div>}
                    {assignment.notes && (
                      <p className="rounded-2xl border border-slate-200/70 bg-slate-50/70 px-4 py-2 text-xs text-slate-600">
                        {assignment.notes}
                      </p>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Incident log</h2>
            <p className="text-sm text-slate-500">
              Capture lost, damaged, or calibration-failed instruments so preventive actions can be taken quickly.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex gap-3">
              <select
                value={incidentTypeFilter}
                onChange={(event) => setIncidentTypeFilter(event.target.value as IncidentTypeFilter)}
                className="rounded-xl border border-slate-200 bg-white/90 px-4 py-2.5 text-sm text-slate-700 shadow-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
              >
                {INCIDENT_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <select
                value={incidentSeverityFilter}
                onChange={(event) => setIncidentSeverityFilter(event.target.value as IncidentSeverityFilter)}
                className="rounded-xl border border-slate-200 bg-white/90 px-4 py-2.5 text-sm text-slate-700 shadow-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
              >
                {INCIDENT_SEVERITY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={openCreateIncidentDrawer}
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-rose-500 to-orange-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-rose-200/50 transition hover:shadow-xl"
            >
              <AlertTriangle className="h-4 w-4" />
              Report incident
            </button>
          </div>
        </div>

        {isIncidentsLoading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="h-48 rounded-3xl border border-slate-200/70 bg-white/80 shadow-inner shadow-slate-200/60 animate-pulse"
              />
            ))}
          </div>
        ) : incidents.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white/70 px-10 py-16 text-center">
            <AlertTriangle className="mx-auto h-8 w-8 text-slate-400" />
            <h3 className="mt-3 text-base font-semibold text-slate-800">No incidents logged</h3>
            <p className="mt-1 text-sm text-slate-500">
              When issues occur, document them here to trigger remedial and replacement workflows.
            </p>
            <button
              onClick={openCreateIncidentDrawer}
              className="mt-4 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-sky-200 hover:text-slate-900"
            >
              <Plus className="h-4 w-4" />
              Report first incident
            </button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {incidents.map((incident) => (
              <article
                key={incident.id}
                className="relative flex h-full flex-col justify-between rounded-3xl border border-slate-200/70 bg-white/90 p-5 shadow-lg shadow-slate-200/60 transition hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-2">
                    <span
                      className={cn(
                        'inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide',
                        INCIDENT_SEVERITY_BADGES[incident.severity]
                      )}
                    >
                      {INCIDENT_SEVERITY_LABELS[incident.severity]}
                    </span>
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      {INCIDENT_TYPE_LABELS[incident.incident_type]}
                    </div>
                    <h3 className="text-base font-semibold text-slate-900">
                      {incident.tool_info?.name ?? 'Tool'}
                    </h3>
                    <p className="text-xs uppercase tracking-wide text-slate-400">
                      SN {incident.tool_info?.serial_number ?? incident.tool}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEditIncidentDrawer(incident)}
                      className="rounded-full border border-slate-200 p-2 text-slate-400 transition hover:border-sky-200 hover:text-sky-600"
                      aria-label="Edit incident"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleIncidentDelete(incident)}
                      className="rounded-full border border-slate-200 p-2 text-slate-400 transition hover:border-rose-200 hover:text-rose-500"
                      aria-label="Delete incident"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-4 space-y-3 text-sm text-slate-600">
                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-500">
                    <div className="rounded-2xl border border-slate-200/70 bg-slate-50/70 px-4 py-3">
                      <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Occurred on</div>
                      <div className="mt-1 text-sm font-medium text-slate-700">{formatDate(incident.occurred_on)}</div>
                    </div>
                    <div className="rounded-2xl border border-slate-200/70 bg-slate-50/70 px-4 py-3">
                      <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Resolved on</div>
                      <div className="mt-1 text-sm font-medium text-slate-700">
                        {incident.resolved_on ? formatDate(incident.resolved_on) : 'Open'}
                      </div>
                    </div>
                  </div>

                  {incident.description && (
                    <p className="rounded-2xl border border-slate-200/70 bg-slate-50/70 px-4 py-2 text-xs text-slate-600">
                      {incident.description}
                    </p>
                  )}

                  {incident.resolution_notes && (
                    <p className="rounded-2xl border border-emerald-200/80 bg-emerald-50/70 px-4 py-2 text-xs text-emerald-700">
                      {incident.resolution_notes}
                    </p>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
