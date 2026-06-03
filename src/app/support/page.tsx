'use client'

import { useState, useEffect } from 'react'
import {
  AlertTriangle,
  Clock,
  Plus,
  X,
  CheckCircle,
  ArrowUpRight,
  ExternalLink,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { StatusPill } from '@/components/shared/status-pill'
import { TICKETS, SALES_REPS, getSalesRepById } from '@/lib/mock-data'
import type { Ticket, TicketStatus, TicketSeverity, SupportLevel } from '@/lib/types'
import { cn } from '@/lib/utils'

// ─── Config ───────────────────────────────────────────────────────────────────

const SEV_STYLES: Record<TicketSeverity, string> = {
  Critical: 'bg-red-100 text-red-700 border border-red-200',
  High: 'bg-orange-100 text-orange-700 border border-orange-200',
  Medium: 'bg-amber-100 text-amber-700 border border-amber-200',
  Low: 'bg-sky-100 text-sky-700 border border-sky-200',
}
const SEV_AR: Record<TicketSeverity, string> = {
  Critical: 'حرج',
  High: 'عالي',
  Medium: 'متوسط',
  Low: 'منخفض',
}
const STATUS_AR: Record<TicketStatus, string> = {
  Open: 'مفتوح',
  'In Progress': 'قيد التنفيذ',
  Resolved: 'محلول',
  Closed: 'مغلق',
}
const SEVERITIES: TicketSeverity[] = ['Critical', 'High', 'Medium', 'Low']
const LEVELS: SupportLevel[] = ['L1', 'L2']
const STATUSES: TicketStatus[] = ['Open', 'In Progress', 'Resolved', 'Closed']

// ─── SLA Timer ────────────────────────────────────────────────────────────────

function useSlaCountdown(deadline: string) {
  const [remaining, setRemaining] = useState(() =>
    Math.max(0, new Date(deadline).getTime() - Date.now())
  )
  useEffect(() => {
    const id = setInterval(() => {
      const r = Math.max(0, new Date(deadline).getTime() - Date.now())
      setRemaining(r)
      if (r === 0) clearInterval(id)
    }, 1000)
    return () => clearInterval(id)
  }, [deadline])

  return {
    h: Math.floor(remaining / 3_600_000),
    m: Math.floor((remaining % 3_600_000) / 60_000),
    s: Math.floor((remaining % 60_000) / 1_000),
    expired: remaining === 0,
    urgent: remaining > 0 && remaining < 4 * 3_600_000,
  }
}

function SlaTimer({ deadline, status }: { deadline: string; status: TicketStatus }) {
  const { h, m, s, expired, urgent } = useSlaCountdown(deadline)

  if (status === 'Resolved' || status === 'Closed') {
    return <span className="text-xs text-muted-foreground">SLA منتهية</span>
  }
  if (expired) {
    return (
      <span className="flex items-center gap-1 text-xs font-bold text-danger">
        <AlertTriangle className="size-3" />
        انتهت المهلة
      </span>
    )
  }
  return (
    <span className={cn('flex items-center gap-1 text-xs font-mono font-semibold tabular-nums', urgent ? 'text-danger' : 'text-warning')}>
      <Clock className="size-3 shrink-0" />
      {String(h).padStart(2, '0')}:{String(m).padStart(2, '0')}:{String(s).padStart(2, '0')}
    </span>
  )
}

// ─── Modal ────────────────────────────────────────────────────────────────────

function Modal({
  open,
  onClose,
  children,
  maxWidth = 'max-w-2xl',
}: {
  open: boolean
  onClose: () => void
  children: React.ReactNode
  maxWidth?: string
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/25 backdrop-blur-sm" onClick={onClose} />
      <div
        className={cn(
          'relative z-10 w-full rounded-xl bg-background border border-border shadow-2xl max-h-[90vh] overflow-y-auto',
          maxWidth
        )}
      >
        {children}
      </div>
    </div>
  )
}

// ─── Ticket Detail Modal ──────────────────────────────────────────────────────

function TicketDetailModal({
  ticket,
  onClose,
  onStatusChange,
}: {
  ticket: Ticket
  onClose: () => void
  onStatusChange: (id: string, status: TicketStatus) => void
}) {
  const rep = getSalesRepById(ticket.assignedTo)

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border px-6 py-4 flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-mono text-muted-foreground">{ticket.id}</span>
            <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', SEV_STYLES[ticket.severity])}>
              {SEV_AR[ticket.severity]}
            </span>
            <StatusPill type="ticket" value={ticket.status} />
            <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
              {ticket.level}
            </span>
          </div>
          <h2 className="text-base font-bold mt-2">{ticket.titleAr}</h2>
        </div>
        <button
          onClick={onClose}
          className="rounded-lg p-1.5 hover:bg-muted transition-colors shrink-0"
        >
          <X className="size-4" />
        </button>
      </div>

      <div className="p-6 flex flex-col gap-6">
        {/* Description */}
        <div className="rounded-lg bg-muted/50 p-4">
          <p className="text-sm leading-relaxed">{ticket.descriptionAr}</p>
        </div>

        {/* Meta */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1">مسند إلى</p>
            <p className="text-sm font-medium">{rep?.nameAr ?? ticket.assignedTo}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">مهلة SLA</p>
            <SlaTimer deadline={ticket.slaDeadline} status={ticket.status} />
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">تاريخ الإنشاء</p>
            <p className="text-sm font-medium">
              {new Date(ticket.createdAt).toLocaleDateString('ar-SA', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </p>
          </div>
        </div>

        {/* Steps */}
        {ticket.steps.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold mb-3">الخطوات المتخذة</h3>
            <div className="flex flex-col gap-0">
              {ticket.steps.map((step, i) => (
                <div key={i} className="flex gap-3 text-sm">
                  <div className="flex flex-col items-center shrink-0">
                    <CheckCircle className="size-4 text-success mt-0.5" />
                    {i < ticket.steps.length - 1 && (
                      <div className="w-0.5 flex-1 bg-border my-1 min-h-3" />
                    )}
                  </div>
                  <div className="pb-4 flex-1">
                    <p className="font-medium">{step.action}</p>
                    {step.note && (
                      <p className="text-xs text-muted-foreground mt-0.5">{step.note}</p>
                    )}
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {new Date(step.date).toLocaleString('ar-SA')} — {step.by}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Escalation history */}
        {ticket.escalationHistory.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-1.5">
              <ArrowUpRight className="size-4 text-danger" />
              سجل التصعيد
            </h3>
            <div className="flex flex-col gap-2">
              {ticket.escalationHistory.map((e, i) => (
                <div key={i} className="rounded-lg border border-danger/20 bg-danger/5 p-3">
                  <p className="text-sm font-medium">
                    {e.fromLevel} → {e.toLevel}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">{e.reason}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {new Date(e.date).toLocaleString('ar-SA')} — {e.escalatedBy}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* RCA link */}
        {ticket.rcaLink && (
          <a
            href={ticket.rcaLink}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 text-sm text-brand hover:underline"
          >
            <ExternalLink className="size-3.5" />
            رابط تحليل السبب الجذري (RCA)
          </a>
        )}

        {/* Comments */}
        {ticket.comments.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold mb-3">التعليقات</h3>
            <div className="flex flex-col gap-2">
              {ticket.comments.map((c, i) => (
                <div key={i} className="rounded-lg bg-muted/50 p-3">
                  <p className="text-sm">{c.text}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {c.by} — {new Date(c.date).toLocaleString('ar-SA')}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Status change */}
        <div className="border-t border-border pt-4 flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-muted-foreground">تغيير الحالة:</span>
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => onStatusChange(ticket.id, s)}
              className={cn(
                'rounded-full px-3 py-1 text-xs font-medium border transition-all',
                ticket.status === s
                  ? 'bg-accent-support text-white border-accent-support'
                  : 'border-border text-muted-foreground hover:border-accent-support/50'
              )}
            >
              {STATUS_AR[s]}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Create Ticket Modal ──────────────────────────────────────────────────────

interface NewTicketForm {
  titleAr: string
  descriptionAr: string
  severity: TicketSeverity
  level: SupportLevel
  assignedTo: string
}

const EMPTY_FORM: NewTicketForm = {
  titleAr: '',
  descriptionAr: '',
  severity: 'Medium',
  level: 'L1',
  assignedTo: 'rep-001',
}

const SLA_HOURS: Record<TicketSeverity, number> = {
  Critical: 4,
  High: 48,
  Medium: 72,
  Low: 168,
}

function CreateTicketModal({
  onClose,
  onCreate,
}: {
  onClose: () => void
  onCreate: (t: Ticket) => void
}) {
  const [form, setForm] = useState<NewTicketForm>(EMPTY_FORM)

  const update = (p: Partial<NewTicketForm>) => setForm((f) => ({ ...f, ...p }))

  const handleCreate = () => {
    if (!form.titleAr.trim()) return
    const now = new Date().toISOString()
    const slaHours = SLA_HOURS[form.severity]
    const slaDeadline = new Date(Date.now() + slaHours * 3_600_000).toISOString()
    const ticket: Ticket = {
      id: `tkt-${Date.now()}`,
      titleAr: form.titleAr,
      descriptionAr: form.descriptionAr,
      severity: form.severity,
      status: 'Open',
      level: form.level,
      assignedTo: form.assignedTo,
      slaDeadline,
      slaHours,
      steps: [{ date: now, action: 'فتح التذكرة', by: form.assignedTo }],
      escalationHistory: [],
      comments: [],
      createdAt: now,
    }
    onCreate(ticket)
    onClose()
  }

  return (
    <div className="flex flex-col">
      <div className="sticky top-0 bg-background border-b border-border px-6 py-4 flex items-center justify-between">
        <h2 className="text-base font-bold">إنشاء تذكرة دعم جديدة</h2>
        <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-muted transition-colors">
          <X className="size-4" />
        </button>
      </div>

      <div className="p-6 flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">عنوان المشكلة *</label>
          <Input
            placeholder="مثال: عدم استلام مستندات الملكية"
            value={form.titleAr}
            onChange={(e) => update({ titleAr: e.target.value })}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">وصف المشكلة</label>
          <textarea
            className="min-h-[88px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring resize-none"
            placeholder="اكتب وصفًا تفصيليًا للمشكلة..."
            value={form.descriptionAr}
            onChange={(e) => update({ descriptionAr: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-2 gap-5">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">الأولوية</label>
            <div className="flex flex-wrap gap-1.5">
              {SEVERITIES.map((s) => (
                <button
                  key={s}
                  onClick={() => update({ severity: s })}
                  className={cn(
                    'rounded-full px-3 py-1 text-xs font-medium border transition-all',
                    form.severity === s
                      ? SEV_STYLES[s]
                      : 'border-border text-muted-foreground hover:border-muted-foreground/50'
                  )}
                >
                  {SEV_AR[s]}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">مستوى الدعم</label>
            <div className="flex gap-2">
              {LEVELS.map((l) => (
                <button
                  key={l}
                  onClick={() => update({ level: l })}
                  className={cn(
                    'rounded-full px-5 py-1.5 text-xs font-bold border-2 transition-all',
                    form.level === l
                      ? 'border-accent-support bg-accent-support text-white'
                      : 'border-border text-muted-foreground hover:border-accent-support/40'
                  )}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">إسناد إلى</label>
          <select
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
            value={form.assignedTo}
            onChange={(e) => update({ assignedTo: e.target.value })}
          >
            {SALES_REPS.map((rep) => (
              <option key={rep.id} value={rep.id}>
                {rep.nameAr} — {rep.region}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
          <Button variant="outline" onClick={onClose}>
            إلغاء
          </Button>
          <Button
            className="bg-accent-support hover:bg-accent-support/90 text-white"
            onClick={handleCreate}
            disabled={!form.titleAr.trim()}
          >
            إنشاء التذكرة
          </Button>
        </div>
      </div>
    </div>
  )
}

// ─── Ticket Row ───────────────────────────────────────────────────────────────

function TicketRow({ ticket, onClick }: { ticket: Ticket; onClick: () => void }) {
  const rep = getSalesRepById(ticket.assignedTo)

  return (
    <div
      className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 hover:shadow-md hover:border-accent-support/30 transition-all cursor-pointer"
      onClick={onClick}
    >
      <div className="flex flex-col gap-1 flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-mono text-muted-foreground">{ticket.id}</span>
          <span
            className={cn(
              'rounded-full px-2.5 py-0.5 text-xs font-medium',
              SEV_STYLES[ticket.severity]
            )}
          >
            {SEV_AR[ticket.severity]}
          </span>
          <StatusPill type="ticket" value={ticket.status} />
          <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
            {ticket.level}
          </span>
        </div>
        <p className="text-sm font-semibold leading-snug mt-1">{ticket.titleAr}</p>
        <p className="text-xs text-muted-foreground mt-0.5 truncate">{ticket.descriptionAr}</p>
      </div>

      <div className="shrink-0 text-end flex flex-col gap-1 items-end">
        <SlaTimer deadline={ticket.slaDeadline} status={ticket.status} />
        <p className="text-[10px] text-muted-foreground">{rep?.nameAr ?? ticket.assignedTo}</p>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type SeverityFilter = TicketSeverity | 'all'
type StatusFilter = TicketStatus | 'all'

const SEV_FILTERS: SeverityFilter[] = ['all', 'Critical', 'High', 'Medium', 'Low']
const SEV_FILTER_AR: Record<SeverityFilter, string> = {
  all: 'الكل',
  Critical: 'حرج',
  High: 'عالي',
  Medium: 'متوسط',
  Low: 'منخفض',
}
const STATUS_FILTERS: StatusFilter[] = ['all', 'Open', 'In Progress', 'Resolved', 'Closed']
const STATUS_FILTER_AR: Record<StatusFilter, string> = {
  all: 'الكل',
  Open: 'مفتوح',
  'In Progress': 'قيد التنفيذ',
  Resolved: 'محلول',
  Closed: 'مغلق',
}

export default function SupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>(TICKETS)
  const [sevFilter, setSevFilter] = useState<SeverityFilter>('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [selected, setSelected] = useState<Ticket | null>(null)
  const [showCreate, setShowCreate] = useState(false)

  const filtered = tickets.filter((t) => {
    if (sevFilter !== 'all' && t.severity !== sevFilter) return false
    if (statusFilter !== 'all' && t.status !== statusFilter) return false
    return true
  })

  const openCount = tickets.filter((t) => t.status === 'Open').length
  const inProgressCount = tickets.filter((t) => t.status === 'In Progress').length
  const criticalCount = tickets.filter((t) => t.severity === 'Critical').length
  const closedCount = tickets.filter((t) => t.status === 'Resolved' || t.status === 'Closed').length

  const handleStatusChange = (id: string, status: TicketStatus) => {
    setTickets((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)))
    setSelected((prev) => (prev?.id === id ? { ...prev, status } : prev))
  }

  const handleCreate = (ticket: Ticket) => setTickets((prev) => [ticket, ...prev])

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-accent-support">تذاكر الدعم</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{tickets.length} تذكرة إجمالاً</p>
        </div>
        <Button
          className="bg-accent-support hover:bg-accent-support/90 text-white gap-1.5"
          onClick={() => setShowCreate(true)}
        >
          <Plus className="size-4" />
          تذكرة جديدة
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { labelAr: 'مفتوحة', value: openCount, color: 'text-sky-600 bg-sky-50' },
          { labelAr: 'قيد التنفيذ', value: inProgressCount, color: 'text-amber-600 bg-amber-50' },
          { labelAr: 'حرجة', value: criticalCount, color: 'text-danger bg-danger/10' },
          { labelAr: 'محلولة / مغلقة', value: closedCount, color: 'text-success bg-success/10' },
        ].map((s) => (
          <div
            key={s.labelAr}
            className="rounded-xl border border-border bg-card p-4 flex items-center gap-3"
          >
            <div
              className={cn(
                'flex size-12 items-center justify-center rounded-xl text-2xl font-bold shrink-0',
                s.color
              )}
            >
              {s.value}
            </div>
            <p className="text-sm font-medium">{s.labelAr}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs text-muted-foreground shrink-0">الأولوية:</span>
          {SEV_FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setSevFilter(f)}
              className={cn(
                'rounded-full px-3 py-1 text-xs font-medium border transition-all',
                sevFilter === f
                  ? 'bg-accent-support text-white border-accent-support'
                  : 'border-border text-muted-foreground hover:border-accent-support/40'
              )}
            >
              {SEV_FILTER_AR[f]}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs text-muted-foreground shrink-0">الحالة:</span>
          {STATUS_FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={cn(
                'rounded-full px-3 py-1 text-xs font-medium border transition-all',
                statusFilter === f
                  ? 'bg-accent-support text-white border-accent-support'
                  : 'border-border text-muted-foreground hover:border-accent-support/40'
              )}
            >
              {STATUS_FILTER_AR[f]}
            </button>
          ))}
        </div>
      </div>

      {/* Ticket list */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <CheckCircle className="size-12 text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground text-sm">لا توجد تذاكر تطابق الفلتر المحدد</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((ticket) => (
            <TicketRow key={ticket.id} ticket={ticket} onClick={() => setSelected(ticket)} />
          ))}
        </div>
      )}

      {/* Ticket detail modal */}
      <Modal open={selected !== null} onClose={() => setSelected(null)}>
        {selected && (
          <TicketDetailModal
            ticket={selected}
            onClose={() => setSelected(null)}
            onStatusChange={handleStatusChange}
          />
        )}
      </Modal>

      {/* Create ticket modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} maxWidth="max-w-xl">
        <CreateTicketModal onClose={() => setShowCreate(false)} onCreate={handleCreate} />
      </Modal>
    </div>
  )
}
