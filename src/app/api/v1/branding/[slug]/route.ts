import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// Public endpoint — no auth required. Returns org branding for portal pages.
export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const supabase = createAdminClient()

  const { data: org, error } = await supabase
    .from('organizations')
    .select('name, slug, primary_color, secondary_color, accent_color, accent2_color, accent3_color, dark_color, light_color, display_font, body_font, logo_url, tagline, phone, email, website, instagram, city, state')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  if (error || !org) {
    return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
  }

  // Cache for 5 minutes
  return NextResponse.json(org, {
    headers: {
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      'Access-Control-Allow-Origin': '*',
    }
  })
}
