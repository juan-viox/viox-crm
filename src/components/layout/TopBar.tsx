'use client'

import { useState } from 'react'
import { Search, Bell } from 'lucide-react'
import Avatar from '@/components/shared/Avatar'

export default function TopBar({ userName }: { userName: string }) {
  const [search, setSearch] = useState('')

  return (
    <header
      className="sticky top-0 z-10 flex items-center justify-between px-6 py-3 border-b"
      style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
    >
      {/* Search */}
      <div className="relative w-full max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--muted)' }} />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search contacts, deals, companies..."
          className="w-full pl-10 py-2"
        />
      </div>

      {/* Right side */}
      <div className="flex items-center gap-4 ml-4">
        <button
          className="relative p-2 rounded-lg hover:bg-[var(--surface-2)] transition-colors"
          style={{ color: 'var(--muted)' }}
        >
          <Bell className="w-5 h-5" />
        </button>
        <Avatar name={userName} size="sm" />
      </div>
    </header>
  )
}
