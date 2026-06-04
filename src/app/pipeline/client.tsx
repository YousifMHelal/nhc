'use client'

import { useState, useCallback, useMemo } from 'react'
import {
  DndContext, DragOverlay, PointerSensor, useSensor, useSensors,
  useDroppable, useDraggable, type DragEndEvent, type DragStartEvent,
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
  Search,
  Star,
  Trash2,
} from "lucide-react";
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter } from '@/components/ui/drawer'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { StatusPill } from '@/components/shared/status-pill'
import { ScoreRing } from '@/components/shared/score-ring'
import { KanbanCardSkeleton } from '@/components/shared/skeleton-card'
import type { Lead, SalesRep, PipelineStage, LeadSource, Channel } from '@/lib/types'
import { cn, toAr } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import { scoreLead } from '@/lib/ai/leadScore'
import { isValidSaudiPhone, isValidEmail, readApiError } from '@/lib/client-validation'

// ── Column config ─────────────────────────────────────────────────────────────

type KanbanColumn = { id: PipelineStage; labelAr: string; colorClass: string; headerBg: string }

const COLUMNS: KanbanColumn[] = [
  { id: 'New',         labelAr: 'جديد',           colorClass: 'text-sky-600',     headerBg: 'bg-sky-50 border-sky-200' },
  { id: 'Contacted',   labelAr: 'تم التواصل',     colorClass: 'text-blue-600',    headerBg: 'bg-blue-50 border-blue-200' },
  { id: 'Qualified',   labelAr: 'مؤهَّل',          colorClass: 'text-violet-600',  headerBg: 'bg-violet-50 border-violet-200' },
  { id: 'Proposal',    labelAr: 'عرض سعر',        colorClass: 'text-amber-600',   headerBg: 'bg-amber-50 border-amber-200' },
  { id: 'Closed Won',  labelAr: 'تم التعاقد',     colorClass: 'text-emerald-600', headerBg: 'bg-emerald-50 border-emerald-200' },
  { id: 'Closed Lost', labelAr: 'لم يتم التعاقد', colorClass: 'text-red-500',     headerBg: 'bg-red-50 border-red-200' },
]

const STAGE_LABEL_AR: Record<PipelineStage, string> = {
  New: 'جديد', Contacted: 'تم التواصل', Qualified: 'مؤهَّل',
  Proposal: 'عرض سعر', 'Closed Won': 'تم التعاقد', 'Closed Lost': 'لم يتم التعاقد',
}

const SOURCES: LeadSource[] = ['Web', 'Social', 'Referral', 'Exhibition', 'Cold Call', 'Campaign']
const CHANNELS: Channel[] = ['WhatsApp', 'SMS', 'Email', 'Web', 'Social']
const INTERESTS = ['فيلا', 'شقة', 'تاون هاوس', 'دوبلكس', 'أرض']
const CITIES = ['الرياض', 'جدة', 'الدمام', 'مكة المكرمة', 'المدينة المنورة', 'الطائف', 'أبها', 'تبوك', 'الخبر']

const selectCls =
  "flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm text-foreground shadow-sm focus:outline-none focus:ring-1 focus:ring-ring [color-scheme:light] dark:[color-scheme:dark]";

// ── Stage persistence (mock-only, no backend) ────────────────────────────────
// Drag-and-drop stage changes are persisted to the database via
// PATCH /api/leads/[id]; the server render is the source of truth.

// ── AI Score badge (purple, hover → top-3 factors) ──────────────────────────

