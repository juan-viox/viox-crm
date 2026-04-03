'use client'

import { useState } from 'react'
import { Phone, Mail, Calendar, CheckCircle2, FileText, Mic, Plus } from 'lucide-react'
import { formatDateTime } from '@/lib/utils'
import ActivityForm from './ActivityForm'

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

const typeFilters = ['all', 'call', 'email', 'meeting', 'task', 'note', 'voice_agent']

export default function ActivityFeed({
  activities: initialActivities,
  orgId,
}: {
  activities: any[]
  orgId: string
}) {
  const [filter, setFilter] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [activities, setActivities] = useState(initialActivities)

  const filtered = filter === 'all'
    ? activities
    : activities.filter(a => a.type === filter)

  return (
    <div>
      {/* Filter + Add */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2 flex-wrap">
          {typeFilters.map(t => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className="btn text-xs py-1.5 px-3"
              style={{
                background: filter === t ? 'var(--accent)' : 'var(--surface)',
                color: filter === t ? 'white' : 'var(--muted)',
                border: `1px solid ${filter === t ? 'var(--accent)' : 'var(--border)'}`,
              }}
            >
              {t === 'all' ? 'All' : t.replace('_', ' ')}
            </button>
          ))}
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn btn-primary">
          <Plus className="w-4 h-4" /> Log Activity
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="mb-6">
          <ActivityForm
            orgId={orgId}
            onCreated={(activity) => {
              setActivities(prev => [activity, ...prev])
              setShowForm(false)
            }}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      {/* Feed */}
      <div className="space-y-2">
        {filtered.map((a: any) => {
          const Icon = activityIcons[a.type] || FileText
          const color = activityColors[a.type] || 'var(--muted)'
          const contactName = a.contact ? `${a.contact.first_name} ${a.contact.last_name}` : null
          return (
            <div key={a.id} className="card p-4 flex items-start gap-4">
              <div className="p-2.5 rounded-lg shrink-0" style={{ background: `${color}15` }}>
                <Icon className="w-4 h-4" style={{ color }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium">{a.title}</p>
                    {a.description && (
                      <p className="text-sm mt-0.5" style={{ color: 'var(--muted)' }}>{a.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-4">
                    {a.completed && (
                      <span className="badge text-xs" style={{ background: 'rgba(0,184,148,0.15)', color: 'var(--success)' }}>Done</span>
                    )}
                    <span className="text-xs" style={{ color: 'var(--muted)' }}>{formatDateTime(a.created_at)}</span>
                  </div>
                </div>
                <div className="flex gap-3 mt-2">
                  {contactName && (
                    <span className="text-xs" style={{ color: 'var(--muted)' }}>Contact: {contactName}</span>
                  )}
                  {a.deal?.title && (
                    <span className="text-xs" style={{ color: 'var(--muted)' }}>Deal: {a.deal.title}</span>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
