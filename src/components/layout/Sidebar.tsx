'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  LayoutDashboard,
  Users,
  Building2,
  Kanban,
  Activity,
  Globe,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Bot,
  Plug,
  Share2,
} from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/contacts', label: 'Contacts', icon: Users },
  { href: '/companies', label: 'Companies', icon: Building2 },
  { href: '/deals', label: 'Pipeline', icon: Kanban },
  { href: '/activities', label: 'Activities', icon: Activity },
  { href: '/sites', label: 'Sites', icon: Globe },
]

const settingsItems = [
  { href: '/settings', label: 'General', icon: Settings },
  { href: '/settings/pipeline', label: 'Pipeline', icon: Kanban },
  { href: '/settings/ai-providers', label: 'AI Providers', icon: Bot },
  { href: '/settings/integrations', label: 'Integrations', icon: Plug },
]

export default function Sidebar({ orgName }: { orgName: string }) {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside
      className="flex flex-col h-screen sticky top-0 transition-all duration-300 border-r"
      style={{
        width: collapsed ? '4.5rem' : '16rem',
        background: 'var(--surface)',
        borderColor: 'var(--border)',
      }}
    >
      {/* Org header */}
      <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--border)' }}>
        {!collapsed && (
          <div className="flex items-center gap-2 min-w-0">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold shrink-0"
              style={{ background: 'var(--accent)' }}
            >
              V
            </div>
            <span className="font-semibold truncate text-sm">{orgName}</span>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-md hover:bg-[var(--surface-2)] transition-colors shrink-0"
          style={{ color: 'var(--muted)' }}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 space-y-1 px-3 overflow-y-auto">
        {navItems.map(item => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors"
              style={{
                background: isActive ? 'var(--accent)' : 'transparent',
                color: isActive ? 'white' : 'var(--muted)',
              }}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          )
        })}

        {/* Settings section */}
        {!collapsed && (
          <div className="pt-4 mt-4 border-t" style={{ borderColor: 'var(--border)' }}>
            <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>Settings</p>
          </div>
        )}
        {settingsItems.map(item => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{
                background: isActive ? 'var(--accent)' : 'transparent',
                color: isActive ? 'white' : 'var(--muted)',
              }}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              {!collapsed && <span className="text-[13px]">{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t" style={{ borderColor: 'var(--border)' }}>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors w-full hover:bg-[var(--surface-2)]"
          style={{ color: 'var(--muted)' }}
          title={collapsed ? 'Logout' : undefined}
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  )
}
