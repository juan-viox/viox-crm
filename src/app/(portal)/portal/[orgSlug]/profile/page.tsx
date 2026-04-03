'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import PortalNavBranded from '@/components/portal/PortalNavBranded'
import { UserCircle, Loader2, Save } from 'lucide-react'

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

interface ContactProfile {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string | null
}

export default function BrandedProfilePage() {
  const { orgSlug } = useParams<{ orgSlug: string }>()
  const [branding, setBranding] = useState<OrgBranding | null>(null)
  const [contact, setContact] = useState<ContactProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const res = await fetch(\`/api/v1/branding/\${orgSlug}\`)
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
        .select('id, first_name, last_name, email, phone')
        .eq('email', user.email)
        .eq('organization_id', org.id)
        .limit(1)

      if (contacts && contacts.length > 0) {
        setContact(contacts[0])
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
  const userName = contact ? `${contact.first_name} ${contact.last_name}` : ''

  return (
    <div style={{ background: branding.secondary_color, minHeight: '100vh' }}>
      <link
        href={`https://fonts.googleapis.com/css2?family=${branding.display_font.replace(/ /g, '+')}:ital,wght@0,400;0,500;0,600;0,700;1,400&family=${branding.body_font.replace(/ /g, '+')}:wght@300;400;500;600&display=swap`}
        rel="stylesheet"
      />
      <PortalNavBranded branding={branding} userName={userName} basePath={basePath} />

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex items-center gap-3 mb-8">
          <div
            className="flex items-center justify-center rounded-lg"
            style={{ width: 40, height: 40, background: `${branding.accent_color}15`, color: branding.accent_color }}
          >
            <UserCircle size={20} />
          </div>
          <h1
            style={{
              fontFamily: `'${branding.display_font}', Georgia, serif`,
              fontSize: '2rem', fontWeight: 600, color: branding.primary_color,
            }}
          >
            Profile
          </h1>
        </div>

        <div
          className="rounded-xl p-6 space-y-5"
          style={{ background: '#FFFFFF', border: `1px solid ${branding.accent_color}20` }}
        >
          {contact ? (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label style={{ fontFamily: `'${branding.body_font}', system-ui, sans-serif`, fontSize: '0.875rem', color: branding.accent_color }}>
                    First Name
                  </label>
                  <input
                    type="text"
                    value={contact.first_name}
                    readOnly
                    className="w-full mt-1"
                    style={{ background: branding.secondary_color, border: `1px solid ${branding.accent_color}20`, color: branding.primary_color }}
                  />
                </div>
                <div>
                  <label style={{ fontFamily: `'${branding.body_font}', system-ui, sans-serif`, fontSize: '0.875rem', color: branding.accent_color }}>
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={contact.last_name}
                    readOnly
                    className="w-full mt-1"
                    style={{ background: branding.secondary_color, border: `1px solid ${branding.accent_color}20`, color: branding.primary_color }}
                  />
                </div>
              </div>
              <div>
                <label style={{ fontFamily: `'${branding.body_font}', system-ui, sans-serif`, fontSize: '0.875rem', color: branding.accent_color }}>
                  Email
                </label>
                <input
                  type="email"
                  value={contact.email}
                  readOnly
                  className="w-full mt-1"
                  style={{ background: branding.secondary_color, border: `1px solid ${branding.accent_color}20`, color: branding.primary_color }}
                />
              </div>
              <div>
                <label style={{ fontFamily: `'${branding.body_font}', system-ui, sans-serif`, fontSize: '0.875rem', color: branding.accent_color }}>
                  Phone
                </label>
                <input
                  type="tel"
                  value={contact.phone ?? ''}
                  readOnly
                  className="w-full mt-1"
                  style={{ background: branding.secondary_color, border: `1px solid ${branding.accent_color}20`, color: branding.primary_color }}
                />
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <UserCircle size={48} style={{ color: branding.accent_color, margin: '0 auto 1rem' }} />
              <p style={{ fontFamily: `'${branding.body_font}', system-ui, sans-serif`, color: branding.accent_color }}>
                Profile information unavailable.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
