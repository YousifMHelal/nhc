'use client'

import { useState, useRef } from 'react'
import {
  MessageSquare,
  MessageCircle,
  Mail,
  Globe,
  Share2,
  Plus,
  ChevronRight,
  ChevronLeft,
  Check,
  Calendar,
  Users,
  BarChart3,
  Eye,
  TrendingUp,
  Zap,
  Megaphone,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { StatusPill } from '@/components/shared/status-pill'
import { CAMPAIGNS } from '@/lib/mock-data'
import type { Campaign, Channel, PipelineStage, CampaignStatus } from '@/lib/types'
import { cn } from '@/lib/utils'

// ─── Constants ────────────────────────────────────────────────────────────────

const CAMPAIGN_TYPES = ['ترويجية', 'إطلاق مشروع', 'إعادة تفعيل', 'موسمية', 'تثقيفية']

const CHANNEL_OPTS: {
  id: Channel
  labelAr: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: React.FC<any>
  color: string
}[] = [
  { id: 'SMS', labelAr: 'رسائل SMS', icon: MessageSquare, color: 'text-sky-600 bg-sky-50 border-sky-200' },
  { id: 'WhatsApp', labelAr: 'واتساب', icon: MessageCircle, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  { id: 'Email', labelAr: 'البريد الإلكتروني', icon: Mail, color: 'text-violet-600 bg-violet-50 border-violet-200' },
  { id: 'Web', labelAr: 'موقع الويب', icon: Globe, color: 'text-blue-600 bg-blue-50 border-blue-200' },
  { id: 'Social', labelAr: 'التواصل الاجتماعي', icon: Share2, color: 'text-rose-600 bg-rose-50 border-rose-200' },
]

const CITIES = ['الرياض', 'جدة', 'الدمام', 'مكة المكرمة', 'المدينة المنورة', 'الطائف', 'أبها', 'تبوك']
const INTERESTS = ['فيلا', 'شقة', 'تاون هاوس', 'دوبلكس', 'أرض']

const PIPELINE_STAGES: { id: PipelineStage; labelAr: string }[] = [
  { id: 'New', labelAr: 'عميل محتمل' },
  { id: 'Contacted', labelAr: 'تأهيل' },
  { id: 'Qualified', labelAr: 'مؤهَّل' },
  { id: 'Proposal', labelAr: 'عرض سعر' },
  { id: 'Closed Won', labelAr: 'تعاقد' },
]

const MSG_VARIABLES = [
  { key: '{customer_name}', labelAr: 'اسم العميل', sample: 'محمد عبدالله' },
  { key: '{property_type}', labelAr: 'نوع العقار', sample: 'فيلا' },
  { key: '{city}', labelAr: 'المدينة', sample: 'الرياض' },
  { key: '{project_name}', labelAr: 'المشروع', sample: 'السدرة' },
  { key: '{sales_rep_name}', labelAr: 'المندوب', sample: 'سارة الأحمدي' },
]

const WIZARD_STEPS = [
  { idx: 1, labelAr: 'الأساسيات' },
  { idx: 2, labelAr: 'القنوات' },
  { idx: 3, labelAr: 'الجمهور' },
  { idx: 4, labelAr: 'الرسالة' },
]

const CHANNEL_BADGE: Record<Channel, string> = {
  SMS: 'bg-sky-100 text-sky-700',
  WhatsApp: 'bg-emerald-100 text-emerald-700',
  Email: 'bg-violet-100 text-violet-700',
  Web: 'bg-blue-100 text-blue-700',
  Social: 'bg-rose-100 text-rose-700',
}

// ─── Wizard State ─────────────────────────────────────────────────────────────

interface WizardForm {
  nameAr: string
  type: string
  descriptionAr: string
  channels: Channel[]
  cities: string[]
  interests: string[]
  stages: PipelineStage[]
  lastInteractionDays: string
  messageBody: string
  scheduleType: 'immediate' | 'scheduled'
  scheduledAt: string
}

const EMPTY_FORM: WizardForm = {
  nameAr: '',
  type: 'ترويجية',
  descriptionAr: '',
  channels: [],
  cities: [],
  interests: [],
  stages: [],
  lastInteractionDays: '',
  messageBody: '',
  scheduleType: 'immediate',
  scheduledAt: '',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toggleArr<T>(arr: T[], item: T): T[] {
  return arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item]
}

function calcReach(form: WizardForm): number {
  let base = 800
  if (form.cities.length) base += form.cities.length * 180
  if (form.interests.length) base += form.interests.length * 80
  if (form.stages.length) base -= form.stages.length * 50
  if (form.lastInteractionDays) base = Math.floor(base * 0.45)
  return Math.max(50, base)
}

// ─── Step Indicator ───────────────────────────────────────────────────────────

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center">
      {WIZARD_STEPS.map((step, i) => (
        <div key={step.idx} className="flex items-center">
          <div className="flex flex-col items-center gap-1.5">
            <div
              className={cn(
                'flex size-9 items-center justify-center rounded-full border-2 text-sm font-bold transition-all',
                current > step.idx
                  ? 'border-accent-marketing bg-accent-marketing text-white'
                  : current === step.idx
                    ? 'border-accent-marketing bg-white text-accent-marketing'
                    : 'border-border bg-background text-muted-foreground'
              )}
            >
              {current > step.idx ? <Check className="size-4" /> : step.idx}
            </div>
            <span
              className={cn(
                'text-xs font-medium',
                current >= step.idx ? 'text-accent-marketing' : 'text-muted-foreground'
              )}
            >
              {step.labelAr}
            </span>
          </div>
          {i < WIZARD_STEPS.length - 1 && (
            <div
              className={cn(
                'h-0.5 w-16 mx-3 mb-5 shrink-0',
                current > step.idx ? 'bg-accent-marketing' : 'bg-border'
              )}
            />
          )}
        </div>
      ))}
    </div>
  )
}

