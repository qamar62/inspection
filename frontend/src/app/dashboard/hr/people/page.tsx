'use client'

import { useMemo, useState } from 'react'
import { Plus, Search, Users, Building2, Phone, Mail } from 'lucide-react'
import { usePeople } from '@/hooks/hr'
import type { PersonType } from '@/types'
import { cn, formatDate } from '@/lib/utils'

const PERSON_TYPE_LABELS: Record<PersonType, string> = {
  OPERATOR: 'Operator',
  TRAINEE: 'Trainee',
  CLIENT_STAFF: 'Client Staff',
  INTERNAL: 'Internal Staff',
}

const PERSON_TYPE_OPTIONS: Array<{ value: PersonType | 'ALL'; label: string }> = [
  { value: 'ALL', label: 'All Categories' },
  ...Object.entries(PERSON_TYPE_LABELS).map(([value, label]) => ({ value: value as PersonType, label })),
]

export default function PeopleRegistryPage() {
  const [search, setSearch] = useState('')
  const [personType, setPersonType] = useState<PersonType | 'ALL'>('ALL')

  const filters = useMemo(
    () => ({
      search: search.trim() || undefined,
      person_type: personType === 'ALL' ? undefined : personType,
      page_size: 50,
    }),
    [search, personType]
  )

  const { data, isLoading } = usePeople(filters)
  const people = data?.results ?? []

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-wide text-slate-400">HR Registry</p>
          <h1 className="mt-1 text-3xl font-bold text-slate-900">People Registry</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-500">
            Track internal staff, operators, trainees, and client contacts together with their credentials.
          </p>
        </div>
        <button className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-200/40 transition hover:shadow-xl">
          <Plus className="h-4 w-4" />
          Add Person
        </button>
      </header>

      <section className="grid gap-4 rounded-3xl border border-slate-200/80 bg-white/80 p-6 shadow-[0_20px_60px_-40px_rgba(56,189,248,0.45)] backdrop-blur-sm sm:grid-cols-3">
        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Search</label>
          <div className="relative mt-2">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name, email, or employer"
              className="w-full rounded-2xl border border-slate-200 bg-white/80 py-3 pl-11 pr-4 text-sm text-slate-700 shadow-inner focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Category</label>
          <select
            value={personType}
            onChange={(event) => setPersonType(event.target.value as PersonType | 'ALL')}
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white/80 py-3 px-4 text-sm text-slate-700 shadow-inner focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
          >
            {PERSON_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Users className="h-4 w-4" />
            <span>
              {isLoading ? 'Loading registry…' : `${data?.count ?? 0} total records`}
            </span>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="h-48 animate-pulse rounded-3xl border border-slate-200/70 bg-gradient-to-br from-slate-100/70 to-white"
              />
            ))}
          </div>
        ) : people.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white/70 p-12 text-center">
            <p className="text-lg font-semibold text-slate-700">No people found</p>
            <p className="mt-2 text-sm text-slate-500">
              Adjust your filters or add a new record to get started.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 xl:grid-cols-3">
            {people.map((person) => (
              <article
                key={person.id}
                className="group relative overflow-hidden rounded-3xl border border-slate-200/70 bg-white/90 shadow-[0_25px_70px_-60px_rgba(15,23,42,0.3)] transition hover:-translate-y-1 hover:border-sky-200 hover:shadow-[0_35px_90px_-65px_rgba(56,189,248,0.55)]"
              >
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-sky-500/80 via-indigo-500/80 to-violet-500/80" />
                <div className="p-6 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-xl font-semibold text-slate-900">
                        {person.first_name} {person.last_name}
                      </h3>
                      <p className="mt-1 inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
                        {PERSON_TYPE_LABELS[person.person_type]}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-slate-100 p-3 text-slate-400">
                      <Users className="h-4 w-4" />
                    </div>
                  </div>

                  <dl className="space-y-3 text-sm text-slate-600">
                    {person.employer && (
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-slate-400" />
                        <span>{person.employer}</span>
                      </div>
                    )}
                    {person.client_name && (
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-slate-400" />
                        <span>{person.client_name}</span>
                      </div>
                    )}
                    {person.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-slate-400" />
                        <span>{person.email}</span>
                      </div>
                    )}
                    {person.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-slate-400" />
                        <span>{person.phone}</span>
                      </div>
                    )}
                  </dl>

                  <div className="flex items-center justify-between border-t border-slate-100 pt-4 text-xs text-slate-400">
                    <span>Created {formatDate(person.created_at)}</span>
                    <span>{person.credentials?.length ?? 0} credentials</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
