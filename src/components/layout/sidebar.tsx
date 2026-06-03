'use client'

import { NAV_ITEMS, type NavItem } from "@/constants/nav";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

interface SidebarProps {
  mobileOpen?: boolean
  onMobileClose?: () => void
  collapsed: boolean
  onToggleCollapse?: () => void
}

export function Sidebar({
  mobileOpen = false,
  onMobileClose,
  collapsed,
}: SidebarProps) {
  const pathname = usePathname()

  return (
    <>
      {/* ── Mobile backdrop — only when drawer is open ──────────────────── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 md:hidden"
          onClick={onMobileClose}
        />
      )}

      {/*
        ── Sidebar ──────────────────────────────────────────────────────────
        MOBILE  (<768px): fixed off-canvas drawer from the end edge (RTL right).
                          translate-x-full = hidden; translate-x-0 = open.
                          Always 240px wide when open.
        TABLET  (768-1279px): sticky column, 64px (icons only), no translate.
        DESKTOP (≥1280px): sticky column, 240px or 64px per `collapsed` state.
      */}
      <aside
        className={cn(
          "flex flex-col shrink-0 bg-brand-dark overflow-hidden",
          "transition-[width,transform] duration-200 ease-in-out",

          // ── Mobile (<md): fixed off-canvas from the right (RTL end) ──
          "fixed inset-y-0 right-0 z-30 w-60",
          mobileOpen ? "translate-x-0" : "transform-[translateX(100%)]",

          // ── md+ (tablet & desktop): sticky in-flow column, full viewport height ──
          "md:sticky md:top-0 md:h-dvh md:self-stretch md:z-auto md:transform-none",
          "md:right-auto md:inset-y-0",

          // ── Tablet (md < xl): icon-only 64px ──
          "md:w-16",

          // ── Desktop (xl+): honours collapsed state ──
          collapsed ? "xl:w-16" : "xl:w-60",
        )}
      >
        {/* ── Logo row ─────────────────────────────────────────────────── */}
        <div className={cn(
          "flex h-16 shrink-0 items-center border-b border-white/8",
          // Tablet always icon-only centred; desktop depends on collapsed
          "md:justify-center md:px-0",
          !collapsed && "xl:justify-between xl:px-4",
        )}>
          <Link
            href="/dashboard"
            onClick={onMobileClose}
            className="flex items-center justify-center min-w-0"
          >
            {/* Icon-only (collapsed / tablet): show just the flower mark clipped to 32×32 */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="currentColor"
              className={cn(
                "shrink-0 text-white transition-all duration-200",
                // Mobile drawer + desktop expanded: full logo
                "w-20 h-10",
                // Tablet: icon-only mark
                "md:w-8 md:h-8",
                // Desktop expanded: full logo; collapsed: icon-only mark
                !collapsed ? "xl:w-20 xl:h-10" : "xl:w-8 xl:h-8",
              )}
              viewBox={collapsed ? "0 0 40 40" : "0 0 80 40"}
            >
              <path d="M59.354 20.872v4.134h-1.96v-10h1.96v4.12h6.079v-4.12h1.961v10h-1.967v-4.134h-6.073ZM52.264 15.007v6.518l-6.272-5.85a2.5 2.5 0 0 0-1.7-.668h-1.383l1.382 1.249v8.75h1.962v-6.383l6.924 6.383h1.047v-10h-1.962.002ZM79.041 22.294c-.823.636-1.922 1.029-3.244 1.03-2.263.006-3.719-1.372-3.719-3.332 0-1.96 1.456-3.327 3.73-3.327 1.268 0 2.408.375 3.226 1.027l.952-1.544c-1.103-.82-2.554-1.293-4.232-1.293-3.417 0-5.674 2.116-5.674 5.137 0 3.02 2.268 5.164 5.685 5.164 1.815 0 3.073-.421 4.233-1.31l-.957-1.554v.002ZM27.272 16.702a5.55 5.55 0 0 1 6.569-3.685 7.339 7.339 0 0 0-2.142 3.248l-1.193 3.672a5.642 5.642 0 0 1-6.729 3.731 4.396 4.396 0 0 0 2.04-2.485l1.455-4.483v.002ZM37.265 31.345l-2.96-5.127a4.189 4.189 0 0 0-5.32-1.737c.917.476 1.364.86 1.923 1.827l2.275 3.945a2.988 2.988 0 0 0 4.082 1.094M35.728 25.85a3.192 3.192 0 0 0 3.356 3.02 3.192 3.192 0 0 0-3.356-3.02ZM32.186 19.886a5.464 5.464 0 0 0 5.909-4.978 5.464 5.464 0 0 0-5.91 4.978ZM30.647 22.611a7.401 7.401 0 0 1 2.464.62l3.745 1.667a2.38 2.38 0 0 0 3.142-1.207l-4.934-2.197a3.686 3.686 0 0 0-4.417 1.115M20.004 12.197a5.552 5.552 0 0 1-1.475-7.386 7.304 7.304 0 0 0 2.429 3.04l3.124 2.27a5.644 5.644 0 0 1 1.47 7.554 4.39 4.39 0 0 0-1.732-2.707l-3.814-2.77h-.002ZM37.018 7.22l-5.791 1.23a4.188 4.188 0 0 0-3.296 4.523c.735-.725 1.241-1.031 2.332-1.264l4.453-.946a2.987 2.987 0 0 0 2.302-3.543ZM31.317 6.982a3.194 3.194 0 0 0 3.91-2.257 3.193 3.193 0 0 0-3.91 2.257ZM24.551 8.509a5.463 5.463 0 0 0-2.91-7.159 5.463 5.463 0 0 0 2.91 7.159ZM26.668 10.814c.323-.79.78-1.518 1.352-2.152l2.744-3.047a2.38 2.38 0 0 0-.177-3.361l-3.614 4.015a3.683 3.683 0 0 0-.303 4.545M13.475 17.719a5.55 5.55 0 0 1-7.48-.88 7.333 7.333 0 0 0 3.641-1.37l3.125-2.27a5.644 5.644 0 0 1 7.638.937 4.401 4.401 0 0 0-3.11.81l-3.814 2.773ZM13.998 0l-.618 5.888a4.187 4.187 0 0 0 3.281 4.531c-.461-.923-.597-1.498-.48-2.608l.475-4.528A2.988 2.988 0 0 0 13.996 0M12.01 5.349a3.193 3.193 0 0 0-.939-4.417 3.193 3.193 0 0 0 .94 4.417ZM11.37 12.255a5.462 5.462 0 0 0-7.706.556 5.462 5.462 0 0 0 7.707-.556ZM14.219 10.955a7.43 7.43 0 0 1-1.629-1.95l-2.05-3.55a2.38 2.38 0 0 0-3.25-.871l2.7 4.679a3.684 3.684 0 0 0 4.23 1.694M16.707 25.635a5.551 5.551 0 0 1-3.148 6.843 7.314 7.314 0 0 0-.178-3.886l-1.193-3.672a5.642 5.642 0 0 1 3.25-6.974 4.403 4.403 0 0 0-.19 3.21l1.457 4.483.002-.004ZM.018 19.663l5.408 2.407a4.187 4.187 0 0 0 5.324-1.72c-1.02.155-1.609.106-2.629-.35l-4.16-1.851a2.987 2.987 0 0 0-3.943 1.514ZM4.49 23.205A3.193 3.193 0 0 0 0 22.733a3.195 3.195 0 0 0 4.49.472ZM10.861 25.947a5.465 5.465 0 0 0-1.854 7.502 5.465 5.465 0 0 0 1.854-7.502ZM10.504 22.838a7.41 7.41 0 0 1-2.358.947l-4.012.853a2.38 2.38 0 0 0-1.832 2.823l5.283-1.123a3.684 3.684 0 0 0 2.917-3.498M25.235 25.006a5.554 5.554 0 0 1 5.536 5.107 7.34 7.34 0 0 0-3.752-1.032h-3.862a5.643 5.643 0 0 1-5.629-5.247 4.4 4.4 0 0 0 2.993 1.172h4.714ZM14.396 39.034l3.962-4.4a4.189 4.189 0 0 0 .009-5.596c-.17 1.019-.396 1.563-1.144 2.393l-3.047 3.384a2.987 2.987 0 0 0 .22 4.22ZM19.148 35.874a3.191 3.191 0 0 0-1.836 4.124 3.19 3.19 0 0 0 1.836-4.124ZM23.725 30.663a5.464 5.464 0 0 0 6.56 4.082 5.465 5.465 0 0 0-6.56-4.082ZM20.658 30.043c.203.828.261 1.686.171 2.534l-.428 4.078a2.38 2.38 0 0 0 2.118 2.615l.564-5.371a3.684 3.684 0 0 0-2.427-3.856" />
            </svg>
          </Link>

        </div>

        {/* ── Nav items ────────────────────────────────────────────────── */}
        <nav className="flex flex-col gap-0.5 overflow-y-auto overflow-x-hidden p-2 flex-1 scrollbar-none">
          {NAV_ITEMS.map((item: NavItem) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            // Icon-only when: tablet always, or desktop collapsed
            const iconOnly = collapsed  // AppShell forces collapsed=true on tablet

            return (
              <NavLink
                key={item.id}
                item={item}
                isActive={isActive}
                iconOnly={iconOnly}
                onClick={onMobileClose}
              />
            )
          })}
        </nav>
      </aside>
    </>
  )
}