// ─── Step 1: Basics ───────────────────────────────────────────────────────────

function BasicsStep({
  form,
  onChange,
}: {
  form: WizardForm
  onChange: (p: Partial<WizardForm>) => void
}) {
  return (
    <div className="flex flex-col gap-6 max-w-xl mx-auto">
      <div>
        <h2 className="text-lg font-bold">أساسيات الحملة</h2>
        <p className="text-sm text-muted-foreground mt-1">حدد اسم الحملة ونوعها ووصفها</p>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">اسم الحملة *</label>
        <Input
          placeholder="مثال: حملة رمضان العقارية ٢٠٢٦"
          value={form.nameAr}
          onChange={(e) => onChange({ nameAr: e.target.value })}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">نوع الحملة</label>
        <div className="flex flex-wrap gap-2">
          {CAMPAIGN_TYPES.map((t) => (
            <button
              key={t}
              onClick={() => onChange({ type: t })}
              className={cn(
                'rounded-full border px-4 py-1.5 text-sm font-medium transition-all',
                form.type === t
                  ? 'border-accent-marketing bg-accent-marketing/10 text-accent-marketing'
                  : 'border-border bg-background text-muted-foreground hover:border-accent-marketing/40'
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">وصف الحملة</label>
        <textarea
          className="min-h-[88px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring resize-none"
          placeholder="وصف مختصر لهدف الحملة والجمهور المستهدف..."
          value={form.descriptionAr}
          onChange={(e) => onChange({ descriptionAr: e.target.value })}
        />
      </div>
    </div>
  )
}

// ─── Step 2: Channels ─────────────────────────────────────────────────────────

function ChannelsStep({
  form,
  onChange,
}: {
  form: WizardForm
  onChange: (p: Partial<WizardForm>) => void
}) {
  return (
    <div className="flex flex-col gap-6 max-w-xl mx-auto">
      <div>
        <h2 className="text-lg font-bold">اختر القنوات</h2>
        <p className="text-sm text-muted-foreground mt-1">
          يمكنك اختيار أكثر من قناة للوصول إلى أكبر شريحة من العملاء
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {CHANNEL_OPTS.map((ch) => {
          const Icon = ch.icon
          const selected = form.channels.includes(ch.id)
          return (
            <button
              key={ch.id}
              onClick={() => onChange({ channels: toggleArr(form.channels, ch.id) })}
              className={cn(
                'flex items-center gap-4 rounded-xl border-2 p-4 text-start transition-all',
                selected
                  ? 'border-accent-marketing bg-accent-marketing/5'
                  : 'border-border bg-background hover:border-muted-foreground/30'
              )}
            >
              <div className={cn('flex size-11 items-center justify-center rounded-xl border-2', ch.color)}>
                <Icon className="size-5" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold">{ch.labelAr}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{ch.id}</p>
              </div>
              <div
                className={cn(
                  'flex size-5 items-center justify-center rounded-full border-2 shrink-0 transition-all',
                  selected
                    ? 'border-accent-marketing bg-accent-marketing'
                    : 'border-muted-foreground/30'
                )}
              >
                {selected && <Check className="size-3 text-white" />}
              </div>
            </button>
          )
        })}
      </div>

      {form.channels.length === 0 && (
        <p className="text-xs text-amber-600 text-center">يرجى اختيار قناة واحدة على الأقل للمتابعة</p>
      )}
    </div>
  )
}

// ─── Step 3: Audience ─────────────────────────────────────────────────────────

function AudienceStep({
  form,
  onChange,
}: {
  form: WizardForm
  onChange: (p: Partial<WizardForm>) => void
}) {
  const reach = calcReach(form)

  return (
    <div className="flex flex-col gap-6 max-w-xl mx-auto">
      <div>
        <h2 className="text-lg font-bold">الجمهور المستهدف</h2>
        <p className="text-sm text-muted-foreground mt-1">
          حدد الفلاتر لتضييق الشريحة. اتركها فارغة للوصول لجميع العملاء.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">المدن</label>
        <div className="flex flex-wrap gap-2">
          {CITIES.map((c) => (
            <button
              key={c}
              onClick={() => onChange({ cities: toggleArr(form.cities, c) })}
              className={cn(
                'rounded-full border px-3 py-1 text-xs font-medium transition-all',
                form.cities.includes(c)
                  ? 'border-accent-marketing bg-accent-marketing/10 text-accent-marketing'
                  : 'border-border text-muted-foreground hover:border-accent-marketing/40'
              )}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">الاهتمام العقاري</label>
        <div className="flex flex-wrap gap-2">
          {INTERESTS.map((i) => (
            <button
              key={i}
              onClick={() => onChange({ interests: toggleArr(form.interests, i) })}
              className={cn(
                'rounded-full border px-3 py-1 text-xs font-medium transition-all',
                form.interests.includes(i)
                  ? 'border-accent-marketing bg-accent-marketing/10 text-accent-marketing'
                  : 'border-border text-muted-foreground hover:border-accent-marketing/40'
              )}
            >
              {i}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">مرحلة العميل في المسار</label>
        <div className="flex flex-wrap gap-2">
          {PIPELINE_STAGES.map((s) => (
            <button
              key={s.id}
              onClick={() => onChange({ stages: toggleArr(form.stages, s.id) })}
              className={cn(
                'rounded-full border px-3 py-1 text-xs font-medium transition-all',
                form.stages.includes(s.id)
                  ? 'border-accent-marketing bg-accent-marketing/10 text-accent-marketing'
                  : 'border-border text-muted-foreground hover:border-accent-marketing/40'
              )}
            >
              {s.labelAr}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">
          عدم التفاعل منذ (أيام){' '}
          <span className="text-muted-foreground font-normal">— اختياري</span>
        </label>
        <Input
          type="number"
          min={1}
          placeholder="مثال: 30 — يستهدف العملاء غير النشطين"
          value={form.lastInteractionDays}
          onChange={(e) => onChange({ lastInteractionDays: e.target.value })}
          className="max-w-xs"
        />
      </div>

      <div className="rounded-xl border border-accent-marketing/30 bg-accent-marketing/5 p-4 flex items-center gap-4">
        <div className="flex size-12 items-center justify-center rounded-xl bg-accent-marketing/15">
          <Users className="size-6 text-accent-marketing" />
        </div>
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-0.5">الوصول التقديري</p>
          <p className="text-2xl font-bold text-accent-marketing leading-none">
            {reach.toLocaleString('ar-SA')}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">عميل محتمل</p>
        </div>
      </div>
    </div>
  )
}

// ─── Step 4: Message & Schedule ───────────────────────────────────────────────

function MessageStep({
  form,
  onChange,
}: {
  form: WizardForm
  onChange: (p: Partial<WizardForm>) => void
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const preview = form.messageBody.replace(/\{[^}]+\}/g, (match) => {
    const v = MSG_VARIABLES.find((vr) => vr.key === match)
    return v ? `**${v.sample}**` : match
  })

  const insertVar = (key: string) => {
    const el = textareaRef.current
    if (!el) {
      onChange({ messageBody: form.messageBody + key })
      return
    }
    const start = el.selectionStart
    const end = el.selectionEnd
    const newVal = form.messageBody.slice(0, start) + key + form.messageBody.slice(end)
    onChange({ messageBody: newVal })
    setTimeout(() => {
      el.focus()
      el.setSelectionRange(start + key.length, start + key.length)
    }, 0)
  }

  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto">
      <div>
        <h2 className="text-lg font-bold">الرسالة والجدولة</h2>
        <p className="text-sm text-muted-foreground mt-1">اكتب نص الرسالة وحدد موعد الإرسال</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Editor */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">إدراج متغير</label>
            <div className="flex flex-wrap gap-1.5">
              {MSG_VARIABLES.map((v) => (
                <button
                  key={v.key}
                  onClick={() => insertVar(v.key)}
                  className="rounded-full border border-border bg-muted px-2.5 py-0.5 text-xs text-muted-foreground hover:bg-accent-marketing/10 hover:text-accent-marketing hover:border-accent-marketing/30 transition-colors"
                  title={v.labelAr}
                >
                  {v.key}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">نص الرسالة *</label>
            <textarea
              ref={textareaRef}
              className="min-h-[180px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono shadow-sm focus:outline-none focus:ring-1 focus:ring-accent-marketing resize-none"
              placeholder="اكتب رسالتك هنا... انقر على المتغيرات أعلاه لإدراجها في مكان المؤشر"
              value={form.messageBody}
              onChange={(e) => onChange({ messageBody: e.target.value })}
            />
            <p className="text-xs text-muted-foreground text-end">{form.messageBody.length} حرف</p>
          </div>
        </div>

        {/* Preview */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium flex items-center gap-1.5">
            <Eye className="size-4" />
            معاينة الرسالة
          </label>
          <div className="rounded-xl min-h-[200px] border border-[#A8D8A8]/60 bg-[#E8F5E9] p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-[#A8D8A8]/40">
              <div className="size-8 rounded-full bg-emerald-600 flex items-center justify-center shrink-0">
                <MessageCircle className="size-4 text-white" />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-700">NHC Innovation</p>
                <p className="text-[10px] text-gray-500">
                  {form.channels[0] ?? 'WhatsApp'}
                </p>
              </div>
            </div>
            <div className="rounded-lg bg-white p-3 shadow-sm max-w-[90%]">
              {form.messageBody ? (
                <p className="text-sm leading-relaxed text-gray-800 whitespace-pre-wrap">
                  {preview.split(/\*\*([^*]+)\*\*/g).map((part, i) =>
                    i % 2 === 1 ? (
                      <strong key={i} className="text-emerald-700">
                        {part}
                      </strong>
                    ) : (
                      part
                    )
                  )}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground italic">ستظهر الرسالة هنا...</p>
              )}
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            القيم المعروضة للمعاينة فقط — ستُستبدل بالبيانات الفعلية عند الإرسال
          </p>
        </div>
      </div>

      {/* Schedule */}
      <div className="flex flex-col gap-3">
        <label className="text-sm font-medium">توقيت الإرسال</label>
        <div className="flex gap-3">
          {(
            [
              { v: 'immediate' as const, labelAr: 'إرسال فوري', icon: Zap },
              { v: 'scheduled' as const, labelAr: 'جدولة الإرسال', icon: Calendar },
            ] as const
          ).map((opt) => {
            const Icon = opt.icon
            const selected = form.scheduleType === opt.v
            return (
              <button
                key={opt.v}
                onClick={() => onChange({ scheduleType: opt.v })}
                className={cn(
                  'flex flex-1 items-center gap-3 rounded-xl border-2 p-4 transition-all',
                  selected
                    ? 'border-accent-marketing bg-accent-marketing/5'
                    : 'border-border bg-background hover:border-muted-foreground/30'
                )}
              >
                <Icon
                  className={cn(
                    'size-5',
                    selected ? 'text-accent-marketing' : 'text-muted-foreground'
                  )}
                />
                <span
                  className={cn(
                    'text-sm font-medium',
                    selected ? 'text-accent-marketing' : 'text-foreground'
                  )}
                >
                  {opt.labelAr}
                </span>
              </button>
            )
          })}
        </div>

        {form.scheduleType === 'scheduled' && (
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">موعد الإرسال</label>
            <Input
              type="datetime-local"
              value={form.scheduledAt}
              onChange={(e) => onChange({ scheduledAt: e.target.value })}
              className="max-w-xs"
            />
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Campaign Metrics Bar ─────────────────────────────────────────────────────

function CampaignMetricsBar({ metrics }: { metrics: Campaign['metrics'] }) {
  const { sent, delivered, opened, clicked, converted } = metrics
  if (!sent) {
    return <p className="text-xs text-muted-foreground text-center py-1">لم يبدأ الإرسال بعد</p>
  }
  const steps = [
    { labelAr: 'أُرسل', value: sent, pct: 100 },
    { labelAr: 'وُصِّل', value: delivered, pct: Math.round((delivered / sent) * 100) },
    { labelAr: 'فُتح', value: opened, pct: Math.round((opened / sent) * 100) },
    { labelAr: 'نُقر', value: clicked, pct: Math.round((clicked / sent) * 100) },
    { labelAr: 'تحوَّل', value: converted, pct: Math.round((converted / sent) * 100) },
  ]
  return (
    <div className="space-y-1.5">
      {steps.map((s) => (
        <div key={s.labelAr} className="flex items-center gap-2 text-xs">
          <span className="w-12 text-muted-foreground shrink-0">{s.labelAr}</span>
          <div className="flex-1">
            <Progress value={s.pct} className="h-1.5" />
          </div>
          <span className="w-20 text-end font-medium text-foreground shrink-0">
            {s.value.toLocaleString('ar-SA')}{' '}
            <span className="text-muted-foreground">({s.pct}%)</span>
          </span>
        </div>
      ))}
    </div>
  )
}

// ─── Campaign Card ────────────────────────────────────────────────────────────

function CampaignCard({ campaign }: { campaign: Campaign }) {
  const convPct = campaign.metrics.sent
    ? Math.round((campaign.metrics.converted / campaign.metrics.sent) * 100)
    : 0

  return (
    <div className="rounded-xl border border-border bg-card p-5 flex flex-col gap-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm leading-snug">{campaign.nameAr}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{campaign.type}</p>
        </div>
        <StatusPill type="campaign" value={campaign.status} className="shrink-0" />
      </div>

      <div className="flex flex-wrap gap-1.5">
        {campaign.channels.map((ch) => (
          <span key={ch} className={cn('rounded-full px-2 py-0.5 text-xs font-medium', CHANNEL_BADGE[ch])}>
            {ch}
          </span>
        ))}
      </div>

      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <Users className="size-3.5 shrink-0" />
          <span>{campaign.audience.estimatedReach.toLocaleString('ar-SA')} وصول</span>
        </div>
        {campaign.metrics.sent > 0 && (
          <div className="flex items-center gap-1">
            <TrendingUp className="size-3.5 text-emerald-600 shrink-0" />
            <span className="text-emerald-600 font-medium">{convPct}% تحويل</span>
          </div>
        )}
      </div>

      <CampaignMetricsBar metrics={campaign.metrics} />

      <p className="text-xs text-muted-foreground border-t border-border pt-3">
        {new Date(campaign.createdAt).toLocaleDateString('ar-SA', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })}
      </p>
    </div>
  )
}

// ─── Campaigns List View ──────────────────────────────────────────────────────

function CampaignsListView({
  campaigns,
  onNew,
}: {
  campaigns: Campaign[]
  onNew: () => void
}) {
  const totalSent = campaigns.reduce((s, c) => s + c.metrics.sent, 0)
  const totalConverted = campaigns.reduce((s, c) => s + c.metrics.converted, 0)
  const active = campaigns.filter((c) => c.status === 'Active').length
  const avgConv = totalSent ? Math.round((totalConverted / totalSent) * 100) : 0

  const summary = [
    {
      labelAr: 'إجمالي الحملات',
      value: campaigns.length,
      icon: Megaphone,
      color: 'text-accent-marketing bg-accent-marketing/10',
    },
    {
      labelAr: 'الحملات النشطة',
      value: active,
      icon: BarChart3,
      color: 'text-emerald-600 bg-emerald-50',
    },
    {
      labelAr: 'إجمالي الرسائل',
      value: totalSent.toLocaleString('ar-SA'),
      icon: MessageCircle,
      color: 'text-brand bg-brand/10',
    },
    {
      labelAr: 'معدل التحويل',
      value: `${avgConv}%`,
      icon: TrendingUp,
      color: 'text-amber-600 bg-amber-50',
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-accent-marketing">التسويق</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{campaigns.length} حملة إجمالاً</p>
        </div>
        <Button
          className="bg-accent-marketing hover:bg-accent-marketing/90 text-white gap-1.5"
          onClick={onNew}
        >
          <Plus className="size-4" />
          إنشاء حملة جديدة
        </Button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {summary.map((card) => {
          const Icon = card.icon
          return (
            <div
              key={card.labelAr}
              className="rounded-xl border border-border bg-card p-4 flex items-center gap-3"
            >
              <div className={cn('flex size-11 items-center justify-center rounded-xl', card.color)}>
                <Icon className="size-5" />
              </div>
              <div>
                <p className="text-2xl font-bold leading-none">{card.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{card.labelAr}</p>
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {campaigns.map((c) => (
          <CampaignCard key={c.id} campaign={c} />
        ))}
      </div>
    </div>
  )
}

// ─── Campaign Wizard ──────────────────────────────────────────────────────────

function CampaignWizard({
  onDone,
  onCancel,
}: {
  onDone: (c: Campaign) => void
  onCancel: () => void
}) {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState<WizardForm>(EMPTY_FORM)

  const update = (p: Partial<WizardForm>) => setForm((f) => ({ ...f, ...p }))

  const canNext =
    step === 1
      ? form.nameAr.trim().length > 0
      : step === 2
        ? form.channels.length > 0
        : step === 3
          ? true
          : form.messageBody.trim().length > 0

  const handleSubmit = () => {
    const reach = calcReach(form)
    const campaign: Campaign = {
      id: `camp-${Date.now()}`,
      nameAr: form.nameAr,
      type: form.type,
      descriptionAr: form.descriptionAr,
      channels: form.channels,
      audience: {
        city: form.cities.length ? form.cities : undefined,
        propertyInterest: form.interests.length ? form.interests : undefined,
        leadStage: form.stages.length ? (form.stages as PipelineStage[]) : undefined,
        lastInteractionDays: form.lastInteractionDays ? Number(form.lastInteractionDays) : undefined,
        estimatedReach: reach,
      },
      messageTemplate: {
        body: form.messageBody,
        variables: MSG_VARIABLES.filter((v) => form.messageBody.includes(v.key)).map(
          (v) => v.key
        ),
      },
      schedule: {
        type: form.scheduleType,
        scheduledAt: form.scheduleType === 'scheduled' ? form.scheduledAt : undefined,
      },
      status: (form.scheduleType === 'immediate' ? 'Active' : 'Scheduled') as CampaignStatus,
      metrics: { sent: 0, delivered: 0, opened: 0, clicked: 0, converted: 0 },
      createdAt: new Date().toISOString(),
      createdBy: 'rep-001',
    }
    onDone(campaign)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-accent-marketing">إنشاء حملة جديدة</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            الخطوة {step} من {WIZARD_STEPS.length}
          </p>
        </div>
        <Button variant="ghost" onClick={onCancel}>
          إلغاء
        </Button>
      </div>

      <StepIndicator current={step} />

      <div className="min-h-[420px]">
        {step === 1 && <BasicsStep form={form} onChange={update} />}
        {step === 2 && <ChannelsStep form={form} onChange={update} />}
        {step === 3 && <AudienceStep form={form} onChange={update} />}
        {step === 4 && <MessageStep form={form} onChange={update} />}
      </div>

      <div className="flex items-center justify-between border-t border-border pt-4">
        <Button
          variant="outline"
          onClick={() => setStep((s) => s - 1)}
          disabled={step === 1}
          className="gap-1.5"
        >
          <ChevronRight className="size-4" />
          السابق
        </Button>

        {step < WIZARD_STEPS.length ? (
          <Button
            className="bg-accent-marketing hover:bg-accent-marketing/90 text-white gap-1.5"
            onClick={() => setStep((s) => s + 1)}
            disabled={!canNext}
          >
            التالي
            <ChevronLeft className="size-4" />
          </Button>
        ) : (
          <Button
            className="bg-accent-marketing hover:bg-accent-marketing/90 text-white gap-1.5"
            onClick={handleSubmit}
            disabled={!canNext}
          >
            <Check className="size-4" />
            إنشاء الحملة
          </Button>
        )}
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function MarketingPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>(CAMPAIGNS)
  const [showWizard, setShowWizard] = useState(false)

  const handleDone = (c: Campaign) => {
    setCampaigns((prev) => [c, ...prev])
    setShowWizard(false)
  }

  if (showWizard) {
    return <CampaignWizard onDone={handleDone} onCancel={() => setShowWizard(false)} />
  }

  return <CampaignsListView campaigns={campaigns} onNew={() => setShowWizard(true)} />
}
