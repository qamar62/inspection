'use client'

import { useMemo, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { LogIn, AlertCircle, ShieldCheck, Sparkles } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  })

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsLoading(true)
    setError('')

    if (!formData.username || !formData.password) {
      setError('Please enter both username and password')
      setIsLoading(false)
      return
    }

    try {
      console.log('Attempting login with username:', formData.username)
      
      const result = await signIn('credentials', {
        username: formData.username,
        password: formData.password,
        redirect: false,
      })

      console.log('Login result:', result)

      if (result?.error) {
        setError('Invalid username or password. Please try again.')
        toast.error('Login failed')
      } else if (result?.ok) {
        toast.success('Login successful!')
        router.push('/dashboard')
        router.refresh()
      } else {
        setError('An unexpected error occurred. Please try again.')
      }
    } catch (error) {
      console.error('Login error:', error)
      setError('Unable to connect to the server. Please check your connection.')
      toast.error('Connection error')
    } finally {
      setIsLoading(false)
    }
  }

  const shimmeringGradient = useMemo(
    () => 'bg-[radial-gradient(circle_at_top,_#fef9f5,_#f1f5f9)]',
    []
  )

  return (
    <div
      className={`relative min-h-screen overflow-hidden ${shimmeringGradient} px-6 py-16 text-slate-800`}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(79,70,229,0.12),_transparent_45%),radial-gradient(circle_at_bottom_right,_rgba(56,189,248,0.12),_transparent_40%)]" />
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\'160\' height=\'160\' viewBox=\'0 0 160 160\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath opacity=\'0.12\' d=\'M0 160V120H40V80H80V40H120V0H160V40H120V80H80V120H40V160Z\' fill=\'%23cbd5f5\'/%3E%3C/svg%3E')] opacity-30" />

      <div className="relative z-10 mx-auto flex max-w-6xl flex-col-reverse items-center gap-12 lg:flex-row lg:items-stretch">
        <div className="w-full max-w-xl rounded-[2.5rem] border border-white/60 bg-white/80 p-10 shadow-xl backdrop-blur-xl lg:w-[60%]">
          <div className="mb-10 flex items-center justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-slate-400">Times United</p>
              <h1 className="mt-2 text-3xl font-semibold text-slate-900">Inspection Division Access</h1>
            </div>
            <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 via-sky-500 to-indigo-500 text-white shadow-lg">
              <ShieldCheck className="h-8 w-8" />
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50/80 px-5 py-4 text-sm text-rose-700">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-600" htmlFor="username">
                Username
              </label>
              <div className="relative">
                <input
                  id="username"
                  type="text"
                  value={formData.username}
                  onChange={(event: ChangeEvent<HTMLInputElement>) =>
                    setFormData({ ...formData, username: event.target.value })
                  }
                  autoComplete="username"
                  placeholder="e.g. admin"
                  disabled={isLoading}
                  className="peer w-full rounded-2xl border border-slate-200 bg-white/70 px-4 py-3 text-base text-slate-900 shadow-sm outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100 disabled:cursor-not-allowed disabled:opacity-50"
                  required
                />
                <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-slate-300 transition peer-focus:text-sky-400">
                  <Sparkles className="h-5 w-5" />
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-600" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(event: ChangeEvent<HTMLInputElement>) =>
                    setFormData({ ...formData, password: event.target.value })
                  }
                  autoComplete="current-password"
                  placeholder="••••••••"
                  disabled={isLoading}
                  className="peer w-full rounded-2xl border border-slate-200 bg-white/70 px-4 py-3 text-base text-slate-900 shadow-sm outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100 disabled:cursor-not-allowed disabled:opacity-50"
                  required
                />
                <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-slate-300 transition peer-focus:text-sky-400">
                  <LogIn className="h-5 w-5" />
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r from-sky-500 via-indigo-500 to-slate-800 py-3 text-base font-semibold text-white shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-sky-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <div className="absolute inset-0 bg-white/15 opacity-0 transition group-hover:opacity-100" />
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <svg
                    className="h-5 w-5 animate-spin"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Signing in…
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <LogIn className="h-5 w-5" />
                  Enter Workspace
                </span>
              )}
            </button>

            <div className="rounded-2xl border border-slate-200/70 bg-white/60 px-5 py-4 text-sm text-slate-600">
              <p className="font-medium text-slate-700">Demo credentials</p>
              <div className="mt-3 grid gap-2 md:grid-cols-2">
                <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                  <span className="text-xs uppercase tracking-wide text-slate-400">Username</span>
                  <code className="rounded bg-white px-2 py-1 text-xs font-semibold text-slate-800 shadow-sm">admin</code>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                  <span className="text-xs uppercase tracking-wide text-slate-400">Password</span>
                  <code className="rounded bg-white px-2 py-1 text-xs font-semibold text-slate-800 shadow-sm">admin123</code>
                </div>
              </div>
              <p className="mt-3 text-xs text-slate-400">Use the demo credentials to explore inspection workflows.</p>
            </div>
          </form>
        </div>

        <aside className="w-full max-w-sm lg:w-[40%]">
          <div className="relative h-full overflow-hidden rounded-[2.25rem] border border-white/40 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-10 text-slate-100 shadow-2xl">
            <div className="absolute inset-x-10 top-10 h-24 rounded-[2rem] border border-white/20 bg-white/10 blur-3xl" />
            <div className="relative z-10 space-y-8">
              <div>
                <p className="text-xs uppercase tracking-[0.45em] text-slate-400">Platform Overview</p>
                <h2 className="mt-3 text-3xl font-semibold leading-tight">Architected for Inspection Excellence</h2>
              </div>
              <ul className="space-y-4 text-sm text-slate-200">
                {[
                  'ISO/IEC 17020 ready workflows',
                  'Field evidence capture and FIR automation',
                  'Tools, calibration and competence governance',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/15 text-sky-200">
                      <Sparkles className="h-4 w-4" />
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <div className="rounded-2xl border border-white/20 bg-white/10 px-4 py-5 text-xs uppercase tracking-wide text-slate-200/80">
                Trusted by inspection teams delivering heavy-industry compliance across the GCC.
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
