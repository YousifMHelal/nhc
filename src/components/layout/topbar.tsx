'use client'

import { usePathname, useRouter } from 'next/navigation'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Menu, LogOut, ChevronDown } from 'lucide-react'
import { NAV_ITEMS } from '@/constants/nav'
import { useState, useRef, useEffect } from 'react'

interface TopbarProps {
  onMenuToggle?: () => void
}

export function Topbar({ onMenuToggle }: TopbarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const activeItem = NAV_ITEMS.find((item) => item.href === pathname)
  const pageTitle = activeItem?.labelAr ?? 'لوحة التحكم'

  // Get user info from sessionStorage
  const [userName, setUserName] = useState('م أ')
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem('nhc_user')
      if (stored) {
        const user = JSON.parse(stored) as { name: string }
        setUserName(user.name.charAt(0) + user.name.split(' ')[1]?.charAt(0))
      }
    } catch {
      // ignore
    }
  }, [])

  // Close dropdown on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  const handleLogout = () => {
    sessionStorage.removeItem('nhc_authed')
    sessionStorage.removeItem('nhc_user')
    router.push('/login')
  }

  return (
    <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between border-b border-border bg-card px-4 sm:px-6">
      {/* Hamburger — mobile only */}
      <button
        onClick={onMenuToggle}
        className="flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors md:hidden"
        aria-label="القائمة"
      >
        <Menu className="size-5" />
      </button>

      {/* Page title */}
      <h1 className="text-base font-semibold text-foreground md:text-lg">
        {pageTitle}
      </h1>

      {/* User avatar dropdown */}
      <div ref={dropdownRef} className="relative">
        <button
          onClick={() => setDropdownOpen((p) => !p)}
          className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-muted transition-colors"
        >
          <Avatar className="size-8">
            <AvatarFallback className="bg-brand/10 text-brand text-xs font-bold">
              {userName}
            </AvatarFallback>
          </Avatar>
          <div className="hidden sm:flex flex-col items-start leading-none">
            <span className="text-xs font-semibold text-foreground">محمد الأحمدي</span>
            <span className="text-[10px] text-white bg-brand rounded-full px-1.5 py-0.5 mt-0.5">مدير المبيعات</span>
          </div>
          <ChevronDown className={`size-3.5 text-muted-foreground transition-transform hidden sm:block ${dropdownOpen ? 'rotate-180' : ''}`} />
        </button>

        {dropdownOpen && (
          <div className="absolute start-0 top-full mt-1 w-48 rounded-xl border border-border bg-card shadow-lg z-50">
            <div className="border-b border-border px-4 py-3">
              <p className="text-sm font-semibold">محمد الأحمدي</p>
              <p className="text-xs text-muted-foreground">مدير المبيعات</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-danger hover:bg-danger/5 transition-colors"
            >
              <LogOut className="size-4" />
              تسجيل الخروج
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
