import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getOrgFromRequest, type OrgRecord } from '@/lib/org-context'
import Sidebar from '@/components/layout/Sidebar'
import TopBar from '@/components/layout/TopBar'

/** Build CRM accent CSS variables from org branding. Keeps the dark theme intact. */
function buildOrgCssVars(org: OrgRecord): Record<string, string> {
  const vars: Record<string, string> = {}
  if (org.primary_color) {
    vars['--accent'] = org.primary_color
    vars['--org-primary'] = org.primary_color
    // Derive a glow from the primary color
    vars['--accent-glow'] = hexToRgba(org.primary_color, 0.25)
    vars['--shadow-glow'] = `0 0 20px ${hexToRgba(org.primary_color, 0.15)}`
    vars['--gradient-accent'] = `linear-gradient(135deg, ${org.primary_color} 0%, ${org.accent_color || lighten(org.primary_color)} 100%)`
  }
  if (org.accent_color) {
    vars['--accent-light'] = org.accent_color
    vars['--org-accent'] = org.accent_color
  }
  if (org.secondary_color) {
    vars['--org-secondary'] = org.secondary_color
  }
  return vars
}

function hexToRgba(hex: string, alpha: number): string {
  const cleaned = hex.replace('#', '')
  const r = parseInt(cleaned.substring(0, 2), 16)
  const g = parseInt(cleaned.substring(2, 4), 16)
  const b = parseInt(cleaned.substring(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

function lighten(hex: string): string {
  const cleaned = hex.replace('#', '')
  const r = Math.min(255, parseInt(cleaned.substring(0, 2), 16) + 60)
  const g = Math.min(255, parseInt(cleaned.substring(2, 4), 16) + 60)
  const b = Math.min(255, parseInt(cleaned.substring(4, 6), 16) + 60)
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*, organization:organizations(*)')
    .eq('id', user.id)
    .single()

  // Try to resolve org from subdomain first, fall back to user's profile org
  let org = await getOrgFromRequest()
  const profileOrg = profile?.organization as OrgRecord | null

  // If no subdomain org (e.g. on vercel.app URL), fall back to user's own org
  if (!org && profileOrg) {
    org = profileOrg
  }

  const orgName = org?.name ?? profile?.organization?.name ?? 'My Organization'
  const userName = profile?.full_name ?? user.email ?? 'User'
  const userRole = profile?.role ?? 'member'

  // Build branding props for Sidebar/TopBar
  const orgBranding = org ? {
    name: org.name,
    slug: org.slug,
    primaryColor: org.primary_color || '#6c5ce7',
    accentColor: org.accent_color || '#a29bfe',
    logoUrl: org.logo_url,
  } : null

  // Build dynamic CSS variables from org branding
  const orgStyle = org ? buildOrgCssVars(org) : {}

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={orgStyle as React.CSSProperties}
    >
      <Sidebar orgName={orgName} userName={userName} userRole={userRole} orgBranding={orgBranding} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar userName={userName} orgName={orgName} orgBranding={orgBranding} />
        <main className="flex-1 overflow-y-auto p-6 animate-page-enter">
          {children}
        </main>
      </div>
    </div>
  )
}
