'use client'

import { useMemo, useState } from 'react'
import { CheckCircle2, Filter, GraduationCap, Search, ShieldCheck, Users } from 'lucide-react'
import { useCompetenceAuthorizations } from '@/hooks/hr'
import type { CompetenceLevel, CompetenceStatus } from '@/types'
import { cn, formatDate } from '@/lib/utils'

const LEVEL_LABELS: Record<CompetenceLevel, string> = {
  SUPERVISED: 'Supervised',
  AUTHORIZED: 'Authorized',
  LEAD: 'Lead',
}

const STATUS_BADGES: Record<CompetenceStatus, string> = {
  ACTIVE: 'bg-emerald-100 text-emerald-700',
  EXPIRED: 'bg-amber-100 text-amber-700',
  REVOKED: 'bg-rose-100 text-rose-700',
}

const STATUS_OPTIONS: Array<{ value: CompetenceStatus | 'ALL'; label: string }> = [
  { value: 'ALL', label: 'All statuses' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'EXPIRED', label: 'Expired' },
  { value: 'REVOKED', label: 'Revoked' },
]

const LEVEL_OPTIONS: Array<{ value: CompetenceLevel | 'ALL'; label: string }> = [
  { value: 'ALL', label: 'All levels' },
  { value: 'SUPERVISED', label: 'Supervised' },
  { value: 'AUTHORIZED', label: 'Authorized' },
  { value: 'LEAD', label: 'Lead' },
]

export default function CompetenceMatrixPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<CompetenceStatus | 'ALL'>('ALL')
  const [levelFilter, setLevelFilter] = useState<CompetenceLevel | 'ALL'>('ALL')

  const filters = useMemo(
    () => ({
      search: search.trim() || undefined,
      status: statusFilter === 'ALL' ? undefined : statusFilter,
      level: levelFilter === 'ALL' ? undefined : levelFilter,
      page_size: 50,
    }),
    [search, statusFilter, levelFilter]
  )

  const { data, isLoading } = useCompetenceAuthorizations(filters)
  const authorizations = data?.results ?? []

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-wide text-slate-400">Competence Management</p>
          <h1 className="mt-1 text-3xl font-bold text-slate-900">Competence Matrix</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-500">
            Monitor inspector authorizations, track assessment evidence, and spot upcoming expirations.
          </p>
        </div>
        <button className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-amber-200/50 transition hover:shadow-xl">
          <ShieldCheck className="h-4 w-4" />
          New Authorization
        </button>
      </header>

      <section className="grid gap-4 rounded-3xl border border-slate-200/80 bg-white/80 p-6 shadow-[0_20px_60px_-40px_rgba(251,191,36,0.45)] backdrop-blur-sm lg:grid-cols-3">
        <div className="lg:col-span-2">
          <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Search</label>
          <div className="relative mt-2">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search inspector, discipline, or service code"
              className="w-full rounded-2xl border border-slate-200 bg-white/80 py-3 pl-11 pr-4 text-sm text-slate-700 shadow-inner focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200"
            />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Status</label>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as CompetenceStatus | 'ALL')}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white/80 py-3 px-4 text-sm text-slate-700 shadow-inner focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Level</label>
            <select
              value={levelFilter}
              onChange={(event) => setLevelFilter(event.target.value as CompetenceLevel | 'ALL')}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white/80 py-3 px-4 text-sm text-slate-700 shadow-inner focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200"
            >
              {LEVEL_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="flex flex-wrap gap-4">
        <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm text-slate-600 shadow-sm">
          <Users className="h-4 w-4 text-slate-400" />
          Inspectors tracked: {data?.count ?? 0}
        </div>
        <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm text-slate-600 shadow-sm">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          Active: {authorizations.filter((item) => item.status === 'ACTIVE').length}
        </div>
        <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm text-slate-600 shadow-sm">
          <Filter className="h-4 w-4 text-amber-400" />
          Filters applied: {[statusFilter, levelFilter].filter((value) => value !== 'ALL').length}
        </div>
      </section>

      {isLoading ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="h-48 animate-pulse rounded-3xl border border-slate-200/70 bg-gradient-to-br from-amber-50/70 to-white"
            />
          ))}
        </div>
      ) : authorizations.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white/70 p-12 text-center">
          <p className="text-lg font-semibold text-slate-700">No authorizations match your filters</p>
          <p className="mt-2 text-sm text-slate-500">Modify the filters or record a new authorization to populate the matrix.</p>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {authorizations.map((item) => (
            <article
              key={item.id}
              className="group relative overflow-hidden rounded-3xl border border-slate-200/70 bg-white/90 shadow-[0_25px_70px_-60px_rgba(15,23,42,0.3)] transition hover:-translate-y-1 hover:border-amber-200 hover:shadow-[0_35px_90px_-65px_rgba(251,191,36,0.5)]"
            >
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400" />
              <div className="space-y-4 p-6">
                <header className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Inspector</p>
                    <h3 className="mt-1 text-lg font-semibold text-slate-900">{item.user_name}</h3>
                    <p className="text-xs text-slate-500">{item.discipline || 'General Discipline'}</p>
                  </div>
                  <span
                    className={cn(
                      'rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide',
                      STATUS_BADGES[item.status]
                    )}
                  >
                    {item.status}
                  </span>
                </header>

                <div className="rounded-2xl border border-amber-100 bg-amber-50/70 p-4 text-sm text-amber-700">
                  <div className="flex items-center gap-2 font-semibold">
                    <GraduationCap className="h-4 w-4" />
                    Level: {LEVEL_LABELS[item.level]}
                  </div>
                  <p className="mt-1 text-xs text-amber-600/80">
                    Service {item.service_code || '—'} · Valid from {formatDate(item.valid_from)}
                    {item.valid_until ? ` to ${formatDate(item.valid_until)}` : ''}
                  </p>
                </div>

                <dl className="space-y-2 text-xs text-slate-500">
                  {item.scope_notes && (
                    <div>
                      <dt className="font-semibold text-slate-600">Scope Notes</dt>
                      <dd className="mt-1 line-clamp-2 leading-relaxed text-slate-500/90">{item.scope_notes}</dd>
                    </div>
                  )}
                  <div>
                    <dt className="font-semibold text-slate-600">Last Assessed</dt>
                    <dd className="mt-1 text-slate-500/90">{item.last_assessed ? formatDate(item.last_assessed) : '—'}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-slate-600">Evidence Items</dt>
                    <dd className="mt-1 text-slate-500/90">{item.evidence_items?.length ?? 0} linked artifacts</dd>
                  </div>
                </dl>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
