'use client'

import { Phone, Mail, Calendar, CheckCircle2, FileText, Mic } from 'lucide-react'
import { formatDateTime } from '@/lib/utils'
import type { Activity } from '@/types'

const activityIcons: Record<string, typeof Phone> = {
  call: Phone,
  email: Mail,
  meeting: Calendar,
  task: CheckCircle2,
  note: FileText,
  voice_agent: Mic,
}

const activityColors: Record<string, string> = {
  call: 'var(--accent)',
  email: '#74b9ff',
  meeting: 'var(--warning)',
  task: 'var(--success)',
  note: 'var(--muted)',
  voice_agent: '#fd79a8',
}

export default function ContactTimeline({ activities }: { activities: Activity[] }) {
  if (activities.length === 0) {
    return (
      <p className="text-sm py-8 text-center" style={{ color: 'var(--muted)' }}>
        No activity yet
      </p>
    )
  }

  return (
    <div className="relative">
      {/* Timeline line */}
      <div
        className="absolute left-5 top-0 bottom-0 w-px"
        style={{ background: 'var(--border)' }}
      />

      <div className="space-y-4">
        {activities.map(a => {
          const Icon = activityIcons[a.type] || FileText
          const color = activityColors[a.type] || 'var(--muted)'
          return (
            <div key={a.id} className="flex gap-4 relative">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 z-10"
                style={{ background: 'var(--surface)', border: `2px solid ${color}` }}
              >
                <Icon className="w-4 h-4" style={{ color }} />
              </div>
              <div className="flex-1 card py-3 px-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium">{a.title}</p>
                    {a.description && (
                      <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>{a.description}</p>
                    )}
                  </div>
                  <span className="text-xs shrink-0 ml-4" style={{ color: 'var(--muted)' }}>
                    {formatDateTime(a.created_at)}
                  </span>
                </div>
                {a.completed && (
                  <span className="badge mt-2" style={{ background: 'rgba(0,184,148,0.15)', color: 'var(--success)' }}>
                    Completed
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
