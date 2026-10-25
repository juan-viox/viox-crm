import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  checkAgentAuth,
  corsHeadersFor,
  findContactByPhone,
  phoneKey,
  resolveOrgId,
} from '@/lib/voice-integration'

const corsHeaders = corsHeadersFor('GET')

export async function OPTIONS() {
  return NextResponse.json(null, { headers: corsHeaders })
}

/** GET /api/v1/agent-tools/contact?phone=+1... — caller lookup for a voice agent. */
export async function GET(request: Request) {
  try {
    const auth = checkAgentAuth(request, corsHeaders)
    if ('response' in auth) return auth.response

    const phone = new URL(request.url).searchParams.get('phone')
    if (!phone || !phoneKey(phone)) {
      return NextResponse.json({ error: 'A valid phone is required' }, { status: 400, headers: corsHeaders })
    }

    const supabase = createAdminClient()
    const orgId = await resolveOrgId(supabase, auth.apiKey)
    if (!orgId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 500, headers: corsHeaders })
    }

    const contact = await findContactByPhone(supabase, orgId, phone)
    if (!contact) {
      return NextResponse.json(
        { found: false, recent_activities: [], open_deals: [], upcoming_appointments: [] },
        { headers: corsHeaders }
      )
    }

    const nowIso = new Date().toISOString()
    const [company, activities, deals, appointments] = await Promise.all([
      contact.company_id
        ? supabase.from('companies').select('name').eq('id', contact.company_id).maybeSingle()
        : Promise.resolve({ data: null }),
      supabase
        .from('activities')
        .select('type, title, description, created_at')
        .eq('organization_id', orgId)
        .eq('contact_id', contact.id)
        .order('created_at', { ascending: false })
        .limit(5),
      supabase
        .from('deals')
        .select('title, amount, closed_at, stage:deal_stages(name, is_won, is_lost)')
        .eq('organization_id', orgId)
        .eq('contact_id', contact.id)
        .is('closed_at', null)
        .order('created_at', { ascending: false })
        .limit(10),
      supabase
        .from('activities')
        .select('id, title, description, due_date, status, metadata')
        .eq('organization_id', orgId)
        .eq('contact_id', contact.id)
        .eq('type', 'meeting')
        .in('status', ['pending', 'in_progress'])
        .gte('due_date', nowIso)
        .order('due_date', { ascending: true })
        .limit(5),
    ])

    type StageRef = { name?: string; is_won?: boolean; is_lost?: boolean } | null
    const openDeals = ((deals.data as Array<{ title: string; amount: number | null; stage: StageRef | StageRef[] }> | null) ?? [])
      .map((d) => ({ ...d, stage: Array.isArray(d.stage) ? d.stage[0] ?? null : d.stage }))
      .filter((d) => !d.stage?.is_won && !d.stage?.is_lost)
      .map((d) => ({ title: d.title, value: Number(d.amount ?? 0), stage_name: d.stage?.name ?? null }))

    const upcoming = ((appointments.data as Array<{ id: string; title: string; description: string | null; due_date: string; metadata: Record<string, unknown> | null }> | null) ?? []).map(
      (a) => ({
        id: a.id,
        title: a.title,
        start: a.due_date,
        end: (a.metadata?.end as string | undefined) ?? null,
        notes: a.description,
      })
    )

    return NextResponse.json(
      {
        found: true,
        contact: {
          id: contact.id,
          first_name: contact.first_name,
          last_name: contact.last_name,
          email: contact.email,
          phone: contact.phone,
          job_title: contact.job_title,
          company_name: (company.data as { name?: string } | null)?.name ?? null,
          created_at: contact.created_at,
        },
        recent_activities: (activities.data ?? []).map((a) => ({
          type: a.type,
          title: a.title,
          description: a.description ? String(a.description).slice(0, 300) : null,
          created_at: a.created_at,
        })),
        open_deals: openDeals,
        upcoming_appointments: upcoming,
      },
      { headers: corsHeaders }
    )
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal error'
    return NextResponse.json({ error: message }, { status: 500, headers: corsHeaders })
  }
}
