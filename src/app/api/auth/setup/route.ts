import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  try {
    const { userId, email, fullName, orgName } = await request.json()

    if (!userId || !orgName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Create organization (admin client bypasses RLS)
    const slug = orgName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .insert({ name: orgName, slug: slug + '-' + Date.now().toString(36) })
      .select()
      .single()

    if (orgError) {
      return NextResponse.json({ error: orgError.message }, { status: 500 })
    }

    // Create profile
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        organization_id: org.id,
        full_name: fullName,
        role: 'owner',
      })

    if (profileError) {
      // Clean up org if profile fails
      await supabase.from('organizations').delete().eq('id', org.id)
      return NextResponse.json({ error: profileError.message }, { status: 500 })
    }

    // Deal stages are auto-seeded by the database trigger on org insert

    return NextResponse.json({ success: true, organizationId: org.id })
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
