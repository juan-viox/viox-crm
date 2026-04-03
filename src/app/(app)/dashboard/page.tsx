import { createServerSupabaseClient } from '@/lib/supabase/server'
import { formatCurrency, formatDate } from '@/lib/utils'
import DashboardClient from './DashboardClient'

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user!.id)
    .single()

  const orgId = profile?.organization_id

  // Fetch stats in parallel
  const [contactsRes, dealsRes, wonDealsRes, activitiesRes, recentActivitiesRes] = await Promise.all([
    supabase.from('contacts').select('id', { count: 'exact', head: true }).eq('organization_id', orgId),
    supabase.from('deals').select('id, amount').eq('organization_id', orgId).eq('status', 'open'),
    supabase.from('deals').select('amount, created_at').eq('organization_id', orgId).eq('status', 'won'),
    supabase.from('activities')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', orgId)
      .eq('completed', false)
      .lte('due_date', new Date().toISOString().split('T')[0] + 'T23:59:59'),
    supabase.from('activities')
      .select('*, contact:contacts(first_name, last_name)')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false })
      .limit(10),
  ])

  const totalContacts = contactsRes.count ?? 0
  const openDeals = dealsRes.data ?? []
  const openDealCount = openDeals.length
  const openDealTotal = openDeals.reduce((sum, d) => sum + (d.amount || 0), 0)
  const wonDeals = wonDealsRes.data ?? []
  const revenue = wonDeals.reduce((sum, d) => sum + (d.amount || 0), 0)
  const tasksDueToday = activitiesRes.count ?? 0
  const recentActivities = recentActivitiesRes.data ?? []

  // Revenue by month (last 6 months)
  const revenueByMonth: { month: string; revenue: number }[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    const monthLabel = d.toLocaleString('en-US', { month: 'short' })
    const monthStart = new Date(d.getFullYear(), d.getMonth(), 1).toISOString()
    const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString()
    const monthDeals = wonDeals.filter(
      deal => deal.created_at >= monthStart && deal.created_at <= monthEnd
    )
    revenueByMonth.push({
      month: monthLabel,
      revenue: monthDeals.reduce((sum, d) => sum + (d.amount || 0), 0),
    })
  }

  // Lead sources
  const { data: contactsBySource } = await supabase
    .from('contacts')
    .select('source')
    .eq('organization_id', orgId)

  const sourceCounts: Record<string, number> = {}
  ;(contactsBySource ?? []).forEach(c => {
    const src = c.source || 'unknown'
    sourceCounts[src] = (sourceCounts[src] || 0) + 1
  })

  const leadSources = Object.entries(sourceCounts).map(([name, value]) => ({ name, value }))

  return (
    <DashboardClient
      stats={{
        totalContacts,
        openDealCount,
        revenue: formatCurrency(revenue),
        tasksDueToday,
      }}
      revenueByMonth={revenueByMonth}
      leadSources={leadSources}
      recentActivities={recentActivities.map(a => ({
        id: a.id,
        type: a.type,
        title: a.title,
        contactName: a.contact ? `${a.contact.first_name} ${a.contact.last_name}` : null,
        createdAt: a.created_at,
      }))}
    />
  )
}
