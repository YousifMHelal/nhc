'use client'

import { useState, useMemo } from 'react'
import {
  CheckCircle, AlertTriangle, XCircle, Activity,
  Search, X, ChevronDown, ChevronUp, Database,
} from 'lucide-react'
import { INTEGRATIONS, INTEGRATION_SUMMARY } from '@/lib/mock-data'
import type { Integration, IntegrationStatus, IntegrationType } from '@/lib/types'
import { cn } from '@/lib/utils'

// ─── Config ───────────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<IntegrationStatus, { dot: string; badge: string }> = {
  Active:   { dot: 'bg-success',           badge: 'bg-emerald-100 text-emerald-700' },
  Warning:  { dot: 'bg-warning',           badge: 'bg-amber-100 text-amber-700' },
  Error:    { dot: 'bg-danger',            badge: 'bg-red-100 text-red-700' },
  Inactive: { dot: 'bg-muted-foreground',  badge: 'bg-slate-100 text-slate-600' },
}
const STATUS_AR: Record<IntegrationStatus, string> = {
  Active: 'نشط', Warning: 'تحذير', Error: 'خطأ', Inactive: 'غير نشط',
}
const TYPE_AR: Record<IntegrationType, string> = {
  'Real-time': 'آني', 'Batch': 'دُفعي', 'On-demand': 'عند الطلب',
}
const HTTP_COLORS: Record<string, string> = {
  GET: 'text-sky-600 bg-sky-50', POST: 'text-emerald-600 bg-emerald-50',
  PUT: 'text-amber-600 bg-amber-50', DELETE: 'text-danger bg-danger/10',
  PATCH: 'text-violet-600 bg-violet-50',
}

// Sort Active first, then Warning, then Error, then Inactive
const STATUS_SORT_ORDER: Record<IntegrationStatus, number> = { Active: 0, Warning: 1, Error: 2, Inactive: 3 }

type StatusFilter = IntegrationStatus | 'all'
type TypeFilter = IntegrationType | 'all'

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

// ─── Full Audit Log Modal ─────────────────────────────────────────────────────

