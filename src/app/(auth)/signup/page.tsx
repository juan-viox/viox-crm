'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { UserPlus, Mail, Lock, Building2, Loader2 } from 'lucide-react'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [orgName, setOrgName] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const supabase = createClient()

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
        data: { full_name: fullName, org_name: orgName },
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
        orgName,
      }),
    })

    const setupData = await setupRes.json()
    if (!setupRes.ok) {
      setError(setupData.error || 'Failed to create organization')
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

  return (
    <div className="animate-fade-in">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">
          <span style={{ color: 'var(--accent)' }}>VioX</span> CRM
        </h1>
        <p style={{ color: 'var(--muted)' }}>Create your organization</p>
      </div>

      <div className="card">
        <form onSubmit={handleSignup} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg text-sm" style={{ background: 'rgba(225, 112, 85, 0.1)', color: 'var(--danger)' }}>
              {error}
            </div>
          )}

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

          <button type="submit" disabled={loading} className="btn btn-primary w-full justify-center">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
            Create Account
          </button>
        </form>

        <p className="text-center text-sm mt-6" style={{ color: 'var(--muted)' }}>
          Already have an account?{' '}
          <Link href="/login" style={{ color: 'var(--accent-light)' }} className="hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
