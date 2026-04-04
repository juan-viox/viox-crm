/**
 * Subdomain detection utility for multi-tenant CRM.
 *
 * URL patterns:
 *   dreamersjoy.crm.viox.ai  → "dreamersjoy"
 *   admin.crm.viox.ai        → "admin"
 *   crm.viox.ai              → null (root)
 *   localhost:3000            → null (dev — use DEV_ORG_SLUG or ?org= param)
 *   viox-crm.vercel.app      → null (Vercel default)
 */

export function getSubdomain(host: string): string | null {
  // Strip port for comparison
  const hostname = host.split(':')[0]

  // Local development — no subdomain extraction
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return null
  }

  // Vercel default domain — no subdomain
  if (hostname.endsWith('.vercel.app')) {
    return null
  }

  const parts = hostname.split('.')

  // For *.crm.viox.ai pattern (4+ parts: sub.crm.viox.ai)
  if (parts.length >= 4 && parts.slice(-3).join('.') === 'crm.viox.ai') {
    return parts[0]
  }

  return null
}

/**
 * Resolve the effective org slug from the request, considering:
 * 1. Subdomain (production)
 * 2. ?org= query param (local dev)
 * 3. DEV_ORG_SLUG env var (local dev fallback)
 */
export function resolveOrgSlug(host: string, searchParams?: URLSearchParams): string | null {
  // First try subdomain
  const sub = getSubdomain(host)
  if (sub) return sub

  // Local dev: check query param
  if (searchParams?.has('org')) {
    return searchParams.get('org') || null
  }

  // Local dev: check env var
  if (process.env.DEV_ORG_SLUG) {
    return process.env.DEV_ORG_SLUG
  }

  return null
}

export function isAdminSubdomain(sub: string | null): boolean {
  return sub === 'admin'
}

export function isRootDomain(sub: string | null): boolean {
  return sub === null
}
