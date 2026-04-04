import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-api-key',
}

export async function OPTIONS() {
  return NextResponse.json(null, { headers: corsHeaders })
}

export async function POST(request: Request) {
  try {
    const apiKey = request.headers.get('x-api-key')
    if (!apiKey) {
      return NextResponse.json({ error: 'Missing API key' }, { status: 401, headers: corsHeaders })
    }

    const supabase = createAdminClient()

    const { data: site } = await supabase
      .from('cinematic_sites')
      .select('organization_id')
      .eq('api_key', apiKey)
      .eq('is_active', true)
      .single()

    if (!site) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 401, headers: corsHeaders })
    }

    const orgId = site.organization_id
    const body = await request.json()
    const { phone, callerName, duration, transcript, agentId } = body

    if (!phone) {
      return NextResponse.json({ error: 'Phone is required' }, { status: 400, headers: corsHeaders })
    }

    // Find or create contact by phone
    const { data: existing } = await supabase
      .from('contacts')
      .select('id')
      .eq('organization_id', orgId)
      .eq('phone', phone)
      .single()

    let contactId: string
    if (existing) {
      contactId = existing.id
      if (callerName) {
        const nameParts = callerName.split(' ')
        await supabase.from('contacts').update({
          first_name: nameParts[0],
          last_name: nameParts.slice(1).join(' ') || '',
        }).eq('id', contactId)
      }
    } else {
      const nameParts = (callerName || 'Unknown').split(' ')
      const { data: newContact } = await supabase
        .from('contacts')
        .insert({
          organization_id: orgId,
          first_name: nameParts[0],
          last_name: nameParts.slice(1).join(' ') || '',
          phone,
          source: 'voice_agent',
        })
        .select('id')
        .single()
      contactId = newContact!.id
    }

    // Create activity
    await supabase.from('activities').insert({
      organization_id: orgId,
      contact_id: contactId,
      type: 'voice_agent',
      title: `Voice call${callerName ? ` with ${callerName}` : ''}`,
      description: transcript ? transcript.slice(0, 500) : null,
      completed: true,
      metadata: {
        transcript,
        duration,
        agentId,
        phone,
      },
    })

    return NextResponse.json({ success: true, contactId }, { headers: corsHeaders })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500, headers: corsHeaders })
  }
}