function AIScoreBadge({ lead }: { lead: Lead }) {
  const result = scoreLead(lead)
  return (
    <div className="relative group/aibadge">
      <span
        className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold cursor-default select-none"
        style={{ background: 'var(--purple-bg)', color: 'var(--purple)' }}
      >
        <Star className="size-3" fill="currentColor" />
        {toAr(result.score)}
      </span>
      {/* Hover tooltip — top 3 factors */}
      <div className="pointer-events-none absolute bottom-full inset-e-0 mb-2 z-50 hidden w-52 rounded-lg border border-border bg-card shadow-md group-hover/aibadge:block p-3 text-start">
        <p className="text-xs font-semibold mb-2" style={{ color: 'var(--purple)' }}>أبرز عوامل التقييم</p>
        <ul className="space-y-1.5">
          {result.topFactors.map((f, i) => (
            <li key={i} className="flex items-center justify-between gap-2 text-xs">
              <span className="text-foreground">{f.labelAr}</span>
              <span
                className="shrink-0 font-bold text-[11px]"
                style={{ color: f.contribution > 0 ? 'var(--success)' : 'var(--error)' }}
              >
                {f.contribution > 0 ? '+' : ''}{toAr(Math.round(f.contribution))}
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-2 border-t border-border pt-2 flex items-center justify-between text-[11px] text-muted-foreground">
          <span>الاحتمالية</span>
          <span className="font-inter font-semibold">{toAr(Math.round(result.probability * 100))}٪</span>
        </div>
      </div>
    </div>
  )
}

// ── Kanban card ───────────────────────────────────────────────────────────────

function KanbanCardItem({ lead, onSelect }: { lead: Lead; onSelect: (l: Lead) => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: lead.id })
  const style = transform ? { transform: `translate3d(${transform.x}px,${transform.y}px,0)` } : undefined
  const rep = lead.salesRepId?.split('-')[1]

  return (
    <div
      ref={setNodeRef} style={style}
      className={cn('group rounded-xl border border-border bg-card p-4 shadow-sm cursor-grab active:cursor-grabbing transition-all', isDragging && 'opacity-40')}
      {...attributes} {...listeners}
      onClick={() => onSelect(lead)}
    >
      <div className="flex items-center gap-3 mb-3">
        <Avatar className="size-9 shrink-0">
          <AvatarFallback className="bg-brand/10 text-brand text-xs font-bold">{lead.nameAr.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">{lead.nameAr}</p>
          <p className="text-xs text-muted-foreground truncate">{lead.propertyInterest} · {lead.city}</p>
        </div>
        <AIScoreBadge lead={lead} />
      </div>
      {lead.budget && (
        <p className="text-xs font-medium text-muted-foreground mb-2">
          الميزانية: {(lead.budget / 1_000).toFixed(0)} ألف ريال
        </p>
      )}
      <div className="flex items-center justify-between gap-2">
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{lead.source}</span>
        <div className="flex items-center gap-1">
          {rep && (
            <Avatar className="size-5">
              <AvatarFallback className="text-[9px] bg-brand/10 text-brand">{rep}</AvatarFallback>
            </Avatar>
          )}
          <span className="text-xs text-muted-foreground">
            {new Date(lead.lastContactDate).toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' })}
          </span>
        </div>
      </div>
    </div>
  )
}

// ── Kanban column ─────────────────────────────────────────────────────────────

function KanbanColumnZone({ col, leads, onSelect, isLoading }: { col: KanbanColumn; leads: Lead[]; onSelect: (l: Lead) => void; isLoading: boolean }) {
  const { setNodeRef, isOver } = useDroppable({ id: col.id })
  return (
    <div className="flex min-w-[220px] flex-col gap-3 flex-1">
      <div className={cn('flex items-center justify-between rounded-lg border px-3 py-2', col.headerBg)}>
        <span className={cn('text-sm font-semibold', col.colorClass)}>{col.labelAr}</span>
        <span className={cn('rounded-full px-2 py-0.5 text-xs font-bold bg-white/70', col.colorClass)}>{toAr(leads.length)}</span>
      </div>
      <div
        ref={setNodeRef}
        className={cn('flex flex-col gap-2 rounded-xl border-2 border-dashed p-2 transition-colors min-h-[120px]',
          isOver ? 'border-brand bg-brand/5' : 'border-transparent')}
      >
        {isLoading
          ? Array.from({ length: 2 }).map((_, i) => <KanbanCardSkeleton key={i} />)
          : leads.length === 0
          ? <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <p className="text-xs">لا يوجد عملاء في هذه المرحلة</p>
            </div>
          : leads.map((l) => <KanbanCardItem key={l.id} lead={l} onSelect={onSelect} />)}
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
  onDelete,
}: {
  lead: Lead | null;
  salesReps: SalesRep[];
  open: boolean;
  onClose: () => void;
  onDelete: (id: string) => void;
}) {
  const router = useRouter();
  const [confirmDelete, setConfirmDelete] = useState(false);
  if (!lead) return null;
  const rep = salesReps.find((r) => r.id === lead.salesRepId);
  return (
    <Drawer open={open} onOpenChange={(v) => !v && onClose()} direction="left">
      <DrawerContent className="max-w-md flex flex-col overflow-hidden">
        <DrawerHeader className="border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <Avatar className="size-12">
              <AvatarFallback className="bg-brand/10 text-brand text-lg font-bold">
                {lead.nameAr.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <DrawerTitle>{lead.nameAr}</DrawerTitle>
              <DrawerDescription>
                {lead.propertyInterest} · {lead.city}
              </DrawerDescription>
            </div>
            <div className="ms-auto">
              <ScoreRing score={lead.aiScore} size={64} strokeWidth={7} />
            </div>
          </div>
        </DrawerHeader>

        <div className="flex flex-col gap-4 p-4 overflow-y-auto flex-1">
          <div className="flex flex-wrap gap-2">
            <StatusPill type="stage" value={lead.stage} />
            <Badge variant="secondary">{lead.source}</Badge>
            <Badge variant="secondary">{lead.channel}</Badge>
          </div>

          <div className="rounded-lg border border-border p-4 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              معلومات التواصل
            </p>
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
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              تفاصيل الاهتمام
            </p>
            <div className="flex items-center gap-2 text-sm">
              <Building2 className="size-4 text-muted-foreground shrink-0" />
              <span>{lead.propertyInterest}</span>
            </div>
            {lead.budget && (
              <div className="flex items-center gap-2 text-sm">
                <span className="size-4 text-center font-bold shrink-0">﷼</span>
                <span>{lead.budget.toLocaleString("ar-SA")} ريال</span>
              </div>
            )}
          </div>

          {rep && (
            <div className="rounded-lg border border-border p-4 space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                المندوب المسؤول
              </p>
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
                  {new Date(lead.lastContactDate).toLocaleDateString("ar-SA", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>
            <div className="flex-1 flex items-center gap-2 text-sm">
              <User className="size-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">تاريخ الإضافة</p>
                <p className="font-medium">
                  {new Date(lead.createdAt).toLocaleDateString("ar-SA", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>
          </div>

          {lead.notes && (
            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <p className="text-xs font-semibold text-muted-foreground mb-2">
                ملاحظات
              </p>
              <p className="text-sm leading-relaxed">{lead.notes}</p>
            </div>
          )}

          {/* AI score breakdown panel */}

          {lead.customerId && (
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={() => {
                onClose();
                router.push("/customer-360");
              }}>
              عرض ملف العميل ٣٦٠
            </Button>
          )}
        </div>

        <DrawerFooter className="gap-2">
          {confirmDelete ? (
            <div className="flex flex-col gap-2 rounded-lg border border-red-200 bg-red-50 p-3">
              <p className="text-xs text-red-700 font-medium text-center">
                هل أنت متأكد من حذف هذا العميل؟
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 text-xs"
                  onClick={() => setConfirmDelete(false)}>
                  إلغاء
                </Button>
                <Button
                  size="sm"
                  className="flex-1 text-xs bg-red-600 hover:bg-red-700 text-white gap-1"
                  onClick={() => {
                    onDelete(lead.id);
                    onClose();
                    setConfirmDelete(false);
                  }}>
                  <Trash2 className="size-3.5" /> تأكيد الحذف
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-1.5 text-xs text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 hover:border-red-300"
              onClick={() => setConfirmDelete(true)}>
              <Trash2 className="size-3.5" /> حذف العميل
            </Button>
          )}
          <Button
            onClick={onClose}
            className="w-full bg-brand hover:bg-brand/90 text-white">
            إغلاق
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

// ── Manage Reps Dialog ────────────────────────────────────────────────────────

function ManageRepsDialog({ open, reps, onClose, onAdd, onDelete }: { open: boolean; reps: SalesRep[]; onClose: () => void; onAdd: (rep: SalesRep) => void; onDelete: (id: string) => void }) {
  const [nameAr, setNameAr] = useState('')
  const [phone, setPhone] = useState('')
  const [region, setRegion] = useState('')
  const [phoneError, setPhoneError] = useState<string | undefined>()
  const [saving, setSaving] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async (id: string) => {
    setDeleting(true)
    try {
      const res = await fetch('/api/sales-reps', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      if (!res.ok) throw new Error('فشل الحذف')
      onDelete(id)
      setConfirmDeleteId(null)
      toast.success('تم حذف المندوب بنجاح')
    } catch {
      toast.error('تعذّر حذف المندوب، يرجى المحاولة مجدداً')
    } finally {
      setDeleting(false)
    }
  }

  const handleAdd = async () => {
    if (nameAr.trim().length < 2) return
    if (phone.trim() && !isValidSaudiPhone(phone)) {
      setPhoneError('رقم جوال غير صالح (مثال: 05XXXXXXXX)')
      return
    }
    setPhoneError(undefined)
    setSaving(true)
    try {
      const res = await fetch('/api/sales-reps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nameAr, phone, region }),
      })
      if (!res.ok) {
        toast.error(await readApiError(res, 'تعذّر إضافة المندوب، يرجى المحاولة مجدداً'))
        return
      }
      const rep: SalesRep = await res.json()
      onAdd(rep)
      setNameAr('')
      setPhone('')
      setRegion('')
      toast.success(`تمت إضافة المندوب: ${rep.nameAr}`)
    } catch {
      toast.error('تعذّر إضافة المندوب، يرجى المحاولة مجدداً')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md" showCloseButton>
        <DialogHeader><DialogTitle>إدارة المندوبين</DialogTitle></DialogHeader>
        <div className="flex flex-col gap-4 py-2">
          {/* Existing reps list */}
          <div className="flex flex-col gap-1">
            <p className="text-xs font-medium text-muted-foreground mb-1">المندوبون الحاليون</p>
            <div className="max-h-48 overflow-y-auto rounded-lg border border-border divide-y divide-border">
              {reps.map((r) => (
                <div key={r.id} className="flex items-center gap-3 px-3 py-2">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand text-xs font-bold">
                    {r.avatarInitials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{r.nameAr}</p>
                    {r.region && <p className="text-xs text-muted-foreground">{r.region}</p>}
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0 me-1">{r.leads} عميل</span>
                  {confirmDeleteId === r.id ? (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        className="rounded px-2 py-0.5 text-xs bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                        disabled={deleting}
                        onClick={() => handleDelete(r.id)}
                      >
                        {deleting ? '...' : 'تأكيد'}
                      </button>
                      <button
                        className="rounded px-2 py-0.5 text-xs border border-border text-muted-foreground hover:bg-muted"
                        onClick={() => setConfirmDeleteId(null)}
                      >
                        إلغاء
                      </button>
                    </div>
                  ) : (
                    <button
                      className="shrink-0 rounded p-1 text-muted-foreground hover:text-red-600 hover:bg-red-50"
                      onClick={() => setConfirmDeleteId(r.id)}
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Add new rep form */}
          <div className="rounded-lg border border-dashed border-border p-4 flex flex-col gap-3">
            <p className="text-xs font-semibold text-muted-foreground">إضافة مندوب جديد</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="col-span-2 flex flex-col gap-1">
                <label className="text-xs text-muted-foreground">الاسم الكامل *</label>
                <Input placeholder="مثال: أحمد المطيري" value={nameAr} onChange={(e) => setNameAr(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAdd()} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground">رقم الجوال</label>
                <Input placeholder="05xxxxxxxx" inputMode="tel" value={phone} aria-invalid={!!phoneError} className={phoneError ? 'border-red-500 focus-visible:ring-red-500' : undefined} onChange={(e) => { setPhone(e.target.value); setPhoneError(undefined) }} />
                {phoneError && <p className="text-xs text-red-600">{phoneError}</p>}
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground">المنطقة</label>
                <Input placeholder="الرياض" value={region} onChange={(e) => setRegion(e.target.value)} />
              </div>
            </div>
            <Button className="bg-brand hover:bg-brand/90 text-white w-full gap-1.5" disabled={!nameAr.trim() || saving} onClick={handleAdd}>
              <Plus className="size-3.5" />
              {saving ? 'جارٍ الحفظ...' : 'إضافة مندوب'}
            </Button>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>إغلاق</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Add Lead Dialog ───────────────────────────────────────────────────────────

function AddLeadDialog({ open, salesReps, onClose, onAdd }: { open: boolean; salesReps: SalesRep[]; onClose: () => void; onAdd: (lead: Lead) => void }) {
  const [form, setForm] = useState({
    nameAr: "",
    phone: "",
    email: "",
    source: "Web" as LeadSource,
    channel: "WhatsApp" as Channel,
    propertyInterest: "فيلا",
    city: "الرياض",
    budget: "",
    salesRepId: salesReps[0]?.id ?? "",
  });
  const [errors, setErrors] = useState<{ nameAr?: string; phone?: string; email?: string; budget?: string }>({})

  const validate = () => {
    const next: typeof errors = {}
    const name = form.nameAr.trim()
    if (!name) next.nameAr = 'الاسم مطلوب'
    else if (name.length < 2) next.nameAr = 'الاسم قصير جداً'
    if (!form.phone.trim()) next.phone = 'رقم الجوال مطلوب'
    else if (!isValidSaudiPhone(form.phone)) next.phone = 'رقم جوال غير صالح (مثال: 05XXXXXXXX)'
    if (form.email.trim() && !isValidEmail(form.email)) next.email = 'بريد إلكتروني غير صالح'
    if (form.budget && (!(Number(form.budget) > 0) || Number(form.budget) > 1_000_000_000))
      next.budget = 'أدخل مبلغاً صحيحاً موجباً'
    return next
  }

  const handleSubmit = () => {
    const next = validate()
    setErrors(next)
    if (Object.keys(next).length > 0) return
    const newLead: Lead = {
      id: `lead-new-${Date.now()}`, nameAr: form.nameAr, phone: form.phone,
      email: form.email || undefined, source: form.source, channel: form.channel,
      stage: 'New', aiScore: Math.floor(Math.random() * 30) + 40,
      salesRepId: form.salesRepId, propertyInterest: form.propertyInterest, city: form.city,
      budget: form.budget ? Number(form.budget) : undefined,
      lastContactDate: new Date().toISOString(), createdAt: new Date().toISOString(),
    }
    onAdd(newLead)
    setForm({
      nameAr: "",
      phone: "",
      email: "",
      source: "Web",
      channel: "WhatsApp",
      propertyInterest: "فيلا",
      city: "الرياض",
      budget: "",
      salesRepId: salesReps[0]?.id ?? "",
    });
    setErrors({})
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg" showCloseButton>
        <DialogHeader><DialogTitle>إضافة عميل محتمل جديد</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3 py-2">
          <div className="col-span-2 flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">الاسم الكامل *</label>
            <Input placeholder="محمد عبدالله" value={form.nameAr} aria-invalid={!!errors.nameAr} className={errors.nameAr ? 'border-red-500 focus-visible:ring-red-500' : undefined} onChange={(e) => { setForm((p) => ({ ...p, nameAr: e.target.value })); setErrors((p) => ({ ...p, nameAr: undefined })) }} />
            {errors.nameAr && <p className="text-xs text-red-600">{errors.nameAr}</p>}
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">رقم الجوال *</label>
            <Input placeholder="05xxxxxxxx" inputMode="tel" value={form.phone} aria-invalid={!!errors.phone} className={errors.phone ? 'border-red-500 focus-visible:ring-red-500' : undefined} onChange={(e) => { setForm((p) => ({ ...p, phone: e.target.value })); setErrors((p) => ({ ...p, phone: undefined })) }} />
            {errors.phone && <p className="text-xs text-red-600">{errors.phone}</p>}
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">البريد الإلكتروني</label>
            <Input placeholder="example@mail.com" inputMode="email" value={form.email} aria-invalid={!!errors.email} className={errors.email ? 'border-red-500 focus-visible:ring-red-500' : undefined} onChange={(e) => { setForm((p) => ({ ...p, email: e.target.value })); setErrors((p) => ({ ...p, email: undefined })) }} />
            {errors.email && <p className="text-xs text-red-600">{errors.email}</p>}
          </div>
          {[
            { label: 'المصدر', key: 'source', opts: SOURCES },
            { label: 'قناة التواصل', key: 'channel', opts: CHANNELS },
            { label: 'العقار المطلوب', key: 'propertyInterest', opts: INTERESTS },
            { label: 'المدينة', key: 'city', opts: CITIES },
          ].map(({ label, key, opts }) => (
            <div key={key} className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">{label}</label>
              <select className={selectCls} value={(form as Record<string,string>)[key]} onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}>
                {opts.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          ))}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">الميزانية (ريال)</label>
            <Input type="number" min="0" placeholder="1000000" value={form.budget} aria-invalid={!!errors.budget} className={errors.budget ? 'border-red-500 focus-visible:ring-red-500' : undefined} onChange={(e) => { setForm((p) => ({ ...p, budget: e.target.value })); setErrors((p) => ({ ...p, budget: undefined })) }} />
            {errors.budget && <p className="text-xs text-red-600">{errors.budget}</p>}
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">المندوب المسؤول</label>
            <select className={selectCls} value={form.salesRepId} onChange={(e) => setForm((p) => ({ ...p, salesRepId: e.target.value }))}>
              {salesReps.map((r) => <option key={r.id} value={r.id}>{r.nameAr}</option>)}
            </select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>إلغاء</Button>
          <Button className="bg-brand hover:bg-brand/90 text-white" onClick={handleSubmit} disabled={!form.nameAr.trim() || !form.phone.trim()}>
            إضافة العميل
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────

interface Props { initialLeads: Lead[]; salesReps: SalesRep[] }

export function PipelineClient({
  initialLeads,
  salesReps: initialReps,
}: Props) {
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [reps, setReps] = useState<SalesRep[]>(initialReps);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [repsDialogOpen, setRepsDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filterSource, setFilterSource] = useState("");
  const [filterRep, setFilterRep] = useState("");
  const [isLoading] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );
  const activeLead = activeId ? leads.find((l) => l.id === activeId) : null;

  const visibleLeads = useMemo(
    () =>
      leads.filter((l) => {
        if (search && !l.nameAr.includes(search) && !l.phone.includes(search))
          return false;
        if (filterSource && l.source !== filterSource) return false;
        if (filterRep && l.salesRepId !== filterRep) return false;
        return true;
      }),
    [leads, search, filterSource, filterRep],
  );

  const handleDragStart = useCallback(
    (e: DragStartEvent) => setActiveId(e.active.id as string),
    [],
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveId(null);
      if (!over) return;
      const leadId = active.id as string;
      let targetStage = over.id as PipelineStage;
      if (!COLUMNS.some((c) => c.id === targetStage)) {
        const tl = leads.find((l) => l.id === targetStage);
        if (!tl) return;
        targetStage = tl.stage;
      }
      const lead = leads.find((l) => l.id === leadId);
      if (!lead || lead.stage === targetStage) return;
      const previousStage = lead.stage;
      // Optimistically move the card; the PATCH below persists it to the
      // database (the server also converts a lead to a customer on Closed Won).
      setLeads((prev) =>
        prev.map((l) => (l.id === leadId ? { ...l, stage: targetStage } : l)),
      );
      toast.success(
        `تم نقل ${lead.nameAr} إلى "${STAGE_LABEL_AR[targetStage]}"`,
      );

      void (async () => {
        try {
          const res = await fetch(`/api/leads/${leadId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ stage: targetStage }),
          });
          if (!res.ok) throw new Error("فشل حفظ الحالة");
          const updated: Lead = await res.json();
          setLeads((prev) =>
            prev.map((l) => (l.id === leadId ? { ...l, ...updated } : l)),
          );
          if (targetStage === "Closed Won" && !lead.customerId) {
            toast.success(`تم تحويل ${lead.nameAr} إلى عميل في العميل ٣٦٠°`);
          }
        } catch {
          // Roll back the optimistic move so the UI matches the database.
          setLeads((prev) =>
            prev.map((l) =>
              l.id === leadId ? { ...l, stage: previousStage } : l,
            ),
          );
          toast.error("تعذّر حفظ تغيير الحالة");
        }
      })();
    },
    [leads],
  );

  const handleSelectLead = useCallback(
    (lead: Lead) => {
      if (activeId) return;
      setSelectedLead(lead);
      setDrawerOpen(true);
    },
    [activeId],
  );

  const handleDeleteLead = useCallback(
    async (id: string) => {
      const lead = leads.find((l) => l.id === id);
      setLeads((prev) => prev.filter((l) => l.id !== id));
      setDrawerOpen(false);
      try {
        const res = await fetch(`/api/leads/${id}`, { method: "DELETE" });
        if (!res.ok) throw new Error("فشل الحذف");
        toast.success(`تم حذف العميل ${lead?.nameAr ?? ""}`);
      } catch {
        setLeads((prev) => (lead ? [lead, ...prev] : prev));
        toast.error("تعذّر حذف العميل، يرجى المحاولة مجدداً");
      }
    },
    [leads],
  );

  const handleAddLead = useCallback(async (lead: Lead) => {
    setLeads((prev) => [lead, ...prev]);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(lead),
      });
      if (!res.ok) {
        const message = await readApiError(res, "تعذّر حفظ العميل، يرجى المحاولة مجدداً");
        // Roll back the optimistic insert — the server rejected it.
        setLeads((prev) => prev.filter((l) => l.id !== lead.id));
        toast.error(message);
        return;
      }
      const saved: Lead = await res.json();
      setLeads((prev) => prev.map((l) => (l.id === lead.id ? saved : l)));
      toast.success("تم إضافة العميل المحتمل بنجاح");
    } catch {
      setLeads((prev) => prev.filter((l) => l.id !== lead.id));
      toast.error("تعذّر حفظ العميل، يرجى المحاولة مجدداً");
    }
  }, []);

  // Stats — based on visibleLeads so filters are reflected in the bar
  const activeLeads = visibleLeads.filter(
    (l) => !["Closed Won", "Closed Lost"].includes(l.stage),
  );
  const pipelineValue = visibleLeads
    .filter((l) => ["Proposal", "Closed Won"].includes(l.stage))
    .reduce((s, l) => s + (l.budget ?? 0), 0);
  const closedWon = visibleLeads.filter((l) => l.stage === "Closed Won").length;
  const closedAll = visibleLeads.filter(
    (l) => l.stage === "Closed Won" || l.stage === "Closed Lost",
  ).length;
  const winRate = closedAll ? Math.round((closedWon / closedAll) * 100) : 0;
  const now = Date.now();
  const avgDaysSinceContact = visibleLeads.length
    ? Math.round(
        visibleLeads.reduce(
          (sum, l) => sum + (now - new Date(l.lastContactDate).getTime()),
          0,
        ) /
          visibleLeads.length /
          86_400_000,
      )
    : 0;

  return (
    <div className="flex flex-col gap-5 h-full">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-dark">خط المبيعات</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {toAr(leads.length)} عميل محتمل
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Search */}
          <div className="relative">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              placeholder="بحث بالاسم أو الجوال..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 w-52 rounded-lg border border-input bg-background ps-9 pe-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-brand"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute end-2 top-1/2 -translate-y-1/2">
                <X className="size-3.5 text-muted-foreground" />
              </button>
            )}
          </div>
          {/* Source filter */}
          <div className="relative">
            <SlidersHorizontal className="absolute start-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
            <select
              className="h-9 rounded-lg border border-input bg-background ps-8 pe-8 text-sm focus:outline-none focus:ring-1 focus:ring-ring text-foreground"
              value={filterSource}
              onChange={(e) => setFilterSource(e.target.value)}>
              <option value="">كل المصادر</option>
              {SOURCES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute end-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          </div>
          {/* Rep filter */}
          <div className="relative">
            <select
              className="h-9 rounded-lg border border-input bg-background ps-3 pe-8 text-sm focus:outline-none focus:ring-1 focus:ring-ring text-foreground"
              value={filterRep}
              onChange={(e) => setFilterRep(e.target.value)}>
              <option value="">كل المندوبين</option>
              {reps.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.nameAr}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute end-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          </div>
          {(filterSource || filterRep || search) && (
            <button
              onClick={() => {
                setFilterSource("");
                setFilterRep("");
                setSearch("");
              }}
              className="flex items-center gap-1 rounded-lg bg-muted px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-muted/70">
              <X className="size-3" /> مسح الفلاتر
            </button>
          )}
          <Button
            variant="outline"
            className="gap-1.5"
            onClick={() => setRepsDialogOpen(true)}>
            <User className="size-4" />
            إدارة المندوبين
          </Button>
          <Button
            className="bg-brand hover:bg-brand/90 text-white gap-1.5"
            onClick={() => setDialogOpen(true)}>
            <Plus className="size-4" />
            إضافة عميل
          </Button>
        </div>
      </div>

      {/* Kanban */}
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}>
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
            <div className="rounded-xl border border-brand bg-card p-4 shadow-2xl w-56 rotate-2">
              <div className="flex items-center gap-3">
                <Avatar className="size-9 shrink-0">
                  <AvatarFallback className="bg-brand/10 text-brand text-xs font-bold">
                    {activeLead.nameAr.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">
                    {activeLead.nameAr}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {activeLead.propertyInterest}
                  </p>
                </div>
                <AIScoreBadge lead={activeLead} />
              </div>
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* Stats bar */}
      <div className="grid grid-cols-4 gap-4 border-t border-border pt-4 mt-auto">
        {[
          { labelAr: "إجمالي النشطين", value: toAr(activeLeads.length) },
          {
            labelAr: "قيمة المسار (م ريال)",
            value: `${toAr((pipelineValue / 1_000_000).toFixed(1))}م`,
          },
          {
            labelAr: "آخر تواصل (متوسط أيام)",
            value: toAr(avgDaysSinceContact),
          },
          { labelAr: "معدل الإغلاق", value: `${toAr(winRate)}٪` },
        ].map((s) => (
          <div
            key={s.labelAr}
            className="rounded-xl border border-border bg-card px-4 py-3 text-center">
            <p className="text-lg font-bold text-brand font-inter">{s.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.labelAr}</p>
          </div>
        ))}
      </div>

      <LeadDrawer
        lead={selectedLead}
        salesReps={reps}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onDelete={handleDeleteLead}
      />
      <AddLeadDialog
        open={dialogOpen}
        salesReps={reps}
        onClose={() => setDialogOpen(false)}
        onAdd={handleAddLead}
      />
      <ManageRepsDialog
        open={repsDialogOpen}
        reps={reps}
        onClose={() => setRepsDialogOpen(false)}
        onAdd={(rep) => setReps((prev) => [...prev, rep])}
        onDelete={(id) => setReps((prev) => prev.filter((r) => r.id !== id))}
      />
    </div>
  );
}
