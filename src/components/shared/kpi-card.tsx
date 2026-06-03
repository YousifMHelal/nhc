import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface KpiCardProps {
  labelAr: string
  value: string
  growth?: number
  icon: LucideIcon
  accentClass: string
  accentBgClass: string
}

export function KpiCard({
  labelAr,
  value,
  growth,
  icon: Icon,
  accentClass,
  accentBgClass,
}: KpiCardProps) {
  const isPositive = growth !== undefined && growth >= 0

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-muted-foreground">{labelAr}</span>
          <span className="text-2xl font-bold text-foreground">{value}</span>
        </div>
        <div className={cn('flex size-10 shrink-0 items-center justify-center rounded-lg', accentBgClass)}>
          <Icon className={cn('size-5', accentClass)} />
        </div>
      </div>

      {growth !== undefined && (
        <div className="mt-3 flex items-center gap-1.5">
          {isPositive ? (
            <TrendingUp className="size-3.5 text-success" />
          ) : (
            <TrendingDown className="size-3.5 text-danger" />
          )}
          <span
            className={cn(
              'text-xs font-semibold',
              isPositive ? 'text-success' : 'text-danger'
            )}
          >
            {isPositive ? '+' : ''}
            {growth}%
          </span>
          <span className="text-xs text-muted-foreground">مقارنة بالشهر الماضي</span>
        </div>
      )}
    </div>
  )
}
