import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import crmConfig from '@/crm.config'

export async function POST(request: Request) {
  try {
    const { userId, email, fullName } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Check if an organization exists, if not create one
    let orgId: string
    const { data: existingOrg } = await supabase
      .from('organizations')
      .select('id')
      .eq('slug', crmConfig.slug)
      .single()

    if (existingOrg) {
      orgId = existingOrg.id
    } else {
      const { data: newOrg, error: orgError } = await supabase
        .from('organizations')
        .insert({
          name: crmConfig.name,
          slug: crmConfig.slug,
        })
        .select('id')
        .single()

      if (orgError) {
        return NextResponse.json({ error: orgError.message }, { status: 500 })
      }
      orgId = newOrg.id
    }

    // Create profile
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        organization_id: orgId,
        full_name: fullName,
        role: 'owner',
      })

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 })
    }

    // Check if deal stages exist for this org, if not create defaults
    const { data: existingStages } = await supabase
      .from('deal_stages')
      .select('id')
      .eq('organization_id', orgId)
      .limit(1)

    if (!existingStages || existingStages.length === 0) {
      const stages = crmConfig.settings.defaultDealStages.map(s => ({
        organization_id: orgId,
        name: s.name,
        color: s.color,
        sort_order: s.sort_order,
        is_won: s.is_won ?? false,
        is_lost: s.is_lost ?? false,
      }))

      await supabase.from('deal_stages').insert(stages)
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
