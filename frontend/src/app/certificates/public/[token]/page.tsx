import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  CalendarDays,
  FileText,
  MapPin,
  PackageCheck,
  ShieldCheck,
  Share2,
  UserCheck,
  Hash,
  Clock,
} from 'lucide-react'

import { formatDate, formatDateTime } from '@/lib/utils'
import type { Certificate, Equipment, Inspection } from '@/types'

const API_BASE_URL = (process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api').replace(
  /\/+$/,
  ''
)

type PublicCertificate = Certificate & {
  inspection_info?: Inspection & {
    equipment_info?: Equipment
  }
}

const certificatePromises = new Map<string, Promise<PublicCertificate | null>>()

function buildApiUrl(path: string) {
  const trimmedPath = path.replace(/^\/+/, '')
  return `${API_BASE_URL}/${trimmedPath}`
}

async function fetchCertificate(token: string): Promise<PublicCertificate | null> {
  const url = `${buildApiUrl('certificates/public/')}` + `?token=${encodeURIComponent(token)}`
  const response = await fetch(url, { cache: 'no-store', next: { revalidate: 0 } })

  if (response.status === 404) {
    return null
  }

  if (!response.ok) {
    throw new Error(`Failed to fetch certificate: ${response.status}`)
  }

  return (await response.json()) as PublicCertificate
}

function readCertificate(token: string) {
  if (!certificatePromises.has(token)) {
    certificatePromises.set(token, fetchCertificate(token))
  }
  return certificatePromises.get(token) as Promise<PublicCertificate | null>
}

const statusStyles: Record<string, { label: string; className: string }> = {
  PUBLISHED: {
    label: 'Published',
    className: 'border-emerald-200/80 bg-emerald-50/90 text-emerald-700',
  },
  GENERATED: {
    label: 'Generated',
    className: 'border-sky-200/80 bg-sky-50/90 text-sky-700',
  },
  DRAFT: {
    label: 'Draft',
    className: 'border-slate-200/80 bg-slate-100/90 text-slate-600',
  },
}

function formatShareToken(token: string): string {
  if (!token) return '—'
  return token
    .toUpperCase()
    .split('-')
    .filter(Boolean)
    .join(' · ')
}

export async function generateMetadata({ params }: { params: { token: string } }): Promise<Metadata> {
  const certificate = await readCertificate(params.token).catch(() => null)

  if (!certificate) {
    return {
      title: 'Certificate not found | QAAM Inspection',
      description: 'The requested certificate could not be located or has expired.',
    }
  }

  const equipmentName = certificate.inspection_info?.equipment_info?.tag_code
    ? ` | ${certificate.inspection_info?.equipment_info?.tag_code}`
    : ''

  return {
    title: `Certificate #${certificate.id}${equipmentName} | QAAM Inspection`,
    description: `Official inspection certificate issued on ${formatDate(certificate.issued_date)} for verification.`,
  }
}

