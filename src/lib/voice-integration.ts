/**
 * VioX Voice integration helpers (optional).
 *
 * Everything here is driven by env vars. When none of them are set the
 * integration is off and the CRM behaves exactly as before.
 *
 *   VOICE_AGENT_API_KEY   key VioX Voice sends as `x-api-key` to the agent-tool
 *                         endpoints (falls back to SITE_API_KEY when unset)
 *   VIOX_VOICE_API_URL    VioX Voice API base (default https://viox-voice-api.vercel.app)
 *   VIOX_VOICE_API_KEY    key the CRM sends to VioX Voice (`xi-api-key`)
 *   VIOX_VOICE_AGENT_ID   agent used for outbound "Call with AI agent"
 *   VIOX_VOICE_PHONE_NUMBER_ID  VioX Voice phone number id used as caller
 */
import { createHash, timingSafeEqual } from 'crypto'
import { NextResponse } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'

export function corsHeadersFor(methods: string) {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': `${methods}, OPTIONS`,
    'Access-Control-Allow-Headers': 'Content-Type, x-api-key',
  }
}

/** Constant-time string comparison (hashes first so lengths never leak). */
export function safeEqual(a: string, b: string): boolean {
  const ha = createHash('sha256').update(a).digest()
  const hb = createHash('sha256').update(b).digest()
  return timingSafeEqual(ha, hb)
}

/** Key the agent-tool endpoints accept: VOICE_AGENT_API_KEY, else SITE_API_KEY. */
export function getAgentApiKey(): string | null {
  return process.env.VOICE_AGENT_API_KEY || process.env.SITE_API_KEY || null
}

/**
 * Auth for /api/v1/agent-tools/*.
 * Returns the accepted key on success, or a ready-to-return response
 * (404 when the feature is off, 401 when the key is wrong).
 */
export function checkAgentAuth(
  request: Request,
  headers: Record<string, string>
): { apiKey: string } | { response: NextResponse } {
  const expected = getAgentApiKey()
  if (!expected) {
    return { response: NextResponse.json({ error: 'Not found' }, { status: 404, headers }) }
  }
  const provided = request.headers.get('x-api-key')
  if (!provided || !safeEqual(provided, expected)) {
    return { response: NextResponse.json({ error: 'Invalid API key' }, { status: 401, headers }) }
  }
  return { apiKey: provided }
}

/** True when the provided key matches SITE_API_KEY or VOICE_AGENT_API_KEY. */
export function isIngestKeyValid(provided: string | null): boolean {
  if (!provided) return false
  const keys = [process.env.SITE_API_KEY, process.env.VOICE_AGENT_API_KEY].filter(
    (k): k is string => !!k
  )
  let ok = false
  for (const k of keys) {
    if (safeEqual(provided, k)) ok = true
  }
  return ok
}

/** Org from a cinematic_sites api key, falling back to the single organization. */
export async function resolveOrgId(supabase: SupabaseClient, apiKey: string): Promise<string | null> {
  const { data } = await supabase
    .from('cinematic_sites')
    .select('organization_id')
    .eq('api_key', apiKey)
    .maybeSingle()
  if (data?.organization_id) return data.organization_id

  const { data: org } = await supabase.from('organizations').select('id').limit(1).maybeSingle()
  return org?.id ?? null
}

/** Last 10 digits of a phone number ("+1 (212) 555-0100" -> "2125550100"). */
export function phoneKey(phone: string | null | undefined): string | null {
  if (!phone) return null
  const digits = String(phone).replace(/\D/g, '')
  if (digits.length < 7) return null
  return digits.slice(-10)
}

export type ContactRow = {
  id: string
  first_name: string
  last_name: string | null
  email: string | null
  phone: string | null
  job_title: string | null
  company_id: string | null
  created_at: string
}

const CONTACT_COLUMNS = 'id, first_name, last_name, email, phone, job_title, company_id, created_at'

/** Find a contact whose phone matches on the last 10 digits, ignoring formatting. */
export async function findContactByPhone(
  supabase: SupabaseClient,
  orgId: string,
  phone: string
): Promise<ContactRow | null> {
  const key = phoneKey(phone)
  if (!key) return null
  // Narrow in SQL (digits in order, any formatting between), then compare exactly.
  const pattern = `%${key.split('').join('%')}%`
  const { data } = await supabase
    .from('contacts')
    .select(CONTACT_COLUMNS)
    .eq('organization_id', orgId)
    .ilike('phone', pattern)
    .order('created_at', { ascending: true })
    .limit(50)
  const match = (data as ContactRow[] | null)?.find((c) => phoneKey(c.phone) === key)
  return match ?? null
}

export async function findContactById(
  supabase: SupabaseClient,
  orgId: string,
  id: string
): Promise<ContactRow | null> {
  const { data } = await supabase
    .from('contacts')
    .select(CONTACT_COLUMNS)
    .eq('organization_id', orgId)
    .eq('id', id)
    .maybeSingle()
  return (data as ContactRow | null) ?? null
}

export async function findContactByEmail(
  supabase: SupabaseClient,
  orgId: string,
  email: string
): Promise<ContactRow | null> {
  const { data } = await supabase
    .from('contacts')
    .select(CONTACT_COLUMNS)
    .eq('organization_id', orgId)
    .ilike('email', email.trim().replace(/[\\%_]/g, (m) => `\\${m}`))
    .limit(1)
    .maybeSingle()
  return (data as ContactRow | null) ?? null
}

/** Allowed values of contacts.source (schema CHECK constraint). */
const CONTACT_SOURCES = ['manual', 'web_form', 'newsletter', 'voice_agent', 'booking', 'referral', 'import']

export function contactSource(source: unknown): string {
  return typeof source === 'string' && CONTACT_SOURCES.includes(source) ? source : 'voice_agent'
}

/** Create a minimal contact from a phone number. */
export async function createContact(
  supabase: SupabaseClient,
  orgId: string,
  fields: { phone?: string | null; first_name?: string | null; last_name?: string | null; email?: string | null; source?: string; company_id?: string | null }
): Promise<string> {
  const { data, error } = await supabase
    .from('contacts')
    .insert({
      organization_id: orgId,
      first_name: fields.first_name || 'Unknown',
      last_name: fields.last_name || '',
      phone: fields.phone || null,
      email: fields.email || null,
      company_id: fields.company_id || null,
      source: fields.source || 'voice_agent',
    })
    .select('id')
    .single()
  if (error || !data) throw new Error(error?.message || 'Could not create contact')
  return data.id
}

export function contactName(c: { first_name?: string | null; last_name?: string | null }): string {
  return `${c.first_name || ''} ${c.last_name || ''}`.trim()
}

/** Outbound-call config, or null when the integration is not configured. */
export function getVoiceOutboundConfig() {
  const apiKey = process.env.VIOX_VOICE_API_KEY
  const agentId = process.env.VIOX_VOICE_AGENT_ID
  const phoneNumberId = process.env.VIOX_VOICE_PHONE_NUMBER_ID
  if (!apiKey || !agentId || !phoneNumberId) return null
  const apiUrl = (process.env.VIOX_VOICE_API_URL || 'https://viox-voice-api.vercel.app').replace(/\/+$/, '')
  return { apiUrl, apiKey, agentId, phoneNumberId }
}

export function isVoiceOutboundConfigured(): boolean {
  return getVoiceOutboundConfig() !== null
}
