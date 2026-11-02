import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

const STAFF_ROLES = ['owner', 'admin', 'member']

/**
 * Middleware lets every /api/* route through, so routes that act on the
 * org's behalf must check auth themselves. Returns a 401/403 response for
 * anyone who isn't signed-in staff (portal clients have no profiles row).
 * Pass `roles` to narrow it further, e.g. ['owner', 'admin'].
 */
export async function requireStaff(roles: string[] = STAFF_ROLES): Promise<NextResponse | null> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !roles.includes(profile.role)) {
    return NextResponse.json({ error: 'Not allowed' }, { status: 403 })
  }
  return null
}
