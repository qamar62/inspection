'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  PaginatedResponse,
  Tool,
  ToolCategory,
  ToolAssignment,
  ToolIncident,
  ToolUsageLog,
} from '@/types'
import { apiClient } from '@/lib/api-client'
import { buildQueryString } from '@/lib/query-helpers'

type Nullable<T> = T | null | undefined

// --------------------
// Tool inventory hooks
// --------------------

export interface ToolFilters {
  search?: string
  status?: string
  assignment_mode?: string
  category?: Nullable<number>
  assigned_to?: Nullable<number>
  page?: number
  page_size?: number
}

export function useTools(filters: ToolFilters = {}) {
  return useQuery({
    queryKey: ['tools', filters],
    queryFn: () => {
      const { page, page_size = 50, search, status, assignment_mode, category, assigned_to } = filters
      const query = buildQueryString({
        page,
        page_size,
        search: search?.trim(),
        status,
        assignment_mode,
        category,
        assigned_to,
      })
      return apiClient.get<PaginatedResponse<Tool>>(`/tools/${query}`)
    },
  })
}

export function useCreateTool() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: Partial<Tool>) => apiClient.post<Tool>('/tools/', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tools'] })
    },
  })
}

export function useUpdateTool(toolId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: Partial<Tool>) => apiClient.patch<Tool>(`/tools/${toolId}/`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tools'] })
      queryClient.invalidateQueries({ queryKey: ['tools', toolId] })
    },
  })
}

export function useDeleteTool() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (toolId: number) => apiClient.delete<void>(`/tools/${toolId}/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tools'] })
    },
  })
}

// --------------------
// Tool category hooks
// --------------------

export function useToolCategories() {
  return useQuery({
    queryKey: ['tool-categories'],
    queryFn: () => apiClient.get<PaginatedResponse<ToolCategory>>('/tool-categories/?page_size=200'),
  })
}

export function useCreateToolCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: Partial<ToolCategory>) =>
      apiClient.post<ToolCategory>('/tool-categories/', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tool-categories'] })
    },
  })
}

export function useUpdateToolCategory(categoryId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: Partial<ToolCategory>) =>
      apiClient.patch<ToolCategory>(`/tool-categories/${categoryId}/`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tool-categories'] })
    },
  })
}

export function useDeleteToolCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (categoryId: number) => apiClient.delete<void>(`/tool-categories/${categoryId}/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tool-categories'] })
    },
  })
}

// --------------------
// Tool assignment hooks
// --------------------

export interface ToolAssignmentFilters {
  tool?: Nullable<number>
  status?: string
  assignment_type?: string
  search?: string
  page?: number
  page_size?: number
}

export function useToolAssignments(filters: ToolAssignmentFilters = {}) {
  return useQuery({
    queryKey: ['tool-assignments', filters],
    queryFn: () => {
      const { tool, status, assignment_type, search, page, page_size = 50 } = filters
      const query = buildQueryString({ tool, status, assignment_type, search, page, page_size })
      return apiClient.get<PaginatedResponse<ToolAssignment>>(`/tool-assignments/${query}`)
    },
  })
}

export function useCreateToolAssignment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: Partial<ToolAssignment>) =>
      apiClient.post<ToolAssignment>('/tool-assignments/', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tool-assignments'] })
      queryClient.invalidateQueries({ queryKey: ['tools'] })
    },
  })
}

export function useUpdateToolAssignment(assignmentId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: Partial<ToolAssignment>) =>
      apiClient.patch<ToolAssignment>(`/tool-assignments/${assignmentId}/`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tool-assignments'] })
      queryClient.invalidateQueries({ queryKey: ['tool-assignments', assignmentId] })
      queryClient.invalidateQueries({ queryKey: ['tools'] })
    },
  })
}

export function useDeleteToolAssignment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (assignmentId: number) =>
      apiClient.delete<void>(`/tool-assignments/${assignmentId}/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tool-assignments'] })
      queryClient.invalidateQueries({ queryKey: ['tools'] })
    },
  })
}

export function useToolUsageLogs(toolId?: Nullable<number>) {
  return useQuery({
    queryKey: ['tool-usage', toolId],
    enabled: Boolean(toolId),
    queryFn: () =>
      apiClient.get<PaginatedResponse<ToolUsageLog>>(
        `/tool-usage/${buildQueryString({ tool: toolId, page_size: 50 })}`
      ),
  })
}

export interface ToolIncidentFilters {
  tool?: Nullable<number>
  incident_type?: string
  severity?: string
  page?: number
  page_size?: number
}

export function useToolIncidents(filters: ToolIncidentFilters = {}) {
  return useQuery({
    queryKey: ['tool-incidents', filters],
    queryFn: () => {
      const { tool, incident_type, severity, page, page_size = 50 } = filters
      const query = buildQueryString({ tool, incident_type, severity, page, page_size })
      return apiClient.get<PaginatedResponse<ToolIncident>>(`/tool-incidents/${query}`)
    },
  })
}

export function useCreateToolIncident() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: Partial<ToolIncident>) =>
      apiClient.post<ToolIncident>('/tool-incidents/', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tool-incidents'] })
      queryClient.invalidateQueries({ queryKey: ['tool-assignments'] })
      queryClient.invalidateQueries({ queryKey: ['tools'] })
    },
  })
}

export function useUpdateToolIncident(incidentId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: Partial<ToolIncident>) =>
      apiClient.patch<ToolIncident>(`/tool-incidents/${incidentId}/`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tool-incidents'] })
      queryClient.invalidateQueries({ queryKey: ['tool-incidents', incidentId] })
    },
  })
}

export function useDeleteToolIncident() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (incidentId: number) => apiClient.delete<void>(`/tool-incidents/${incidentId}/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tool-incidents'] })
    },
  })
}