export default async function CertificatePublicPage({ params }: { params: { token: string } }) {
  const certificate = await readCertificate(params.token)

  if (!certificate) {
    notFound()
  }

  const inspection = certificate.inspection_info
  const equipment = inspection?.equipment_info
  const statusBadge = statusStyles[certificate.status] ?? {
    label: certificate.status,
    className: 'border-slate-200/80 bg-slate-100/90 text-slate-600',
  }

  const issuedOn = certificate.issued_date ? formatDate(certificate.issued_date) : 'Pending issuance'
  const inspectionStart = inspection?.start_time ? formatDateTime(inspection.start_time) : null
  const inspectionEnd = inspection?.end_time ? formatDateTime(inspection.end_time) : null

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-100 via-white to-sky-100 text-slate-900">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-24 top-20 h-72 w-72 rounded-full bg-sky-200/40 blur-3xl" />
        <div className="absolute right-[-120px] top-32 h-96 w-96 rounded-full bg-indigo-200/30 blur-[120px]" />
        <div className="absolute bottom-[-160px] left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-emerald-200/30 blur-[120px]" />
      </div>

      <main className="relative z-10 mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8 lg:py-20">
        <div className="mb-12 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <span className="flex h-16 w-16 items-center justify-center rounded-3xl bg-sky-500/10 text-sky-600 shadow-inner shadow-sky-200">
              <ShieldCheck className="h-8 w-8" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.4em] text-sky-600">Certificate verification</p>
              <h1 className="mt-2 text-3xl font-semibold text-slate-900 sm:text-4xl">Inspection Certificate</h1>
              <p className="mt-2 text-sm text-slate-600">
                Official compliance confirmation issued by the QAAM Inspection & Certification division.
              </p>
            </div>
          </div>

          {certificate.pdf_file && (
            <a
              href={certificate.pdf_file}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-sky-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-200 transition hover:bg-sky-700"
            >
              <FileText className="h-4 w-4" /> Download official PDF
            </a>
          )}
        </div>

        <div className="space-y-12 rounded-3xl border border-slate-200/80 bg-white/90 p-8 shadow-2xl shadow-slate-200/70 backdrop-blur-sm sm:p-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-6">
              <div className="flex flex-wrap items-center gap-3">
                <span
                  className={`inline-flex items-center gap-2 rounded-full border px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${statusBadge.className}`}
                >
                  <ShieldCheck className="h-3.5 w-3.5" />
                  {statusBadge.label}
                </span>
                <span className="text-xs font-medium uppercase tracking-[0.35em] text-slate-400">
                  Certificate #{certificate.id}
                </span>
              </div>
              <div className="space-y-3">
                <h2 className="text-2xl font-semibold text-slate-900">Issued {equipment?.client_name ? `for ${equipment.client_name}` : 'certificate'}</h2>
                <p className="max-w-xl text-sm text-slate-600">
                  This certificate confirms that the referenced equipment and inspection data meet the published safety and
                  compliance requirements at the time of issuance.
                </p>
              </div>
            </div>
            <div className="space-y-3 rounded-2xl border border-sky-200/70 bg-sky-50/70 p-5 text-sm text-slate-700">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.35em] text-sky-700">
                <Share2 className="h-4 w-4" /> Verification token
              </p>
              <p className="text-lg font-semibold tracking-[0.25em] text-slate-900">{formatShareToken(certificate.share_link_token)}</p>
              <p className="text-xs text-slate-500">
                Scan the QR code on the certificate or share this page to validate authenticity. Tokens may be revoked if the
                certificate is superseded.
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-slate-200/70 bg-slate-50/80 p-5">
              <div className="flex items-center gap-3 text-slate-700">
                <CalendarDays className="h-5 w-5 text-slate-500" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Issued on</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{issuedOn}</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200/70 bg-slate-50/80 p-5">
              <div className="flex items-center gap-3 text-slate-700">
                <UserCheck className="h-5 w-5 text-slate-500" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Inspector</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{inspection?.inspector_name ?? '—'}</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200/70 bg-slate-50/80 p-5">
              <div className="flex items-center gap-3 text-slate-700">
                <PackageCheck className="h-5 w-5 text-slate-500" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Equipment tag</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {equipment?.tag_code || equipment?.type || '—'}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200/70 bg-slate-50/80 p-5">
              <div className="flex items-center gap-3 text-slate-700">
                <MapPin className="h-5 w-5 text-slate-500" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Location</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{equipment?.location ?? '—'}</p>
                </div>
              </div>
            </div>
          </div>

          <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <article className="space-y-4 rounded-2xl border border-slate-200/70 bg-white/70 p-6 shadow-sm">
              <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
                <FileText className="h-5 w-5 text-sky-500" /> Inspection summary
              </h3>
              <dl className="grid gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Checklist template</dt>
                  <dd className="mt-1 text-sm text-slate-700">{inspection?.checklist_template || '—'}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Inspection status</dt>
                  <dd className="mt-1 text-sm capitalize text-slate-700">{inspection?.status?.toLowerCase() ?? '—'}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Started</dt>
                  <dd className="mt-1 text-sm text-slate-700">{inspectionStart ?? '—'}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Completed</dt>
                  <dd className="mt-1 text-sm text-slate-700">{inspectionEnd ?? '—'}</dd>
                </div>
              </dl>
              <div className="rounded-xl border border-slate-200/70 bg-slate-50/70 p-4 text-xs text-slate-600">
                <p>
                  The inspection record includes photo evidence, recorded answers, and signatures as provided within the QAAM
                  inspection workflow. For the full dossier, download the official PDF or contact the issuing authority.
                </p>
              </div>
            </article>

            <article className="space-y-4 rounded-2xl border border-slate-200/70 bg-white/70 p-6 shadow-sm">
              <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
                <Hash className="h-5 w-5 text-sky-500" /> Equipment details
              </h3>
              <dl className="space-y-3 text-sm text-slate-700">
                <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3 last:mb-0 last:border-b-0">
                  <dt className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Client</dt>
                  <dd className="text-right">{equipment?.client_name ?? '—'}</dd>
                </div>
                <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
                  <dt className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Type / Model</dt>
                  <dd className="text-right">
                    {[equipment?.type, equipment?.model].filter(Boolean).join(' · ') || '—'}
                  </dd>
                </div>
                <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
                  <dt className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Serial / SWL</dt>
                  <dd className="text-right">
                    {[equipment?.serial_number, equipment?.swl ? `${equipment.swl} SWL` : null]
                      .filter(Boolean)
                      .join(' · ') || '—'}
                  </dd>
                </div>
                <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
                  <dt className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Next due</dt>
                  <dd className="text-right">{equipment?.next_due ? formatDate(equipment.next_due) : '—'}</dd>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <dt className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">QR reference</dt>
                  <dd className="text-right font-mono text-xs text-slate-600">{certificate.qr_code || '—'}</dd>
                </div>
              </dl>
            </article>
          </section>

          <section className="rounded-2xl border border-emerald-200/70 bg-emerald-50/70 p-6 shadow-inner">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3 text-emerald-700">
                <Clock className="h-5 w-5" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em]">Certification lifecycle</p>
                  <p className="text-sm text-emerald-900">
                    This record remains valid until superseded by a new inspection or revoked by QAAM compliance officers.
                  </p>
                </div>
              </div>
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-full border border-emerald-300/70 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-emerald-700 transition hover:border-emerald-400"
              >
                Return to QAAM portal
              </Link>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}
