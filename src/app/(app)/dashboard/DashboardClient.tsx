'use client'

import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { Users, DollarSign, Target, CheckCircle2, Phone, Mail, Calendar, FileText, Mic } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import StatCard from '@/components/shared/StatCard'
import { formatDateTime } from '@/lib/utils'

const PIE_COLORS = ['#6c5ce7', '#a29bfe', '#00b894', '#fdcb6e', '#e17055', '#74b9ff']

const activityIcons: Record<string, typeof Phone> = {
  call: Phone,
  email: Mail,
  meeting: Calendar,
  task: CheckCircle2,
  note: FileText,
  voice_agent: Mic,
}

export default function DashboardClient({
  stats,
  revenueByMonth,
  leadSources,
  recentActivities,
}: {
  stats: { totalContacts: number; openDealCount: number; revenue: string; tasksDueToday: number }
  revenueByMonth: { month: string; revenue: number }[]
  leadSources: { name: string; value: number }[]
  recentActivities: { id: string; type: string; title: string; contactName: string | null; createdAt: string }[]
}) {
  const containerRef = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    gsap.from(containerRef.current, { opacity: 0, duration: 0.3 })
  }, [])

  return (
    <div ref={containerRef}>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Contacts" value={String(stats.totalContacts)} icon={Users} index={0} />
        <StatCard label="Open Deals" value={String(stats.openDealCount)} icon={Target} index={1} />
        <StatCard label="Revenue (Won)" value={stats.revenue} icon={DollarSign} index={2} />
        <StatCard label="Tasks Due Today" value={String(stats.tasksDueToday)} icon={CheckCircle2} index={3} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
        <div className="card lg:col-span-2">
          <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--muted)' }}>Revenue Over Time</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={revenueByMonth}>
              <XAxis dataKey="month" stroke="var(--muted)" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--muted)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '0.5rem', color: 'var(--text)' }}
                formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Revenue']}
              />
              <Bar dataKey="revenue" fill="var(--accent)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--muted)' }}>Lead Sources</h3>
          {leadSources.length === 0 ? (
            <p className="text-sm text-center py-8" style={{ color: 'var(--muted)' }}>No data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={leadSources}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {leadSources.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '0.5rem', color: 'var(--text)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
          <div className="flex flex-wrap gap-3 mt-2">
            {leadSources.map((s, i) => (
              <div key={s.name} className="flex items-center gap-1.5 text-xs">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                <span style={{ color: 'var(--muted)' }}>{s.name} ({s.value})</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card">
        <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--muted)' }}>Recent Activity</h3>
        {recentActivities.length === 0 ? (
          <p className="text-sm py-4 text-center" style={{ color: 'var(--muted)' }}>No recent activity</p>
        ) : (
          <div className="space-y-3">
            {recentActivities.map(a => {
              const Icon = activityIcons[a.type] || FileText
              return (
                <div key={a.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-[var(--surface-2)] transition-colors">
                  <div className="p-2 rounded-lg shrink-0" style={{ background: 'var(--surface-2)' }}>
                    <Icon className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{a.title}</p>
                    {a.contactName && (
                      <p className="text-xs" style={{ color: 'var(--muted)' }}>{a.contactName}</p>
                    )}
                  </div>
                  <span className="text-xs shrink-0" style={{ color: 'var(--muted)' }}>
                    {formatDateTime(a.createdAt)}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
