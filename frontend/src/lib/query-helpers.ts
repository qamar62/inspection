'use client'

export function buildQueryString(params: Record<string, unknown>): string {
  const searchParams = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return

    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (item === undefined || item === null || item === '') return
        searchParams.append(key, String(item))
      })
    } else {
      searchParams.append(key, String(value))
    }
  })

  const query = searchParams.toString()
  return query ? `?${query}` : ''
}
