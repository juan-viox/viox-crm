import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  checkAgentAuth,
  corsHeadersFor,
  createContact,
  findContactById,
  findContactByPhone,
  phoneKey,
  resolveOrgId,
} from '@/lib/voice-integration'

const corsHeaders = corsHeadersFor('POST')

export async function OPTIONS() {
  return NextResponse.json(null, { headers: corsHeaders })
}

/**
 * POST /api/v1/agent-tools/appointment — book an appointment.
 * Stored the same way as the CRM calendar: an activity of type 'meeting'
 * with due_date = start and status 'pending'.
 */
export async function POST(request: Request) {
  try {
    const auth = checkAgentAuth(request, corsHeaders)
    if ('response' in auth) return auth.response

    const body = await request.json().catch(() => ({}))
    const { phone, contact_id, title, start, duration_minutes, notes } = body ?? {}

    if (typeof title !== 'string' || !title.trim()) {
      return NextResponse.json({ error: 'title is required' }, { status: 400, headers: corsHeaders })
    }
    const startDate = typeof start === 'string' ? new Date(start) : null
    if (!startDate || Number.isNaN(startDate.getTime())) {
      return NextResponse.json({ error: 'start must be an ISO 8601 date-time' }, { status: 400, headers: corsHeaders })
    }
    const minutes = Number(duration_minutes) > 0 ? Math.round(Number(duration_minutes)) : 30
    const endDate = new Date(startDate.getTime() + minutes * 60_000)

    if (!contact_id && !phoneKey(phone)) {
      return NextResponse.json({ error: 'phone or contact_id is required' }, { status: 400, headers: corsHeaders })
    }

    const supabase = createAdminClient()
    const orgId = await resolveOrgId(supabase, auth.apiKey)
    if (!orgId) {
      return NextResponse.json({ error: 'No organization found (set VOICE_AGENT_ORG_ID when the CRM holds several)' }, { status: 500, headers: corsHeaders })
    }

    let contactId: string | null = null
    if (contact_id) {
      const c = await findContactById(supabase, orgId, String(contact_id))
      if (!c) return NextResponse.json({ error: 'Contact not found' }, { status: 404, headers: corsHeaders })
      contactId = c.id
    } else {
      const c = await findContactByPhone(supabase, orgId, String(phone))
      contactId = c ? c.id : await createContact(supabase, orgId, { phone: String(phone), source: 'voice_agent' })
    }

    const { data: appt, error } = await supabase
      .from('activities')
      .insert({
        organization_id: orgId,
        contact_id: contactId,
        type: 'meeting',
        title: title.trim(),
        description: typeof notes === 'string' && notes.trim() ? notes.trim() : null,
        due_date: startDate.toISOString(),
        status: 'pending',
        metadata: {
          source: 'voice_agent',
          start: startDate.toISOString(),
          end: endDate.toISOString(),
          duration_minutes: minutes,
        },
      })
      .select('id')
      .single()
    if (error || !appt) throw new Error(error?.message || 'Could not save appointment')

    return NextResponse.json(
      { appointment_id: appt.id, start: startDate.toISOString(), end: endDate.toISOString() },
      { headers: corsHeaders }
    )
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal error'
    return NextResponse.json({ error: message }, { status: 500, headers: corsHeaders })
  }
}
