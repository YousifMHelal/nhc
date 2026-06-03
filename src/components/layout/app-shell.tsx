'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar } from './sidebar'
import { Topbar } from './topbar'

interface AppShellProps {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isAuthed, setIsAuthed] = useState(false)
  const [isChecking, setIsChecking] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const authed = sessionStorage.getItem('nhc_authed') === '1'
    if (!authed) {
      router.replace('/login')
    } else {
      setIsAuthed(true)
      setIsChecking(false)
    }
  }, [router])

  if (isChecking) {
    return <div className="min-h-screen bg-background" />
  }

  if (!isAuthed) return null

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <Sidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />

      <main className="flex min-w-0 flex-1 flex-col overflow-y-auto">
        <Topbar onMenuToggle={() => setMobileOpen((p) => !p)} />
        <div className="flex-1 overflow-y-auto p-6">{children}</div>
      </main>
    </div>
  )
}
