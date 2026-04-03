import { createServerSupabaseClient } from '@/lib/supabase/server'
import CalendarClient from './CalendarClient'

export default async function CalendarPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user!.id)
    .single()

  const orgId = profile?.organization_id

  // Fetch activities for the next/prev 2 months
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const end = new Date(now.getFullYear(), now.getMonth() + 2, 0)

  const { data: activities } = await supabase
    .from('activities')
    .select('id, title, type, due_date, completed, created_at, contact_id')
    .eq('organization_id', orgId)
    .gte('due_date', start.toISOString().split('T')[0])
    .lte('due_date', end.toISOString().split('T')[0])
    .order('due_date', { ascending: true })

  // Fetch contacts for the form
  const { data: contacts } = await supabase
    .from('contacts')
    .select('id, first_name, last_name')
    .eq('organization_id', orgId)
    .order('first_name')

  // Fetch deals for the form
  const { data: deals } = await supabase
    .from('deals')
    .select('id, title')
    .eq('organization_id', orgId)
    .eq('status', 'open')
    .order('title')

  return (
    <CalendarClient
      activities={activities ?? []}
      contacts={contacts ?? []}
      deals={deals ?? []}
      orgId={orgId!}
    />
  )
}
