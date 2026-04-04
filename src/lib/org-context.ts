import { headers } from 'next/headers'
import { createAdminClient } from './supabase/admin'
import { resolveOrgSlug, isAdminSubdomain } from './subdomain'

export interface OrgRecord {
  id: string
  name: string
  slug: string
  is_active: boolean
  primary_color: string | null
  secondary_color: string | null
  accent_color: string | null
  display_font: string | null
  body_font: string | null
  logo_url: string | null
  tagline: string | null
  website: string | null
  phone: string | null
  email: string | null
}

/**
 * Server-side: resolve the current organization from the request's subdomain.
 *
 * Returns null when:
 * - On admin.crm.viox.ai (super-admin — no single org)
 * - On root domain crm.viox.ai with no org context
 * - Org slug doesn't match an active organization
 */
export async function getOrgFromRequest(): Promise<OrgRecord | null> {
  const headersList = await headers()
  const host = headersList.get('host') || ''

  // Check the x-org-slug header set by middleware first
  const orgSlugHeader = headersList.get('x-org-slug')
  const orgSlug = orgSlugHeader || resolveOrgSlug(host)

  if (!orgSlug || isAdminSubdomain(orgSlug)) return null

  const supabase = createAdminClient()
  const { data: org } = await supabase
    .from('organizations')
    .select('id, name, slug, is_active, primary_color, secondary_color, accent_color, display_font, body_font, logo_url, tagline, website, phone, email')
    .eq('slug', orgSlug)
    .eq('is_active', true)
    .single()

  return org as OrgRecord | null
}

/**
 * Get the raw org slug from the current request (without DB lookup).
 * Useful when you just need the slug string, not the full org record.
 */
export async function getOrgSlugFromRequest(): Promise<string | null> {
  const headersList = await headers()
  const orgSlugHeader = headersList.get('x-org-slug')
  if (orgSlugHeader) return orgSlugHeader

  const host = headersList.get('host') || ''
  return resolveOrgSlug(host)
}
