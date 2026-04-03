import { createServerSupabaseClient } from '@/lib/supabase/server'
import ActivityFeed from '@/components/activities/ActivityFeed'
import EmptyState from '@/components/shared/EmptyState'
import { Activity } from 'lucide-react'

export default async function ActivitiesPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles').select('organization_id').eq('id', user!.id).single()

  const orgId = profile?.organization_id

  const { data: activities } = await supabase
    .from('activities')
    .select('*, contact:contacts(first_name, last_name), deal:deals(title)')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false })
    .limit(100)

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Activities</h1>

      {!activities || activities.length === 0 ? (
        <EmptyState
          icon={Activity}
          title="No activities yet"
          description="Activities from your contacts, deals, and integrations will appear here"
        />
      ) : (
        <ActivityFeed activities={activities} orgId={orgId!} />
      )}
    </div>
  )
}
