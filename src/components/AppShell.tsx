'use client'

import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'

const NO_SIDEBAR_PREFIXES = ['/login', '/signup', '/onboarding']

export default function AppShell({
  sidebar,
  children,
}: {
  sidebar: ReactNode
  children: ReactNode
}) {
  const pathname = usePathname()
  const hideSidebar = NO_SIDEBAR_PREFIXES.some(p => pathname === p || pathname.startsWith(p + '/'))

  if (hideSidebar) return <>{children}</>

  return (
    <div className="flex min-h-screen bg-background">
      {sidebar}
      <div className="flex-1 min-w-0 pb-16 md:pb-0">
        {children}
      </div>
    </div>
  )
}
