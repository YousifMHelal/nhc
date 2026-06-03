'use client'

import { useState, useMemo } from 'react'
import {
  CheckCircle,
  AlertTriangle,
  XCircle,
  Activity,
  Search,
  X,
  ChevronLeft,
  Database,
} from 'lucide-react'
import { INTEGRATIONS, INTEGRATION_SUMMARY } from '@/lib/mock-data'
import type { Integration, IntegrationStatus } from '@/lib/types'
import { cn } from '@/lib/utils'

// ─── Config ───────────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<IntegrationStatus, { dot: string; badge: string }> = {
  Active: { dot: 'bg-success', badge: 'bg-emerald-100 text-emerald-700' },
  Warning: { dot: 'bg-warning', badge: 'bg-amber-100 text-amber-700' },
  Error: { dot: 'bg-danger', badge: 'bg-red-100 text-red-700' },
  Inactive: { dot: 'bg-muted-foreground', badge: 'bg-slate-100 text-slate-600' },
}
const STATUS_AR: Record<IntegrationStatus, string> = {
  Active: 'نشط',
  Warning: 'تحذير',
  Error: 'خطأ',
  Inactive: 'غير نشط',
}

const HTTP_COLORS: Record<string, string> = {
  GET: 'text-sky-600 bg-sky-50',
  POST: 'text-emerald-600 bg-emerald-50',
  PUT: 'text-amber-600 bg-amber-50',
  DELETE: 'text-danger bg-danger/10',
  PATCH: 'text-violet-600 bg-violet-50',
}

const CATEGORIES = ['الكل', ...Array.from(new Set(INTEGRATIONS.map((i) => i.category)))]
type StatusFilter = IntegrationStatus | 'all'
const STATUS_FILTER_OPTS: StatusFilter[] = ['all', 'Active', 'Warning', 'Error']
const STATUS_FILTER_AR: Record<StatusFilter, string> = {
  all: 'الكل',
  Active: 'نشط',
  Warning: 'تحذير',
  Error: 'خطأ',
  Inactive: 'غير نشط',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtRelTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 60) return `منذ ${mins} دقيقة`
  const hours = Math.floor(diff / 3_600_000)
  if (hours < 24) return `منذ ${hours} ساعة`
  return `منذ ${Math.floor(diff / 86_400_000)} يوم`
}

function fmtRecords(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}م`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}ألف`
  return n.toString()
}

// ─── Audit Log Modal ──────────────────────────────────────────────────────────

