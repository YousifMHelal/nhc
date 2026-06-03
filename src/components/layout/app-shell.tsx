'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Topbar } from './topbar'
import { Sidebar } from './sidebar'

const COLLAPSE_KEY = 'nhc_sidebar_collapsed'

interface AppShellProps {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const [isAuthed, setIsAuthed] = useState(false)
  const [isChecking, setIsChecking] = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)
  // Sidebar collapse state — desktop only; initialised from sessionStorage
  const [collapsed, setCollapsed] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const authed = sessionStorage.getItem('nhc_authed') === '1'
    if (!authed) {
      router.replace('/login')
    } else {
      setIsAuthed(true)
      setIsChecking(false)
    }
    // Restore collapse preference
    const stored = sessionStorage.getItem(COLLAPSE_KEY)
    if (stored !== null) setCollapsed(stored === '1')
  }, [router])

  // On tablet (768–1279px), auto-collapse; on desktop (≥1280px), honour stored pref
  useEffect(() => {
    function onResize() {
      const w = window.innerWidth
      if (w < 768) {
        // Mobile — sidebar is off-canvas; collapse state irrelevant here
        return
      }
      if (w < 1280) {
        // Tablet — force collapsed
        setCollapsed(true)
      } else {
        // Desktop — restore stored pref
        const stored = sessionStorage.getItem(COLLAPSE_KEY)
        setCollapsed(stored === '1')
      }
    }
    onResize()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  function toggleCollapse() {
    // Only meaningful on desktop ≥1280px
    if (window.innerWidth < 1280) return
    setCollapsed((prev) => {
      const next = !prev
      sessionStorage.setItem(COLLAPSE_KEY, next ? '1' : '0')
      return next
    })
  }

  if (isChecking) return <div className="min-h-screen bg-bg-page" />
  if (!isAuthed) return null

  return (
    <div className="flex min-h-dvh bg-bg-page">
      <Sidebar
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
        collapsed={collapsed}
        onToggleCollapse={toggleCollapse}
      />

      {/* Content area — flexes to fill remaining space */}
      <div className="flex flex-1 flex-col min-w-0 transition-[margin] duration-200 ease-in-out">
        <Topbar
          onMenuToggle={() => setMobileOpen((p) => !p)}
          sidebarCollapsed={collapsed}
          onToggleCollapse={toggleCollapse}
        />
        <main className="flex-1 overflow-y-auto">
          <div className="p-6">{children}</div>
        </main>
      </div>
    </div>
  )
}
