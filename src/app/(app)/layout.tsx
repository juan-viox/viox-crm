import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import Sidebar from '@/components/layout/Sidebar'
import TopBar from '@/components/layout/TopBar'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*, organization:organizations(*)')
    .eq('id', user.id)
    .single()

  const orgName = profile?.organization?.name ?? 'My Organization'
  const userName = profile?.full_name ?? user.email ?? 'User'
  const userRole = profile?.role ?? 'member'

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar orgName={orgName} userName={userName} userRole={userRole} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar userName={userName} orgName={orgName} />
        <main className="flex-1 overflow-y-auto p-6 animate-page-enter">
          {children}
        </main>
      </div>
    </div>
  )
}
