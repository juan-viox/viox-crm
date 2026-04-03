'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2, Mail, Lock, ArrowRight } from 'lucide-react'

interface OrgBranding {
  name: string
  primary_color: string
  secondary_color: string
  accent_color: string
  display_font: string
  body_font: string
  logo_url: string | null
  tagline: string | null
}

export default function BrandedPortalLogin() {
  const { orgSlug } = useParams<{ orgSlug: string }>()
  const [branding, setBranding] = useState<OrgBranding | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/v1/branding/${orgSlug}`)
      const org = res.ok ? await res.json() : null

      if (org) {
        setBranding({
          name: org.name,
          primary_color: org.primary_color ?? '#334155',
          secondary_color: org.secondary_color ?? '#F5F0EB',
          accent_color: org.accent_color ?? '#8B7355',
          display_font: org.display_font ?? 'Cormorant Garamond',
          body_font: org.body_font ?? 'Jost',
          logo_url: org.logo_url,
          tagline: org.tagline,
        })
      }
      setPageLoading(false)
    }
    load()
  }, [orgSlug])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    router.push(`/portal/${orgSlug}`)
    router.refresh()
  }

  if (pageLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin" size={32} style={{ color: '#8B7355' }} />
      </div>
    )
  }

  if (!branding) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Organization not found.</p>
      </div>
    )
  }

  return (
    <>
      <link
        href={`https://fonts.googleapis.com/css2?family=${branding.display_font.replace(/ /g, '+')}:ital,wght@0,400;0,500;0,600;0,700;1,400&family=${branding.body_font.replace(/ /g, '+')}:wght@300;400;500;600&display=swap`}
        rel="stylesheet"
      />
      <div
        className="min-h-screen flex items-center justify-center px-4"
        style={{ background: branding.secondary_color }}
      >
        <div
          className="w-full max-w-md rounded-2xl p-8"
          style={{ background: '#FFFFFF', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}
        >
          {/* Logo / Name */}
          <div className="text-center mb-8">
            {branding.logo_url ? (
              <img
                src={branding.logo_url}
                alt={branding.name}
                className="mx-auto mb-4"
                style={{ height: 56, objectFit: 'contain' }}
              />
            ) : (
              <div
                className="mx-auto mb-4 flex items-center justify-center rounded-full text-white text-2xl font-bold"
                style={{
                  width: 56,
                  height: 56,
                  background: branding.primary_color,
                  fontFamily: `'${branding.display_font}', Georgia, serif`,
                }}
              >
                {branding.name.charAt(0)}
              </div>
            )}
            <h1
              style={{
                fontFamily: `'${branding.display_font}', Georgia, serif`,
                fontSize: '1.75rem',
                fontWeight: 600,
                color: branding.primary_color,
                marginBottom: '0.5rem',
              }}
            >
              {branding.name}
            </h1>
            <p
              style={{
                fontFamily: `'${branding.body_font}', system-ui, sans-serif`,
                fontSize: '0.925rem',
                color: branding.accent_color,
              }}
            >
              {branding.tagline || 'Sign in to your client portal'}
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label
                style={{
                  fontFamily: `'${branding.body_font}', system-ui, sans-serif`,
                  fontSize: '0.875rem',
                  color: branding.accent_color,
                }}
              >
                Email
              </label>
              <div className="relative mt-1">
                <Mail
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2"
                  style={{ color: branding.accent_color }}
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-9"
                  placeholder="you@example.com"
                  style={{
                    background: '#FFFFFF',
                    border: `1px solid ${branding.accent_color}30`,
                    color: branding.primary_color,
                    fontFamily: `'${branding.body_font}', system-ui, sans-serif`,
                  }}
                />
              </div>
            </div>

            <div>
              <label
                style={{
                  fontFamily: `'${branding.body_font}', system-ui, sans-serif`,
                  fontSize: '0.875rem',
                  color: branding.accent_color,
                }}
              >
                Password
              </label>
              <div className="relative mt-1">
                <Lock
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2"
                  style={{ color: branding.accent_color }}
                />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-9"
                  placeholder="Your password"
                  style={{
                    background: '#FFFFFF',
                    border: `1px solid ${branding.accent_color}30`,
                    color: branding.primary_color,
                    fontFamily: `'${branding.body_font}', system-ui, sans-serif`,
                  }}
                />
              </div>
            </div>

            {error && (
              <p className="text-sm" style={{ color: '#C45B4B' }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium transition-opacity"
              style={{
                background: branding.primary_color,
                color: branding.secondary_color,
                fontFamily: `'${branding.body_font}', system-ui, sans-serif`,
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1,
              }}
            >
              {loading ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <>
                  Sign In <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </>
  )
}
