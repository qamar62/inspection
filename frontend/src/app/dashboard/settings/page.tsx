'use client'

import { useState } from 'react'
import {
  Bell,
  Building,
  CloudCog,
  Fingerprint,
  Globe2,
  Palette,
  ShieldCheck,
  UserCog,
  Workflow,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface SettingTile {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  name: string
  description: string
  badge?: string
  action?: string
}

const PRIMARY_SECTIONS: SettingTile[] = [
  {
    icon: ShieldCheck,
    name: 'Compliance Controls',
    description: 'Define approval chains, publish policies, and manage governance rules.',
    badge: 'High priority',
  },
  {
    icon: Workflow,
    name: 'Workflow Automation',
    description: 'Update auto-assignment, reminders, and escalation settings for inspections.',
  },
  {
    icon: UserCog,
    name: 'Team Roles & Access',
    description: 'Invite teammates, manage role permissions, and configure 2FA enforcement.',
  },
  {
    icon: Bell,
    name: 'Notifications & Alerts',
    description: 'Control email alerts, Slack/webhook destinations, and digests.',
  },
]

const FOUNDATION_SECTIONS: SettingTile[] = [
  {
    icon: Building,
    name: 'Organization Profile',
    description: 'Branding, legal details, and key contacts shown on certificates.',
    action: 'Update profile',
  },
  {
    icon: Palette,
    name: 'Theme & Branding',
    description: 'Upload logos, pick color palettes, and preview certificate styling.',
  },
  {
    icon: Globe2,
    name: 'Regional Preferences',
    description: 'Set locales, timezone defaults, and unit standards for field teams.',
  },
  {
    icon: CloudCog,
    name: 'Integrations Hub',
    description: 'Connect ERP, storage, and communication tools to sync inspection data.',
    badge: 'Soon',
  },
]

export default function SettingsHubPage() {
  const [activeCategory, setActiveCategory] = useState<'workspace' | 'governance'>('workspace')

  return (
    <div className="relative space-y-10">
      <section className="rounded-3xl border border-white/60 bg-white/80 px-6 py-10 shadow-xl shadow-slate-200/50 backdrop-blur-xl lg:px-10">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-sky-600">
              Settings hub
            </p>
            <h1 className="mt-4 text-3xl font-semibold text-slate-900 lg:text-4xl">
              Configure the Inspection Division workspace
            </h1>
            <p className="mt-4 max-w-2xl text-base text-slate-600">
              Adjust branding, access control, automation, and compliance guardrails. These settings apply to the
              entire organization unless overridden per service.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <button className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white/90 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-sky-200 hover:text-slate-900">
              <Fingerprint className="h-4 w-4 text-slate-500" />
              Audit trail
            </button>
            <button className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-sky-200/60 transition hover:shadow-xl">
              <ShieldCheck className="h-4 w-4" />
              Review policies
            </button>
          </div>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Branding', value: activeCategory === 'workspace', onClick: () => setActiveCategory('workspace') },
            { label: 'Governance', value: activeCategory === 'governance', onClick: () => setActiveCategory('governance') },
            { label: 'Integrations', value: false, onClick: () => setActiveCategory('workspace') },
            { label: 'Audit', value: false, onClick: () => setActiveCategory('governance') },
          ].map((filter) => (
            <button
              key={filter.label}
              onClick={filter.onClick}
              className={cn(
                'flex items-center justify-between rounded-2xl border px-4 py-3 text-sm font-semibold transition backdrop-blur',
                filter.value
                  ? 'border-sky-300 bg-white text-sky-700 shadow-lg shadow-sky-200/50'
                  : 'border-slate-200 bg-white/60 text-slate-500 hover:border-slate-300 hover:text-slate-700'
              )}
            >
              {filter.label}
              <span className="text-xs font-medium uppercase tracking-wide">
                {filter.value ? 'Active' : 'Preview'}
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-8">
        <div className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-900">Governance controls</h2>
          <p className="text-sm text-slate-600">
            Establish how inspections are published, reviewed, and escalated. These modules will connect to the
            approvals dashboard and certificates engine.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {PRIMARY_SECTIONS.map((item) => (
            <article
              key={item.name}
              className="group relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white/80 p-6 shadow-lg shadow-slate-200/60 transition hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500/80 to-indigo-500/80 text-white shadow-inner shadow-indigo-200/70">
                  <item.icon className="h-5 w-5" />
                </div>
                {item.badge && (
                  <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-rose-500">
                    {item.badge}
                  </span>
                )}
              </div>
              <h3 className="mt-6 text-lg font-semibold text-slate-900">{item.name}</h3>
              <p className="mt-2 text-sm text-slate-600">{item.description}</p>
              <div className="mt-6 flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-slate-400">
                <span>Preview module</span>
                <span>Coming soon</span>
              </div>
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 translate-y-12 rounded-t-3xl bg-gradient-to-t from-sky-100/30 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
            </article>
          ))}
        </div>
      </section>

      <section className="space-y-8">
        <div className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-900">Workspace foundations</h2>
          <p className="text-sm text-slate-600">
            Start with organization-level settings so certificates, reports, and portals stay aligned with client
            expectations.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {FOUNDATION_SECTIONS.map((item) => (
            <article
              key={item.name}
              className="flex h-full flex-col justify-between rounded-3xl border border-slate-200/70 bg-white/70 p-6 shadow-md shadow-slate-200/50 backdrop-blur transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900/90 text-white shadow-inner shadow-slate-500/30">
                  <item.icon className="h-4 w-4" />
                </div>
                {item.badge && (
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {item.badge}
                  </span>
                )}
              </div>
              <div className="mt-6 space-y-2">
                <h3 className="text-base font-semibold text-slate-900">{item.name}</h3>
                <p className="text-sm text-slate-600">{item.description}</p>
              </div>
              <div className="mt-6 flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-slate-400">
                <span>{item.action ?? 'Configure'}</span>
                <span>Draft</span>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}
