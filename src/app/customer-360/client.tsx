'use client'

import { useState } from 'react'
import {
  Phone, Mail, MapPin, Building2, User,
  PhoneCall, MessageSquare, MailIcon, Calendar,
  FileText, Zap, ShoppingBag, Award, ChevronDown, Plus, X,
} from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { StatusPill } from '@/components/shared/status-pill'
import { ScoreRing } from '@/components/shared/score-ring'
import { TimelineItemSkeleton } from '@/components/shared/skeleton-card'
import { toast } from 'sonner'
import type { TimelineEvent, Customer, Opportunity, Contract } from '@/lib/types'
import { cn } from '@/lib/utils'

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
  { id: 'timeline',     labelAr: 'التفاعلات' },
  { id: 'opportunities',labelAr: 'الفرص' },
  { id: 'contracts',    labelAr: 'العقود' },
  { id: 'profile',      labelAr: 'الملف' },
  { id: 'campaigns',    labelAr: 'الحملات' },
  { id: 'requests',     labelAr: 'الطلبات' },
]

const CHANNELS = ['واتساب', 'مكالمة', 'بريد إلكتروني', 'اجتماع', 'زيارة موقع']
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
function LogInteractionModal({ onClose, onSave }: { onClose: () => void; onSave: (note: string) => void }) {
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
            className="min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring resize-none"
            placeholder="اكتب ملاحظات التفاعل..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>
        <div className="flex gap-2 justify-end">
          <Button variant="outline" size="sm" onClick={onClose}>إلغاء</Button>
          <Button size="sm" className="bg-brand hover:bg-brand/90 text-white" onClick={() => { onSave(note); onClose() }}>
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

/* ── Main component ─────────────────────────────────────────── */
interface Props {
  customers: Customer[]
  allTimeline: TimelineEvent[]
  allOpportunities: Opportunity[]
  allContracts: Contract[]
}

export function Customer360Client({ customers, allTimeline, allOpportunities, allContracts }: Props) {
  const [customerId, setCustomerId] = useState(customers[0]?.id ?? '')
  const [activeTab, setActiveTab] = useState('timeline')
  const [activeFilter, setActiveFilter] = useState('')
  const [isLoading] = useState(false)
  const [assignedRep, setAssignedRep] = useState('')
  const [showLogModal, setShowLogModal] = useState(false)
  const [showOppModal, setShowOppModal] = useState(false)
  const [extraTimeline, setExtraTimeline] = useState<TimelineEvent[]>([])
  const [extraOpps, setExtraOpps] = useState<Opportunity[]>([])

  const customer = customers.find((c) => c.id === customerId) ?? customers[0]
  const timeline = [...allTimeline.filter((e) => e.customerId === customer?.id), ...extraTimeline.filter((e) => e.customerId === customer?.id)]
  const opportunities = [...allOpportunities.filter((o) => o.customerId === customer?.id), ...extraOpps.filter((o) => o.customerId === customer?.id)]
  const contracts = allContracts.filter((c) => c.customerId === customer?.id)

  const filteredTimeline = activeFilter ? timeline.filter((e) => e.type === activeFilter) : timeline

  if (!customer) return null

  const REPS = ['خالد الشمري', 'نورة الغامدي', 'فيصل العنزي', 'سارة القرشي', 'رشيد الزهراني']

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-accent-customer360">العميل ٣٦٠°</h1>
          <p className="text-sm text-muted-foreground mt-0.5">رؤية شاملة عبر جميع نقاط التفاعل</p>
        </div>
        <div className="relative w-56">
          <select
            className="h-9 w-full rounded-lg border border-input bg-background pe-8 ps-3 text-sm text-foreground shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
            value={customerId}
            onChange={(e) => { setCustomerId(e.target.value); setActiveFilter(''); setActiveTab('timeline') }}
          >
            {customers.map((c) => <option key={c.id} value={c.id}>{c.nameAr}</option>)}
          </select>
          <ChevronDown className="pointer-events-none absolute end-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
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
                <p className="text-xs text-muted-foreground font-inter mt-0.5">{customer.nic}</p>
                <span className={cn('mt-1 inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium', SEGMENT_STYLES[customer.segment])}>
                  {SEGMENT_LABELS_AR[customer.segment]}
                </span>
              </div>
              {/* AI Score with tooltip hint */}
              <div className="relative group">
                <ScoreRing score={customer.aiScore} size={80} strokeWidth={8} labelAr="نقاط AI" />
                <div className="absolute -top-12 start-1/2 -translate-x-1/2 hidden group-hover:block z-10 bg-foreground text-background text-xs rounded-lg px-3 py-2 whitespace-nowrap shadow-lg">
                  <p className="font-semibold mb-1">أبرز عوامل التقييم:</p>
                  <p>• مستوى التفاعل (+٢٥)</p>
                  <p>• الميزانية المناسبة (+٢٠)</p>
                  <p>• قوة المصدر (+١٥)</p>
                </div>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <div className="flex items-center gap-2.5 text-sm"><Phone className="size-4 shrink-0 text-muted-foreground" /><span>{customer.phone}</span></div>
              {customer.email && <div className="flex items-center gap-2.5 text-sm"><Mail className="size-4 shrink-0 text-muted-foreground" /><span className="break-all text-xs">{customer.email}</span></div>}
              <div className="flex items-center gap-2.5 text-sm"><MapPin className="size-4 shrink-0 text-muted-foreground" /><span>{customer.city}</span></div>
              <div className="flex items-center gap-2.5 text-sm"><Building2 className="size-4 shrink-0 text-muted-foreground" /><span>{customer.propertyInterest}</span></div>
            </div>
          </div>

          {/* Action Panel */}
          <div className="rounded-xl border border-border bg-card p-5 flex flex-col gap-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">الإجراءات السريعة</h3>

            {/* Assign Rep */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-muted-foreground">تعيين مندوب</label>
              <div className="flex gap-1.5">
                <select
                  className="flex-1 h-8 rounded-lg border border-input bg-background ps-2 pe-6 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                  value={assignedRep}
                  onChange={(e) => setAssignedRep(e.target.value)}
                >
                  <option value="">اختر مندوباً...</option>
                  {REPS.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
                <Button
                  size="sm"
                  className="bg-brand hover:bg-brand/90 text-white px-3 h-8 text-xs"
                  disabled={!assignedRep}
                  onClick={() => toast.success(`تم تعيين ${assignedRep} للعميل ${customer.nameAr}`)}
                >
                  تعيين
                </Button>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              className="w-full gap-1.5 text-xs"
              onClick={() => setShowLogModal(true)}
            >
              <Plus className="size-3.5" />
              تسجيل تفاعل
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="w-full gap-1.5 text-xs"
              onClick={() => setShowOppModal(true)}
            >
              <Plus className="size-3.5" />
              إنشاء فرصة
            </Button>
          </div>

          {/* Data summary */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="mb-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">مصادر البيانات</h3>
            <div className="space-y-2">
              {[
                ['التفاعلات', timeline.filter((e) => ['Call','Message','Email','Meeting','Site Visit'].includes(e.type)).length],
                ['الفرص',     opportunities.length],
                ['العقود',    contracts.length],
                ['الحملات',   timeline.filter((e) => e.type === 'campaign').length],
              ].map(([label, count]) => (
                <div key={String(label)} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-semibold text-accent-customer360">{count}</span>
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
                  'shrink-0 px-4 py-3 text-sm font-medium border-b-2 transition-colors',
                  activeTab === tab.id
                    ? 'border-accent-customer360 text-accent-customer360'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                )}
              >
                {tab.labelAr}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="p-5">
            {/* Timeline tab */}
            {activeTab === 'timeline' && (
              <>
                <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                  <h3 className="text-sm font-semibold">تسلسل التفاعلات <span className="ms-2 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{filteredTimeline.length}</span></h3>
                  <div className="flex flex-wrap gap-1.5">
                    {SOURCE_FILTERS.map((f) => (
                      <button
                        key={f.id}
                        onClick={() => setActiveFilter(f.id)}
                        className={cn('rounded-full px-3 py-1 text-xs font-medium transition-colors',
                          activeFilter === f.id ? 'bg-accent-customer360 text-white' : 'bg-muted text-muted-foreground hover:bg-muted/70')}
                      >
                        {f.labelAr}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="overflow-y-auto max-h-[520px] pe-1">
                  {isLoading
                    ? Array.from({ length: 4 }).map((_, i) => <TimelineItemSkeleton key={i} />)
                    : filteredTimeline.length === 0
                    ? <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                        <p className="text-sm">لا توجد تفاعلات لهذا الفلتر</p>
                        <button onClick={() => setActiveFilter('')} className="mt-2 text-xs text-accent-customer360 hover:underline">مسح الفلتر</button>
                      </div>
                    : filteredTimeline.map((event, i) => (
                        <TimelineItem key={event.id} event={event} isLast={i === filteredTimeline.length - 1}
                          isHighlighted={!activeFilter || event.type === activeFilter} />
                      ))}
                </div>
              </>
            )}

            {/* Opportunities tab */}
            {activeTab === 'opportunities' && (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold">الفرص ({opportunities.length})</h3>
                  <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={() => setShowOppModal(true)}>
                    <Plus className="size-3.5" /> فرصة جديدة
                  </Button>
                </div>
                {opportunities.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-8 text-center">لا توجد فرص مسجلة لهذا العميل</p>
                ) : opportunities.map((opp) => (
                  <div key={opp.id} className="rounded-lg border border-border p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold">{opp.titleAr}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{opp.project} · {opp.unitType}</p>
                      </div>
                      <StatusPill type="opportunity" value={opp.stage} />
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-sm font-bold text-accent-customer360">{(opp.valueRiyal / 1_000_000).toFixed(2)} م ريال</span>
                      <span className="text-xs text-muted-foreground">احتمالية: {opp.probability}٪</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Contracts tab */}
            {activeTab === 'contracts' && (
              <div className="flex flex-col gap-3">
                <h3 className="text-sm font-semibold mb-2">العقود ({contracts.length})</h3>
                {contracts.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-8 text-center">لا توجد عقود مسجلة</p>
                ) : contracts.map((c) => (
                  <div key={c.id} className="rounded-lg border border-border p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold font-inter">{c.unitId}</p>
                        <p className="text-xs text-muted-foreground">{c.project} · {c.unitType}</p>
                      </div>
                      <StatusPill type="contract" value={c.status} />
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                      <span>{(c.valueRiyal / 1_000_000).toFixed(2)} م ريال</span>
                      <span>{c.paymentPlan}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Profile tab */}
            {activeTab === 'profile' && (
              <div className="grid grid-cols-2 gap-4">
                {[
                  ['الاسم الكامل', customer.nameAr],
                  ['رقم الهوية الوطنية', customer.nic],
                  ['رقم الجوال', customer.phone],
                  ['البريد الإلكتروني', customer.email ?? '—'],
                  ['المدينة', customer.city],
                  ['العقار المطلوب', customer.propertyInterest],
                  ['الجنسية', customer.nationality],
                  ['تاريخ التسجيل', new Date(customer.createdAt).toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' })],
                ].map(([label, val]) => (
                  <div key={String(label)}>
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className={cn('text-sm font-medium mt-0.5', String(label).includes('الهوية') || String(label).includes('رقم') ? 'font-inter' : '')}>{val}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Campaigns tab */}
            {activeTab === 'campaigns' && (
              <div className="flex flex-col gap-3">
                <h3 className="text-sm font-semibold mb-2">الحملات المرتبطة</h3>
                {timeline.filter((e) => e.type === 'campaign').length === 0 ? (
                  <p className="text-sm text-muted-foreground py-8 text-center">لا توجد حملات مرتبطة</p>
                ) : timeline.filter((e) => e.type === 'campaign').map((e) => (
                  <div key={e.id} className="rounded-lg border border-border p-4">
                    <p className="text-sm font-semibold">{e.titleAr}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{e.descriptionAr}</p>
                    <p className="text-[10px] text-muted-foreground mt-2">{new Date(e.date).toLocaleDateString('ar-SA')}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Requests tab */}
            {activeTab === 'requests' && (
              <div className="flex flex-col gap-3">
                <h3 className="text-sm font-semibold mb-2">الطلبات المقدمة</h3>
                {timeline.filter((e) => e.type === 'request').length === 0 ? (
                  <p className="text-sm text-muted-foreground py-8 text-center">لا توجد طلبات مقدمة</p>
                ) : timeline.filter((e) => e.type === 'request').map((e) => (
                  <div key={e.id} className="rounded-lg border border-border p-4">
                    <p className="text-sm font-semibold">{e.titleAr}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{e.descriptionAr}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {showLogModal && (
        <LogInteractionModal
          onClose={() => setShowLogModal(false)}
          onSave={(note) => {
            const newEvent: TimelineEvent = {
              id: `evt-${Date.now()}`, customerId: customer.id, entityType: 'Interaction',
              entityId: `int-${Date.now()}`, titleAr: 'تفاعل جديد', descriptionAr: note || 'تم تسجيل التفاعل',
              date: new Date().toISOString(), type: 'Call',
            }
            setExtraTimeline((p) => [newEvent, ...p])
            toast.success('تم تسجيل التفاعل بنجاح')
          }}
        />
      )}
      {showOppModal && (
        <CreateOpportunityModal
          customerName={customer.nameAr}
          onClose={() => setShowOppModal(false)}
          onSave={(title) => {
            const newOpp: Opportunity = {
              id: `opp-${Date.now()}`, customerId: customer.id, titleAr: title,
              project: 'مشروع جديد', unitType: customer.propertyInterest,
              valueRiyal: 1_500_000, stage: 'تحديد الاهتمام', probability: 20,
              expectedCloseDate: new Date(Date.now() + 30 * 86400000).toISOString(),
              salesRepId: 'rep-001', createdAt: new Date().toISOString(),
            }
            setExtraOpps((p) => [newOpp, ...p])
            toast.success('تم إنشاء الفرصة بنجاح')
            setActiveTab('opportunities')
          }}
        />
      )}
    </div>
  )
}
