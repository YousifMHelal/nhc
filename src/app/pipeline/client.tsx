'use client'

import { useState, useCallback } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import {
  Phone,
  Mail,
  MapPin,
  Building2,
  Calendar,
  User,
  Plus,
  X,
  ChevronDown,
  SlidersHorizontal,
  Star,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from '@/components/ui/drawer'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { StatusPill } from '@/components/shared/status-pill'
import { ScoreRing } from '@/components/shared/score-ring'
import { KanbanCardSkeleton } from '@/components/shared/skeleton-card'
import type { Lead, SalesRep, PipelineStage, LeadSource, Channel } from '@/lib/types'
import { cn } from '@/lib/utils'

// ── Column definitions ────────────────────────────────────────────────────────

type KanbanColumn = {
  id: PipelineStage
  labelAr: string
  colorClass: string
  headerBg: string
}

const COLUMNS: KanbanColumn[] = [
  { id: 'New', labelAr: 'عميل محتمل', colorClass: 'text-sky-600', headerBg: 'bg-sky-50 border-sky-200' },
  { id: 'Contacted', labelAr: 'تأهيل', colorClass: 'text-blue-600', headerBg: 'bg-blue-50 border-blue-200' },
  { id: 'Qualified', labelAr: 'مؤهَّل', colorClass: 'text-violet-600', headerBg: 'bg-violet-50 border-violet-200' },
  { id: 'Proposal', labelAr: 'عرض سعر', colorClass: 'text-amber-600', headerBg: 'bg-amber-50 border-amber-200' },
  { id: 'Closed Won', labelAr: 'تعاقد', colorClass: 'text-emerald-600', headerBg: 'bg-emerald-50 border-emerald-200' },
]

const SOURCES: LeadSource[] = ['Web', 'Social', 'Referral', 'Exhibition', 'Cold Call', 'Campaign']
const CHANNELS: Channel[] = ['WhatsApp', 'SMS', 'Email', 'Web', 'Social']
const INTERESTS = ['فيلا', 'شقة', 'تاون هاوس', 'دوبلكس', 'أرض']
const CITIES = ['الرياض', 'جدة', 'الدمام', 'مكة المكرمة', 'المدينة المنورة', 'الطائف', 'أبها', 'تبوك', 'الخبر']

const selectCls =
  'flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm text-foreground shadow-sm focus:outline-none focus:ring-1 focus:ring-ring'

// ── Score badge ───────────────────────────────────────────────────────────────

function ScoreBadge({ score }: { score: number }) {
  const cls =
    score >= 80
      ? 'bg-emerald-100 text-emerald-700'
      : score >= 60
      ? 'bg-amber-100 text-amber-700'
      : score >= 40
      ? 'bg-orange-100 text-orange-700'
      : 'bg-red-100 text-red-700'
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold', cls)}>
      <Star className="size-3" />
      {score}
    </span>
  )
}

// ── KanbanCard ────────────────────────────────────────────────────────────────

function KanbanCardItem({
  lead,
  onSelect,
  isDragging,
}: {
  lead: Lead
  onSelect: (l: Lead) => void
  isDragging?: boolean
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging: isSelfDragging } =
    useDraggable({ id: lead.id })

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group rounded-xl border border-border bg-card p-4 shadow-sm cursor-grab active:cursor-grabbing transition-all',
        isSelfDragging && 'opacity-40',
        isDragging && 'shadow-lg scale-105 rotate-1'
      )}
      {...attributes}
      {...listeners}
      onClick={() => onSelect(lead)}
    >
      <div className="flex items-center gap-3 mb-3">
        <Avatar className="size-9 shrink-0">
          <AvatarFallback className="bg-brand/10 text-brand text-xs font-bold">
            {lead.nameAr.charAt(0)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">{lead.nameAr}</p>
          <p className="text-xs text-muted-foreground truncate">{lead.propertyInterest} · {lead.city}</p>
        </div>
        <ScoreBadge score={lead.aiScore} />
      </div>
      {lead.budget && (
        <p className="text-xs font-medium text-muted-foreground mb-2">
          الميزانية: {(lead.budget / 1_000).toFixed(0)} ألف ريال
        </p>
      )}
      <div className="flex items-center justify-between gap-2">
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
          {lead.source}
        </span>
        <span className="text-xs text-muted-foreground">
          {new Date(lead.lastContactDate).toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' })}
        </span>
      </div>
    </div>
  )
}

// ── KanbanColumn ──────────────────────────────────────────────────────────────

