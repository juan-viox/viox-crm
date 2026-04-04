'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { UserPlus, Mail, Lock, Building2, Loader2 } from 'lucide-react'

interface OrgBranding {
  name: string
  slug: string
  primary_color: string
  accent_color: string
  logo_url: string | null
  tagline: string | null
}

function getClientOrgSlug(): string | null {
  if (typeof window === 'undefined') return null
  const hostname = window.location.hostname
  const params = new URLSearchParams(window.location.search)
  if (params.has('org')) return params.get('org')
  if (hostname === 'localhost' || hostname === '127.0.0.1') return null
  if (hostname.endsWith('.vercel.app')) return null
  const parts = hostname.split('.')
  if (parts.length >= 4 && parts.slice(-3).join('.') === 'crm.viox.ai') {
    return parts[0]
  }
  return null
}

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [orgName, setOrgName] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [orgBranding, setOrgBranding] = useState<OrgBranding | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const orgSlug = typeof window !== 'undefined' ? getClientOrgSlug() : null
  // On an org subdomain, the user is joining an existing org (not creating a new one)
  const isOrgSignup = !!orgBranding

  // Fetch org branding from subdomain
  useEffect(() => {
    const slug = getClientOrgSlug()
    if (!slug || slug === 'admin') return

    fetch(`/api/v1/branding/${slug}`)
      .then(res => res.ok ? res.json() : null)
      .then(data => { if (data) setOrgBranding(data) })
      .catch(() => {})
  }, [])

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Sign up the user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: {
          full_name: fullName,
          // If on org subdomain, pass the slug so the setup API adds to that org
          ...(isOrgSignup
            ? { org_slug: orgBranding!.slug }
            : { org_name: orgName }),
        },
      },
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    if (!authData.user) {
      setError('Signup failed. Please try again.')
      setLoading(false)
      return
    }

    // Create organization + profile via admin API (bypasses RLS)
    const setupRes = await fetch('/api/auth/setup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: authData.user.id,
        email,
        fullName,
        // If on org subdomain, join existing org instead of creating a new one
        ...(isOrgSignup
          ? { orgSlug: orgBranding!.slug }
          : { orgName }),
      }),
    })

    const setupData = await setupRes.json()
    if (!setupRes.ok) {
      setError(setupData.error || 'Failed to create account')
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)

    // If email confirmation is not required, redirect
    if (authData.session) {
      router.push('/dashboard')
      router.refresh()
    }
  }

  const accentColor = orgBranding?.primary_color || 'var(--accent)'

  if (success) {
    return (
      <div className="card text-center animate-fade-in">
        <Mail className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--success)' }} />
        <h2 className="text-xl font-bold mb-2">Check your email</h2>
        <p style={{ color: 'var(--muted)' }}>
          We sent a confirmation link to <strong>{email}</strong>. Click it to activate your account.
        </p>
        <Link href="/login" className="btn btn-primary mt-6 mx-auto">
          Back to login
        </Link>
      </div>
    )
  }

  const title = isOrgSignup ? orgBranding!.name : 'VioX CRM'
  const subtitle = isOrgSignup
    ? `Join ${orgBranding!.name}`
    : 'Create your organization'

  return (
    <div className="animate-fade-in">
      <div className="text-center mb-8">
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
            <span style={{ color: accentColor }}>{isOrgSignup ? title : 'VioX'}</span>
            {!isOrgSignup && ' CRM'}
          </h1>
        )}
        <p style={{ color: 'var(--muted)' }}>{subtitle}</p>
      </div>

      <div className="card">
        <form onSubmit={handleSignup} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg text-sm" style={{ background: 'rgba(225, 112, 85, 0.1)', color: 'var(--danger)' }}>
              {error}
            </div>
          )}

          {/* Only show org name field when NOT on an org subdomain */}
          {!isOrgSignup && (
            <div>
              <label htmlFor="orgName">Organization Name</label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--muted)' }} />
                <input
                  id="orgName"
                  type="text"
                  value={orgName}
                  onChange={e => setOrgName(e.target.value)}
                  placeholder="Your company name"
                  required
                  className="w-full pl-10"
                />
              </div>
            </div>
          )}

          <div>
            <label htmlFor="fullName">Full Name</label>
            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              placeholder="John Doe"
              required
              className="w-full"
            />
          </div>

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
                placeholder="Min 6 characters"
                required
                minLength={6}
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
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
            {isOrgSignup ? 'Join Organization' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-sm mt-6" style={{ color: 'var(--muted)' }}>
          Already have an account?{' '}
          <Link href="/login" style={{ color: orgBranding?.primary_color || 'var(--accent-light)' }} className="hover:underline">
            Sign in
          </Link>
        </p>

        {orgBranding && (
          <p className="text-center text-[10px] mt-4" style={{ color: 'var(--muted)', opacity: 0.5 }}>
            Powered by VioX AI
          </p>
        )}
      </div>
    </div>
  )
}
