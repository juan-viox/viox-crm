import { type LucideIcon } from 'lucide-react'
import Link from 'next/link'

export default function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
}: {
  icon: LucideIcon
  title: string
  description: string
  actionLabel?: string
  actionHref?: string
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
        style={{ background: 'var(--surface-2)' }}
      >
        <Icon className="w-8 h-8" style={{ color: 'var(--muted)' }} />
      </div>
      <h3 className="text-lg font-semibold mb-1">{title}</h3>
      <p className="text-sm mb-6" style={{ color: 'var(--muted)' }}>{description}</p>
      {actionLabel && actionHref && (
        <Link href={actionHref} className="btn btn-primary">
          {actionLabel}
        </Link>
      )}
    </div>
  )
}