function KanbanColumnZone({
  col,
  leads,
  onSelect,
  isLoading,
}: {
  col: KanbanColumn
  leads: Lead[]
  onSelect: (l: Lead) => void
  isLoading: boolean
}) {
  const { setNodeRef, isOver } = useDroppable({ id: col.id })

  return (
    <div className="flex min-w-[240px] flex-col gap-3 flex-1">
      <div className={cn('flex items-center justify-between rounded-lg border px-3 py-2', col.headerBg)}>
        <span className={cn('text-sm font-semibold', col.colorClass)}>{col.labelAr}</span>
        <span className={cn('rounded-full px-2 py-0.5 text-xs font-bold', col.colorClass, 'bg-white/60')}>
          {leads.length}
        </span>
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          'flex flex-col gap-2 rounded-xl border-2 border-dashed p-2 transition-colors min-h-[120px]',
          isOver ? 'border-brand bg-blue-50/60' : 'border-transparent'
        )}
      >
        {isLoading
          ? Array.from({ length: 2 }).map((_, i) => <KanbanCardSkeleton key={i} />)
          : leads.length === 0
          ? (
            <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
              <p className="text-xs">لا يوجد عملاء في هذه المرحلة</p>
            </div>
          )
          : leads.map((lead) => (
            <KanbanCardItem key={lead.id} lead={lead} onSelect={onSelect} />
          ))
        }
      </div>
    </div>
  )
}

// ── Lead drawer ───────────────────────────────────────────────────────────────

