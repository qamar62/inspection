'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { PaginatedResponse, User } from '@/types'
import { apiClient } from '@/lib/api-client'
import { buildQueryString } from '@/lib/query-helpers'

export interface UserFilters {
  search?: string
  ordering?: string
  page?: number
  page_size?: number
}

export function useUsers(filters: UserFilters = {}) {
  return useQuery({
    queryKey: ['users', filters],
    queryFn: () => {
      const { search, ordering, page, page_size = 50 } = filters
      const query = buildQueryString({ search, ordering, page, page_size })
      return apiClient.get<PaginatedResponse<User>>(`/users/${query}`)
    },
  })
}

export function useUpdateUser(userId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: Partial<User>) => apiClient.patch<User>(`/users/${userId}/`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      queryClient.invalidateQueries({ queryKey: ['users', userId] })
    },
  })
}
