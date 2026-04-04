import { createServerSupabaseClient } from '@/lib/supabase/server'
import ReportsClient from './ReportsClient'

export default async function ReportsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user!.id)
    .single()

  const orgId = profile?.organization_id

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
      .select('id, title, amount, status, probability, stage_id, created_at, updated_at, close_date')
      .eq('organization_id', orgId),
    supabase
      .from('contacts')
      .select('id, source, created_at')
      .eq('organization_id', orgId),
    supabase
      .from('activities')
      .select('id, type, user_id, created_at, completed')
      .eq('organization_id', orgId),
    supabase
      .from('deal_stages')
      .select('id, name, color, position')
      .eq('organization_id', orgId)
      .order('position'),
    supabase
      .from('profiles')
      .select('id, full_name')
      .eq('organization_id', orgId),
  ])

  // Fetch companies with deal counts
  const { data: companies } = await supabase
    .from('companies')
    .select('id, name')
    .eq('organization_id', orgId)

  const { data: dealCompanies } = await supabase
    .from('deals')
    .select('company_id')
    .eq('organization_id', orgId)
    .not('company_id', 'is', null)

  const companyDealCounts: Record<string, number> = {}
  ;(dealCompanies ?? []).forEach((d) => {
    if (d.company_id) {
      companyDealCounts[d.company_id] = (companyDealCounts[d.company_id] || 0) + 1
    }
  })

  const topCompanies = (companies ?? [])
    .map((c) => ({ name: c.name, deals: companyDealCounts[c.id] || 0 }))
    .filter((c) => c.deals > 0)
    .sort((a, b) => b.deals - a.deals)
    .slice(0, 10)

  return (
    <ReportsClient
      deals={dealsRes.data ?? []}
      contacts={contactsRes.data ?? []}
      activities={activitiesRes.data ?? []}
      stages={stagesRes.data ?? []}
      teamMembers={(profilesRes.data ?? []).map((p) => ({ id: p.id, name: p.full_name }))}
      topCompanies={topCompanies}
    />
  )
}
