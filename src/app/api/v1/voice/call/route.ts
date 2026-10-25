import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getOrgId } from '@/lib/utils'
import { contactName, getVoiceOutboundConfig } from '@/lib/voice-integration'

/**
 * POST /api/v1/voice/call  { contact_id }
 * Starts an outbound call from the configured VioX Voice agent to the contact.
 * Requires a signed-in CRM user. 404 when the integration is not configured.
 */
export async function POST(request: Request) {
  try {
    const config = getVoiceOutboundConfig()
    if (!config) {
      return NextResponse.json({ error: 'VioX Voice integration is not configured' }, { status: 404 })
    }

    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const contactId = body?.contact_id
    if (!contactId || typeof contactId !== 'string') {
      return NextResponse.json({ error: 'contact_id is required' }, { status: 400 })
    }

    // Read through the user's session so RLS scopes the contact to their org.
    const { data: contact } = await supabase
      .from('contacts')
      .select('id, first_name, last_name, email, phone')
      .eq('id', contactId)
      .maybeSingle()
    if (!contact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 })
    }
    if (!contact.phone) {
      return NextResponse.json({ error: 'Contact has no phone number' }, { status: 400 })
    }

    const res = await fetch(`${config.apiUrl}/v1/convai/twilio/outbound-call`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': config.apiKey,
      },
      body: JSON.stringify({
        agent_id: config.agentId,
        agent_phone_number_id: config.phoneNumberId,
        to_number: contact.phone,
        conversation_initiation_client_data: {
          dynamic_variables: {
            contact_name: contactName(contact),
            contact_first_name: contact.first_name || '',
            contact_id: contact.id,
            contact_email: contact.email || '',
          },
        },
      }),
    })

    const text = await res.text()
    let result: Record<string, unknown>
    try {
      result = text ? JSON.parse(text) : {}
    } catch {
      result = { message: text.slice(0, 500) }
    }

    if (!res.ok || result.success === false) {
      const detail = (result.detail as { message?: string } | string | undefined)
      const message =
        (typeof detail === 'string' ? detail : detail?.message) ||
        (result.message as string | undefined) ||
        `VioX Voice returned ${res.status}`
      return NextResponse.json({ error: message, voice: result }, { status: res.ok ? 502 : res.status })
    }

    const conversationId = (result.conversation_id as string | undefined) ?? null
    const callSid = (result.callSid as string | undefined) ?? (result.call_sid as string | undefined) ?? null

    const orgId = await getOrgId(supabase)
    if (orgId) {
      await supabase.from('activities').insert({
        organization_id: orgId,
        contact_id: contact.id,
        user_id: user.id,
        type: 'call',
        title: 'AI call started',
        description: `Outbound call by VioX Voice agent to ${contact.phone}`,
        status: 'in_progress',
        metadata: {
          // conversationId lets the post-call voice-call ingest update this same activity.
          conversationId,
          callSid,
          agentId: config.agentId,
          direction: 'outbound',
          phone: contact.phone,
          source: 'viox_voice',
        },
      })
    }

    return NextResponse.json(result)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
