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

async function getOrgIdFromApiKey(supabase: any, apiKey: string): Promise<string | null> {
  const { data } = await supabase
    .from('cinematic_sites')
    .select('organization_id')
    .eq('api_key', apiKey)
    .single()
  return data?.organization_id ?? null
}

export async function POST(request: Request) {
  try {
    const apiKey = request.headers.get('x-api-key')
    if (!apiKey || apiKey !== process.env.SITE_API_KEY) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 401, headers: corsHeaders })
    }

    const supabase = createAdminClient()
    const body = await request.json()
    const { firstName, lastName, email, phone, service, date, notes } = body

    let orgId = await getOrgIdFromApiKey(supabase, apiKey)
    if (!orgId) {
      const { data: org } = await supabase.from('organizations').select('id').limit(1).single()
      orgId = org?.id ?? null
    }
    if (!orgId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 500, headers: corsHeaders })
    }

    let contactId: string
    if (email) {
      const { data: existing } = await supabase
        .from('contacts')
        .select('id')
        .eq('email', email)
        .eq('organization_id', orgId)
        .single()

      if (existing) {
        contactId = existing.id
        await supabase.from('contacts').update({
          first_name: firstName || undefined,
          last_name: lastName || undefined,
          phone: phone || undefined,
        }).eq('id', contactId)
      } else {
        const { data: newContact } = await supabase
          .from('contacts')
          .insert({
            organization_id: orgId,
            first_name: firstName || 'Unknown',
            last_name: lastName || '',
            email,
            phone: phone || null,
            source: 'booking',
          })
          .select('id')
          .single()
        contactId = newContact!.id
      }
    } else {
      const { data: newContact } = await supabase
        .from('contacts')
        .insert({
          organization_id: orgId,
          first_name: firstName || 'Unknown',
          last_name: lastName || '',
          phone: phone || null,
          source: 'booking',
        })
        .select('id')
        .single()
      contactId = newContact!.id
    }

    const { data: firstStage } = await supabase
      .from('deal_stages')
      .select('id')
      .eq('organization_id', orgId)
      .order('sort_order')
      .limit(1)
      .single()

    if (firstStage) {
      await supabase.from('deals').insert({
        organization_id: orgId,
        contact_id: contactId,
        stage_id: firstStage.id,
        title: `Booking: ${service || 'Service'} - ${firstName || ''} ${lastName || ''}`.trim(),
        amount: 0,
        notes: notes || null,
      })
    }

    await supabase.from('activities').insert({
      organization_id: orgId,
      contact_id: contactId,
      type: 'meeting',
      title: `Booking: ${service || 'Service'}`,
      description: notes || null,
      due_date: date || null,
      status: 'pending',
      metadata: { service, bookingDate: date },
    })

    return NextResponse.json({ success: true, contactId }, { headers: corsHeaders })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500, headers: corsHeaders })
  }
}
