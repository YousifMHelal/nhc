'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  AlertTriangle, Clock, Plus, X, CheckCircle,
  ArrowUpRight, ExternalLink, ChevronUp, ChevronsUpDown,
  ArrowUp, ArrowDown, BarChart3,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { StatusPill } from '@/components/shared/status-pill'
import { SALES_REPS, getSalesRepById, SPRINT_INFO } from '@/lib/mock-data'
import { toast } from 'sonner'
import type { Ticket, TicketStatus, TicketSeverity, SupportLevel } from '@/lib/types'
import { cn, toAr } from '@/lib/utils'

// ─── Config ───────────────────────────────────────────────────────────────────

const SEV_STYLES: Record<TicketSeverity, string> = {
  Critical: 'bg-sev-critical-bg text-sev-critical border border-sev-critical-border',
  High:     'bg-sev-high-bg text-sev-high border border-sev-high-border',
  Medium:   'bg-sev-medium-bg text-sev-medium border border-sev-medium-border',
  Low:      'bg-sev-low-bg text-sev-low border border-sev-low-border',
}
const SEV_AR: Record<TicketSeverity, string> = { Critical: 'حرج', High: 'عالي', Medium: 'متوسط', Low: 'منخفض' }
const SEV_ORDER: Record<TicketSeverity, number> = { Critical: 0, High: 1, Medium: 2, Low: 3 }
const STATUS_AR: Record<TicketStatus, string> = { Open: 'مفتوح', 'In Progress': 'قيد التنفيذ', Resolved: 'محلول', Closed: 'مغلق' }
const SEVERITIES: TicketSeverity[] = ['Critical', 'High', 'Medium', 'Low']
const LEVELS: SupportLevel[] = ['L1', 'L2']
const STATUSES: TicketStatus[] = ['Open', 'In Progress', 'Resolved', 'Closed']

// ─── SLA Timer ────────────────────────────────────────────────────────────────

function useSlaCountdown(deadline: string) {
  const [remaining, setRemaining] = useState(() => Math.max(0, new Date(deadline).getTime() - Date.now()))
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
    critical: remaining > 0 && remaining < 30 * 60_000,     // < 30 min → red
    urgent:   remaining > 0 && remaining < 3_600_000,        // < 1 hr → orange
  }
}

function SlaTimer({ deadline, status }: { deadline: string; status: TicketStatus }) {
  const { h, m, s, expired, critical, urgent } = useSlaCountdown(deadline)
  if (status === 'Resolved' || status === 'Closed')
    return <span className="text-xs text-muted-foreground">—</span>
  if (expired)
    return <span className="flex items-center gap-1 text-xs font-bold text-danger"><AlertTriangle className="size-3" />انتهت</span>
  return (
    <span className={cn('flex items-center gap-1 text-xs font-mono font-semibold tabular-nums',
      critical ? 'text-danger' : urgent ? 'text-warning' : 'text-success')}>
      <Clock className="size-3 shrink-0" />
      {String(h).padStart(2,'0')}:{String(m).padStart(2,'0')}:{String(s).padStart(2,'0')}
    </span>
  )
}

// ─── Modal ────────────────────────────────────────────────────────────────────

function Modal({ open, onClose, children, maxWidth = 'max-w-2xl' }: { open: boolean; onClose: () => void; children: React.ReactNode; maxWidth?: string }) {
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/25 backdrop-blur-sm" onClick={onClose} />
      <div className={cn('relative z-10 w-full rounded-xl bg-background border border-border shadow-2xl max-h-[90vh] overflow-y-auto', maxWidth)}>
        {children}
      </div>
    </div>
  )
}

// ─── Ticket Detail Modal ──────────────────────────────────────────────────────

