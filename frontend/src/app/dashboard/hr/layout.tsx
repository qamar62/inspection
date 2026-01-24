import type { ReactNode } from 'react'

export default function HRLayout({ children }: { children: ReactNode }) {
  return <div className="space-y-10">{children}</div>
}
