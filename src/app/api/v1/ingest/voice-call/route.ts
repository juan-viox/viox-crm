import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  createContact,
  findContactByPhone,
  isIngestKeyValid,
  resolveOrgId,
} from '@/lib/voice-integration'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-api-key',
}

export async function OPTIONS() {
  return NextResponse.json(null, { headers: corsHeaders })
}

/** Map a voice platform call status onto the activities.status CHECK values. */
function activityStatus(status: unknown): 'in_progress' | 'completed' | 'cancelled' {
  const s = typeof status === 'string' ? status.toLowerCase() : ''
  if (['initiated', 'in-progress', 'in_progress', 'processing', 'ringing'].includes(s)) return 'in_progress'
  if (['cancelled', 'canceled'].includes(s)) return 'cancelled'
  return 'completed'
}

export async function POST(request: Request) {
  try {
    const apiKey = request.headers.get('x-api-key')
    if (!apiKey || !isIngestKeyValid(apiKey)) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 401, headers: corsHeaders })
    }

    const supabase = createAdminClient()
    const body = await request.json()
    const {
      phone,
      callerName,
      duration,
      transcript,
      agentId,
      conversationId,
      summary,
      direction,
      email,
      data,
      startedAt,
      status,
    } = body

    if (!phone) {
      return NextResponse.json({ error: 'Phone is required' }, { status: 400, headers: corsHeaders })
    }

    const orgId = await resolveOrgId(supabase, apiKey)
    if (!orgId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 500, headers: corsHeaders })
    }

    const existing = await findContactByPhone(supabase, orgId, phone)

    let contactId: string
    if (existing) {
      contactId = existing.id
      const updates: Record<string, string> = {}
      if (callerName) {
        const nameParts = String(callerName).split(' ')
        updates.first_name = nameParts[0]
        updates.last_name = nameParts.slice(1).join(' ') || ''
      }
      if (email && !existing.email) updates.email = String(email).trim()
      if (Object.keys(updates).length > 0) {
        const { error } = await supabase.from('contacts').update(updates).eq('id', contactId)
        if (error && updates.email) {
          // Email may already belong to another contact (unique per org); keep the rest.
          delete updates.email
          if (Object.keys(updates).length > 0) {
            await supabase.from('contacts').update(updates).eq('id', contactId)
          }
        }
      }
    } else {
      const nameParts = String(callerName || 'Unknown').split(' ')
      try {
        contactId = await createContact(supabase, orgId, {
          first_name: nameParts[0],
          last_name: nameParts.slice(1).join(' ') || '',
          phone,
          email: email ? String(email).trim() : null,
          source: 'voice_agent',
        })
      } catch {
        // Retry without the email in case it collides with another contact.
        contactId = await createContact(supabase, orgId, {
          first_name: nameParts[0],
          last_name: nameParts.slice(1).join(' ') || '',
          phone,
          source: 'voice_agent',
        })
      }
    }

    const text: string | null = summary || transcript || null
    const actStatus = activityStatus(status)
    const metadata: Record<string, unknown> = { transcript, duration, agentId, phone }
    if (conversationId) metadata.conversationId = conversationId
    if (summary) metadata.summary = summary
    if (direction === 'inbound' || direction === 'outbound') metadata.direction = direction
    if (email) metadata.email = email
    if (data && typeof data === 'object' && !Array.isArray(data)) metadata.data = data
    if (startedAt) metadata.startedAt = startedAt
    if (status) metadata.callStatus = status

    const activity = {
      type: 'voice_agent',
      title: `Voice call${callerName ? ` with ${callerName}` : ''}`,
      description: text ? String(text).slice(0, 500) : null,
      status: actStatus,
      completed_at: actStatus === 'completed' ? new Date().toISOString() : null,
    }

    // Idempotent on conversationId: update the existing activity if we have one.
    if (conversationId) {
      const { data: prior } = await supabase
        .from('activities')
        .select('id, metadata')
        .eq('organization_id', orgId)
        .eq('metadata->>conversationId', String(conversationId))
        .limit(1)
        .maybeSingle()

      if (prior) {
        const merged = { ...((prior.metadata as Record<string, unknown>) || {}), ...stripUndefined(metadata) }
        await supabase
          .from('activities')
          .update({ ...activity, contact_id: contactId, metadata: merged })
          .eq('id', prior.id)
        return NextResponse.json(
          { success: true, contactId, activityId: prior.id, updated: true },
          { headers: corsHeaders }
        )
      }
    }

    const { data: inserted } = await supabase
      .from('activities')
      .insert({
        organization_id: orgId,
        contact_id: contactId,
        ...activity,
        metadata,
      })
      .select('id')
      .single()

    return NextResponse.json(
      { success: true, contactId, activityId: inserted?.id ?? null, updated: false },
      { headers: corsHeaders }
    )
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal error'
    return NextResponse.json({ error: message }, { status: 500, headers: corsHeaders })
  }
}

function stripUndefined(obj: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined))
}