function AuditLogModal({ integration, onClose }: { integration: Integration; onClose: () => void }) {
  const log = integration.auditLog.slice(0, 50)
  const errorCount = log.filter((e) => e.statusCode >= 400).length
  const styles = STATUS_STYLES[integration.status]
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/25 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-3xl rounded-xl bg-background border border-border shadow-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-start justify-between gap-4 p-5 border-b border-border shrink-0">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={cn('size-2.5 rounded-full shrink-0', styles.dot)} />
              <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', styles.badge)}>{STATUS_AR[integration.status]}</span>
              <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">{TYPE_AR[integration.type]}</span>
              <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">{integration.category}</span>
            </div>
            <h2 className="text-base font-bold mt-2">{integration.nameAr}</h2>
            <p className="text-xs text-muted-foreground font-mono mt-0.5">{integration.nameEn}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-muted transition-colors shrink-0"><X className="size-4" /></button>
        </div>
        <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-muted/30 shrink-0">
          <div className="flex items-center gap-2">
            <Activity className="size-4 text-accent-integrations" />
            <span className="text-sm font-semibold">سجل آخر {log.length} طلب</span>
          </div>
          {errorCount > 0 && (
            <span className="flex items-center gap-1 rounded-full bg-danger/10 px-2.5 py-0.5 text-xs font-medium text-danger">
              <AlertTriangle className="size-3" />{errorCount} خطأ
            </span>
          )}
        </div>
        <div className="overflow-y-auto flex-1" dir="ltr">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-muted/90 backdrop-blur-sm">
              <tr>
                {['Timestamp','Method','Endpoint','Status','Duration (ms)','Records'].map((h) => (
                  <th key={h} className="text-left px-3 py-2.5 font-medium text-muted-foreground whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {log.map((entry) => {
                const isError = entry.statusCode >= 400
                return (
                  <tr key={entry.id} className={cn('hover:bg-muted/30 transition-colors', isError && 'bg-danger/5')}>
                    <td className="px-3 py-2 text-muted-foreground font-mono whitespace-nowrap">
                      {new Date(entry.timestamp).toLocaleTimeString('en-US', { hour12: false })}
                    </td>
                    <td className="px-3 py-2">
                      <span className={cn('rounded px-1.5 py-0.5 text-[10px] font-bold font-mono', HTTP_COLORS[entry.method] ?? 'text-foreground bg-muted')}>{entry.method}</span>
                    </td>
                    <td className="px-3 py-2 font-mono text-muted-foreground max-w-[200px] truncate">{entry.endpoint}</td>
                    <td className="px-3 py-2">
                      <span className={cn('font-mono font-bold', isError ? 'text-danger' : 'text-success')}>{entry.statusCode}</span>
                    </td>
                    <td className="px-3 py-2 font-mono text-muted-foreground">{entry.duration}</td>
                    <td className="px-3 py-2 font-mono">{entry.records > 0 ? entry.records.toLocaleString() : '—'}</td>
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

// ─── Integration Row with Inline Accordion ────────────────────────────────────

function IntegrationRow({ integration, onViewFull }: { integration: Integration; onViewFull: () => void }) {
  const [expanded, setExpanded] = useState(false)
  const styles = STATUS_STYLES[integration.status]
  const recentLog = integration.auditLog.slice(0, 5)

  return (
    <div className={cn('rounded-xl border border-border bg-card transition-all', expanded && 'shadow-md border-accent-integrations/30')}>
      {/* Row */}
      <button
        className="flex w-full items-center gap-4 px-4 py-3.5 text-start"
        onClick={() => setExpanded((e) => !e)}
      >
        <span className={cn('size-2.5 rounded-full shrink-0 ring-2 ring-background', styles.dot)} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate">{integration.nameAr}</p>
          <p className="text-[11px] text-muted-foreground font-mono">{integration.nameEn}</p>
        </div>
        <div className="shrink-0 hidden md:flex flex-col items-end gap-0.5">
          <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-medium', styles.badge)}>{STATUS_AR[integration.status]}</span>
          <span className="text-[10px] text-muted-foreground">{fmtRelTime(integration.lastSync)}</span>
        </div>
        <div className="shrink-0 text-end min-w-[56px]">
          <p className="text-xs font-bold font-mono font-inter">{fmtRecords(integration.recordCount)}</p>
          <p className="text-[10px] text-muted-foreground">سجل</p>
        </div>
        <span className="shrink-0 text-[10px] text-muted-foreground rounded-full border border-border px-2 py-0.5">
          {TYPE_AR[integration.type]}
        </span>
        {expanded ? <ChevronUp className="size-4 text-muted-foreground shrink-0" /> : <ChevronDown className="size-4 text-muted-foreground shrink-0" />}
      </button>

      {/* Accordion — last 5 audit entries */}
      {expanded && (
        <div className="border-t border-border px-4 py-4 bg-muted/20">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">آخر ٥ طلبات</p>
            <button
              className="text-xs text-accent-integrations hover:underline flex items-center gap-0.5"
              onClick={(e) => { e.stopPropagation(); onViewFull() }}
            >
              عرض السجل الكامل
            </button>
          </div>
          <div dir="ltr">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-muted-foreground border-b border-border">
                  <th className="pb-2 pe-3 font-medium">Timestamp</th>
                  <th className="pb-2 pe-3 font-medium">Method</th>
                  <th className="pb-2 pe-3 font-medium">Status</th>
                  <th className="pb-2 font-medium">Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {recentLog.map((entry) => {
                  const isError = entry.statusCode >= 400
                  return (
                    <tr key={entry.id} className={cn('hover:bg-muted/30', isError && 'bg-danger/5')}>
                      <td className="py-1.5 pe-3 font-mono text-muted-foreground whitespace-nowrap">
                        {new Date(entry.timestamp).toLocaleTimeString('en-US', { hour12: false })}
                      </td>
                      <td className="py-1.5 pe-3">
                        <span className={cn('rounded px-1.5 py-0.5 text-[10px] font-bold font-mono', HTTP_COLORS[entry.method] ?? 'bg-muted text-foreground')}>{entry.method}</span>
                      </td>
                      <td className="py-1.5 pe-3">
                        <span className={cn('font-mono font-bold', isError ? 'text-danger' : 'text-success')}>{entry.statusCode}</span>
                      </td>
                      <td className="py-1.5 font-mono text-muted-foreground">{entry.duration}ms</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function IntegrationsPage() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')
  const [search, setSearch] = useState('')
  const [fullLogTarget, setFullLogTarget] = useState<Integration | null>(null)

  const filtered = useMemo(() => {
    let list = INTEGRATIONS.filter((i) => {
      if (statusFilter !== 'all' && i.status !== statusFilter) return false
      if (typeFilter !== 'all' && i.type !== typeFilter) return false
      if (search && !i.nameAr.includes(search) && !i.nameEn.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
    // Default sort: Active first
    list = [...list].sort((a, b) => STATUS_SORT_ORDER[a.status] - STATUS_SORT_ORDER[b.status])
    return list
  }, [statusFilter, typeFilter, search])

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-brand-dark">مراقبة التكاملات</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {INTEGRATION_SUMMARY.total} تكامل —{' '}
          <span className="text-success font-medium">{INTEGRATION_SUMMARY.active} نشط</span>
          {' · '}
          <span className="text-warning font-medium">{INTEGRATION_SUMMARY.warning} تحذير</span>
          {' · '}
          <span className="text-danger font-medium">{INTEGRATION_SUMMARY.error} خطأ</span>
        </p>
      </div>

      {/* Summary chips */}
      <div className="flex items-center gap-3 flex-wrap">
        {[
          { label: `${INTEGRATION_SUMMARY.active} نشط`, color: 'bg-emerald-100 text-emerald-700 border-emerald-200', filter: 'Active' as StatusFilter },
          { label: `${INTEGRATION_SUMMARY.warning} تحذير`, color: 'bg-amber-100 text-amber-700 border-amber-200', filter: 'Warning' as StatusFilter },
          { label: `${INTEGRATION_SUMMARY.error} خطأ`, color: 'bg-red-100 text-red-700 border-red-200', filter: 'Error' as StatusFilter },
          { label: `${INTEGRATION_SUMMARY.total} إجمالي`, color: 'bg-muted text-muted-foreground border-border', filter: 'all' as StatusFilter },
        ].map((chip) => (
          <button
            key={chip.filter}
            onClick={() => setStatusFilter(statusFilter === chip.filter ? 'all' : chip.filter)}
            className={cn('flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-semibold transition-all', chip.color, statusFilter === chip.filter && 'ring-2 ring-offset-1 ring-accent-integrations')}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { labelAr: 'إجمالي التكاملات', value: INTEGRATION_SUMMARY.total, Icon: Database, color: 'text-accent-integrations bg-accent-integrations/10' },
          { labelAr: 'نشط',    value: INTEGRATION_SUMMARY.active,  Icon: CheckCircle,   color: 'text-success bg-success/10' },
          { labelAr: 'تحذير',  value: INTEGRATION_SUMMARY.warning, Icon: AlertTriangle, color: 'text-warning bg-warning/10' },
          { labelAr: 'خطأ',    value: INTEGRATION_SUMMARY.error,   Icon: XCircle,       color: 'text-danger bg-danger/10' },
        ].map((card) => (
          <div key={card.labelAr} className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
            <div className={cn('flex size-11 items-center justify-center rounded-xl shrink-0', card.color)}>
              <card.Icon className="size-5" />
            </div>
            <div>
              <p className="text-2xl font-bold leading-none font-inter">{card.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{card.labelAr}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Search */}
        <div className="relative">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
          <input
            type="text" placeholder="بحث بالاسم..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-52 rounded-lg border border-input bg-background ps-9 pe-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-accent-integrations"
          />
          {search && <button onClick={() => setSearch('')} className="absolute end-2 top-1/2 -translate-y-1/2"><X className="size-3.5 text-muted-foreground" /></button>}
        </div>

        {/* Type filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground">النوع:</span>
          {(['all', 'Real-time', 'Batch', 'On-demand'] as TypeFilter[]).map((t) => (
            <button key={t} onClick={() => setTypeFilter(t)}
              className={cn('rounded-full px-3 py-1 text-xs font-medium border transition-all',
                typeFilter === t ? 'bg-accent-integrations text-white border-accent-integrations' : 'border-border text-muted-foreground hover:border-accent-integrations/40')}>
              {t === 'all' ? 'الكل' : TYPE_AR[t]}
            </button>
          ))}
        </div>
      </div>

      {/* Integrations list */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Search className="size-12 text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground text-sm">لا توجد تكاملات تطابق البحث</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((integration) => (
            <IntegrationRow
              key={integration.id}
              integration={integration}
              onViewFull={() => setFullLogTarget(integration)}
            />
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground text-center pb-2">
        يعرض {filtered.length} من {INTEGRATION_SUMMARY.total} تكامل
      </p>

      {fullLogTarget && <AuditLogModal integration={fullLogTarget} onClose={() => setFullLogTarget(null)} />}
    </div>
  )
}
