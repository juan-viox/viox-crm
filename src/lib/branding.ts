import { createServerSupabaseClient } from '@/lib/supabase/server'

export interface OrgBranding {
  id: string
  name: string
  slug: string
  primary_color: string
  secondary_color: string
  accent_color: string
  display_font: string
  body_font: string
  logo_url: string | null
  tagline: string | null
  website: string | null
  phone: string | null
  email: string | null
}

const DEFAULT_BRANDING: Omit<OrgBranding, 'id' | 'name' | 'slug'> = {
  primary_color: '#334155',
  secondary_color: '#F5F0EB',
  accent_color: '#8B7355',
  display_font: 'Cormorant Garamond',
  body_font: 'Jost',
  logo_url: null,
  tagline: null,
  website: null,
  phone: null,
  email: null,
}

/**
 * Fetch org branding from Supabase by slug.
 * Falls back to sensible defaults for missing fields.
 */
export async function getOrgBranding(orgSlug: string): Promise<OrgBranding | null> {
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase
    .from('organizations')
    .select(
      'id, name, slug, primary_color, secondary_color, accent_color, display_font, body_font, logo_url, tagline, website, phone, email'
    )
    .eq('slug', orgSlug)
    .single()

  if (error || !data) return null

  return {
    id: data.id,
    name: data.name,
    slug: data.slug,
    primary_color: data.primary_color ?? DEFAULT_BRANDING.primary_color,
    secondary_color: data.secondary_color ?? DEFAULT_BRANDING.secondary_color,
    accent_color: data.accent_color ?? DEFAULT_BRANDING.accent_color,
    display_font: data.display_font ?? DEFAULT_BRANDING.display_font,
    body_font: data.body_font ?? DEFAULT_BRANDING.body_font,
    logo_url: data.logo_url ?? DEFAULT_BRANDING.logo_url,
    tagline: data.tagline ?? DEFAULT_BRANDING.tagline,
    website: data.website ?? DEFAULT_BRANDING.website,
    phone: data.phone ?? DEFAULT_BRANDING.phone,
    email: data.email ?? DEFAULT_BRANDING.email,
  }
}

/**
 * Build CSS variables object from branding for inline styles.
 */
export function brandingToCssVars(branding: OrgBranding): Record<string, string> {
  return {
    '--portal-primary': branding.primary_color,
    '--portal-secondary': branding.secondary_color,
    '--portal-accent': branding.accent_color,
    '--portal-display-font': `'${branding.display_font}', Georgia, serif`,
    '--portal-body-font': `'${branding.body_font}', system-ui, sans-serif`,
  }
}

/**
 * Build a Google Fonts URL for the org's chosen fonts.
 */
export function buildGoogleFontsUrl(branding: OrgBranding): string {
  const display = branding.display_font.replace(/ /g, '+')
  const body = branding.body_font.replace(/ /g, '+')
  return `https://fonts.googleapis.com/css2?family=${display}:ital,wght@0,400;0,500;0,600;0,700;1,400&family=${body}:wght@300;400;500;600&display=swap`
}