function AuditLogModal({
  integration,
  onClose,
}: {
  integration: Integration
  onClose: () => void
}) {
  const log = integration.auditLog.slice(0, 50)
  const errorCount = log.filter((e) => e.statusCode >= 400).length
  const styles = STATUS_STYLES[integration.status]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/25 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-3xl rounded-xl bg-background border border-border shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 p-5 border-b border-border shrink-0">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={cn('size-2.5 rounded-full shrink-0', styles.dot)} />
              <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', styles.badge)}>
                {STATUS_AR[integration.status]}
              </span>
              <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                {integration.type}
              </span>
              <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                {integration.category}
              </span>
            </div>
            <h2 className="text-base font-bold mt-2">{integration.nameAr}</h2>
            <p className="text-xs text-muted-foreground font-mono mt-0.5">{integration.nameEn}</p>
            {integration.description && (
              <p className="text-sm text-muted-foreground mt-2 max-w-xl">{integration.description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 hover:bg-muted transition-colors shrink-0"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Audit log */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-muted/30 shrink-0">
          <div className="flex items-center gap-2">
            <Activity className="size-4 text-accent-integrations" />
            <span className="text-sm font-semibold">
              سجل آخر {log.length} طلب
            </span>
          </div>
          {errorCount > 0 && (
            <span className="flex items-center gap-1 rounded-full bg-danger/10 px-2.5 py-0.5 text-xs font-medium text-danger">
              <AlertTriangle className="size-3" />
              {errorCount} خطأ
            </span>
          )}
        </div>

        <div className="overflow-y-auto flex-1" dir="ltr">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-muted/90 backdrop-blur-sm">
              <tr>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground whitespace-nowrap">Timestamp</th>
                <th className="text-left px-3 py-2.5 font-medium text-muted-foreground">Method</th>
                <th className="text-left px-3 py-2.5 font-medium text-muted-foreground">Endpoint</th>
                <th className="text-left px-3 py-2.5 font-medium text-muted-foreground">Status</th>
                <th className="text-left px-3 py-2.5 font-medium text-muted-foreground">Duration (ms)</th>
                <th className="text-left px-3 py-2.5 font-medium text-muted-foreground">Records</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {log.map((entry) => {
                const isError = entry.statusCode >= 400
                return (
                  <tr
                    key={entry.id}
                    className={cn(
                      'hover:bg-muted/30 transition-colors',
                      isError && 'bg-danger/5'
                    )}
                  >
                    <td className="px-4 py-2 text-muted-foreground font-mono whitespace-nowrap">
                      {new Date(entry.timestamp).toLocaleTimeString('en-US', { hour12: false })}
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={cn(
                          'rounded px-1.5 py-0.5 text-[10px] font-bold font-mono',
                          HTTP_COLORS[entry.method] ?? 'text-foreground bg-muted'
                        )}
                      >
                        {entry.method}
                      </span>
                    </td>
                    <td className="px-3 py-2 font-mono text-muted-foreground max-w-[220px] truncate">
                      {entry.endpoint}
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={cn(
                          'font-mono font-bold',
                          isError ? 'text-danger' : 'text-success'
                        )}
                      >
                        {entry.statusCode}
                      </span>
                    </td>
                    <td className="px-3 py-2 font-mono text-muted-foreground">{entry.duration}</td>
                    <td className="px-3 py-2 font-mono">
                      {entry.records > 0 ? entry.records.toLocaleString() : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ─── Integration Card ─────────────────────────────────────────────────────────

function IntegrationCard({
  integration,
  onClick,
}: {
  integration: Integration
  onClick: () => void
}) {
  const styles = STATUS_STYLES[integration.status]
  return (
    <div
      className="flex items-center gap-4 rounded-xl border border-border bg-card px-4 py-3.5 hover:shadow-md hover:border-accent-integrations/30 transition-all cursor-pointer"
      onClick={onClick}
    >
      <span className={cn('size-2.5 rounded-full shrink-0 ring-2 ring-background', styles.dot)} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate">{integration.nameAr}</p>
        <p className="text-[11px] text-muted-foreground font-mono">{integration.nameEn}</p>
      </div>
      <div className="shrink-0 flex flex-col items-end gap-0.5">
        <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-medium', styles.badge)}>
          {STATUS_AR[integration.status]}
        </span>
        <span className="text-[10px] text-muted-foreground">{fmtRelTime(integration.lastSync)}</span>
      </div>
      <div className="shrink-0 text-end min-w-[56px]">
        <p className="text-xs font-bold font-mono">{fmtRecords(integration.recordCount)}</p>
        <p className="text-[10px] text-muted-foreground">سجل</p>
      </div>
      <span className="shrink-0 text-[10px] text-muted-foreground rounded-full border border-border px-2 py-0.5">
        {integration.type}
      </span>
      <ChevronLeft className="size-4 text-muted-foreground shrink-0" />
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function IntegrationsPage() {
  const [category, setCategory] = useState('الكل')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Integration | null>(null)

  const filtered = useMemo(
    () =>
      INTEGRATIONS.filter((i) => {
        if (category !== 'الكل' && i.category !== category) return false
        if (statusFilter !== 'all' && i.status !== statusFilter) return false
        if (
          search &&
          !i.nameAr.includes(search) &&
          !i.nameEn.toLowerCase().includes(search.toLowerCase())
        )
          return false
        return true
      }),
    [category, statusFilter, search]
  )

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-accent-integrations">مراقبة التكاملات</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {INTEGRATION_SUMMARY.total} تكامل —{' '}
          <span className="text-success font-medium">{INTEGRATION_SUMMARY.active} نشط</span>
          {' · '}
          <span className="text-warning font-medium">{INTEGRATION_SUMMARY.warning} تحذير</span>
          {' · '}
          <span className="text-danger font-medium">{INTEGRATION_SUMMARY.error} خطأ</span>
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          {
            labelAr: 'إجمالي التكاملات',
            value: INTEGRATION_SUMMARY.total,
            Icon: Database,
            color: 'text-accent-integrations bg-accent-integrations/10',
          },
          {
            labelAr: 'نشط',
            value: INTEGRATION_SUMMARY.active,
            Icon: CheckCircle,
            color: 'text-success bg-success/10',
          },
          {
            labelAr: 'تحذير',
            value: INTEGRATION_SUMMARY.warning,
            Icon: AlertTriangle,
            color: 'text-warning bg-warning/10',
          },
          {
            labelAr: 'خطأ',
            value: INTEGRATION_SUMMARY.error,
            Icon: XCircle,
            color: 'text-danger bg-danger/10',
          },
        ].map((card) => (
          <div
            key={card.labelAr}
            className="rounded-xl border border-border bg-card p-4 flex items-center gap-3"
          >
            <div className={cn('flex size-11 items-center justify-center rounded-xl shrink-0', card.color)}>
              <card.Icon className="size-5" />
            </div>
            <div>
              <p className="text-2xl font-bold leading-none">{card.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{card.labelAr}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters row */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Search */}
        <div className="relative">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="بحث بالاسم..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-52 rounded-lg border border-input bg-background ps-9 pe-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-accent-integrations"
          />
        </div>

        {/* Status filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground">الحالة:</span>
          {STATUS_FILTER_OPTS.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                'rounded-full px-3 py-1 text-xs font-medium border transition-all',
                statusFilter === s
                  ? 'bg-accent-integrations text-white border-accent-integrations'
                  : 'border-border text-muted-foreground hover:border-accent-integrations/40'
              )}
            >
              {STATUS_FILTER_AR[s]}
            </button>
          ))}
        </div>
      </div>

      {/* Category chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={cn(
              'shrink-0 rounded-full px-3 py-1.5 text-xs font-medium border transition-all',
              category === cat
                ? 'bg-accent-integrations text-white border-accent-integrations'
                : 'border-border text-muted-foreground hover:border-accent-integrations/40 bg-background'
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Search className="size-12 text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground text-sm">لا توجد تكاملات تطابق البحث</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((integration) => (
            <IntegrationCard
              key={integration.id}
              integration={integration}
              onClick={() => setSelected(integration)}
            />
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground text-center pb-2">
        يعرض {filtered.length} من {INTEGRATION_SUMMARY.total} تكامل
      </p>

      {/* Drill-down modal */}
      {selected && (
        <AuditLogModal integration={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  )
}
