'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { LogIn, Mail, Lock, Loader2 } from 'lucide-react'

interface OrgBranding {
  name: string
  slug: string
  primary_color: string
  accent_color: string
  logo_url: string | null
  tagline: string | null
}

/**
 * Extract org slug from the current hostname (client-side).
 * Returns null for root domain, localhost, or vercel URLs.
 */
function getClientOrgSlug(): string | null {
  if (typeof window === 'undefined') return null
  const hostname = window.location.hostname

  // Local dev: check URL search params
  const params = new URLSearchParams(window.location.search)
  if (params.has('org')) return params.get('org')

  // Localhost — no subdomain
  if (hostname === 'localhost' || hostname === '127.0.0.1') return null

  // Vercel default
  if (hostname.endsWith('.vercel.app')) return null

  const parts = hostname.split('.')
  if (parts.length >= 4 && parts.slice(-3).join('.') === 'crm.viox.ai') {
    return parts[0]
  }

  return null
}

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [magicLinkSent, setMagicLinkSent] = useState(false)
  const [error, setError] = useState('')
  const [orgBranding, setOrgBranding] = useState<OrgBranding | null>(null)
  const router = useRouter()
  const supabase = createClient()

  // Fetch org branding from subdomain
  useEffect(() => {
    const slug = getClientOrgSlug()
    if (!slug || slug === 'admin') return

    fetch(`/api/v1/branding/${slug}`)
      .then(res => res.ok ? res.json() : null)
      .then(data => { if (data) setOrgBranding(data) })
      .catch(() => {})
  }, [])

  const isAdmin = typeof window !== 'undefined' && getClientOrgSlug() === 'admin'

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }
    router.push('/dashboard')
    router.refresh()
  }

  async function handleMagicLink() {
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    })
    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }
    setMagicLinkSent(true)
    setLoading(false)
  }

  // Branding-aware accent color
  const accentColor = orgBranding?.primary_color || 'var(--accent)'

  if (magicLinkSent) {
    return (
      <div className="card text-center animate-fade-in">
        <Mail className="w-12 h-12 mx-auto mb-4" style={{ color: accentColor }} />
        <h2 className="text-xl font-bold mb-2">Check your email</h2>
        <p style={{ color: 'var(--muted)' }}>We sent a magic link to <strong>{email}</strong></p>
        <button onClick={() => setMagicLinkSent(false)} className="btn btn-secondary mt-6 mx-auto">
          Back to login
        </button>
      </div>
    )
  }

  // Determine title and subtitle based on context
  const title = orgBranding
    ? orgBranding.name
    : isAdmin
      ? 'VioX Admin'
      : 'VioX'
  const subtitle = orgBranding
    ? orgBranding.tagline || 'Sign in to your account'
    : isAdmin
      ? 'Super Admin Login'
      : 'Sign in to your account'

  return (
    <div className="animate-fade-in">
      <div className="text-center mb-8">
        {/* Org logo or default heading */}
        {orgBranding?.logo_url ? (
          <div className="flex flex-col items-center gap-3 mb-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={orgBranding.logo_url}
              alt={orgBranding.name}
              className="w-16 h-16 rounded-xl object-cover"
            />
            <h1 className="text-2xl font-bold">{title}</h1>
          </div>
        ) : (
          <h1 className="text-3xl font-bold mb-2">
            <span style={{ color: accentColor }}>{title}</span>
            {!orgBranding && !isAdmin && ' CRM'}
          </h1>
        )}
        <p style={{ color: 'var(--muted)' }}>{subtitle}</p>
      </div>

      <div className="card">
        <form onSubmit={handleLogin} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg text-sm" style={{ background: 'rgba(225, 112, 85, 0.1)', color: 'var(--danger)' }}>
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--muted)' }} />
              <input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
                className="w-full pl-10"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--muted)' }} />
              <input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Your password"
                required
                className="w-full pl-10"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary w-full justify-center"
            style={orgBranding ? { background: orgBranding.primary_color } : undefined}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
            Sign In
          </button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full" style={{ borderTop: '1px solid var(--border)' }} />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2" style={{ background: 'var(--surface)', color: 'var(--muted)' }}>or</span>
          </div>
        </div>

        <button
          onClick={handleMagicLink}
          disabled={loading || !email}
          className="btn btn-secondary w-full justify-center"
        >
          <Mail className="w-4 h-4" />
          Send Magic Link
        </button>

        <p className="text-center text-sm mt-6" style={{ color: 'var(--muted)' }}>
          Don&apos;t have an account?{' '}
          <Link href="/signup" style={{ color: orgBranding?.primary_color || 'var(--accent-light)' }} className="hover:underline">
            Sign up
          </Link>
        </p>

        {/* Powered by VioX AI — only on org subdomains */}
        {orgBranding && (
          <p className="text-center text-[10px] mt-4" style={{ color: 'var(--muted)', opacity: 0.5 }}>
            Powered by VioX AI
          </p>
        )}
      </div>
    </div>
  )
}
