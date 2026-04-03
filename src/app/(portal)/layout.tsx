import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'DreamersJoy Floral Studio — Client Portal',
  description: 'View your workshop bookings, photos, and account info',
}

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div data-theme="portal" className="min-h-screen" style={{ background: '#FAFAF8' }}>
      <link
        href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Jost:wght@300;400;500;600&display=swap"
        rel="stylesheet"
      />
      {children}
    </div>
  )
}