function LeadDrawer({
  lead,
  salesReps,
  open,
  onClose,
}: {
  lead: Lead | null
  salesReps: SalesRep[]
  open: boolean
  onClose: () => void
}) {
  if (!lead) return null
  const rep = salesReps.find((r) => r.id === lead.salesRepId)

  return (
    <Drawer open={open} onOpenChange={(v) => !v && onClose()} direction="left">
      <DrawerContent className="max-w-md overflow-y-auto">
        <DrawerHeader className="border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <Avatar className="size-12">
              <AvatarFallback className="bg-brand/10 text-brand text-lg font-bold">
                {lead.nameAr.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <DrawerTitle>{lead.nameAr}</DrawerTitle>
              <DrawerDescription>{lead.propertyInterest} · {lead.city}</DrawerDescription>
            </div>
            <div className="ms-auto">
              <ScoreRing score={lead.aiScore} size={64} strokeWidth={7} />
            </div>
          </div>
        </DrawerHeader>

        <div className="flex flex-col gap-4 p-4">
          <div className="flex flex-wrap gap-2">
            <StatusPill type="stage" value={lead.stage} />
            <Badge variant="secondary">{lead.source}</Badge>
            <Badge variant="secondary">{lead.channel}</Badge>
          </div>

          <div className="rounded-lg border border-border p-4 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">معلومات التواصل</p>
            <div className="flex items-center gap-2 text-sm">
              <Phone className="size-4 text-muted-foreground shrink-0" />
              <span>{lead.phone}</span>
            </div>
            {lead.email && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="size-4 text-muted-foreground shrink-0" />
                <span className="break-all">{lead.email}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="size-4 text-muted-foreground shrink-0" />
              <span>{lead.city}</span>
            </div>
          </div>

          <div className="rounded-lg border border-border p-4 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">تفاصيل الاهتمام</p>
            <div className="flex items-center gap-2 text-sm">
              <Building2 className="size-4 text-muted-foreground shrink-0" />
              <span>{lead.propertyInterest}</span>
            </div>
            {lead.budget && (
              <div className="flex items-center gap-2 text-sm">
                <span className="size-4 text-muted-foreground shrink-0 text-center font-bold">﷼</span>
                <span>{lead.budget.toLocaleString('ar-SA')} ريال</span>
              </div>
            )}
          </div>

          {rep && (
            <div className="rounded-lg border border-border p-4 space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">المندوب المسؤول</p>
              <div className="flex items-center gap-2">
                <Avatar className="size-8">
                  <AvatarFallback className="bg-accent-pipeline/10 text-accent-pipeline text-xs font-bold">
                    {rep.avatarInitials}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{rep.nameAr}</p>
                  <p className="text-xs text-muted-foreground">{rep.region}</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-4 rounded-lg border border-border p-4">
            <div className="flex-1 flex items-center gap-2 text-sm">
              <Calendar className="size-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">آخر تواصل</p>
                <p className="font-medium">
                  {new Date(lead.lastContactDate).toLocaleDateString('ar-SA', {
                    year: 'numeric', month: 'short', day: 'numeric',
                  })}
                </p>
              </div>
            </div>
            <div className="flex-1 flex items-center gap-2 text-sm">
              <User className="size-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">تاريخ الإضافة</p>
                <p className="font-medium">
                  {new Date(lead.createdAt).toLocaleDateString('ar-SA', {
                    year: 'numeric', month: 'short', day: 'numeric',
                  })}
                </p>
              </div>
            </div>
          </div>

          {lead.notes && (
            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <p className="text-xs font-semibold text-muted-foreground mb-2">ملاحظات</p>
              <p className="text-sm leading-relaxed">{lead.notes}</p>
            </div>
          )}
        </div>

        <DrawerFooter>
          <Button onClick={onClose} className="w-full bg-brand hover:bg-brand/90 text-white">
            إغلاق
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}

// ── Add Lead Dialog ───────────────────────────────────────────────────────────

function AddLeadDialog({
  open,
  salesReps,
  onClose,
  onAdd,
}: {
  open: boolean
  salesReps: SalesRep[]
  onClose: () => void
  onAdd: (lead: Lead) => void
}) {
  const [form, setForm] = useState({
    nameAr: '',
    phone: '',
    email: '',
    source: 'Web' as LeadSource,
    channel: 'WhatsApp' as Channel,
    propertyInterest: 'فيلا',
    city: 'الرياض',
    budget: '',
    salesRepId: salesReps[0]?.id ?? 'rep-001',
  })

  const handleSubmit = () => {
    if (!form.nameAr.trim() || !form.phone.trim()) return
    const newLead: Lead = {
      id: `lead-new-${Date.now()}`,
      nameAr: form.nameAr,
      phone: form.phone,
      email: form.email || undefined,
      source: form.source,
      channel: form.channel,
      stage: 'New',
      aiScore: Math.floor(Math.random() * 30) + 40,
      salesRepId: form.salesRepId,
      propertyInterest: form.propertyInterest,
      city: form.city,
      budget: form.budget ? Number(form.budget) : undefined,
      lastContactDate: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    }
    onAdd(newLead)
    setForm({
      nameAr: '', phone: '', email: '', source: 'Web', channel: 'WhatsApp',
      propertyInterest: 'فيلا', city: 'الرياض', budget: '', salesRepId: salesReps[0]?.id ?? 'rep-001',
    })
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg" showCloseButton>
        <DialogHeader>
          <DialogTitle>إضافة عميل محتمل جديد</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3 py-2">
          <div className="col-span-2 flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">الاسم الكامل *</label>
            <Input
              placeholder="محمد عبدالله"
              value={form.nameAr}
              onChange={(e) => setForm((p) => ({ ...p, nameAr: e.target.value }))}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">رقم الجوال *</label>
            <Input
              placeholder="05xxxxxxxx"
              value={form.phone}
              onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">البريد الإلكتروني</label>
            <Input
              placeholder="example@mail.com"
              value={form.email}
              onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">المصدر</label>
            <select
              className={selectCls}
              value={form.source}
              onChange={(e) => setForm((p) => ({ ...p, source: e.target.value as LeadSource }))}
            >
              {SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">قناة التواصل</label>
            <select
              className={selectCls}
              value={form.channel}
              onChange={(e) => setForm((p) => ({ ...p, channel: e.target.value as Channel }))}
            >
              {CHANNELS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">العقار المطلوب</label>
            <select
              className={selectCls}
              value={form.propertyInterest}
              onChange={(e) => setForm((p) => ({ ...p, propertyInterest: e.target.value }))}
            >
              {INTERESTS.map((i) => <option key={i} value={i}>{i}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">المدينة</label>
            <select
              className={selectCls}
              value={form.city}
              onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))}
            >
              {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">الميزانية (ريال)</label>
            <Input
              type="number"
              placeholder="1000000"
              value={form.budget}
              onChange={(e) => setForm((p) => ({ ...p, budget: e.target.value }))}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">المندوب المسؤول</label>
            <select
              className={selectCls}
              value={form.salesRepId}
              onChange={(e) => setForm((p) => ({ ...p, salesRepId: e.target.value }))}
            >
              {salesReps.map((r) => <option key={r.id} value={r.id}>{r.nameAr}</option>)}
            </select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>إلغاء</Button>
          <Button
            className="bg-accent-pipeline hover:bg-accent-pipeline/90 text-white"
            onClick={handleSubmit}
            disabled={!form.nameAr.trim() || !form.phone.trim()}
          >
            إضافة العميل
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Pipeline Filters ──────────────────────────────────────────────────────────

function PipelineFilters({
  filterSource,
  filterCity,
  onSourceChange,
  onCityChange,
  onReset,
}: {
  filterSource: string
  filterCity: string
  onSourceChange: (v: string) => void
  onCityChange: (v: string) => void
  onReset: () => void
}) {
  const hasFilter = !!filterSource || !!filterCity
  const selectCls2 =
    'h-8 rounded-lg border border-input bg-background pe-8 ps-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring text-foreground'

  return (
    <div className="flex flex-wrap items-center gap-2">
      <SlidersHorizontal className="size-4 text-muted-foreground" />
      <div className="relative">
        <select
          className={selectCls2}
          value={filterSource}
          onChange={(e) => onSourceChange(e.target.value)}
        >
          <option value="">كل المصادر</option>
          {SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <ChevronDown className="pointer-events-none absolute end-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
      </div>
      <div className="relative">
        <select
          className={selectCls2}
          value={filterCity}
          onChange={(e) => onCityChange(e.target.value)}
        >
          <option value="">كل المدن</option>
          {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <ChevronDown className="pointer-events-none absolute end-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
      </div>
      {hasFilter && (
        <button
          onClick={onReset}
          className="flex items-center gap-1 rounded-lg bg-muted px-2.5 py-1 text-xs text-muted-foreground hover:bg-muted/70"
        >
          <X className="size-3" /> مسح الفلاتر
        </button>
      )}
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

interface Props {
  initialLeads: Lead[]
  salesReps: SalesRep[]
}

export function PipelineClient({ initialLeads, salesReps }: Props) {
  const [leads, setLeads] = useState<Lead[]>(initialLeads)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [filterSource, setFilterSource] = useState('')
  const [filterCity, setFilterCity] = useState('')
  const [isLoading] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  const activeLead = activeId ? leads.find((l) => l.id === activeId) : null

  const visibleLeads = leads.filter((l) => {
    if (filterSource && l.source !== filterSource) return false
    if (filterCity && l.city !== filterCity) return false
    return true
  })

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }, [])

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      setActiveId(null)
      if (!over) return

      const leadId = active.id as string
      let targetStage = over.id as PipelineStage

      const isColumnId = COLUMNS.some((c) => c.id === targetStage)
      if (!isColumnId) {
        const targetLead = leads.find((l) => l.id === targetStage)
        if (!targetLead) return
        targetStage = targetLead.stage
      }

      setLeads((prev) =>
        prev.map((l) => (l.id === leadId ? { ...l, stage: targetStage } : l))
      )
    },
    [leads]
  )

  const handleSelectLead = useCallback((lead: Lead) => {
    if (activeId) return
    setSelectedLead(lead)
    setDrawerOpen(true)
  }, [activeId])

  const handleAddLead = useCallback((lead: Lead) => {
    setLeads((prev) => [lead, ...prev])
  }, [])

  const totalVisible = visibleLeads.length

  return (
    <div className="flex flex-col gap-5 h-full">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-accent-pipeline">خط المبيعات</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {totalVisible} عميل محتمل
            {(filterSource || filterCity) ? ' (مُصفَّى)' : ''}
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <PipelineFilters
            filterSource={filterSource}
            filterCity={filterCity}
            onSourceChange={setFilterSource}
            onCityChange={setFilterCity}
            onReset={() => { setFilterSource(''); setFilterCity('') }}
          />
          <Button
            className="bg-accent-pipeline hover:bg-accent-pipeline/90 text-white gap-1.5"
            onClick={() => setDialogOpen(true)}
          >
            <Plus className="size-4" />
            إضافة عميل محتمل
          </Button>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4 flex-1">
          {COLUMNS.map((col) => (
            <KanbanColumnZone
              key={col.id}
              col={col}
              leads={visibleLeads.filter((l) => l.stage === col.id)}
              onSelect={handleSelectLead}
              isLoading={isLoading}
            />
          ))}
        </div>

        <DragOverlay>
          {activeLead && (
            <div className="rounded-xl border border-brand bg-card p-4 shadow-2xl w-60 rotate-2">
              <div className="flex items-center gap-3">
                <Avatar className="size-9 shrink-0">
                  <AvatarFallback className="bg-brand/10 text-brand text-xs font-bold">
                    {activeLead.nameAr.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{activeLead.nameAr}</p>
                  <p className="text-xs text-muted-foreground">{activeLead.propertyInterest}</p>
                </div>
                <ScoreBadge score={activeLead.aiScore} />
              </div>
            </div>
          )}
        </DragOverlay>
      </DndContext>

      <LeadDrawer
        lead={selectedLead}
        salesReps={salesReps}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />

      <AddLeadDialog
        open={dialogOpen}
        salesReps={salesReps}
        onClose={() => setDialogOpen(false)}
        onAdd={handleAddLead}
      />
    </div>
  )
}
