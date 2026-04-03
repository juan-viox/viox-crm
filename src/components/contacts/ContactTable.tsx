'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Search, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import Avatar from '@/components/shared/Avatar'
import type { Contact } from '@/types'

type SortField = 'first_name' | 'last_name' | 'email' | 'company' | 'created_at'
type SortDir = 'asc' | 'desc'

const PAGE_SIZE = 20

export default function ContactTable({ contacts }: { contacts: Contact[] }) {
  const [search, setSearch] = useState('')
  const [sortField, setSortField] = useState<SortField>('created_at')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [page, setPage] = useState(0)

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return contacts.filter(c =>
      `${c.first_name} ${c.last_name} ${c.email ?? ''} ${c.company?.name ?? ''}`.toLowerCase().includes(q)
    )
  }, [contacts, search])

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let aVal: string, bVal: string
      switch (sortField) {
        case 'company':
          aVal = a.company?.name ?? ''
          bVal = b.company?.name ?? ''
          break
        default:
          aVal = String((a as unknown as Record<string, unknown>)[sortField] ?? '')
          bVal = String((b as unknown as Record<string, unknown>)[sortField] ?? '')
      }
      const cmp = aVal.localeCompare(bVal)
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [filtered, sortField, sortDir])

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE)
  const paginated = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDir('asc')
    }
    setPage(0)
  }

  function SortIcon({ field }: { field: SortField }) {
    if (sortField !== field) return null
    return sortDir === 'asc'
      ? <ChevronUp className="w-3 h-3 inline ml-1" />
      : <ChevronDown className="w-3 h-3 inline ml-1" />
  }

  return (
    <div className="card p-0">
      {/* Search */}
      <div className="p-4 border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--muted)' }} />
          <input
            type="text"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0) }}
            placeholder="Search contacts..."
            className="w-full pl-10"
          />
        </div>
      </div>

      {/* Table */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th className="cursor-pointer select-none" onClick={() => toggleSort('first_name')}>
                Name <SortIcon field="first_name" />
              </th>
              <th className="cursor-pointer select-none" onClick={() => toggleSort('email')}>
                Email <SortIcon field="email" />
              </th>
              <th className="cursor-pointer select-none" onClick={() => toggleSort('company')}>
                Company <SortIcon field="company" />
              </th>
              <th>Phone</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map(c => (
              <tr key={c.id}>
                <td>
                  <Link href={`/contacts/${c.id}`} className="flex items-center gap-3 hover:underline">
                    <Avatar name={`${c.first_name} ${c.last_name}`} size="sm" />
                    <span className="font-medium">{c.first_name} {c.last_name}</span>
                  </Link>
                </td>
                <td style={{ color: 'var(--muted)' }}>{c.email ?? '-'}</td>
                <td style={{ color: 'var(--muted)' }}>{c.company?.name ?? '-'}</td>
                <td style={{ color: 'var(--muted)' }}>{c.phone ?? '-'}</td>
                <td>
                  <span
                    className="badge"
                    style={{
                      background: c.status === 'active' ? 'rgba(0,184,148,0.15)' : c.status === 'lead' ? 'rgba(108,92,231,0.15)' : 'rgba(136,136,160,0.15)',
                      color: c.status === 'active' ? 'var(--success)' : c.status === 'lead' ? 'var(--accent-light)' : 'var(--muted)',
                    }}
                  >
                    {c.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between p-4 border-t" style={{ borderColor: 'var(--border)' }}>
          <span className="text-sm" style={{ color: 'var(--muted)' }}>
            {sorted.length} contacts
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="btn btn-secondary py-1.5 px-2"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm" style={{ color: 'var(--muted)' }}>
              {page + 1} / {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="btn btn-secondary py-1.5 px-2"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
