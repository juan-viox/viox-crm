'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import PortalNavBranded from '@/components/portal/PortalNavBranded'
import { CalendarDays, Image, UserCircle, ArrowRight, Loader2 } from 'lucide-react'

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

interface Contact {
  id: string
  first_name: string
  last_name: string
  email: string
}

interface Deal {
  id: string
  title: string
  value: number
  stage: string
  created_at: string
}

export default function BrandedPortalDashboard() {
  const { orgSlug } = useParams<{ orgSlug: string }>()
  const [branding, setBranding] = useState<OrgBranding | null>(null)
  const [contact, setContact] = useState<Contact | null>(null)
  const [deals, setDeals] = useState<Deal[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      // Fetch org branding
      const res = await fetch(`/api/v1/branding/${orgSlug}`)
      const org = res.ok ? await res.json() : null

      if (!org) {
        setLoading(false)
        return
      }

      setBranding({
        id: org.id,
        name: org.name,
        slug: org.slug,
        primary_color: org.primary_color ?? '#334155',
        secondary_color: org.secondary_color ?? '#F5F0EB',
        accent_color: org.accent_color ?? '#8B7355',
        display_font: org.display_font ?? 'Cormorant Garamond',
        body_font: org.body_font ?? 'Jost',
        logo_url: org.logo_url,
        tagline: org.tagline,
      })

      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push(`/portal/${orgSlug}/login`)
        return
      }

      // Find contact
      const { data: contacts } = await supabase
        .from('contacts')
        .select('*')
        .eq('email', user.email)
        .eq('organization_id', org.id)
        .limit(1)

      if (contacts && contacts.length > 0) {
        setContact(contacts[0])
        const { data: dealData } = await supabase
          .from('deals')
          .select('*')
          .eq('contact_id', contacts[0].id)
          .order('created_at', { ascending: false })
          .limit(5)

        if (dealData) setDeals(dealData)
      }

      setLoading(false)
    }
    load()
  }, [orgSlug])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="animate-spin" size={32} style={{ color: branding?.accent_color ?? '#8B7355' }} />
      </div>
    )
  }

  if (!branding) {
    return (
      <div className="flex items-center justify-center py-32 text-center">
        <p>Organization not found.</p>
      </div>
    )
  }

  const cssVars = {
    '--portal-primary': branding.primary_color,
    '--portal-secondary': branding.secondary_color,
    '--portal-accent': branding.accent_color,
  } as React.CSSProperties

  const firstName = contact?.first_name || 'there'
  const basePath = `/portal/${orgSlug}`

  return (
    <div style={cssVars}>
      <link
        href={`https://fonts.googleapis.com/css2?family=${branding.display_font.replace(/ /g, '+')}:ital,wght@0,400;0,500;0,600;0,700;1,400&family=${branding.body_font.replace(/ /g, '+')}:wght@300;400;500;600&display=swap`}
        rel="stylesheet"
      />
      <PortalNavBranded
        branding={branding}
        userName={contact ? `${contact.first_name} ${contact.last_name}` : ''}
        basePath={basePath}
      />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        {/* Welcome */}
        <div className="mb-10">
          <h1
            style={{
              fontFamily: `'${branding.display_font}', Georgia, serif`,
              fontSize: '2rem',
              fontWeight: 600,
              color: branding.primary_color,
              marginBottom: '0.5rem',
            }}
          >
            Welcome back, {firstName}
          </h1>
          <p
            style={{
              fontFamily: `'${branding.body_font}', system-ui, sans-serif`,
              fontSize: '1rem',
              color: branding.accent_color,
            }}
          >
            {branding.tagline || `Here is an overview of your ${branding.name} experience.`}
          </p>
        </div>

        {/* Dashboard cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <PortalCard
            href={`${basePath}/bookings`}
            icon={<CalendarDays size={20} />}
            title="Upcoming Bookings"
            branding={branding}
          >
            <p
              style={{
                fontFamily: `'${branding.body_font}', system-ui, sans-serif`,
                fontSize: '2rem',
                fontWeight: 500,
                color: branding.primary_color,
                marginBottom: '0.25rem',
              }}
            >
              {deals.filter((d) => d.stage !== 'closed_won' && d.stage !== 'closed_lost').length}
            </p>
            <div className="flex items-center gap-1" style={{ color: branding.accent_color, fontSize: '0.875rem' }}>
              <span style={{ fontFamily: `'${branding.body_font}', system-ui, sans-serif` }}>View bookings</span>
              <ArrowRight size={14} />
            </div>
          </PortalCard>

          <PortalCard
            href={`${basePath}/gallery`}
            icon={<Image size={20} />}
            title="Recent Photos"
            branding={branding}
          >
            <p
              style={{
                fontFamily: `'${branding.body_font}', system-ui, sans-serif`,
                fontSize: '0.875rem',
                color: branding.accent_color,
                lineHeight: 1.6,
              }}
            >
              View photos from your recent events.
            </p>
            <div className="flex items-center gap-1 mt-3" style={{ color: branding.accent_color, fontSize: '0.875rem' }}>
              <span style={{ fontFamily: `'${branding.body_font}', system-ui, sans-serif` }}>View gallery</span>
              <ArrowRight size={14} />
            </div>
          </PortalCard>

          <PortalCard
            href={`${basePath}/profile`}
            icon={<UserCircle size={20} />}
            title="Account Info"
            branding={branding}
          >
            <p
              style={{
                fontFamily: `'${branding.body_font}', system-ui, sans-serif`,
                fontSize: '0.875rem',
                color: branding.accent_color,
                lineHeight: 1.6,
              }}
            >
              {contact?.email || 'Manage your profile and preferences.'}
            </p>
            <div className="flex items-center gap-1 mt-3" style={{ color: branding.accent_color, fontSize: '0.875rem' }}>
              <span style={{ fontFamily: `'${branding.body_font}', system-ui, sans-serif` }}>Edit profile</span>
              <ArrowRight size={14} />
            </div>
          </PortalCard>
        </div>

        {/* Recent activity */}
        {deals.length > 0 && (
          <div>
            <h2
              className="mb-4"
              style={{
                fontFamily: `'${branding.display_font}', Georgia, serif`,
                fontSize: '1.5rem',
                fontWeight: 600,
                color: branding.primary_color,
              }}
            >
              Recent Activity
            </h2>
            <div
              className="rounded-xl overflow-hidden"
              style={{ background: '#FFFFFF', border: `1px solid ${branding.accent_color}20`, padding: 0 }}
            >
              <table className="w-full">
                <thead>
                  <tr style={{ background: branding.secondary_color }}>
                    <th style={{ fontFamily: `'${branding.body_font}', system-ui, sans-serif`, fontSize: '0.75rem', fontWeight: 600, color: branding.accent_color, textTransform: 'uppercase', letterSpacing: '0.05em', padding: '0.75rem 1rem', textAlign: 'left', borderBottom: `1px solid ${branding.accent_color}20` }}>
                      Item
                    </th>
                    <th style={{ fontFamily: `'${branding.body_font}', system-ui, sans-serif`, fontSize: '0.75rem', fontWeight: 600, color: branding.accent_color, textTransform: 'uppercase', letterSpacing: '0.05em', padding: '0.75rem 1rem', textAlign: 'left', borderBottom: `1px solid ${branding.accent_color}20` }}>
                      Status
                    </th>
                    <th style={{ fontFamily: `'${branding.body_font}', system-ui, sans-serif`, fontSize: '0.75rem', fontWeight: 600, color: branding.accent_color, textTransform: 'uppercase', letterSpacing: '0.05em', padding: '0.75rem 1rem', textAlign: 'right', borderBottom: `1px solid ${branding.accent_color}20` }}>
                      Amount
                    </th>
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
                            background: deal.stage === 'closed_won'
                              ? `${branding.primary_color}12`
                              : `${branding.accent_color}20`,
                            color: deal.stage === 'closed_won'
                              ? branding.primary_color
                              : branding.accent_color,
                          }}
                        >
                          {deal.stage === 'closed_won' ? 'Completed' : deal.stage === 'closed_lost' ? 'Cancelled' : 'Pending'}
                        </span>
                      </td>
                      <td style={{ fontFamily: `'${branding.body_font}', system-ui, sans-serif`, fontSize: '0.875rem', color: branding.primary_color, padding: '0.75rem 1rem', textAlign: 'right', borderBottom: `1px solid ${branding.accent_color}20` }}>
                        ${deal.value?.toLocaleString() ?? '0'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

function PortalCard({
  href,
  icon,
  title,
  branding,
  children,
}: {
  href: string
  icon: React.ReactNode
  title: string
  branding: OrgBranding
  children: React.ReactNode
}) {
  return (
    <a
      href={href}
      className="no-underline block rounded-xl p-6 transition-shadow hover:shadow-md"
      style={{
        background: '#FFFFFF',
        border: `1px solid ${branding.accent_color}20`,
      }}
    >
      <div className="flex items-center gap-3 mb-4">
        <div
          className="flex items-center justify-center rounded-lg"
          style={{
            width: 40,
            height: 40,
            background: `${branding.accent_color}15`,
            color: branding.accent_color,
          }}
        >
          {icon}
        </div>
        <h2
          style={{
            fontFamily: `'${branding.display_font}', Georgia, serif`,
            fontSize: '1.25rem',
            fontWeight: 600,
            color: branding.primary_color,
          }}
        >
          {title}
        </h2>
      </div>
      {children}
    </a>
  )
}
