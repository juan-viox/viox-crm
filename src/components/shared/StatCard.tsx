'use client'

import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { TrendingUp, TrendingDown, type LucideIcon } from 'lucide-react'

export default function StatCard({
  label,
  value,
  trend,
  trendLabel,
  icon: Icon,
  index = 0,
}: {
  label: string
  value: string
  trend?: number
  trendLabel?: string
  icon?: LucideIcon
  index?: number
}) {
  const ref = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    gsap.from(ref.current, {
      y: 20,
      opacity: 0,
      duration: 0.5,
      delay: index * 0.1,
      ease: 'power2.out',
    })
  }, [])

  const isPositive = trend !== undefined && trend >= 0

  return (
    <div ref={ref} className="card flex items-start justify-between">
      <div>
        <p className="text-sm mb-1" style={{ color: 'var(--muted)' }}>{label}</p>
        <p className="text-2xl font-bold">{value}</p>
        {trend !== undefined && (
          <div className="flex items-center gap-1 mt-2 text-xs">
            {isPositive ? (
              <TrendingUp className="w-3 h-3" style={{ color: 'var(--success)' }} />
            ) : (
              <TrendingDown className="w-3 h-3" style={{ color: 'var(--danger)' }} />
            )}
            <span style={{ color: isPositive ? 'var(--success)' : 'var(--danger)' }}>
              {isPositive ? '+' : ''}{trend}%
            </span>
            {trendLabel && <span style={{ color: 'var(--muted)' }}>{trendLabel}</span>}
          </div>
        )}
      </div>
      {Icon && (
        <div className="p-2.5 rounded-lg" style={{ background: 'var(--surface-2)' }}>
          <Icon className="w-5 h-5" style={{ color: 'var(--accent)' }} />
        </div>
      )}
    </div>
  )
}
