'use client'

import { useState } from 'react'
import {
  Phone, Mail, MapPin, Building2, User,
  PhoneCall, MessageSquare, MailIcon, Calendar,
  FileText, Zap, ShoppingBag, Award, ChevronDown,
} from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { StatusPill } from '@/components/shared/status-pill'
import { ScoreRing } from '@/components/shared/score-ring'
import { TimelineItemSkeleton } from '@/components/shared/skeleton-card'
import {
  CUSTOMERS,
  getTimelineByCustomer,
  getOpportunitiesByCustomer,
  getContractsByCustomer,
} from '@/lib/mock-data'
import type { TimelineEvent, Customer } from '@/lib/types'
import { cn } from '@/lib/utils'

// ── Timeline event types + icons ─────────────────────────────────────────────

const EVENT_CONFIG: Record<string, { icon: React.ElementType; bgClass: string; colorClass: string; labelAr: string }> = {
  Call: { icon: PhoneCall, bgClass: 'bg-blue-100', colorClass: 'text-blue-600', labelAr: 'مكالمة' },
  Message: { icon: MessageSquare, bgClass: 'bg-sky-100', colorClass: 'text-sky-600', labelAr: 'رسالة' },
  Email: { icon: MailIcon, bgClass: 'bg-violet-100', colorClass: 'text-violet-600', labelAr: 'بريد إلكتروني' },
  Meeting: { icon: Calendar, bgClass: 'bg-emerald-100', colorClass: 'text-emerald-600', labelAr: 'اجتماع' },
  'Site Visit': { icon: Building2, bgClass: 'bg-amber-100', colorClass: 'text-amber-600', labelAr: 'زيارة موقع' },
  Document: { icon: FileText, bgClass: 'bg-slate-100', colorClass: 'text-slate-600', labelAr: 'مستند' },
  System: { icon: Zap, bgClass: 'bg-gray-100', colorClass: 'text-gray-500', labelAr: 'نظام' },
  opportunity: { icon: ShoppingBag, bgClass: 'bg-purple-100', colorClass: 'text-purple-600', labelAr: 'فرصة' },
  contract: { icon: Award, bgClass: 'bg-green-100', colorClass: 'text-green-600', labelAr: 'عقد' },
  campaign: { icon: Zap, bgClass: 'bg-rose-100', colorClass: 'text-rose-600', labelAr: 'حملة' },
  request: { icon: FileText, bgClass: 'bg-orange-100', colorClass: 'text-orange-600', labelAr: 'طلب' },
  lead: { icon: User, bgClass: 'bg-sky-100', colorClass: 'text-sky-600', labelAr: 'عميل محتمل' },
}

const SOURCE_FILTERS = [
  { id: '', labelAr: 'الكل' },
  { id: 'Call', labelAr: 'مكالمات' },
  { id: 'Message', labelAr: 'رسائل' },
  { id: 'Email', labelAr: 'بريد' },
  { id: 'Meeting', labelAr: 'اجتماعات' },
  { id: 'Site Visit', labelAr: 'زيارات' },
  { id: 'opportunity', labelAr: 'فرص' },
  { id: 'contract', labelAr: 'عقود' },
]

// ── Segment colors ────────────────────────────────────────────────────────────

const SEGMENT_STYLES: Record<string, string> = {
  VIP: 'bg-amber-100 text-amber-700 border-amber-200',
  Standard: 'bg-blue-100 text-blue-700 border-blue-200',
  'At-Risk': 'bg-red-100 text-red-700 border-red-200',
  New: 'bg-emerald-100 text-emerald-700 border-emerald-200',
}

const SEGMENT_LABELS_AR: Record<string, string> = {
  VIP: 'عميل VIP',
  Standard: 'عميل عادي',
  'At-Risk': 'في خطر',
  New: 'عميل جديد',
}

// ── Timeline item ─────────────────────────────────────────────────────────────

