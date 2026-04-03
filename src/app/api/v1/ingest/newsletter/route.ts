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
      .eq('active', true)
      .single()

    if (!site) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 401, headers: corsHeaders })
    }

    const orgId = site.organization_id
    const body = await request.json()
    const { email, firstName } = body

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400, headers: corsHeaders })
    }

    // Upsert contact
    const { data: existing } = await supabase
      .from('contacts')
      .select('id')
      .eq('organization_id', orgId)
      .eq('email', email)
      .single()

    let contactId: string
    if (existing) {
      contactId = existing.id
      if (firstName) {
        await supabase.from('contacts').update({ first_name: firstName }).eq('id', contactId)
      }
    } else {
      const { data: newContact } = await supabase
        .from('contacts')
        .insert({
          organization_id: orgId,
          first_name: firstName || email.split('@')[0],
          last_name: '',
          email,
          source: 'newsletter',
          status: 'lead',
        })
        .select('id')
        .single()
      contactId = newContact!.id
    }

    // Add newsletter tag
    let { data: tag } = await supabase
      .from('tags')
      .select('id')
      .eq('organization_id', orgId)
      .eq('name', 'newsletter')
      .single()

    if (!tag) {
      const { data: newTag } = await supabase
        .from('tags')
        .insert({ organization_id: orgId, name: 'newsletter', color: '#fdcb6e' })
        .select('id')
        .single()
      tag = newTag
    }

    if (tag) {
      // Check if tag already exists
      const { data: existingTag } = await supabase
        .from('entity_tags')
        .select('id')
        .eq('tag_id', tag.id)
        .eq('entity_type', 'contact')
        .eq('entity_id', contactId)
        .single()

      if (!existingTag) {
        await supabase.from('entity_tags').insert({
          tag_id: tag.id,
          entity_type: 'contact',
          entity_id: contactId,
        })
      }
    }

    return NextResponse.json({ success: true, contactId }, { headers: corsHeaders })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500, headers: corsHeaders })
  }
}
