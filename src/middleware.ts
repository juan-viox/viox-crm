import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { getSubdomain, isAdminSubdomain, resolveOrgSlug } from '@/lib/subdomain'

/** Paths that never require authentication */
const publicPaths = ['/login', '/signup', '/auth/callback']

export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl
  const host = request.headers.get('host') || ''

  // ── 1. Resolve the org slug from subdomain / dev overrides ──
  const orgSlug = resolveOrgSlug(host, searchParams)

  // ── 2. Always allow public paths ──
  if (publicPaths.some((p) => pathname.startsWith(p))) {
    const response = NextResponse.next({ request })
    if (orgSlug && !isAdminSubdomain(orgSlug)) {
      response.headers.set('x-org-slug', orgSlug)
    }
    return response
  }

  // ── 3. Always allow ingest API routes (API-key auth in route handlers) ──
  if (pathname.startsWith('/api/v1/ingest')) {
    return NextResponse.next()
  }

  // ── 4. Always allow public branding API ──
  if (pathname.startsWith('/api/v1/branding')) {
    return NextResponse.next()
  }

  // ── 5. Portal login pages — no auth required ──
  if (/^\/portal\/[^/]+\/login$/.test(pathname)) {
    return NextResponse.next()
  }

  // ── 6. Create Supabase client that handles cookie refresh ──
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // ── 7. Inject x-org-slug header for downstream layouts ──
  if (orgSlug && !isAdminSubdomain(orgSlug)) {
    supabaseResponse.headers.set('x-org-slug', orgSlug)
  }

  // ── 8. Portal routes: require auth, redirect to branded login ──
  if (pathname.startsWith('/portal/')) {
    if (!user) {
      const segments = pathname.split('/')
      const portalOrg = segments[2]
      if (portalOrg) {
        const url = request.nextUrl.clone()
        url.pathname = `/portal/${portalOrg}/login`
        return NextResponse.redirect(url)
      }
    }
    return supabaseResponse
  }

  // ── 9. Legacy portal routes ──
  if (pathname.startsWith('/portal-login')) {
    return supabaseResponse
  }

  // ── 10. Admin subdomain: require auth + super-admin check done in layout ──
  if (isAdminSubdomain(orgSlug)) {
    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }
    supabaseResponse.headers.set('x-org-slug', 'admin')
    return supabaseResponse
  }

  // ── 11. Admin routes (path-based, for backwards compat) ──
  if (pathname.startsWith('/admin')) {
    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }
    return supabaseResponse
  }

  // ── 12. All other authenticated routes ──
  if (!user && !pathname.startsWith('/api')) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
