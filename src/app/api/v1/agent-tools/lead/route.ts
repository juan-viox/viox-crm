import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  checkAgentAuth,
  contactSource,
  corsHeadersFor,
  createContact,
  findContactByEmail,
  findContactByPhone,
  phoneKey,
  resolveOrgId,
} from '@/lib/voice-integration'
import type { SupabaseClient } from '@supabase/supabase-js'

const corsHeaders = corsHeadersFor('POST')

export async function OPTIONS() {
  return NextResponse.json(null, { headers: corsHeaders })
}

async function findOrCreateCompany(supabase: SupabaseClient, orgId: string, name: string): Promise<string | null> {
  const clean = name.trim()
  if (!clean) return null
  const { data: existing } = await supabase
    .from('companies')
    .select('id')
    .eq('organization_id', orgId)
    .ilike('name', clean)
    .limit(1)
    .maybeSingle()
  if (existing) return existing.id
  const { data: created } = await supabase
    .from('companies')
    .insert({ organization_id: orgId, name: clean })
    .select('id')
    .single()
  return created?.id ?? null
}

/** POST /api/v1/agent-tools/lead — create or update a contact from a call. */
export async function POST(request: Request) {
  try {
    const auth = checkAgentAuth(request, corsHeaders)
    if ('response' in auth) return auth.response

    const body = await request.json().catch(() => ({}))
    const { phone, first_name, last_name, email, company, notes, source } = body ?? {}
    const cleanEmail = typeof email === 'string' && email.trim() ? email.trim() : null

    if (!phoneKey(phone) && !cleanEmail) {
      return NextResponse.json({ error: 'phone or email is required' }, { status: 400, headers: corsHeaders })
    }

    const supabase = createAdminClient()
    const orgId = await resolveOrgId(supabase, auth.apiKey)
    if (!orgId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 500, headers: corsHeaders })
    }

    let existing = phoneKey(phone) ? await findContactByPhone(supabase, orgId, phone) : null
    if (!existing && cleanEmail) existing = await findContactByEmail(supabase, orgId, cleanEmail)

    const companyId = typeof company === 'string' && company.trim()
      ? await findOrCreateCompany(supabase, orgId, company)
      : null

    let contactId: string
    let created = false
    if (existing) {
      contactId = existing.id
      const updates: Record<string, string> = {}
      if (first_name) updates.first_name = String(first_name)
      if (last_name) updates.last_name = String(last_name)
      if (phone && !existing.phone) updates.phone = String(phone)
      if (companyId && !existing.company_id) updates.company_id = companyId
      if (cleanEmail && !existing.email) updates.email = cleanEmail
      if (Object.keys(updates).length > 0) {
        const { error } = await supabase.from('contacts').update(updates).eq('id', contactId)
        if (error && updates.email) {
          delete updates.email
          if (Object.keys(updates).length > 0) await supabase.from('contacts').update(updates).eq('id', contactId)
        }
      }
    } else {
      contactId = await createContact(supabase, orgId, {
        first_name: first_name ? String(first_name) : null,
        last_name: last_name ? String(last_name) : null,
        phone: phone ? String(phone) : null,
        email: cleanEmail,
        company_id: companyId,
        source: contactSource(source ?? 'voice_agent'),
      })
      created = true
    }

    if (typeof notes === 'string' && notes.trim()) {
      await supabase.from('notes').insert({
        organization_id: orgId,
        entity_type: 'contact',
        entity_id: contactId,
        content: notes.trim(),
      })
    }

    return NextResponse.json({ contact_id: contactId, created }, { headers: corsHeaders })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal error'
    return NextResponse.json({ error: message }, { status: 500, headers: corsHeaders })
  }
}
