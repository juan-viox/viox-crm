'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import PortalNavBranded from '@/components/portal/PortalNavBranded'
import { CalendarDays, Loader2 } from 'lucide-react'

interface OrgBranding {
  id: string
  name: string
  slug: string
  primary_color: string
  secondary_color: string
  accent_color: string
  display_font: string
  body_font: string
  logo_url: string | null
  tagline: string | null
}

interface Deal {
  id: string
  title: string
  value: number
  stage: string
  created_at: string
}

export default function BrandedBookingsPage() {
  const { orgSlug } = useParams<{ orgSlug: string }>()
  const [branding, setBranding] = useState<OrgBranding | null>(null)
  const [deals, setDeals] = useState<Deal[]>([])
  const [userName, setUserName] = useState('')
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/v1/branding/${orgSlug}`)
      const org = res.ok ? await res.json() : null

      if (!org) { setLoading(false); return }

      setBranding({
        id: org.id, name: org.name, slug: org.slug,
        primary_color: org.primary_color ?? '#334155',
        secondary_color: org.secondary_color ?? '#F5F0EB',
        accent_color: org.accent_color ?? '#8B7355',
        display_font: org.display_font ?? 'Cormorant Garamond',
        body_font: org.body_font ?? 'Jost',
        logo_url: org.logo_url, tagline: org.tagline,
      })

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push(`/portal/${orgSlug}/login`); return }

      const { data: contacts } = await supabase
        .from('contacts')
        .select('id, first_name, last_name')
        .eq('email', user.email)
        .eq('organization_id', org.id)
        .limit(1)

      if (contacts && contacts.length > 0) {
        setUserName(`${contacts[0].first_name} ${contacts[0].last_name}`)
        const { data: dealData } = await supabase
          .from('deals')
          .select('*')
          .eq('contact_id', contacts[0].id)
          .order('created_at', { ascending: false })
        if (dealData) setDeals(dealData)
      }

      setLoading(false)
    }
    load()
  }, [orgSlug])

  if (loading || !branding) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="animate-spin" size={32} style={{ color: '#8B7355' }} />
      </div>
    )
  }

  const basePath = `/portal/${orgSlug}`

  return (
    <div style={{ background: branding.secondary_color, minHeight: '100vh' }}>
      <link
        href={`https://fonts.googleapis.com/css2?family=${branding.display_font.replace(/ /g, '+')}:ital,wght@0,400;0,500;0,600;0,700;1,400&family=${branding.body_font.replace(/ /g, '+')}:wght@300;400;500;600&display=swap`}
        rel="stylesheet"
      />
      <PortalNavBranded branding={branding} userName={userName} basePath={basePath} />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex items-center gap-3 mb-8">
          <div
            className="flex items-center justify-center rounded-lg"
            style={{ width: 40, height: 40, background: `${branding.accent_color}15`, color: branding.accent_color }}
          >
            <CalendarDays size={20} />
          </div>
          <h1
            style={{
              fontFamily: `'${branding.display_font}', Georgia, serif`,
              fontSize: '2rem', fontWeight: 600, color: branding.primary_color,
            }}
          >
            Your Bookings
          </h1>
        </div>

        {deals.length === 0 ? (
          <div
            className="rounded-xl p-12 text-center"
            style={{ background: '#FFFFFF', border: `1px solid ${branding.accent_color}20` }}
          >
            <CalendarDays size={48} style={{ color: branding.accent_color, margin: '0 auto 1rem' }} />
            <p style={{ fontFamily: `'${branding.body_font}', system-ui, sans-serif`, color: branding.accent_color }}>
              No bookings yet.
            </p>
          </div>
        ) : (
          <div
            className="rounded-xl overflow-hidden"
            style={{ background: '#FFFFFF', border: `1px solid ${branding.accent_color}20` }}
          >
            <table className="w-full">
              <thead>
                <tr style={{ background: branding.secondary_color }}>
                  {['Item', 'Status', 'Date', 'Amount'].map((h, i) => (
                    <th key={h} style={{
                      fontFamily: `'${branding.body_font}', system-ui, sans-serif`,
                      fontSize: '0.75rem', fontWeight: 600, color: branding.accent_color,
                      textTransform: 'uppercase', letterSpacing: '0.05em',
                      padding: '0.75rem 1rem',
                      textAlign: i === 3 ? 'right' : 'left',
                      borderBottom: `1px solid ${branding.accent_color}20`,
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {deals.map((deal) => (
                  <tr key={deal.id}>
                    <td style={{ fontFamily: `'${branding.body_font}', system-ui, sans-serif`, fontSize: '0.875rem', color: branding.primary_color, padding: '0.75rem 1rem', borderBottom: `1px solid ${branding.accent_color}20` }}>
                      {deal.title}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', borderBottom: `1px solid ${branding.accent_color}20` }}>
                      <span
                        className="inline-flex items-center px-3 py-0.5 rounded-full text-xs font-medium"
                        style={{
                          background: `${branding.accent_color}20`,
                          color: branding.accent_color,
                        }}
                      >
                        {deal.stage === 'closed_won' ? 'Completed' : deal.stage === 'closed_lost' ? 'Cancelled' : 'Pending'}
                      </span>
                    </td>
                    <td style={{ fontFamily: `'${branding.body_font}', system-ui, sans-serif`, fontSize: '0.875rem', color: branding.accent_color, padding: '0.75rem 1rem', borderBottom: `1px solid ${branding.accent_color}20` }}>
                      {new Date(deal.created_at).toLocaleDateString()}
                    </td>
                    <td style={{ fontFamily: `'${branding.body_font}', system-ui, sans-serif`, fontSize: '0.875rem', color: branding.primary_color, padding: '0.75rem 1rem', textAlign: 'right', borderBottom: `1px solid ${branding.accent_color}20` }}>
                      ${deal.value?.toLocaleString() ?? '0'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  )
}
