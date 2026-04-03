import { createServerSupabaseClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Building2, Mail, Phone, Tag } from 'lucide-react'
import Avatar from '@/components/shared/Avatar'
import ContactTimeline from '@/components/contacts/ContactTimeline'
import { formatDate } from '@/lib/utils'

export default async function ContactDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()

  const { data: contact } = await supabase
    .from('contacts')
    .select('*, company:companies(name)')
    .eq('id', id)
    .single()

  if (!contact) notFound()

  const { data: activities } = await supabase
    .from('activities')
    .select('*')
    .eq('contact_id', id)
    .order('created_at', { ascending: false })

  const { data: deals } = await supabase
    .from('deals')
    .select('*, stage:deal_stages(name, color)')
    .eq('contact_id', id)
    .order('created_at', { ascending: false })

  return (
    <div>
      <Link href="/contacts" className="inline-flex items-center gap-1 text-sm mb-6 hover:underline" style={{ color: 'var(--muted)' }}>
        <ArrowLeft className="w-4 h-4" /> Back to contacts
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Info */}
        <div className="space-y-4">
          <div className="card">
            <div className="flex items-center gap-4 mb-4">
              <Avatar name={`${contact.first_name} ${contact.last_name}`} size="lg" />
              <div>
                <h1 className="text-xl font-bold">{contact.first_name} {contact.last_name}</h1>
                {contact.title && <p className="text-sm" style={{ color: 'var(--muted)' }}>{contact.title}</p>}
              </div>
            </div>

            <div className="space-y-3">
              {contact.email && (
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="w-4 h-4" style={{ color: 'var(--muted)' }} />
                  <span>{contact.email}</span>
                </div>
              )}
              {contact.phone && (
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="w-4 h-4" style={{ color: 'var(--muted)' }} />
                  <span>{contact.phone}</span>
                </div>
              )}
              {contact.company?.name && (
                <div className="flex items-center gap-3 text-sm">
                  <Building2 className="w-4 h-4" style={{ color: 'var(--muted)' }} />
                  <span>{contact.company.name}</span>
                </div>
              )}
              {contact.source && (
                <div className="flex items-center gap-3 text-sm">
                  <Tag className="w-4 h-4" style={{ color: 'var(--muted)' }} />
                  <span className="badge" style={{ background: 'rgba(108,92,231,0.15)', color: 'var(--accent-light)' }}>
                    {contact.source}
                  </span>
                </div>
              )}
            </div>

            {contact.notes && (
              <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
                <p className="text-sm" style={{ color: 'var(--muted)' }}>{contact.notes}</p>
              </div>
            )}

            <p className="text-xs mt-4" style={{ color: 'var(--muted)' }}>
              Created {formatDate(contact.created_at)}
            </p>
          </div>

          {/* Deals */}
          {deals && deals.length > 0 && (
            <div className="card">
              <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--muted)' }}>Deals</h3>
              <div className="space-y-2">
                {deals.map((deal: any) => (
                  <Link
                    key={deal.id}
                    href={`/deals/${deal.id}`}
                    className="block p-3 rounded-lg hover:bg-[var(--surface-2)] transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{deal.title}</span>
                      <span
                        className="badge text-xs"
                        style={{
                          background: `${deal.stage?.color ?? 'var(--muted)'}20`,
                          color: deal.stage?.color ?? 'var(--muted)',
                        }}
                      >
                        {deal.stage?.name}
                      </span>
                    </div>
                    <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
                      ${(deal.amount ?? 0).toLocaleString()}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Timeline */}
        <div className="lg:col-span-2">
          <div className="card">
            <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--muted)' }}>Activity Timeline</h3>
            <ContactTimeline activities={activities ?? []} />
          </div>
        </div>
      </div>
    </div>
  )
}
