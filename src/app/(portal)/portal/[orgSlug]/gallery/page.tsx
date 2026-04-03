'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import PortalNavBranded from '@/components/portal/PortalNavBranded'
import { Image as ImageIcon, Loader2 } from 'lucide-react'

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

export default function BrandedGalleryPage() {
  const { orgSlug } = useParams<{ orgSlug: string }>()
  const [branding, setBranding] = useState<OrgBranding | null>(null)
  const [userName, setUserName] = useState('')
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: org } = await supabase
        .from('organizations')
        .select('id, name, slug, primary_color, secondary_color, accent_color, display_font, body_font, logo_url, tagline')
        .eq('slug', orgSlug)
        .single()

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
        .select('first_name, last_name')
        .eq('email', user.email)
        .eq('organization_id', org.id)
        .limit(1)

      if (contacts && contacts.length > 0) {
        setUserName(`${contacts[0].first_name} ${contacts[0].last_name}`)
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
            <ImageIcon size={20} />
          </div>
          <h1
            style={{
              fontFamily: `'${branding.display_font}', Georgia, serif`,
              fontSize: '2rem', fontWeight: 600, color: branding.primary_color,
            }}
          >
            Gallery
          </h1>
        </div>

        <div
          className="rounded-xl p-12 text-center"
          style={{ background: '#FFFFFF', border: `1px solid ${branding.accent_color}20` }}
        >
          <ImageIcon size={48} style={{ color: branding.accent_color, margin: '0 auto 1rem' }} />
          <p style={{ fontFamily: `'${branding.body_font}', system-ui, sans-serif`, color: branding.accent_color, marginBottom: '0.5rem' }}>
            Your event photos will appear here.
          </p>
          <p style={{ fontFamily: `'${branding.body_font}', system-ui, sans-serif`, fontSize: '0.875rem', color: `${branding.accent_color}80` }}>
            Photos are shared after events are completed.
          </p>
        </div>
      </main>
    </div>
  )
}
