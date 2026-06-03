'use client'

import { usePathname } from 'next/navigation'
import { AppShell } from './app-shell'

const PUBLIC_PATHS = ['/login']

export function ConditionalShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  if (PUBLIC_PATHS.includes(pathname)) {
    return <>{children}</>
  }

  return <AppShell>{children}</AppShell>
}
