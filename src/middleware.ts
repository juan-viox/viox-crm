import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const publicPaths = ['/login', '/signup', '/auth/callback']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public paths
  if (publicPaths.some((p) => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  // Allow ingest API routes (they use API key auth)
  if (pathname.startsWith('/api/v1/ingest')) {
    return NextResponse.next()
  }

  // Allow portal login pages without auth (branded login)
  if (/^\/portal\/[^/]+\/login$/.test(pathname)) {
    return NextResponse.next()
  }

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
          cookiesToSet.forEach(({ name, value, options }) =>
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

  // Portal routes: require auth, redirect to branded login
  if (pathname.startsWith('/portal/')) {
    if (!user) {
      // Extract orgSlug from /portal/[orgSlug]/...
      const segments = pathname.split('/')
      const orgSlug = segments[2]
      if (orgSlug) {
        const url = request.nextUrl.clone()
        url.pathname = `/portal/${orgSlug}/login`
        return NextResponse.redirect(url)
      }
    }
    return supabaseResponse
  }

  // Legacy portal routes
  if (pathname.startsWith('/portal-login')) {
    return supabaseResponse
  }

  // Admin routes: require auth (super-admin check done in layout)
  if (pathname.startsWith('/admin')) {
    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }
    return supabaseResponse
  }

  // All other authenticated routes
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
