'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Loader2, Save, Settings, Kanban } from 'lucide-react'

export default function SettingsPage() {
  const [orgName, setOrgName] = useState('')
  const [orgId, setOrgId] = useState('')
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: profile } = await supabase
        .from('profiles').select('organization_id').eq('id', user.id).single()
      if (!profile) return
      setOrgId(profile.organization_id)
      const { data: org } = await supabase
        .from('organizations').select('name').eq('id', profile.organization_id).single()
      if (org) setOrgName(org.name)
    }
    load()
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSaved(false)

    const { error: updateError } = await supabase
      .from('organizations')
      .update({ name: orgName })
      .eq('id', orgId)

    if (updateError) { setError(updateError.message); setLoading(false); return }

    setSaved(true)
    setLoading(false)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      <form onSubmit={handleSave} className="card space-y-4 mb-6">
        <h2 className="font-semibold flex items-center gap-2">
          <Settings className="w-5 h-5" style={{ color: 'var(--accent)' }} />
          Organization
        </h2>

        {error && (
          <div className="p-3 rounded-lg text-sm" style={{ background: 'rgba(225,112,85,0.1)', color: 'var(--danger)' }}>{error}</div>
        )}
        {saved && (
          <div className="p-3 rounded-lg text-sm" style={{ background: 'rgba(0,184,148,0.1)', color: 'var(--success)' }}>Settings saved</div>
        )}

        <div>
          <label>Organization Name</label>
          <input value={orgName} onChange={e => setOrgName(e.target.value)} className="w-full" />
        </div>

        <div className="flex justify-end">
          <button type="submit" disabled={loading} className="btn btn-primary">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save
          </button>
        </div>
      </form>

      <Link href="/settings/pipeline" className="card flex items-center justify-between hover:border-[var(--accent)] transition-colors">
        <div className="flex items-center gap-3">
          <Kanban className="w-5 h-5" style={{ color: 'var(--accent)' }} />
          <div>
            <p className="font-semibold">Pipeline Stages</p>
            <p className="text-sm" style={{ color: 'var(--muted)' }}>Manage deal stages, colors, and order</p>
          </div>
        </div>
        <span style={{ color: 'var(--muted)' }}>&rarr;</span>
      </Link>
    </div>
  )
}