/* ─── Individual nav link ──────────────────────────────────────────────────── */
function NavLink({
  item,
  isActive,
  iconOnly,
  onClick,
}: {
  item: NavItem
  isActive: boolean
  iconOnly: boolean
  onClick?: () => void
}) {
  const [tipVisible, setTipVisible] = useState(false)
  const Icon = item.icon

  return (
    <div className="relative">
      <Link
        href={item.href}
        onClick={onClick}
        onMouseEnter={() => iconOnly && setTipVisible(true)}
        onMouseLeave={() => setTipVisible(false)}
        className={cn(
          "flex items-center gap-3 rounded-lg py-2.5 text-sm font-medium",
          "relative transition-all duration-150",
          // Icon-only: centre; label visible: start-aligned
          iconOnly ? "justify-center px-0" : "justify-start px-3",
          // Mobile drawer is always label-visible
          "xl:justify-start xl:px-3",
          iconOnly && "xl:justify-center xl:px-0",
          isActive
            ? "bg-brand/30 text-white"
            : "text-white/60 hover:bg-white/8 hover:text-white/90",
        )}
      >
        {/* Active border on the end edge */}
        {isActive && (
          <span className="absolute inset-y-0 inset-e-0 w-0.75 rounded-s-full bg-brand-accent" />
        )}

        <Icon className={cn("size-5 shrink-0", isActive && "text-brand-accent")} />

        {/* Label — always visible in mobile drawer; hidden when iconOnly on md+ */}
        <span className={cn(
          "whitespace-nowrap overflow-hidden transition-all duration-200 leading-none flex-1",
          // Mobile: always visible
          "w-auto opacity-100",
          // md+: hide when iconOnly
          iconOnly ? "md:w-0 md:opacity-0" : "md:w-auto md:opacity-100",
        )}>
          {item.labelAr}
        </span>
      </Link>

      {/* Tooltip when icon-only on md+ */}
      {iconOnly && tipVisible && (
        <div className={cn(
          "absolute top-1/2 -translate-y-1/2 inset-e-full me-2 z-50",
          "pointer-events-none whitespace-nowrap hidden md:block",
          "rounded-md bg-brand-dark border border-white/10 px-2.5 py-1.5",
          "text-xs font-medium text-white shadow-md",
        )}>
          {item.labelAr}
          <span className="absolute top-1/2 -translate-y-1/2 inset-s-full border-4 border-transparent border-s-brand-dark" />
        </div>
      )}
    </div>
  )
}
