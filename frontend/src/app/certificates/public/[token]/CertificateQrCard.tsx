'use client'

import { useCallback, useMemo, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Copy, Share2, CheckCircle2 } from 'lucide-react'

export interface CertificateQrCardProps {
  shareUrl: string
  tokenDisplay: string
}

export default function CertificateQrCard({ shareUrl, tokenDisplay }: CertificateQrCardProps) {
  const [copied, setCopied] = useState(false)

  const normalizedShareUrl = useMemo(() => {
    if (!shareUrl) return '#'
    return shareUrl
  }, [shareUrl])

  const handleCopy = useCallback(() => {
    if (!normalizedShareUrl || normalizedShareUrl === '#') return
    void navigator.clipboard
      .writeText(normalizedShareUrl)
      .then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 2200)
      })
      .catch(() => {
        setCopied(false)
      })
  }, [normalizedShareUrl])

  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-sky-200/70 bg-sky-50/80 p-5 text-sm text-slate-700">
      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.35em] text-sky-700">
        <Share2 className="h-4 w-4" /> Verification QR
      </p>
      <div className="flex items-center justify-center rounded-2xl bg-white p-4 shadow-inner shadow-sky-200">
        <QRCodeSVG value={normalizedShareUrl} size={132} level="Q" includeMargin className="drop-shadow-sm" />
      </div>
      <div className="text-center text-xs text-slate-500">
        Scan with any mobile device to open this certificate. The code encodes a secure tokenised link.
      </div>
      <div className="w-full rounded-xl border border-sky-200/60 bg-white/80 px-3 py-2 text-center text-xs font-semibold tracking-[0.25em] text-slate-600">
        {tokenDisplay}
      </div>
      <button
        type="button"
        onClick={handleCopy}
        className="inline-flex items-center gap-2 rounded-full border border-sky-300/70 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-sky-700 transition hover:border-sky-400/80"
      >
        {copied ? (
          <>
            <CheckCircle2 className="h-4 w-4" /> Copied
          </>
        ) : (
          <>
            <Copy className="h-4 w-4" /> Copy link
          </>
        )}
      </button>
    </div>
  )
}
