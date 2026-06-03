'use client'

import { Badge } from '@/components/ui/badge'
import { NAV_ITEMS, type NavItem } from "@/constants/nav";
import { cn } from '@/lib/utils'
import Link from "next/link";
import { usePathname } from "next/navigation";

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="flex w-64 flex-col border-s border-border bg-card">
      <div className="flex items-center gap-2 border-b border-border px-6 py-5">
        <span className="text-xl font-bold text-[#1B6CA8]">◆</span>
        <span className="text-sm font-bold tracking-tight text-foreground">
          NHC Innovation
        </span>
      </div>

      <nav className="flex flex-col gap-1 p-3">
        {NAV_ITEMS.map((item: NavItem) => {
          const isActive = pathname === item.href
          const Icon = item.icon

          return (
            <Link
              key={item.id}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? `${item.accentBgClass} ${item.accentClass}`
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}>
              <Icon className="size-4 shrink-0" />
              <span className="flex-1">{item.labelAr}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  )
}
