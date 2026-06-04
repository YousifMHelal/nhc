'use client'

import { useState } from 'react'
import { cn, toAr } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface KpiCardProps {
  labelAr: string
  value: string
  growth?: number
  icon: LucideIcon
  accentClass: string
  accentBgClass: string
  accentBarClass?: string
  tooltip?: string
  isPurple?: boolean
}

export function KpiCard({
  labelAr, value, growth, icon: Icon, accentClass, accentBgClass, accentBarClass, tooltip, isPurple,
}: KpiCardProps) {
  const [showTip, setShowTip] = useState(false)
  const isPositive = growth !== undefined && growth >= 0

  return (
    <div
      className="relative h-full rounded-xl border border-border bg-card shadow-sm overflow-hidden transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 group"
      onMouseEnter={() => setShowTip(true)}
      onMouseLeave={() => setShowTip(false)}
    >
      {/* Colored top accent bar */}
      <div className={cn(
        'absolute top-0 inset-x-0 h-[3px]',
        accentBarClass ?? (isPurple ? 'bg-purple' : 'bg-brand'),
      )} />

      {/* Tooltip */}
      {tooltip && showTip && (
        <div className="absolute -top-9 start-1/2 z-20 whitespace-nowrap rounded-lg bg-foreground px-3 py-1.5 text-xs text-background shadow-md pointer-events-none -translate-x-1/2 rtl:translate-x-1/2">
          {tooltip}
        </div>
      )}

      <div className="p-4 pt-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1 min-w-0">
            <span className="text-xs font-medium text-muted-foreground leading-snug">{labelAr}</span>
            <span className={cn(
              'text-2xl font-bold font-inter tabular-nums leading-tight',
              isPurple ? 'text-purple' : 'text-foreground',
            )}>
              {value}
            </span>
          </div>
          <div className={cn(
            'flex size-11 shrink-0 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-110',
            accentBgClass,
          )}>
            <Icon className={cn('size-5', accentClass)} />
          </div>
        </div>

        {growth !== undefined && (
          <div className="mt-3 flex items-center gap-1.5">
            <div className={cn(
              'flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold',
              isPositive ? 'bg-success-bg text-success' : 'bg-error-bg text-danger',
            )}>
              {isPositive
                ? <TrendingUp className="size-3" />
                : <TrendingDown className="size-3" />}
              {isPositive ? '+' : ''}{toAr(growth)}٪
            </div>
            <span className="text-xs text-muted-foreground">مقارنة بالشهر الماضي</span>
          </div>
        )}

        {isPurple && !growth && (
          <div className="mt-3">
            <span className="inline-flex items-center rounded-full bg-purple/10 px-2.5 py-0.5 text-xs font-semibold text-purple">
              AI Score Model
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
