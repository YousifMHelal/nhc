'use client'

import { useState, useMemo } from 'react'
import {
  Phone,
  Mail,
  MapPin,
  Building2,
  User,
  PhoneCall,
  MessageSquare,
  MailIcon,
  Calendar,
  FileText,
  Zap,
  ShoppingBag,
  Award,
  ChevronDown,
  Plus,
  X,
  Brain,
  CheckCircle2,
  XCircle,
  Home,
  Star,
  ArrowLeft,
  BadgeCheck,
  AlertTriangle,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { StatusPill } from '@/components/shared/status-pill'
import { ScoreRing } from '@/components/shared/score-ring'
import { TimelineItemSkeleton } from '@/components/shared/skeleton-card'
import { toast } from 'sonner'
import type { TimelineEvent, Customer, Opportunity, Contract, Unit, SalesRep, InteractionType } from '@/lib/types'
import { cn, toAr } from '@/lib/utils'
import { scoreLead } from '@/lib/ai/leadScore'
import { computeHousingEligibility } from '@/lib/ai/housingEligibility'
import { recommendUnits } from '@/lib/ai/unitRecommendation'

const EVENT_CONFIG: Record<string, { icon: React.ElementType; bgClass: string; colorClass: string; labelAr: string }> = {
  Call:        { icon: PhoneCall,    bgClass: 'bg-blue-100',   colorClass: 'text-blue-600',   labelAr: 'مكالمة' },
  Message:     { icon: MessageSquare,bgClass: 'bg-sky-100',    colorClass: 'text-sky-600',    labelAr: 'رسالة' },
  Email:       { icon: MailIcon,     bgClass: 'bg-violet-100', colorClass: 'text-violet-600', labelAr: 'بريد' },
  Meeting:     { icon: Calendar,     bgClass: 'bg-emerald-100',colorClass: 'text-emerald-600',labelAr: 'اجتماع' },
  'Site Visit':{ icon: Building2,    bgClass: 'bg-amber-100',  colorClass: 'text-amber-600',  labelAr: 'زيارة' },
  Document:    { icon: FileText,     bgClass: 'bg-slate-100',  colorClass: 'text-slate-600',  labelAr: 'مستند' },
  System:      { icon: Zap,          bgClass: 'bg-gray-100',   colorClass: 'text-gray-500',   labelAr: 'نظام' },
  opportunity: { icon: ShoppingBag,  bgClass: 'bg-purple-100', colorClass: 'text-purple-600', labelAr: 'فرصة' },
  contract:    { icon: Award,        bgClass: 'bg-green-100',  colorClass: 'text-green-600',  labelAr: 'عقد' },
  campaign:    { icon: Zap,          bgClass: 'bg-rose-100',   colorClass: 'text-rose-600',   labelAr: 'حملة' },
  request:     { icon: FileText,     bgClass: 'bg-orange-100', colorClass: 'text-orange-600', labelAr: 'طلب' },
  lead:        { icon: User,         bgClass: 'bg-sky-100',    colorClass: 'text-sky-600',    labelAr: 'عميل' },
}

const SEGMENT_STYLES: Record<string, string> = {
  VIP: 'bg-amber-100 text-amber-700 border-amber-200',
  Standard: 'bg-blue-100 text-blue-700 border-blue-200',
  'At-Risk': 'bg-red-100 text-red-700 border-red-200',
  New: 'bg-emerald-100 text-emerald-700 border-emerald-200',
}
const SEGMENT_LABELS_AR: Record<string, string> = {
  VIP: 'عميل VIP', Standard: 'عميل عادي', 'At-Risk': 'في خطر', New: 'عميل جديد',
}

const TABS = [
  { id: "ai-analysis", labelAr: "تحليل الذكاء الاصطناعي" },
  { id: "timeline", labelAr: "التفاعلات" },
  { id: "opportunities", labelAr: "الفرص" },
  { id: "contracts", labelAr: "العقود" },
  { id: "profile", labelAr: "الملف" },
  { id: "campaigns", labelAr: "الحملات" },
  { id: "requests", labelAr: "الطلبات" },
];

const CHANNELS = ['واتساب', 'مكالمة', 'بريد إلكتروني', 'اجتماع', 'زيارة موقع']
const CHANNEL_TO_TYPE: Record<string, InteractionType> = {
  'واتساب': 'Message',
  'مكالمة': 'Call',
  'بريد إلكتروني': 'Email',
  'اجتماع': 'Meeting',
  'زيارة موقع': 'Site Visit',
}
const SOURCE_FILTERS = [
  { id: '', labelAr: 'الكل' },
  { id: 'Call', labelAr: 'مكالمات' },
  { id: 'Message', labelAr: 'رسائل' },
  { id: 'Email', labelAr: 'بريد' },
  { id: 'Meeting', labelAr: 'اجتماعات' },
  { id: 'Site Visit', labelAr: 'زيارات' },
]

function TimelineItem({ event, isLast, isHighlighted }: { event: TimelineEvent; isLast: boolean; isHighlighted: boolean }) {
  const cfg = EVENT_CONFIG[event.type] ?? EVENT_CONFIG['System']
  const Icon = cfg.icon
  return (
    <div className={cn('flex gap-4 transition-opacity', !isHighlighted && 'opacity-40')}>
      <div className="flex flex-col items-center">
        <div className={cn('flex size-9 shrink-0 items-center justify-center rounded-full', cfg.bgClass)}>
          <Icon className={cn('size-4', cfg.colorClass)} />
        </div>
        {!isLast && <div className="mt-2 w-0.5 flex-1 bg-border" />}
      </div>
      <div className="flex-1 pb-5">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-foreground leading-snug">{event.titleAr}</p>
            <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">{event.descriptionAr}</p>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {new Date(event.date).toLocaleDateString('ar-SA', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
            <span className={cn('rounded-full px-2 py-0.5 text-xs', cfg.bgClass, cfg.colorClass)}>{cfg.labelAr}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Log Interaction Modal ─────────────────────────────────── */
function LogInteractionModal({ onClose, onSave }: { onClose: () => void; onSave: (note: string, channel: string) => void }) {
  const [channel, setChannel] = useState(CHANNELS[0])
  const [note, setNote] = useState('')
  const selectCls = 'flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring'
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/25 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-sm rounded-xl bg-card border border-border shadow-2xl p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold">تسجيل تفاعل جديد</h3>
          <button onClick={onClose}><X className="size-4" /></button>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">القناة</label>
          <select className={selectCls} value={channel} onChange={(e) => setChannel(e.target.value)}>
            {CHANNELS.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">ملاحظات</label>
          <textarea
            className="min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring resize-none"
            placeholder="اكتب ملاحظات التفاعل..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>
        <div className="flex gap-2 justify-end">
          <Button variant="outline" size="sm" onClick={onClose}>إلغاء</Button>
          <Button size="sm" className="bg-brand hover:bg-brand/90 text-white" onClick={() => { onSave(note, channel); onClose() }}>
            حفظ
          </Button>
        </div>
      </div>
    </div>
  )
}

/* ── Create Opportunity Modal ──────────────────────────────── */
function CreateOpportunityModal({ customerName, onClose, onSave }: { customerName: string; onClose: () => void; onSave: (title: string) => void }) {
  const [title, setTitle] = useState('')
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/25 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-sm rounded-xl bg-card border border-border shadow-2xl p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold">إنشاء فرصة جديدة</h3>
          <button onClick={onClose}><X className="size-4" /></button>
        </div>
        <p className="text-xs text-muted-foreground">للعميل: <strong>{customerName}</strong></p>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">عنوان الفرصة *</label>
          <Input placeholder="مثال: فيلا في مشروع السدرة" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="flex gap-2 justify-end">
          <Button variant="outline" size="sm" onClick={onClose}>إلغاء</Button>
          <Button size="sm" className="bg-brand hover:bg-brand/90 text-white" disabled={!title.trim()} onClick={() => { onSave(title); onClose() }}>
            إنشاء
          </Button>
        </div>
      </div>
    </div>
  )
}

/* ── Delete Confirm Modal ──────────────────────────────────── */
function DeleteConfirmModal({ customerName, onClose, onConfirm }: { customerName: string; onClose: () => void; onConfirm: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/25 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-sm rounded-xl bg-card border border-border shadow-2xl p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-full bg-red-100">
              <Trash2 className="size-4 text-red-600" />
            </div>
            <h3 className="text-sm font-bold">حذف العميل</h3>
          </div>
          <button onClick={onClose}><X className="size-4" /></button>
        </div>
        <p className="text-sm text-muted-foreground">
          هل أنت متأكد من حذف العميل <strong className="text-foreground">{customerName}</strong>؟ لا يمكن التراجع عن هذا الإجراء.
        </p>
        <div className="flex gap-2 justify-end">
          <Button variant="outline" size="sm" onClick={onClose}>إلغاء</Button>
          <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white gap-1.5" onClick={onConfirm}>
            <Trash2 className="size-3.5" />
            حذف
          </Button>
        </div>
      </div>
    </div>
  )
}

/* ── Main component ─────────────────────────────────────────── */
interface Props {
  customers: Customer[]
  allTimeline: TimelineEvent[]
  allOpportunities: Opportunity[]
  allContracts: Contract[]
  availableUnits: Unit[]
  salesReps: SalesRep[]
}

export function Customer360Client({ customers, allTimeline, allOpportunities, allContracts, availableUnits, salesReps }: Props) {
  const [customerList, setCustomerList] = useState(customers)
  const [customerId, setCustomerId] = useState(customers[0]?.id ?? '')
  const [activeTab, setActiveTab] = useState("ai-analysis");
  const [activeFilter, setActiveFilter] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [assignedRep, setAssignedRep] = useState('')
  const [assigning, setAssigning] = useState(false)
  const [showLogModal, setShowLogModal] = useState(false)
  const [showOppModal, setShowOppModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [extraTimeline, setExtraTimeline] = useState<TimelineEvent[]>([])
  const [extraOpps, setExtraOpps] = useState<Opportunity[]>([])

  const customer = customerList.find((c) => c.id === customerId) ?? customerList[0]
  const timeline = [...allTimeline.filter((e) => e.customerId === customer?.id), ...extraTimeline.filter((e) => e.customerId === customer?.id)]
  const opportunities = [...allOpportunities.filter((o) => o.customerId === customer?.id), ...extraOpps.filter((o) => o.customerId === customer?.id)]
  const contracts = allContracts.filter((c) => c.customerId === customer?.id)

  const filteredTimeline = activeFilter ? timeline.filter((e) => e.type === activeFilter) : timeline

  if (!customer) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-muted-foreground">
        <div className="flex size-20 items-center justify-center rounded-full bg-muted">
          <User className="size-10 opacity-30" />
        </div>
        <div className="text-center">
          <h2 className="text-lg font-semibold text-foreground">لا يوجد عملاء بعد</h2>
          <p className="text-sm mt-1">أضف عملاء من خط المبيعات لعرضهم هنا</p>
        </div>
      </div>
    )
  }

  async function handleAssignRep() {
    if (!assignedRep) return
    const rep = salesReps.find((r) => r.id === assignedRep)
    setAssigning(true)
    try {
      const res = await fetch(`/api/customers/${customer.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ salesRepId: assignedRep }),
      })
      if (!res.ok) throw new Error('فشل التعيين')
      setCustomerList((p) => p.map((c) => (c.id === customer.id ? { ...c, salesRepId: assignedRep } : c)))
      toast.success(`تم تعيين ${rep?.nameAr ?? ''} للعميل ${customer.nameAr}`)
    } catch {
      toast.error('تعذّر تعيين المندوب، يرجى المحاولة مجدداً')
    } finally {
      setAssigning(false)
    }
  }

  // ── AI Pipeline (recomputed when customer changes) ───────────────────────
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const aiPipeline = useMemo(() => {
    const aiLead = {
      id: customer.id, source: 'Referral' as const, channel: 'WhatsApp' as const,
      propertyInterest: customer.propertyInterest, city: customer.city,
      budget: undefined, email: customer.email, lastContactDate: new Date().toISOString(),
      createdAt: customer.createdAt, stage: 'Qualified' as const, aiScore: customer.aiScore,
      salesRepId: customer.salesRepId, nameAr: customer.nameAr, phone: customer.phone,
      nationality: customer.nationality,
    }
    const hasActiveContract = contracts.length > 0
    return {
      leadScore: scoreLead(aiLead),
      eligibility: computeHousingEligibility(customer, hasActiveContract),
      unitRecs: recommendUnits(customer, availableUnits),
    }
  // contracts changes when customer changes; we want this to stay stable
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customer.id, availableUnits])

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-accent-customer360">
            العميل ٣٦٠°
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            رؤية شاملة عبر جميع نقاط التفاعل
          </p>
        </div>
        <div className="relative w-56">
          <select
            className="h-9 w-full rounded-lg border border-input bg-background pe-8 ps-3 text-sm text-foreground shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
            value={customerId}
            onChange={(e) => {
              setIsLoading(true);
              setCustomerId(e.target.value);
              setActiveFilter("");
              setActiveTab("ai-analysis");
              setTimeout(() => setIsLoading(false), 400);
            }}>
            {customerList.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nameAr}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute inset-e-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-4">
        {/* Left: Profile card */}
        <div className="flex flex-col gap-4">
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex flex-col items-center gap-3 pb-4 border-b border-border">
              <Avatar className="size-16">
                <AvatarFallback className="bg-accent-customer360/10 text-accent-customer360 text-2xl font-bold">
                  {customer.nameAr.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="text-center">
                <h2 className="text-base font-bold">{customer.nameAr}</h2>
                <p className="text-xs text-muted-foreground font-inter mt-0.5">
                  {customer.nic}
                </p>
                <span
                  className={cn(
                    "mt-1 inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium",
                    SEGMENT_STYLES[customer.segment],
                  )}>
                  {SEGMENT_LABELS_AR[customer.segment]}
                </span>
              </div>
              {/* AI Score with tooltip hint */}
              <div className="relative group">
                <ScoreRing
                  score={customer.aiScore}
                  size={80}
                  strokeWidth={8}
                  labelAr="نقاط AI"
                />
                {(() => {
                  const aiLead = {
                    id: customer.id,
                    source: "Referral" as const,
                    channel: "WhatsApp" as const,
                    propertyInterest: customer.propertyInterest,
                    city: customer.city,
                    budget: undefined,
                    email: customer.email,
                    lastContactDate: new Date().toISOString(),
                    createdAt: customer.createdAt,
                    stage: "Qualified" as const,
                    aiScore: customer.aiScore,
                    salesRepId: customer.salesRepId,
                    nameAr: customer.nameAr,
                    phone: customer.phone,
                    nationality: customer.nationality,
                  };
                  const aiResult = scoreLead(aiLead);
                  return (
                    <div className="absolute -top-2 -translate-y-full inset-s-1/2 -translate-x-1/2 hidden group-hover:block z-10 w-52 rounded-lg border border-border bg-card shadow-md text-start p-3">
                      <p
                        className="text-xs font-semibold mb-2"
                        style={{ color: "var(--purple)" }}>
                        أبرز عوامل التقييم
                      </p>
                      <ul className="space-y-1.5">
                        {aiResult.topFactors.map((f, i) => (
                          <li
                            key={i}
                            className="flex items-center justify-between gap-2 text-xs">
                            <span className="text-foreground">{f.labelAr}</span>
                            <span
                              className="font-bold shrink-0"
                              style={{
                                color:
                                  f.contribution > 0
                                    ? "var(--success)"
                                    : "var(--error)",
                              }}>
                              {f.contribution > 0 ? "+" : ""}
                              {toAr(Math.round(f.contribution))}
                            </span>
                          </li>
                        ))}
                      </ul>
                      <div className="mt-2 border-t border-border pt-2 flex items-center justify-between text-[11px] text-muted-foreground">
                        <span>احتمالية التحويل</span>
                        <span
                          className="font-inter font-semibold"
                          style={{ color: "var(--purple)" }}>
                          {toAr(Math.round(aiResult.probability * 100))}٪
                        </span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <div className="flex items-center gap-2.5 text-sm">
                <Phone className="size-4 shrink-0 text-muted-foreground" />
                <span>{customer.phone}</span>
              </div>
              {customer.email && (
                <div className="flex items-center gap-2.5 text-sm">
                  <Mail className="size-4 shrink-0 text-muted-foreground" />
                  <span className="break-all text-xs">{customer.email}</span>
                </div>
              )}
              <div className="flex items-center gap-2.5 text-sm">
                <MapPin className="size-4 shrink-0 text-muted-foreground" />
                <span>{customer.city}</span>
              </div>
              <div className="flex items-center gap-2.5 text-sm">
                <Building2 className="size-4 shrink-0 text-muted-foreground" />
                <span>{customer.propertyInterest}</span>
              </div>
            </div>
          </div>

          {/* Action Panel */}
          <div className="rounded-xl border border-border bg-card p-5 flex flex-col gap-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              الإجراءات السريعة
            </h3>

            {/* Assign Rep */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-muted-foreground">
                تعيين مندوب
              </label>
              <div className="flex gap-1.5">
                <select
                  className="flex-1 h-8 rounded-lg border border-input bg-background ps-2 pe-6 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                  value={assignedRep}
                  onChange={(e) => setAssignedRep(e.target.value)}>
                  <option value="">اختر مندوباً...</option>
                  {salesReps.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.nameAr}
                    </option>
                  ))}
                </select>
                <Button
                  size="sm"
                  className="bg-brand hover:bg-brand/90 text-white px-3 h-8 text-xs"
                  disabled={!assignedRep || assigning}
                  onClick={handleAssignRep}>
                  تعيين
                </Button>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              className="w-full gap-1.5 text-xs"
              onClick={() => setShowLogModal(true)}>
              <Plus className="size-3.5" />
              تسجيل تفاعل
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="w-full gap-1.5 text-xs"
              onClick={() => setShowOppModal(true)}>
              <Plus className="size-3.5" />
              إنشاء فرصة
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="w-full gap-1.5 text-xs text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 hover:border-red-300"
              onClick={() => setShowDeleteModal(true)}>
              <Trash2 className="size-3.5" />
              حذف العميل
            </Button>
          </div>

          {/* Data summary */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="mb-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              مصادر البيانات
            </h3>
            <div className="space-y-2">
              {[
                [
                  "التفاعلات",
                  timeline.filter((e) =>
                    [
                      "Call",
                      "Message",
                      "Email",
                      "Meeting",
                      "Site Visit",
                    ].includes(e.type),
                  ).length,
                ],
                ["الفرص", opportunities.length],
                ["العقود", contracts.length],
                [
                  "الحملات",
                  timeline.filter((e) => e.type === "campaign").length,
                ],
              ].map(([label, count]) => (
                <div
                  key={String(label)}
                  className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-semibold text-accent-customer360">
                    {toAr(Number(count))}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Tabbed panel */}
        <div className="lg:col-span-3 rounded-xl border border-border bg-card">
          {/* Tab bar */}
          <div className="flex border-b border-border overflow-x-auto">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "shrink-0 px-4 py-3 text-sm font-medium border-b-2 transition-colors",
                  activeTab === tab.id
                    ? "border-accent-customer360 text-accent-customer360"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border",
                )}>
                {tab.labelAr}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="p-5">
            {/* Timeline tab */}
            {activeTab === "timeline" && (
              <>
                <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                  <h3 className="text-sm font-semibold">
                    تسلسل التفاعلات{" "}
                    <span className="ms-2 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                      {filteredTimeline.length}
                    </span>
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {SOURCE_FILTERS.map((f) => (
                      <button
                        key={f.id}
                        onClick={() => setActiveFilter(f.id)}
                        className={cn(
                          "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                          activeFilter === f.id
                            ? "bg-accent-customer360 text-white"
                            : "bg-muted text-muted-foreground hover:bg-muted/70",
                        )}>
                        {f.labelAr}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="overflow-y-auto max-h-130 pe-1">
                  {isLoading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <TimelineItemSkeleton key={i} />
                    ))
                  ) : filteredTimeline.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                      <p className="text-sm">لا توجد تفاعلات لهذا الفلتر</p>
                      <button
                        onClick={() => setActiveFilter("")}
                        className="mt-2 text-xs text-accent-customer360 hover:underline">
                        مسح الفلتر
                      </button>
                    </div>
                  ) : (
                    filteredTimeline.map((event, i) => (
                      <TimelineItem
                        key={event.id}
                        event={event}
                        isLast={i === filteredTimeline.length - 1}
                        isHighlighted={
                          !activeFilter || event.type === activeFilter
                        }
                      />
                    ))
                  )}
                </div>
              </>
            )}

            {/* Opportunities tab */}
            {activeTab === "opportunities" && (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold">
                    الفرص ({toAr(opportunities.length)})
                  </h3>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1 text-xs"
                    onClick={() => setShowOppModal(true)}>
                    <Plus className="size-3.5" /> فرصة جديدة
                  </Button>
                </div>
                {opportunities.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-8 text-center">
                    لا توجد فرص مسجلة لهذا العميل
                  </p>
                ) : (
                  opportunities.map((opp) => (
                    <div
                      key={opp.id}
                      className="rounded-lg border border-border p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold">{opp.titleAr}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {opp.project} · {opp.unitType}
                          </p>
                        </div>
                        <StatusPill type="opportunity" value={opp.stage} />
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-sm font-bold text-accent-customer360">
                          {(opp.valueRiyal / 1_000_000).toFixed(2)} م ريال
                        </span>
                        <span className="text-xs text-muted-foreground">
                          احتمالية: {opp.probability}٪
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Contracts tab */}
            {activeTab === "contracts" && (
              <div className="flex flex-col gap-3">
                <h3 className="text-sm font-semibold mb-2">
                  العقود ({toAr(contracts.length)})
                </h3>
                {contracts.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-8 text-center">
                    لا توجد عقود مسجلة
                  </p>
                ) : (
                  contracts.map((c) => (
                    <div
                      key={c.id}
                      className="rounded-lg border border-border p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold font-inter">
                            {c.unitId}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {c.project} · {c.unitType}
                          </p>
                        </div>
                        <StatusPill type="contract" value={c.status} />
                      </div>
                      <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                        <span>
                          {toAr((c.valueRiyal / 1_000_000).toFixed(2))} م ريال
                        </span>
                        <span>{c.paymentPlan}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Profile tab */}
            {activeTab === "profile" && (
              <div className="grid grid-cols-2 gap-4">
                {[
                  ["الاسم الكامل", customer.nameAr],
                  ["رقم الهوية الوطنية", customer.nic],
                  ["رقم الجوال", customer.phone],
                  ["البريد الإلكتروني", customer.email ?? "—"],
                  ["المدينة", customer.city],
                  ["العقار المطلوب", customer.propertyInterest],
                  ["الجنسية", customer.nationality],
                  [
                    "تاريخ التسجيل",
                    new Date(customer.createdAt).toLocaleDateString("ar-SA", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    }),
                  ],
                ].map(([label, val]) => (
                  <div key={String(label)}>
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p
                      className={cn(
                        "text-sm font-medium mt-0.5",
                        String(label).includes("الهوية") ||
                          String(label).includes("رقم")
                          ? "font-inter"
                          : "",
                      )}>
                      {val}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Campaigns tab */}
            {activeTab === "campaigns" && (
              <div className="flex flex-col gap-3">
                <h3 className="text-sm font-semibold mb-2">الحملات المرتبطة</h3>
                {timeline.filter((e) => e.type === "campaign").length === 0 ? (
                  <p className="text-sm text-muted-foreground py-8 text-center">
                    لا توجد حملات مرتبطة
                  </p>
                ) : (
                  timeline
                    .filter((e) => e.type === "campaign")
                    .map((e) => (
                      <div
                        key={e.id}
                        className="rounded-lg border border-border p-4">
                        <p className="text-sm font-semibold">{e.titleAr}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {e.descriptionAr}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-2">
                          {new Date(e.date).toLocaleDateString("ar-SA")}
                        </p>
                      </div>
                    ))
                )}
              </div>
            )}

            {/* Requests tab */}
            {activeTab === "requests" && (
              <div className="flex flex-col gap-3">
                <h3 className="text-sm font-semibold mb-2">الطلبات المقدمة</h3>
                {timeline.filter((e) => e.type === "request").length === 0 ? (
                  <p className="text-sm text-muted-foreground py-8 text-center">
                    لا توجد طلبات مقدمة
                  </p>
                ) : (
                  timeline
                    .filter((e) => e.type === "request")
                    .map((e) => (
                      <div
                        key={e.id}
                        className="rounded-lg border border-border p-4">
                        <p className="text-sm font-semibold">{e.titleAr}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {e.descriptionAr}
                        </p>
                      </div>
                    ))
                )}
              </div>
            )}

            {/* AI Analysis tab — three-stage pipeline */}
            {activeTab === "ai-analysis" && (
              <div className="flex flex-col gap-6">
                {/* Pipeline header */}
                <div className="flex items-center gap-3">
                  <div className="flex size-9 items-center justify-center rounded-lg bg-violet-100">
                    <Brain className="size-4 text-violet-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">
                      تحليل الذكاء الاصطناعي المتكامل
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      ثلاث مراحل متسلسلة — أهلية الإسكان ← تقييم الصفقة ← توصية
                      الوحدات
                    </p>
                  </div>
                </div>

                {/* Pipeline flow indicator */}
                <div className="flex items-center gap-1 overflow-x-auto pb-1">
                  {[
                    {
                      label: "أهلية الإسكان",
                      score: aiPipeline.eligibility.score,
                      color: "bg-blue-500",
                    },
                    {
                      label: "تقييم الصفقة",
                      score: aiPipeline.leadScore.score,
                      color: "bg-amber-500",
                    },
                    {
                      label: "توصية الوحدات",
                      score:
                        aiPipeline.unitRecs.recommendations[0]?.matchScore ?? 0,
                      color: "bg-emerald-500",
                    },
                  ].map((step, i) => (
                    <div key={i} className="flex items-center gap-1 shrink-0">
                      <div className="flex flex-col items-center gap-1">
                        <div
                          className={cn(
                            "flex size-8 items-center justify-center rounded-full text-white text-xs font-bold",
                            step.color,
                          )}>
                          {toAr(i + 1)}
                        </div>
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                          {step.label}
                        </span>
                        <span
                          className={cn(
                            "text-xs font-bold",
                            step.score >= 80
                              ? "text-success"
                              : step.score >= 55
                                ? "text-amber-500"
                                : "text-danger",
                          )}>
                          {toAr(step.score)}٪
                        </span>
                      </div>
                      {i < 2 && (
                        <ArrowLeft className="size-4 text-muted-foreground shrink-0 -mt-4 mx-1" />
                      )}
                    </div>
                  ))}
                </div>

                {/* ── Stage 1: Housing Eligibility ─────────────────────── */}
                <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-5">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="flex size-8 items-center justify-center rounded-lg bg-blue-100">
                        <ShieldCheck className="size-4 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-blue-900">
                          المرحلة الأولى: أهلية الإسكان
                        </h4>
                        <p className="text-xs text-blue-600">
                          تحديد البرامج الحكومية المناسبة
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span
                        className={cn(
                          "rounded-full px-3 py-1 text-xs font-bold border",
                          aiPipeline.eligibility.tier === "مؤهل كامل"
                            ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                            : aiPipeline.eligibility.tier === "مؤهل جزئي"
                              ? "bg-amber-100 text-amber-700 border-amber-200"
                              : "bg-red-100 text-red-700 border-red-200",
                        )}>
                        {aiPipeline.eligibility.tier}
                      </span>
                      <span className="text-2xl font-extrabold text-blue-700">
                        {toAr(aiPipeline.eligibility.score)}٪
                      </span>
                    </div>
                  </div>

                  {/* Eligibility factors */}
                  <div className="grid grid-cols-1 gap-2 mb-4">
                    {aiPipeline.eligibility.factors.map((factor, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-2.5 rounded-lg bg-white/70 border border-blue-100 px-3 py-2">
                        {factor.met ? (
                          <CheckCircle2 className="size-4 shrink-0 text-emerald-500 mt-0.5" />
                        ) : (
                          <XCircle className="size-4 shrink-0 text-red-400 mt-0.5" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-foreground">
                            {factor.labelAr}
                          </p>
                          <p className="text-[11px] text-muted-foreground leading-relaxed">
                            {factor.descriptionAr}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Eligible programs */}
                  {aiPipeline.eligibility.programs.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs font-semibold text-blue-800 mb-2">
                        البرامج المتاحة:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {aiPipeline.eligibility.programs.map((prog) => (
                          <span
                            key={prog}
                            className="flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700 border border-blue-200">
                            <BadgeCheck className="size-3" />
                            {prog}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recommendation */}
                  <div className="rounded-lg bg-blue-100/60 border border-blue-200 px-3 py-2.5">
                    <p className="text-xs text-blue-800 leading-relaxed">
                      {aiPipeline.eligibility.recommendationAr}
                    </p>
                  </div>
                </div>

                {/* ── Stage 2: Lead Score ──────────────────────────────── */}
                <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-5">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="flex size-8 items-center justify-center rounded-lg bg-amber-100">
                        <Star className="size-4 text-amber-600" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-amber-900">
                          المرحلة الثانية: تقييم الصفقة
                        </h4>
                        <p className="text-xs text-amber-600">
                          احتمالية إغلاق الصفقة بناءً على ملف العميل
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span
                        className={cn(
                          "rounded-full px-3 py-1 text-xs font-bold border",
                          aiPipeline.leadScore.tier === "A"
                            ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                            : aiPipeline.leadScore.tier === "B"
                              ? "bg-blue-100 text-blue-700 border-blue-200"
                              : aiPipeline.leadScore.tier === "C"
                                ? "bg-amber-100 text-amber-700 border-amber-200"
                                : "bg-red-100 text-red-700 border-red-200",
                        )}>
                        الدرجة {aiPipeline.leadScore.tier}
                      </span>
                      <span className="text-2xl font-extrabold text-amber-700">
                        {toAr(aiPipeline.leadScore.score)}/١٠٠
                      </span>
                    </div>
                  </div>

                  {/* Probability bar */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-muted-foreground">
                        احتمالية التحويل
                      </span>
                      <span className="font-bold text-amber-700">
                        {toAr(
                          Math.round(aiPipeline.leadScore.probability * 100),
                        )}
                        ٪
                      </span>
                    </div>
                    <div className="h-2.5 rounded-full bg-amber-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-amber-500 transition-all duration-700"
                        style={{
                          width: `${Math.round(aiPipeline.leadScore.probability * 100)}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Top factors */}
                  <div className="space-y-2 mb-3">
                    {aiPipeline.leadScore.topFactors.map((factor, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between rounded-lg bg-white/70 border border-amber-100 px-3 py-2">
                        <span className="text-xs text-foreground">
                          {factor.labelAr}
                        </span>
                        <span
                          className={cn(
                            "text-xs font-bold",
                            factor.contribution > 0
                              ? "text-emerald-600"
                              : "text-red-500",
                          )}>
                          {factor.contribution > 0 ? "+" : ""}
                          {toAr(Math.round(factor.contribution))}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-lg bg-amber-100/60 border border-amber-200 px-3 py-2.5">
                    <p className="text-xs text-amber-800 leading-relaxed">
                      {aiPipeline.leadScore.tier === "A"
                        ? "عميل ذو أولوية عالية — يُنصح بالتواصل الفوري وتسريع دورة المبيعات."
                        : aiPipeline.leadScore.tier === "B"
                          ? "عميل واعد — تابع معه بانتظام وقدّم له عروضاً مخصصة."
                          : aiPipeline.leadScore.tier === "C"
                            ? "عميل متوسط — استمر في التفاعل وحاول تحسين نقاط الضعف."
                            : "عميل ذو أولوية منخفضة — ضعه في قائمة المتابعة الدورية."}
                    </p>
                  </div>
                </div>

                {/* ── Stage 3: Unit Recommendations ───────────────────── */}
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-5">
                  <div className="flex items-center gap-2.5 mb-4">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-100">
                      <Home className="size-4 text-emerald-600" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-emerald-900">
                        المرحلة الثالثة: توصية الوحدات
                      </h4>
                      <p className="text-xs text-emerald-600">
                        الوحدات الأنسب للعميل مرتبة حسب درجة التطابق
                      </p>
                    </div>
                  </div>

                  {aiPipeline.unitRecs.recommendations.length === 0 ? (
                    <div className="flex items-center gap-2 rounded-lg bg-white/70 border border-emerald-100 px-4 py-6 text-center justify-center">
                      <AlertTriangle className="size-4 text-amber-500" />
                      <p className="text-sm text-muted-foreground">
                        لا توجد وحدات متاحة تناسب ملف العميل حالياً
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {aiPipeline.unitRecs.recommendations.map((rec) => (
                        <div
                          key={rec.unit.id}
                          className="rounded-lg bg-white/80 border border-emerald-100 p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="flex size-5 items-center justify-center rounded-full bg-emerald-500 text-white text-[10px] font-bold shrink-0">
                                  {toAr(rec.rank)}
                                </span>
                                <p className="text-sm font-bold text-foreground">
                                  {rec.unit.project}
                                </p>
                                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                                  {rec.unit.unitType}
                                </span>
                              </div>
                              <p className="mt-1 text-xs text-muted-foreground font-inter">
                                {rec.unit.id} · {rec.unit.city} ·{" "}
                                {rec.unit.bedrooms} غرف · {toAr(rec.unit.area)}{" "}
                                م²
                              </p>
                            </div>
                            <div className="flex flex-col items-end gap-1 shrink-0">
                              <span
                                className={cn(
                                  "text-sm font-extrabold",
                                  rec.matchScore >= 80
                                    ? "text-emerald-600"
                                    : rec.matchScore >= 55
                                      ? "text-amber-500"
                                      : "text-muted-foreground",
                                )}>
                                {toAr(rec.matchScore)}٪
                              </span>
                              <span className="text-xs font-bold text-foreground">
                                {(rec.unit.priceRiyal / 1_000_000).toFixed(2)} م
                                ريال
                              </span>
                            </div>
                          </div>

                          {/* Match reasons */}
                          <div className="mt-2.5 space-y-1">
                            {rec.matchReasons.map((reason, i) => (
                              <div
                                key={i}
                                className="flex items-start gap-1.5 text-xs text-muted-foreground">
                                <span className="mt-1 size-1 rounded-full bg-emerald-400 shrink-0" />
                                {reason}
                              </div>
                            ))}
                          </div>

                          {/* Unit features */}
                          {rec.unit.features.length > 0 && (
                            <div className="mt-2.5 flex flex-wrap gap-1.5">
                              {rec.unit.features.map((feat) => (
                                <span
                                  key={feat}
                                  className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                                  {feat}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {showLogModal && (
        <LogInteractionModal
          onClose={() => setShowLogModal(false)}
          onSave={async (note, channel) => {
            const targetId = customer.id
            try {
              const res = await fetch(`/api/customers/${targetId}/interactions`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  type: CHANNEL_TO_TYPE[channel] ?? "Call",
                  channel,
                  note,
                }),
              });
              if (!res.ok) throw new Error("فشل الحفظ");
              const { event } = (await res.json()) as { event: TimelineEvent };
              // Display under the currently-selected id even if a lead was just
              // converted to a customer (the DB row carries the real customerId).
              setExtraTimeline((p) => [{ ...event, customerId: targetId }, ...p]);
              toast.success("تم تسجيل التفاعل بنجاح");
            } catch {
              toast.error("تعذّر تسجيل التفاعل، يرجى المحاولة مجدداً");
            }
          }}
        />
      )}
      {showDeleteModal && (
        <DeleteConfirmModal
          customerName={customer.nameAr}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={async () => {
            const deleted = customer
            const remaining = customerList.filter((c) => c.id !== deleted.id)
            setCustomerList(remaining)
            setShowDeleteModal(false)
            const next = remaining[0]
            setCustomerId(next?.id ?? '')
            setActiveTab('ai-analysis')
            setActiveFilter('')
            try {
              const res = await fetch(`/api/customers/${deleted.id}`, { method: 'DELETE' })
              if (!res.ok) throw new Error('فشل الحذف')
              toast.success(`تم حذف العميل ${deleted.nameAr}`)
            } catch {
              setCustomerList((p) => [deleted, ...p])
              setCustomerId(deleted.id)
              toast.error('تعذّر حذف العميل، يرجى المحاولة مجدداً')
            }
          }}
        />
      )}
      {showOppModal && (
        <CreateOpportunityModal
          customerName={customer.nameAr}
          onClose={() => setShowOppModal(false)}
          onSave={async (title) => {
            const targetId = customer.id
            try {
              const res = await fetch(`/api/customers/${targetId}/opportunities`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  titleAr: title,
                  unitType: customer.propertyInterest,
                }),
              });
              if (!res.ok) throw new Error("فشل الحفظ");
              const { opportunity, event } = (await res.json()) as {
                opportunity: Opportunity;
                event: TimelineEvent;
              };
              setExtraOpps((p) => [{ ...opportunity, customerId: targetId }, ...p]);
              setExtraTimeline((p) => [{ ...event, customerId: targetId }, ...p]);
              toast.success("تم إنشاء الفرصة بنجاح");
              setActiveTab("opportunities");
            } catch {
              toast.error("تعذّر إنشاء الفرصة، يرجى المحاولة مجدداً");
            }
          }}
        />
      )}
    </div>
  );
}
