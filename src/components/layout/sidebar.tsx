'use client'

import { NAV_ITEMS, type NavItem } from "@/constants/nav";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface SidebarProps {
  mobileOpen?: boolean
  onMobileClose?: () => void
}

export function Sidebar({ mobileOpen = false, onMobileClose }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside
      className={cn(
        // Base
        "flex flex-col border-s border-border bg-card",
        // Mobile: fixed overlay from the end (right in RTL), z-30
        "fixed inset-y-0 end-0 z-30 transition-transform duration-300 ease-in-out",
        // Mobile open/close — translate off-screen to the end when hidden
        mobileOpen ? "translate-x-0" : "translate-x-full",
        // md+: back to static flow, no transform
        "md:relative md:inset-auto md:z-auto md:translate-x-0",
        // Width: icon-only on md, full on xl
        "w-60 md:w-16 xl:w-60",
      )}
    >
      {/* Logo */}
      <div className="flex h-16 shrink-0 items-center border-b border-border px-4 md:justify-center xl:justify-start">
        <Link href="/dashboard" onClick={onMobileClose} className="flex items-center gap-2">
          <span className="text-xl font-bold text-brand">◆</span>
          <span className="text-sm font-bold tracking-tight text-foreground md:hidden xl:inline">
            NHC Innovation
          </span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-0.5 overflow-y-auto p-2">
        {NAV_ITEMS.map((item: NavItem) => {
          const isActive = pathname === item.href
          const Icon = item.icon

          return (
            <Link
              key={item.id}
              href={item.href}
              onClick={onMobileClose}
              title={item.labelAr}
              className={cn(
                "flex items-center rounded-lg py-2.5 text-sm font-medium transition-colors",
                // Collapsed (md): center icon, no padding for text
                "md:justify-center md:px-0 xl:justify-start xl:gap-3 xl:px-3",
                isActive
                  ? `${item.accentBgClass} ${item.accentClass}`
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon className="size-5 shrink-0 md:size-5" />
              <span className="flex-1 md:hidden xl:inline">{item.labelAr}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  )
}