function TicketDetailModal({ ticket, onClose, onStatusChange, onEscalate }:
  { ticket: Ticket; onClose: () => void; onStatusChange: (id: string, s: TicketStatus) => void; onEscalate: (id: string) => void }) {
  const rep = getSalesRepById(ticket.assignedTo)
  return (
    <div className="flex flex-col">
      <div className="sticky top-0 z-10 bg-background border-b border-border px-6 py-4 flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-mono text-muted-foreground font-inter">{ticket.id}</span>
            <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', SEV_STYLES[ticket.severity])}>{SEV_AR[ticket.severity]}</span>
            <StatusPill type="ticket" value={ticket.status} />
            <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">{ticket.level}</span>
          </div>
          <h2 className="text-base font-bold mt-2">{ticket.titleAr}</h2>
        </div>
        <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-muted transition-colors shrink-0"><X className="size-4" /></button>
      </div>

      <div className="p-6 flex flex-col gap-6">
        <div className="rounded-lg bg-muted/50 p-4"><p className="text-sm leading-relaxed">{ticket.descriptionAr}</p></div>

        <div className="grid grid-cols-3 gap-4">
          <div><p className="text-xs text-muted-foreground mb-1">مسند إلى</p><p className="text-sm font-medium">{rep?.nameAr ?? ticket.assignedTo}</p></div>
          <div><p className="text-xs text-muted-foreground mb-1">مهلة SLA</p><SlaTimer deadline={ticket.slaDeadline} status={ticket.status} /></div>
          <div><p className="text-xs text-muted-foreground mb-1">تاريخ الإنشاء</p><p className="text-sm font-medium font-inter">{new Date(ticket.createdAt).toLocaleDateString('ar-SA',{year:'numeric',month:'short',day:'numeric'})}</p></div>
        </div>

        {ticket.steps.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold mb-3">الخطوات المتخذة</h3>
            <div className="flex flex-col gap-0">
              {ticket.steps.map((step, i) => (
                <div key={i} className="flex gap-3 text-sm">
                  <div className="flex flex-col items-center shrink-0">
                    <CheckCircle className="size-4 text-success mt-0.5" />
                    {i < ticket.steps.length - 1 && <div className="w-0.5 flex-1 bg-border my-1 min-h-3" />}
                  </div>
                  <div className="pb-4 flex-1">
                    <p className="font-medium">{step.action}</p>
                    {step.note && <p className="text-xs text-muted-foreground mt-0.5">{step.note}</p>}
                    <p className="text-[10px] text-muted-foreground mt-1 font-inter">{new Date(step.date).toLocaleString('ar-SA')} — {step.by}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {ticket.escalationHistory.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-1.5"><ArrowUpRight className="size-4 text-danger" />سجل التصعيد</h3>
            <div className="flex flex-col gap-2">
              {ticket.escalationHistory.map((e, i) => (
                <div key={i} className="rounded-lg border border-danger/20 bg-danger/5 p-3">
                  <p className="text-sm font-medium">{e.fromLevel} → {e.toLevel}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{e.reason}</p>
                  <p className="text-[10px] text-muted-foreground mt-1 font-inter">{new Date(e.date).toLocaleString('ar-SA')} — {e.escalatedBy}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {ticket.rcaLink && (
          <a href={ticket.rcaLink} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-sm text-brand hover:underline">
            <ExternalLink className="size-3.5" />رابط تحليل السبب الجذري (RCA)
          </a>
        )}

        {ticket.comments.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold mb-3">التعليقات</h3>
            <div className="flex flex-col gap-2">
              {ticket.comments.map((c, i) => (
                <div key={i} className="rounded-lg bg-muted/50 p-3">
                  <p className="text-sm">{c.text}</p>
                  <p className="text-[10px] text-muted-foreground mt-1 font-inter">{c.by} — {new Date(c.date).toLocaleString('ar-SA')}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="border-t border-border pt-4 flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-muted-foreground">تغيير الحالة:</span>
          {STATUSES.map((s) => (
            <button key={s} onClick={() => onStatusChange(ticket.id, s)}
              className={cn('rounded-full px-3 py-1 text-xs font-medium border transition-all',
                ticket.status === s ? 'bg-accent-support text-white border-accent-support' : 'border-border text-muted-foreground hover:border-accent-support/50')}>
              {STATUS_AR[s]}
            </button>
          ))}
          {ticket.level === 'L1' && ticket.status !== 'Resolved' && ticket.status !== 'Closed' && (
            <Button size="sm" variant="outline" className="ms-auto gap-1.5 text-danger border-danger/30 hover:bg-danger/5"
              onClick={() => { onEscalate(ticket.id); onClose() }}>
              <ArrowUpRight className="size-3.5" />تصعيد إلى L2
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Create Ticket Modal ──────────────────────────────────────────────────────

interface NewTicketForm { titleAr: string; descriptionAr: string; severity: TicketSeverity; level: SupportLevel; assignedTo: string }

const SLA_HOURS: Record<TicketSeverity, number> = { Critical: 4, High: 48, Medium: 72, Low: 168 }
const EMPTY_FORM: NewTicketForm = { titleAr: '', descriptionAr: '', severity: 'Medium', level: 'L1', assignedTo: 'rep-001' }

function CreateTicketModal({ onClose, onCreate }: { onClose: () => void; onCreate: (t: Ticket) => Promise<void> }) {
  const [form, setForm] = useState<NewTicketForm>(EMPTY_FORM)
  const update = (p: Partial<NewTicketForm>) => setForm((f) => ({ ...f, ...p }))

  const handleCreate = async () => {
    if (!form.titleAr.trim()) return
    const now = new Date().toISOString()
    const slaHours = SLA_HOURS[form.severity]
    const ticket: Ticket = {
      id: `tkt-${Date.now()}`, titleAr: form.titleAr, descriptionAr: form.descriptionAr,
      severity: form.severity, status: 'Open', level: form.level, assignedTo: form.assignedTo,
      slaDeadline: new Date(Date.now() + slaHours * 3_600_000).toISOString(), slaHours,
      steps: [{ date: now, action: 'فتح التذكرة', by: form.assignedTo }],
      escalationHistory: [], comments: [], createdAt: now,
    }
    await onCreate(ticket)
    onClose()
  }

  return (
    <div className="flex flex-col">
      <div className="sticky top-0 bg-background border-b border-border px-6 py-4 flex items-center justify-between">
        <h2 className="text-base font-bold">إنشاء تذكرة دعم جديدة</h2>
        <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-muted transition-colors"><X className="size-4" /></button>
      </div>
      <div className="p-6 flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">عنوان المشكلة *</label>
          <Input placeholder="مثال: عدم استلام مستندات الملكية" value={form.titleAr} onChange={(e) => update({ titleAr: e.target.value })} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">وصف المشكلة</label>
          <textarea className="min-h-[88px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring resize-none"
            placeholder="اكتب وصفًا تفصيليًا..." value={form.descriptionAr} onChange={(e) => update({ descriptionAr: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-5">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">الأولوية</label>
            <div className="flex flex-wrap gap-1.5">
              {SEVERITIES.map((s) => (
                <button key={s} onClick={() => update({ severity: s })}
                  className={cn('rounded-full px-3 py-1 text-xs font-medium border transition-all',
                    form.severity === s ? SEV_STYLES[s] : 'border-border text-muted-foreground hover:border-muted-foreground/50')}>
                  {SEV_AR[s]}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">مستوى الدعم</label>
            <div className="flex gap-2">
              {LEVELS.map((l) => (
                <button key={l} onClick={() => update({ level: l })}
                  className={cn('rounded-full px-5 py-1.5 text-xs font-bold border-2 transition-all',
                    form.level === l ? 'border-accent-support bg-accent-support text-white' : 'border-border text-muted-foreground hover:border-accent-support/40')}>
                  {l}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">إسناد إلى</label>
          <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
            value={form.assignedTo} onChange={(e) => update({ assignedTo: e.target.value })}>
            {SALES_REPS.map((r) => <option key={r.id} value={r.id}>{r.nameAr} — {r.region}</option>)}
          </select>
        </div>
        <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
          <Button variant="outline" onClick={onClose}>إلغاء</Button>
          <Button className="bg-accent-support hover:bg-accent-support/90 text-white" onClick={handleCreate} disabled={!form.titleAr.trim()}>إنشاء التذكرة</Button>
        </div>
      </div>
    </div>
  )
}

// ─── Ticket Row ───────────────────────────────────────────────────────────────

function TicketRow({ ticket, onClick }: { ticket: Ticket; onClick: () => void }) {
  const rep = getSalesRepById(ticket.assignedTo)
  return (
    <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 hover:shadow-md hover:border-accent-support/30 transition-all cursor-pointer" onClick={onClick}>
      <div className="flex flex-col gap-1 flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-mono text-muted-foreground font-inter">{ticket.id}</span>
          <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', SEV_STYLES[ticket.severity])}>{SEV_AR[ticket.severity]}</span>
          <StatusPill type="ticket" value={ticket.status} />
          <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">{ticket.level}</span>
          {ticket.level === 'L1' && ticket.status !== 'Resolved' && ticket.status !== 'Closed' && (
            <span className="text-[10px] text-danger/70">قابل للتصعيد</span>
          )}
        </div>
        <p className="text-sm font-semibold leading-snug mt-1">{ticket.titleAr}</p>
      </div>
      <div className="shrink-0 text-end flex flex-col gap-1 items-end">
        <SlaTimer deadline={ticket.slaDeadline} status={ticket.status} />
        <p className="text-[10px] text-muted-foreground">{rep?.nameAr ?? ticket.assignedTo}</p>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type SortField = 'severity' | 'createdAt' | 'slaDeadline' | 'status'
type StatusFilter = TicketStatus | 'all'
type SeverityFilter = TicketSeverity | 'all'

const STATUS_TABS: { id: StatusFilter; labelAr: string }[] = [
  { id: 'all', labelAr: 'الكل' },
  { id: 'Open', labelAr: 'مفتوح' },
  { id: 'In Progress', labelAr: 'قيد التنفيذ' },
  { id: 'Resolved', labelAr: 'محلول' },
  { id: 'Closed', labelAr: 'مغلق' },
]

export default function SupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [sevFilter, setSevFilter] = useState<SeverityFilter>('all')
  const [statusTab, setStatusTab] = useState<StatusFilter>('all')
  const [selected, setSelected] = useState<Ticket | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [sortField, setSortField] = useState<SortField>('severity')
  const [sortAsc, setSortAsc] = useState(true)

  useEffect(() => {
    fetch('/api/tickets')
      .then((r) => r.json())
      .then((data) => setTickets(data))
      .catch(() => toast.error('فشل تحميل التذاكر'))
      .finally(() => setLoading(false))
  }, [])

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortAsc((a) => !a)
    else { setSortField(field); setSortAsc(true) }
  }

  const filtered = useMemo(() => {
    let list = tickets.filter((t) => {
      if (sevFilter !== 'all' && t.severity !== sevFilter) return false
      if (statusTab !== 'all' && t.status !== statusTab) return false
      return true
    })
    list = [...list].sort((a, b) => {
      let cmp = 0
      if (sortField === 'severity')    cmp = SEV_ORDER[a.severity] - SEV_ORDER[b.severity]
      else if (sortField === 'createdAt')  cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      else if (sortField === 'slaDeadline') cmp = new Date(a.slaDeadline).getTime() - new Date(b.slaDeadline).getTime()
      else if (sortField === 'status') cmp = a.status.localeCompare(b.status)
      return sortAsc ? cmp : -cmp
    })
    return list
  }, [tickets, sevFilter, statusTab, sortField, sortAsc])

  const openCount = tickets.filter((t) => t.status === 'Open').length
  const inProgCount = tickets.filter((t) => t.status === 'In Progress').length
  const critCount = tickets.filter((t) => t.severity === 'Critical').length
  const closedCount = tickets.filter((t) => t.status === 'Resolved' || t.status === 'Closed').length

  const handleStatusChange = useCallback(async (id: string, status: TicketStatus) => {
    const resolvedAt = (status === 'Resolved' || status === 'Closed') ? new Date().toISOString() : null
    try {
      await fetch(`/api/tickets/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, ...(resolvedAt && { resolvedAt }) }),
      })
      setTickets((prev) => prev.map((t) => t.id === id ? { ...t, status, ...(resolvedAt && { resolvedAt }) } : t))
      setSelected((prev) => prev?.id === id ? { ...prev, status } : prev)
      toast.success(`تم تحديث حالة التذكرة إلى "${STATUS_AR[status]}"`)
    } catch {
      toast.error('فشل تحديث الحالة')
    }
  }, [])

  const handleCreate = useCallback(async (ticket: Ticket) => {
    try {
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ticket),
      })
      const saved: Ticket = await res.json()
      setTickets((prev) => [saved, ...prev])
      toast.success('تم إنشاء التذكرة بنجاح')
    } catch {
      toast.error('فشل إنشاء التذكرة')
    }
  }, [])

  const handleEscalate = useCallback(async (id: string) => {
    const now = new Date().toISOString()
    const ticket = tickets.find((t) => t.id === id)
    if (!ticket) return
    const escalationHistory = [...ticket.escalationHistory, {
      date: now, fromLevel: 'L1' as const, toLevel: 'L2' as const,
      reason: 'تصعيد يدوي من لوحة الدعم الفني', escalatedBy: 'rep-001',
    }]
    const steps = [...ticket.steps, { date: now, action: 'تصعيد إلى L2', by: 'system' }]
    try {
      await fetch(`/api/tickets/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ escalationHistory, steps }),
      })
      setTickets((prev) => prev.map((t) => t.id !== id ? t : { ...t, level: 'L2', escalationHistory, steps }))
      toast.success('تم تصعيد التذكرة إلى المستوى L2')
    } catch {
      toast.error('فشل التصعيد')
    }
  }, [tickets])

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ChevronsUpDown className="size-3 opacity-40" />
    return sortAsc ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />
  }

  if (loading) return (
    <div className="flex items-center justify-center py-32 text-muted-foreground text-sm">جارٍ التحميل...</div>
  )

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-dark">تذاكر الدعم</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{toAr(tickets.length)} تذكرة إجمالاً</p>
        </div>
        <Button className="bg-accent-support hover:bg-accent-support/90 text-white gap-1.5" onClick={() => setShowCreate(true)}>
          <Plus className="size-4" />تذكرة جديدة
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { labelAr: 'مفتوحة', value: openCount, color: 'text-sky-600 bg-sky-50' },
          { labelAr: 'قيد التنفيذ', value: inProgCount, color: 'text-amber-600 bg-amber-50' },
          { labelAr: 'حرجة', value: critCount, color: 'text-danger bg-danger/10' },
          { labelAr: 'محلولة / مغلقة', value: closedCount, color: 'text-success bg-success/10' },
        ].map((s) => (
          <div key={s.labelAr} className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
            <div className={cn('flex size-12 items-center justify-center rounded-xl text-2xl font-bold font-inter shrink-0', s.color)}>{toAr(s.value)}</div>
            <p className="text-sm font-medium">{s.labelAr}</p>
          </div>
        ))}
      </div>

      {/* Sort + Severity filters */}
      <div className="flex items-center gap-4 flex-wrap">
        {/* Sort buttons */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground">ترتيب:</span>
          {([['severity','الأولوية'],['slaDeadline','مهلة SLA'],['createdAt','التاريخ'],['status','الحالة']] as [SortField, string][]).map(([f, label]) => (
            <button key={f} onClick={() => toggleSort(f)}
              className={cn('flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium border transition-all',
                sortField === f ? 'bg-accent-support text-white border-accent-support' : 'border-border text-muted-foreground hover:border-accent-support/40')}>
              {label} <SortIcon field={f} />
            </button>
          ))}
        </div>
        {/* Severity filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground shrink-0">الأولوية:</span>
          {(['all','Critical','High','Medium','Low'] as SeverityFilter[]).map((f) => (
            <button key={f} onClick={() => setSevFilter(f)}
              className={cn('rounded-full px-3 py-1 text-xs font-medium border transition-all',
                sevFilter === f ? 'bg-accent-support text-white border-accent-support' : 'border-border text-muted-foreground hover:border-accent-support/40')}>
              {f === 'all' ? 'الكل' : SEV_AR[f]}
            </button>
          ))}
        </div>
      </div>

      {/* Status tabs */}
      <div className="flex border-b border-border overflow-x-auto">
        {STATUS_TABS.map((tab) => (
          <button key={tab.id} onClick={() => setStatusTab(tab.id)}
            className={cn('shrink-0 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors',
              statusTab === tab.id ? 'border-accent-support text-accent-support' : 'border-transparent text-muted-foreground hover:text-foreground')}>
            {tab.labelAr}
            {tab.id !== 'all' && (
              <span className="ms-1.5 rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                {toAr(tickets.filter((t) => t.status === tab.id).length)}
              </span>
            )}
          </button>
        ))}
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

      {/* Sprint info card */}
      <div className="rounded-xl border border-border bg-card p-5 mt-2">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="size-4 text-accent-support" />
            <h3 className="text-sm font-semibold">{SPRINT_INFO.sprintNameAr}</h3>
          </div>
          <span className="text-xs text-muted-foreground">يوم {toAr(10 - SPRINT_INFO.daysRemaining)}/١٠ · {toAr(SPRINT_INFO.daysRemaining)} أيام متبقية</span>
        </div>
        <div className="flex items-center gap-3">
          <Progress value={SPRINT_INFO.progressPercent} className="flex-1 h-2.5" />
          <span className="text-sm font-bold text-accent-support font-inter">{toAr(SPRINT_INFO.progressPercent)}٪</span>
        </div>
        <p className="text-xs text-muted-foreground mt-2">{SPRINT_INFO.completedTasks} من {SPRINT_INFO.totalTasks} مهمة مكتملة</p>
      </div>

      {/* Ticket detail */}
      <Modal open={selected !== null} onClose={() => setSelected(null)}>
        {selected && <TicketDetailModal ticket={selected} onClose={() => setSelected(null)}
          onStatusChange={handleStatusChange} onEscalate={handleEscalate} />}
      </Modal>

      {/* Create ticket */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} maxWidth="max-w-xl">
        <CreateTicketModal onClose={() => setShowCreate(false)} onCreate={handleCreate} />
      </Modal>
    </div>
  )
}
