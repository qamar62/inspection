'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Edit2, Search, ShieldCheck, UserCog } from 'lucide-react'
import { toast } from 'sonner'
import { CrudDrawer } from '@/components/admin/CrudDrawer'
import { FormField } from '@/components/admin/FormField'
import { cn } from '@/lib/utils'
import type { User } from '@/types'
import { useUpdateUser, useUsers } from '@/hooks/users'

type UserRole = User['role']

type RoleOption = { value: UserRole; label: string }

const ROLE_OPTIONS: RoleOption[] = [
  { value: 'ADMIN', label: 'Admin' },
  { value: 'TECHNICAL_MANAGER', label: 'Technical Manager' },
  { value: 'TEAM_LEAD', label: 'Team Lead' },
  { value: 'INSPECTOR', label: 'Inspector' },
  { value: 'CLIENT', label: 'Client' },
]

type UserFormState = {
  role: UserRole
}

const EMPTY_FORM: UserFormState = {
  role: 'INSPECTOR',
}

export default function TeamRolesPage() {
  const router = useRouter()
  const { data: session, status } = useSession()

  const userRole = session?.user?.role

  const [search, setSearch] = useState('')
  const [isDrawerOpen, setDrawerOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [userIdForUpdate, setUserIdForUpdate] = useState<number | null>(null)
  const [formState, setFormState] = useState<UserFormState>(EMPTY_FORM)

  const filters = useMemo(
    () => ({
      search: search.trim() || undefined,
      ordering: 'username',
      page_size: 100,
    }),
    [search]
  )

  const { data, isLoading } = useUsers(filters)
  const users = data?.results ?? []

  const updateUser = useUpdateUser(userIdForUpdate ?? 0)

  useEffect(() => {
    if (status !== 'loading' && userRole !== 'ADMIN') {
      router.push('/dashboard')
    }
  }, [router, status, userRole])

  const resetForm = () => {
    setFormState(EMPTY_FORM)
    setEditingUser(null)
    setUserIdForUpdate(null)
  }

  const closeDrawer = () => {
    setDrawerOpen(false)
    resetForm()
  }

  const openEditDrawer = (user: User) => {
    setEditingUser(user)
    setUserIdForUpdate(user.id)
    setFormState({
      role: user.role,
    })
    setDrawerOpen(true)
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!editingUser || !userIdForUpdate) {
      toast.error('Select a user first')
      return
    }

    try {
      await updateUser.mutateAsync({ role: formState.role })
      toast.success('User role updated')
      closeDrawer()
    } catch (error: unknown) {
      const detail = (error as any)?.response?.data?.detail
      toast.error(detail || 'Failed to update user role')
    }
  }

  // Hard guard: this is an admin-only area.
  if (status === 'loading' || userRole !== 'ADMIN') {
    return null
  }

  const roleBadge = (role: UserRole) => {
    const style =
      role === 'ADMIN'
        ? 'bg-rose-50 text-rose-600 border border-rose-200'
        : role === 'TECHNICAL_MANAGER'
        ? 'bg-indigo-50 text-indigo-600 border border-indigo-200'
        : role === 'TEAM_LEAD'
        ? 'bg-sky-50 text-sky-600 border border-sky-200'
        : role === 'INSPECTOR'
        ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
        : 'bg-slate-100 text-slate-600 border border-slate-200'

    return (
      <span className={cn('inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide', style)}>
        {role.replace(/_/g, ' ')}
      </span>
    )
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 rounded-3xl border border-white/60 bg-white/80 p-8 shadow-xl shadow-slate-200/50 backdrop-blur-xl md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <p className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-sky-600">
            <ShieldCheck className="h-3.5 w-3.5" />
            Settings
          </p>
          <h1 className="text-3xl font-semibold text-slate-900">Team Roles & Access</h1>
          <p className="max-w-2xl text-sm text-slate-600">
            Manage workspace membership roles. Only administrators can change access levels.
          </p>
        </div>
      </header>

      <section className="space-y-4">
        <div className="flex flex-col gap-4 rounded-3xl border border-slate-200/70 bg-white/80 p-6 shadow-lg shadow-slate-200/50 backdrop-blur md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-slate-900">Users</h2>
            <p className="text-sm text-slate-500">Search by username, email, or name. Click a record to change role.</p>
          </div>
          <div className="relative w-full md:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search users"
              className="w-full rounded-xl border border-slate-200 bg-white/90 py-2.5 pl-10 pr-4 text-sm text-slate-700 shadow-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="h-40 rounded-3xl border border-slate-200/70 bg-white/80 shadow-inner shadow-slate-200/60 animate-pulse"
              />
            ))}
          </div>
        ) : users.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white/70 px-10 py-16 text-center">
            <UserCog className="mx-auto h-8 w-8 text-slate-400" />
            <h3 className="mt-3 text-base font-semibold text-slate-800">No users found</h3>
            <p className="mt-1 text-sm text-slate-500">Try a different search term.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {users.map((user) => (
              <button
                key={user.id}
                type="button"
                onClick={() => openEditDrawer(user)}
                className="text-left rounded-3xl border border-slate-200/70 bg-white/90 p-5 shadow-lg shadow-slate-200/60 transition hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">
                      {user.first_name || user.last_name ? `${user.first_name} ${user.last_name}`.trim() : user.username}
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">{user.email || '—'}</p>
                    <p className="mt-1 text-xs uppercase tracking-wide text-slate-400">@{user.username}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {roleBadge(user.role)}
                    <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                      <Edit2 className="h-3.5 w-3.5" />
                      Edit
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      <CrudDrawer
        open={isDrawerOpen}
        onClose={closeDrawer}
        title={editingUser ? 'Update user role' : 'Update role'}
        description={
          editingUser
            ? `Update access role for ${editingUser.username}. Changes take effect immediately.`
            : 'Select a user to manage.'
        }
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
              form="user-role-form"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-sky-500 to-indigo-500 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-70"
              disabled={updateUser.isPending || !editingUser}
            >
              {updateUser.isPending ? 'Saving...' : 'Save changes'}
            </button>
          </div>
        }
      >
        <form id="user-role-form" className="space-y-6" onSubmit={handleSubmit}>
          <FormField label="Role" required>
            <select
              value={formState.role}
              onChange={(event) => setFormState({ role: event.target.value as UserRole })}
              className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-700 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
            >
              {ROLE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </FormField>
        </form>
      </CrudDrawer>
    </div>
  )
}
