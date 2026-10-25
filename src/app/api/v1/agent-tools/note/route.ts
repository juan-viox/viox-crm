import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  checkAgentAuth,
  corsHeadersFor,
  findContactById,
  findContactByPhone,
  resolveOrgId,
} from '@/lib/voice-integration'

const corsHeaders = corsHeadersFor('POST')

export async function OPTIONS() {
  return NextResponse.json(null, { headers: corsHeaders })
}

/** POST /api/v1/agent-tools/note — add a note to a contact (by contact_id or phone). */
export async function POST(request: Request) {
  try {
    const auth = checkAgentAuth(request, corsHeaders)
    if ('response' in auth) return auth.response

    const body = await request.json().catch(() => ({}))
    const { phone, contact_id, text } = body ?? {}
    if (typeof text !== 'string' || !text.trim()) {
      return NextResponse.json({ error: 'text is required' }, { status: 400, headers: corsHeaders })
    }
    if (!phone && !contact_id) {
      return NextResponse.json({ error: 'phone or contact_id is required' }, { status: 400, headers: corsHeaders })
    }

    const supabase = createAdminClient()
    const orgId = await resolveOrgId(supabase, auth.apiKey)
    if (!orgId) {
      return NextResponse.json({ error: 'No organization found (set VOICE_AGENT_ORG_ID when the CRM holds several)' }, { status: 500, headers: corsHeaders })
    }

    const contact = contact_id
      ? await findContactById(supabase, orgId, String(contact_id))
      : await findContactByPhone(supabase, orgId, String(phone))
    if (!contact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404, headers: corsHeaders })
    }

    const { data: note, error } = await supabase
      .from('notes')
      .insert({
        organization_id: orgId,
        entity_type: 'contact',
        entity_id: contact.id,
        content: text.trim(),
      })
      .select('id')
      .single()
    if (error || !note) throw new Error(error?.message || 'Could not save note')

    return NextResponse.json({ note_id: note.id, contact_id: contact.id }, { headers: corsHeaders })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal error'
    return NextResponse.json({ error: message }, { status: 500, headers: corsHeaders })
  }
}
