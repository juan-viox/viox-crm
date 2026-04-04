import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getOrgSlugFromRequest } from '@/lib/org-context'
import { isAdminSubdomain } from '@/lib/subdomain'

export default async function RootPage() {
  const orgSlug = await getOrgSlugFromRequest()

  // Admin subdomain → go to admin dashboard
  if (isAdminSubdomain(orgSlug)) {
    redirect('/admin')
  }

  // Check if user is authenticated
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    // Not logged in → show login page
    redirect('/login')
  }

  // Logged in on an org subdomain (or dev with org slug) → dashboard
  if (orgSlug) {
    redirect('/dashboard')
  }

  // Logged in on root domain / vercel URL → look up user's org and redirect
  const { data: profile } = await supabase
    .from('profiles')
    .select('organization:organizations(slug)')
    .eq('id', user.id)
    .single()

  const userOrgSlug = (profile?.organization as { slug?: string } | null)?.slug

  if (userOrgSlug) {
    // In production, redirect to the user's org subdomain
    const host = (await import('next/headers')).headers
    const headersList = await host()
    const currentHost = headersList.get('host') || ''

    // If we're on crm.viox.ai, redirect to {org}.crm.viox.ai
    if (currentHost === 'crm.viox.ai') {
      redirect(`https://${userOrgSlug}.crm.viox.ai/dashboard`)
    }
  }

  // Fallback: just go to dashboard (vercel URL, local dev without org)
  redirect('/dashboard')
}
