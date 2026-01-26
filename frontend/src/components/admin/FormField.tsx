'use client'

import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type FormFieldProps = {
  label: string
  description?: string
  error?: string
  required?: boolean
  children: ReactNode
  className?: string
}

export function FormField({
  label,
  description,
  error,
  required,
  children,
  className,
}: FormFieldProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <div className="space-y-1">
        <label className="block text-sm font-medium text-slate-700">
          {label}
          {required && <span className="ml-1 text-rose-500">*</span>}
        </label>
        {description && <p className="text-xs text-slate-500">{description}</p>}
      </div>

      {children}

      {error && <p className="text-xs text-rose-600">{error}</p>}
    </div>
  )
}
