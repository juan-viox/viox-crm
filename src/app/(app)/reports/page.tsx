import { createServerSupabaseClient } from '@/lib/supabase/server'
import ReportsClient from './ReportsClient'

export default async function ReportsPage() {
  const supabase = await createServerSupabaseClient()

  // Fetch all raw data for reports
  const [
    dealsRes,
    contactsRes,
    activitiesRes,
    stagesRes,
    profilesRes,
  ] = await Promise.all([
    supabase
      .from('deals')
      .select('id, title, amount, probability, stage_id, created_at, updated_at, close_date, closed_at'),
    supabase
      .from('contacts')
      .select('id, source, created_at'),
    supabase
      .from('activities')
      .select('id, type, user_id, created_at, status'),
    supabase
      .from('deal_stages')
      .select('id, name, color, sort_order, is_won, is_lost')
      .order('sort_order'),
    supabase
      .from('profiles')
      .select('id, full_name'),
  ])

  // Fetch companies with deal counts
  const { data: companies } = await supabase
    .from('companies')
    .select('id, name')

  const { data: dealCompanies } = await supabase
    .from('deals')
    .select('company_id')
    .not('company_id', 'is', null)

  const companyDealCounts: Record<string, number> = {}
  ;(dealCompanies ?? []).forEach((d) => {
    const cid = d.company_id as string
    companyDealCounts[cid] = (companyDealCounts[cid] || 0) + 1
  })

  // Compute deal status from stage is_won/is_lost flags
  const stages = stagesRes.data ?? []
  const wonStageIds = new Set(stages.filter((s: any) => s.is_won).map((s: any) => s.id))
  const lostStageIds = new Set(stages.filter((s: any) => s.is_lost).map((s: any) => s.id))

  const dealsWithStatus = (dealsRes.data ?? []).map((d: any) => ({
    ...d,
    status: wonStageIds.has(d.stage_id) ? 'won'
      : lostStageIds.has(d.stage_id) ? 'lost'
      : 'open',
  }))

  return (
    <ReportsClient
      deals={dealsWithStatus}
      contacts={contactsRes.data ?? []}
      activities={activitiesRes.data ?? []}
      stages={stages}
      profiles={profilesRes.data ?? []}
      companies={(companies ?? []).map(c => ({
        ...c,
        dealCount: companyDealCounts[c.id] || 0,
      }))}
    />
  )
}
