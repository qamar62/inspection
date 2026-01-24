'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  CompetenceAuthorization,
  CompetenceEvidence,
  PaginatedResponse,
  Person,
  PersonCredential,
} from '@/types'
import { apiClient } from '@/lib/api-client'
import { buildQueryString } from '@/lib/query-helpers'

type Nullable<T> = T | null | undefined

// --------------------
// People Registry Hooks
// --------------------

export interface PeopleFilters {
  search?: string
  person_type?: string
  client?: Nullable<number>
  page?: number
  page_size?: number
}

export function usePeople(filters: PeopleFilters = {}) {
  return useQuery({
    queryKey: ['people', filters],
    queryFn: async () => {
      const { page, page_size = 50, search, person_type, client } = filters
      const query = buildQueryString({
        page,
        page_size,
        search: search?.trim(),
        person_type,
        client,
      })

      return apiClient.get<PaginatedResponse<Person>>(`/people/${query}`)
    },
  })
}

export function usePerson(personId?: Nullable<number>) {
  return useQuery({
    queryKey: ['people', personId],
    enabled: Boolean(personId),
    queryFn: () => apiClient.get<Person>(`/people/${personId}/`),
  })
}

export function useCreatePerson() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: Partial<Person>) => apiClient.post<Person>('/people/', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['people'] })
    },
  })
}

export function useUpdatePerson(personId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: Partial<Person>) => apiClient.patch<Person>(`/people/${personId}/`, payload),
    onSuccess: (_data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ['people'] })
      queryClient.invalidateQueries({ queryKey: ['people', personId] })
    },
  })
}

export function useDeletePerson() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (personId: number) => apiClient.delete<void>(`/people/${personId}/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['people'] })
    },
  })
}

// ----------------------------
// Person Credential Management
// ----------------------------

export function usePersonCredentials(personId?: Nullable<number>) {
  return useQuery({
    queryKey: ['person-credentials', personId],
    enabled: Boolean(personId),
    queryFn: () =>
      apiClient.get<PaginatedResponse<PersonCredential>>(
        `/person-credentials/${buildQueryString({ person: personId })}`
      ),
  })
}

export function useAddPersonCredential() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: Partial<PersonCredential>) =>
      apiClient.post<PersonCredential>('/person-credentials/', payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['person-credentials', variables.person] })
      queryClient.invalidateQueries({ queryKey: ['people'] })
    },
  })
}

export function useDeletePersonCredential() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, person }: { id: number; person: number }) =>
      apiClient.delete<void>(`/person-credentials/${id}/`),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['person-credentials', variables.person] })
      queryClient.invalidateQueries({ queryKey: ['people'] })
    },
  })
}

// ------------------------------
// Competence Matrix Authorizations
// ------------------------------

export interface CompetenceFilters {
  search?: string
  user?: Nullable<number>
  service?: Nullable<number>
  status?: string
  level?: string
  page?: number
  page_size?: number
}

export function useCompetenceAuthorizations(filters: CompetenceFilters = {}) {
  return useQuery({
    queryKey: ['competence-authorizations', filters],
    queryFn: () => {
      const { page, page_size = 50, search, user, service, status, level } = filters
      const query = buildQueryString({ page, page_size, search, user, service, status, level })
      return apiClient.get<PaginatedResponse<CompetenceAuthorization>>(
        `/competence-authorizations/${query}`
      )
    },
  })
}

export function useCompetenceAuthorization(authorizationId?: Nullable<number>) {
  return useQuery({
    queryKey: ['competence-authorization', authorizationId],
    enabled: Boolean(authorizationId),
    queryFn: () =>
      apiClient.get<CompetenceAuthorization>(`/competence-authorizations/${authorizationId}/`),
  })
}

export function useCreateCompetenceAuthorization() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: Partial<CompetenceAuthorization>) =>
      apiClient.post<CompetenceAuthorization>('/competence-authorizations/', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['competence-authorizations'] })
    },
  })
}

export function useUpdateCompetenceAuthorization(authorizationId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: Partial<CompetenceAuthorization>) =>
      apiClient.patch<CompetenceAuthorization>(
        `/competence-authorizations/${authorizationId}/`,
        payload
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['competence-authorizations'] })
      queryClient.invalidateQueries({ queryKey: ['competence-authorization', authorizationId] })
    },
  })
}

export function useDeleteCompetenceAuthorization() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (authorizationId: number) =>
      apiClient.delete<void>(`/competence-authorizations/${authorizationId}/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['competence-authorizations'] })
    },
  })
}

// ------------------------------
// Competence Evidence management
// ------------------------------

export function useCompetenceEvidence(authorizationId?: Nullable<number>) {
  return useQuery({
    queryKey: ['competence-evidence', authorizationId],
    enabled: Boolean(authorizationId),
    queryFn: () =>
      apiClient.get<PaginatedResponse<CompetenceEvidence>>(
        `/competence-evidence/${buildQueryString({ authorization: authorizationId })}`
      ),
  })
}

export function useAddCompetenceEvidence() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: Partial<CompetenceEvidence>) =>
      apiClient.post<CompetenceEvidence>('/competence-evidence/', payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['competence-evidence', variables.authorization as number],
      })
      queryClient.invalidateQueries({ queryKey: ['competence-authorizations'] })
    },
  })
}

export function useDeleteCompetenceEvidence() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, authorization }: { id: number; authorization: number }) =>
      apiClient.delete<void>(`/competence-evidence/${id}/`),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['competence-evidence', variables.authorization] })
      queryClient.invalidateQueries({ queryKey: ['competence-authorizations'] })
    },
  })
}