function TimelineItem({
  event,
  isLast,
  isHighlighted,
}: {
  event: TimelineEvent
  isLast: boolean
  isHighlighted: boolean
}) {
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
            <span className={cn('rounded-full px-2 py-0.5 text-xs', cfg.bgClass, cfg.colorClass)}>
              {cfg.labelAr}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Customer selector ─────────────────────────────────────────────────────────

function CustomerSelector({
  selected,
  onChange,
}: {
  selected: string
  onChange: (id: string) => void
}) {
  return (
    <div className="relative">
      <select
        className="h-9 w-full rounded-lg border border-input bg-background pe-8 ps-3 text-sm text-foreground shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
        value={selected}
        onChange={(e) => onChange(e.target.value)}
      >
        {CUSTOMERS.map((c) => (
          <option key={c.id} value={c.id}>{c.nameAr}</option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute end-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function Customer360Page() {
  const [customerId, setCustomerId] = useState('cust-001')
  const [activeFilter, setActiveFilter] = useState('')
  const [isLoading] = useState(false)

  const customer = CUSTOMERS.find((c) => c.id === customerId) ?? CUSTOMERS[0]
  const timeline = getTimelineByCustomer(customer.id)
  const opportunities = getOpportunitiesByCustomer(customer.id)
  const contracts = getContractsByCustomer(customer.id)

  const filteredTimeline = activeFilter
    ? timeline.filter((e) => e.type === activeFilter)
    : timeline

  return (
    <div className="flex flex-col gap-5">
      {/* Header with customer selector */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-accent-customer360">العميل ٣٦٠</h1>
          <p className="text-sm text-muted-foreground mt-0.5">رؤية شاملة للعميل عبر جميع نقاط التفاعل</p>
        </div>
        <div className="w-56">
          <CustomerSelector selected={customerId} onChange={setCustomerId} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
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
                <h2 className="text-base font-bold text-foreground">{customer.nameAr}</h2>
                <span
                  className={cn(
                    'mt-1 inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium',
                    SEGMENT_STYLES[customer.segment]
                  )}
                >
                  {SEGMENT_LABELS_AR[customer.segment]}
                </span>
              </div>
              <ScoreRing score={customer.aiScore} size={80} strokeWidth={8} labelAr="نقاط الذكاء الاصطناعي" />
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

          {/* Data sources summary */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="mb-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              مصادر البيانات
            </h3>
            <div className="space-y-2">
              {Object.entries({
                'التفاعلات': timeline.filter((e) => ['Call','Message','Email','Meeting','Site Visit','Document'].includes(e.type)).length,
                'الفرص': opportunities.length,
                'العقود': contracts.length,
                'الحملات': timeline.filter((e) => e.type === 'campaign').length,
              }).map(([label, count]) => (
                <div key={label} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-semibold text-accent-customer360">{count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Opportunities */}
          {opportunities.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="mb-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                الفرص ({opportunities.length})
              </h3>
              <div className="space-y-3">
                {opportunities.map((opp) => (
                  <div key={opp.id} className="rounded-lg border border-border p-3">
                    <p className="text-sm font-medium text-foreground">{opp.titleAr}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{opp.stage}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-xs font-semibold text-accent-customer360">
                        {(opp.valueRiyal / 1_000_000).toFixed(2)} م ريال
                      </span>
                      <span className="text-xs text-muted-foreground">{opp.probability}٪</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Timeline */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-card p-5">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
            <h3 className="text-sm font-semibold text-foreground">
              تسلسل التفاعلات
              <span className="ms-2 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                {filteredTimeline.length}
              </span>
            </h3>
            {/* Filter pills */}
            <div className="flex flex-wrap gap-1.5">
              {SOURCE_FILTERS.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setActiveFilter(f.id)}
                  className={cn(
                    'rounded-full px-3 py-1 text-xs font-medium transition-colors',
                    activeFilter === f.id
                      ? 'bg-accent-customer360 text-white'
                      : 'bg-muted text-muted-foreground hover:bg-muted/70'
                  )}
                >
                  {f.labelAr}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-y-auto max-h-[600px] pe-1">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => <TimelineItemSkeleton key={i} />)
            ) : filteredTimeline.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <p className="text-sm">لا توجد تفاعلات لهذا الفلتر</p>
                <button
                  onClick={() => setActiveFilter('')}
                  className="mt-2 text-xs text-accent-customer360 hover:underline"
                >
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
        </div>
      </div>
    </div>
  )
}
