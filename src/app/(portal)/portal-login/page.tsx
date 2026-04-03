'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Mail, Lock, Loader2 } from 'lucide-react'

export default function PortalLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

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
    router.push('/portal')
    router.refresh()
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: '#F5F0EB' }}
    >
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-10">
          <div
            className="inline-flex items-center justify-center rounded-full mx-auto mb-5"
            style={{
              width: 64,
              height: 64,
              background: '#334155',
              color: '#FAFAF8',
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: '1.75rem',
              fontWeight: 600,
            }}
          >
            D
          </div>
          <h1
            className="portal-heading"
            style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: '2.25rem',
              fontWeight: 600,
              color: '#334155',
              letterSpacing: '-0.02em',
              marginBottom: '0.5rem',
            }}
          >
            Welcome Back
          </h1>
          <p
            style={{
              fontFamily: "'Jost', system-ui, sans-serif",
              fontSize: '1rem',
              color: '#8B7355',
              fontWeight: 400,
            }}
          >
            Access your workshop bookings and gallery
          </p>
        </div>

        {/* Login card */}
        <div
          className="portal-card"
          style={{
            background: '#FFFFFF',
            border: '1px solid #E8E0D8',
            borderRadius: '0.75rem',
            padding: '2rem',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.05)',
          }}
        >
          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <div
                className="p-3 rounded-lg text-sm"
                style={{
                  background: 'rgba(196, 91, 75, 0.08)',
                  color: '#C45B4B',
                  fontFamily: "'Jost', system-ui, sans-serif",
                }}
              >
                {error}
              </div>
            )}

            <div>
              <label
                htmlFor="portal-email"
                style={{
                  fontFamily: "'Jost', system-ui, sans-serif",
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: '#334155',
                  marginBottom: '0.375rem',
                  display: 'block',
                }}
              >
                Email
              </label>
              <div className="relative">
                <Mail
                  className="absolute left-3 top-1/2 -translate-y-1/2"
                  size={16}
                  style={{ color: '#C9B8A8' }}
                />
                <input
                  id="portal-email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className="w-full pl-10"
                  style={{
                    fontFamily: "'Jost', system-ui, sans-serif",
                    height: '2.75rem',
                  }}
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="portal-password"
                style={{
                  fontFamily: "'Jost', system-ui, sans-serif",
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: '#334155',
                  marginBottom: '0.375rem',
                  display: 'block',
                }}
              >
                Password
              </label>
              <div className="relative">
                <Lock
                  className="absolute left-3 top-1/2 -translate-y-1/2"
                  size={16}
                  style={{ color: '#C9B8A8' }}
                />
                <input
                  id="portal-password"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Your password"
                  required
                  className="w-full pl-10"
                  style={{
                    fontFamily: "'Jost', system-ui, sans-serif",
                    height: '2.75rem',
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="portal-btn portal-btn-primary w-full justify-center"
              style={{
                height: '2.75rem',
                fontSize: '0.9375rem',
                borderRadius: '0.5rem',
              }}
            >
              {loading ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <p
            className="text-center mt-6"
            style={{
              fontFamily: "'Jost', system-ui, sans-serif",
              fontSize: '0.875rem',
              color: '#8B7355',
            }}
          >
            Don&apos;t have an account?{' '}
            <a
              href="mailto:hello@dreamersjoy.com"
              style={{ color: '#8B7355', fontWeight: 500, textDecoration: 'underline' }}
            >
              Contact us
            </a>
          </p>
        </div>

        {/* Branding footer */}
        <p
          className="text-center mt-8"
          style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontSize: '0.875rem',
            color: '#C9B8A8',
            fontStyle: 'italic',
          }}
        >
          DreamersJoy Floral Studio
        </p>
      </div>
    </div>
  )
}
