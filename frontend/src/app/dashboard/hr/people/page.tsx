'use client'

import { useMemo, useState } from 'react'
import { Plus, Search, Users, Building2, Phone, Mail, Edit2, Trash2 } from 'lucide-react'
import {
  usePeople,
  useCreatePerson,
  useUpdatePerson,
  useDeletePerson,
} from '@/hooks/hr'
import type { PersonType, Person } from '@/types'
import { formatDate } from '@/lib/utils'
import { CrudDrawer } from '@/components/admin/CrudDrawer'
import { FormField } from '@/components/admin/FormField'
import { toast } from 'sonner'

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

type PersonFormState = {
  first_name: string
  last_name: string
  email?: string
  phone?: string
  person_type: PersonType
  employer?: string
  client?: string
  notes?: string
}

const EMPTY_FORM: PersonFormState = {
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  person_type: 'OPERATOR',
  employer: '',
  client: '',
  notes: '',
}

export default function PeopleRegistryPage() {
  const [search, setSearch] = useState('')
  const [personType, setPersonType] = useState<PersonType | 'ALL'>('ALL')
  const [isDrawerOpen, setDrawerOpen] = useState(false)
  const [editingPerson, setEditingPerson] = useState<Person | null>(null)
  const [formState, setFormState] = useState<PersonFormState>(EMPTY_FORM)

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
  const createPerson = useCreatePerson()
  const [personIdForUpdate, setPersonIdForUpdate] = useState<number | null>(null)
  const updatePerson = useUpdatePerson(personIdForUpdate ?? 0)
  const deletePerson = useDeletePerson()

  const resetForm = () => {
    setFormState(EMPTY_FORM)
    setPersonIdForUpdate(null)
    setEditingPerson(null)
  }

  const openCreateDrawer = () => {
    resetForm()
    setDrawerOpen(true)
  }

  const openEditDrawer = (person: Person) => {
    setEditingPerson(person)
    setPersonIdForUpdate(person.id)
    setFormState({
      first_name: person.first_name ?? '',
      last_name: person.last_name ?? '',
      email: person.email ?? '',
      phone: person.phone ?? '',
      person_type: person.person_type,
      employer: person.employer ?? '',
      client: person.client ? String(person.client) : '',
      notes: person.notes ?? '',
    })
    setDrawerOpen(true)
  }

  const closeDrawer = () => {
    setDrawerOpen(false)
    resetForm()
  }

  const handleChange = (field: keyof PersonFormState) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      setFormState((prev) => ({ ...prev, [field]: event.target.value }))
    }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!formState.first_name.trim() || !formState.last_name.trim()) {
      toast.error('First name and last name are required')
      return
    }

    const payload: Partial<Person> = {
      first_name: formState.first_name.trim(),
      last_name: formState.last_name.trim(),
      email: formState.email?.trim() || undefined,
      phone: formState.phone?.trim() || undefined,
      person_type: formState.person_type,
      employer: formState.employer?.trim() || undefined,
      client: formState.client ? Number(formState.client) : undefined,
      notes: formState.notes?.trim() || undefined,
    }

    try {
      if (editingPerson && personIdForUpdate) {
        await updatePerson.mutateAsync(payload)
        toast.success('Person updated successfully')
      } else {
        await createPerson.mutateAsync(payload)
        toast.success('Person created successfully')
      }
      closeDrawer()
    } catch (error: unknown) {
      const detail = (error as any)?.response?.data?.detail
      toast.error(detail || 'Something went wrong')
    }
  }

  const handleDelete = async (person: Person) => {
    const confirmed = window.confirm(
      `Remove ${person.first_name} ${person.last_name} from the registry?`
    )
    if (!confirmed) return

    try {
      await deletePerson.mutateAsync(person.id)
      toast.success('Person removed')
    } catch (error: unknown) {
      const detail = (error as any)?.response?.data?.detail
      toast.error(detail || 'Unable to delete record')
    }
  }

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
        <button
          onClick={openCreateDrawer}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-200/40 transition hover:shadow-xl"
        >
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

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEditDrawer(person)}
                      className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-sky-200 hover:text-sky-600"
                    >
                      <Edit2 className="h-3 w-3" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(person)}
                      className="inline-flex items-center gap-2 rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-500 transition hover:bg-rose-50"
                    >
                      <Trash2 className="h-3 w-3" />
                      Delete
                    </button>
                  </div>

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

      <CrudDrawer
        open={isDrawerOpen}
        onClose={closeDrawer}
        title={editingPerson ? 'Edit Person' : 'Add Person'}
        description="Maintain accurate people records for competency, assignment, and communication workflows."
        size="lg"
        footer={
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">
              Required fields are marked with <span className="text-rose-500">*</span>
            </p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={closeDrawer}
                className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="people-form"
                disabled={createPerson.isPending || updatePerson.isPending}
                className="rounded-lg bg-gradient-to-r from-sky-500 to-indigo-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:shadow disabled:opacity-60"
              >
                {editingPerson
                  ? updatePerson.isPending
                    ? 'Saving...'
                    : 'Save Changes'
                  : createPerson.isPending
                  ? 'Saving...'
                  : 'Create Person'}
              </button>
            </div>
          </div>
        }
      >
        <form id="people-form" onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="First Name" required>
              <input
                value={formState.first_name}
                onChange={handleChange('first_name')}
                placeholder="e.g., Ahmed"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
                required
              />
            </FormField>
            <FormField label="Last Name" required>
              <input
                value={formState.last_name}
                onChange={handleChange('last_name')}
                placeholder="e.g., Al Harbi"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
                required
              />
            </FormField>
            <FormField label="Email">
              <input
                type="email"
                value={formState.email}
                onChange={handleChange('email')}
                placeholder="name@example.com"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
              />
            </FormField>
            <FormField label="Phone">
              <input
                value={formState.phone}
                onChange={handleChange('phone')}
                placeholder="e.g., +971 50 123 4567"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
              />
            </FormField>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="Person Category" required>
              <select
                value={formState.person_type}
                onChange={handleChange('person_type')}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
                required
              >
                {Object.entries(PERSON_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Employer">
              <input
                value={formState.employer}
                onChange={handleChange('employer')}
                placeholder="Company / Department"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
              />
            </FormField>
          </div>

          <FormField
            label="Linked Client (optional)"
            description="Associate this person with a client record for rapid assignment."
            className="md:max-w-md"
          >
            <input
              value={formState.client}
              onChange={handleChange('client')}
              placeholder="Client ID"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
            />
          </FormField>

          <FormField label="Notes">
            <textarea
              value={formState.notes}
              onChange={handleChange('notes')}
              rows={4}
              placeholder="Training background, site access constraints, or other reference notes"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
            />
          </FormField>
        </form>
      </CrudDrawer>
    </div>
  )
}
