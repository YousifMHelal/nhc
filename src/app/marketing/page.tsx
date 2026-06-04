'use client'

import { useState, useRef, useEffect } from 'react'
import {
  MessageSquare, MessageCircle, Mail, Globe, Share2, Plus, ChevronRight,
  ChevronLeft, Check, Calendar, Users, BarChart3, Eye, TrendingUp, Zap,
  Megaphone, Pause, Edit2, X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { StatusPill } from '@/components/shared/status-pill'
import { toast } from 'sonner'
import type { Campaign, Channel, PipelineStage, CampaignStatus } from '@/lib/types'
import { cn, toAr } from '@/lib/utils'
import { readApiError } from '@/lib/client-validation'
import { MarketingPageSkeleton } from '@/components/shared/skeleton-card'

// ─── Constants ────────────────────────────────────────────────────────────────

const CAMPAIGN_TYPES = ['ترويجية', 'إطلاق مشروع', 'إعادة تفعيل', 'موسمية', 'تثقيفية']
const CHANNEL_OPTS: { id: Channel; labelAr: string; icon: React.FC<{ className?: string }>; color: string }[] = [
  { id: 'SMS',      labelAr: 'رسائل SMS',       icon: MessageSquare, color: 'text-sky-600 bg-sky-50 border-sky-200' },
  { id: 'WhatsApp', labelAr: 'واتساب',           icon: MessageCircle, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  { id: 'Email',    labelAr: 'البريد الإلكتروني', icon: Mail,         color: 'text-violet-600 bg-violet-50 border-violet-200' },
  { id: 'Web',      labelAr: 'موقع الويب',        icon: Globe,        color: 'text-blue-600 bg-blue-50 border-blue-200' },
  { id: 'Social',   labelAr: 'التواصل الاجتماعي', icon: Share2,       color: 'text-rose-600 bg-rose-50 border-rose-200' },
]
const CITIES = ['الرياض', 'جدة', 'الدمام', 'مكة المكرمة', 'المدينة المنورة', 'الطائف', 'أبها', 'تبوك']
const INTERESTS = ['فيلا', 'شقة', 'تاون هاوس', 'دوبلكس', 'أرض']
const PIPELINE_STAGES: { id: PipelineStage; labelAr: string }[] = [
  { id: 'New', labelAr: 'جديد' }, { id: 'Contacted', labelAr: 'تم التواصل' },
  { id: 'Qualified', labelAr: 'مؤهَّل' }, { id: 'Proposal', labelAr: 'عرض سعر' },
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
  { idx: 1, labelAr: 'الأساسيات' }, { idx: 2, labelAr: 'القنوات' },
  { idx: 3, labelAr: 'الجمهور' }, { idx: 4, labelAr: 'الرسالة والجدولة' },
]
const CHANNEL_BADGE: Record<Channel, string> = {
  SMS: 'bg-sky-100 text-sky-700', WhatsApp: 'bg-emerald-100 text-emerald-700',
  Email: 'bg-violet-100 text-violet-700', Web: 'bg-blue-100 text-blue-700',
  Social: 'bg-rose-100 text-rose-700',
}

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

// ─── Wizard State ─────────────────────────────────────────────────────────────

interface WizardForm {
  nameAr: string; type: string; descriptionAr: string; channels: Channel[]
  cities: string[]; interests: string[]; stages: PipelineStage[]
  lastInteractionDays: string; messageBody: string
  scheduleType: 'immediate' | 'scheduled'; scheduledAt: string
}
const EMPTY_FORM: WizardForm = {
  nameAr: '', type: 'ترويجية', descriptionAr: '', channels: [],
  cities: [], interests: [], stages: [], lastInteractionDays: '',
  messageBody: '', scheduleType: 'immediate', scheduledAt: '',
}

// ─── Step Indicator ───────────────────────────────────────────────────────────

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center">
      {WIZARD_STEPS.map((step, i) => (
        <div key={step.idx} className="flex items-center">
          <div className="flex flex-col items-center gap-1.5">
            <div className={cn('flex size-9 items-center justify-center rounded-full border-2 text-sm font-bold transition-all',
              current > step.idx ? 'border-accent-marketing bg-accent-marketing text-white'
              : current === step.idx ? 'border-accent-marketing bg-white text-accent-marketing'
              : 'border-border bg-background text-muted-foreground')}>
              {current > step.idx ? <Check className="size-4" /> : step.idx}
            </div>
            <span className={cn('text-xs font-medium', current >= step.idx ? 'text-accent-marketing' : 'text-muted-foreground')}>{step.labelAr}</span>
          </div>
          {i < WIZARD_STEPS.length - 1 && (
            <div className={cn('h-0.5 w-16 mx-3 mb-5 shrink-0', current > step.idx ? 'bg-accent-marketing' : 'bg-border')} />
          )}
        </div>
      ))}
    </div>
  )
}

// ─── Wizard Steps ─────────────────────────────────────────────────────────────

function BasicsStep({ form, onChange }: { form: WizardForm; onChange: (p: Partial<WizardForm>) => void }) {
  return (
    <div className="flex flex-col gap-6 max-w-xl mx-auto">
      <div><h2 className="text-lg font-bold">أساسيات الحملة</h2><p className="text-sm text-muted-foreground mt-1">حدد اسم الحملة ونوعها</p></div>
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">اسم الحملة *</label>
        <Input placeholder="مثال: حملة رمضان العقارية ٢٠٢٦" value={form.nameAr} onChange={(e) => onChange({ nameAr: e.target.value })} />
      </div>
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">نوع الحملة</label>
        <div className="flex flex-wrap gap-2">
          {CAMPAIGN_TYPES.map((t) => (
            <button key={t} onClick={() => onChange({ type: t })}
              className={cn('rounded-full border px-4 py-1.5 text-sm font-medium transition-all',
                form.type === t ? 'border-accent-marketing bg-accent-marketing/10 text-accent-marketing' : 'border-border bg-background text-muted-foreground hover:border-accent-marketing/40')}>
              {t}
            </button>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">وصف الحملة</label>
        <textarea className="min-h-[88px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring resize-none"
          placeholder="وصف مختصر..." value={form.descriptionAr} onChange={(e) => onChange({ descriptionAr: e.target.value })} />
      </div>
    </div>
  )
}

function ChannelsStep({ form, onChange }: { form: WizardForm; onChange: (p: Partial<WizardForm>) => void }) {
  return (
    <div className="flex flex-col gap-6 max-w-xl mx-auto">
      <div><h2 className="text-lg font-bold">اختر القنوات</h2><p className="text-sm text-muted-foreground mt-1">يمكنك اختيار أكثر من قناة</p></div>
      <div className="flex flex-col gap-3">
        {CHANNEL_OPTS.map((ch) => {
          const Icon = ch.icon; const selected = form.channels.includes(ch.id)
          return (
            <button key={ch.id} onClick={() => onChange({ channels: toggleArr(form.channels, ch.id) })}
              className={cn('flex items-center gap-4 rounded-xl border-2 p-4 text-start transition-all',
                selected ? 'border-accent-marketing bg-accent-marketing/5' : 'border-border bg-background hover:border-muted-foreground/30')}>
              <div className={cn('flex size-11 items-center justify-center rounded-xl border-2', ch.color)}><Icon className="size-5" /></div>
              <div className="flex-1"><p className="text-sm font-semibold">{ch.labelAr}</p><p className="text-xs text-muted-foreground mt-0.5">{ch.id}</p></div>
              <div className={cn('flex size-5 items-center justify-center rounded-full border-2 shrink-0 transition-all',
                selected ? 'border-accent-marketing bg-accent-marketing' : 'border-muted-foreground/30')}>
                {selected && <Check className="size-3 text-white" />}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function AudienceStep({ form, onChange }: { form: WizardForm; onChange: (p: Partial<WizardForm>) => void }) {
  const reach = calcReach(form)
  return (
    <div className="flex flex-col gap-6 max-w-xl mx-auto">
      <div><h2 className="text-lg font-bold">الجمهور المستهدف</h2></div>
      {([['المدن', 'cities', CITIES], ['الاهتمام العقاري', 'interests', INTERESTS]] as [string, 'cities'|'interests', string[]][]).map(([label, key, opts]) => (
        <div key={key} className="flex flex-col gap-2">
          <label className="text-sm font-medium">{label}</label>
          <div className="flex flex-wrap gap-2">
            {opts.map((o) => (
              <button key={o} onClick={() => onChange({ [key]: toggleArr(form[key], o) })}
                className={cn('rounded-full border px-3 py-1 text-xs font-medium transition-all',
                  form[key].includes(o) ? 'border-accent-marketing bg-accent-marketing/10 text-accent-marketing' : 'border-border text-muted-foreground hover:border-accent-marketing/40')}>
                {o}
              </button>
            ))}
          </div>
        </div>
      ))}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">مرحلة العميل</label>
        <div className="flex flex-wrap gap-2">
          {PIPELINE_STAGES.map((s) => (
            <button key={s.id} onClick={() => onChange({ stages: toggleArr(form.stages, s.id) })}
              className={cn('rounded-full border px-3 py-1 text-xs font-medium transition-all',
                form.stages.includes(s.id) ? 'border-accent-marketing bg-accent-marketing/10 text-accent-marketing' : 'border-border text-muted-foreground hover:border-accent-marketing/40')}>
              {s.labelAr}
            </button>
          ))}
        </div>
      </div>
      <div className="rounded-xl border border-accent-marketing/30 bg-accent-marketing/5 p-4 flex items-center gap-4">
        <div className="flex size-12 items-center justify-center rounded-xl bg-accent-marketing/15"><Users className="size-6 text-accent-marketing" /></div>
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-0.5">الوصول التقديري</p>
          <p className="text-2xl font-bold text-accent-marketing leading-none font-inter">{reach.toLocaleString('ar-SA')}</p>
          <p className="text-xs text-muted-foreground mt-0.5">عميل محتمل</p>
        </div>
      </div>
    </div>
  )
}

function MessageStep({ form, onChange }: { form: WizardForm; onChange: (p: Partial<WizardForm>) => void }) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const preview = form.messageBody.replace(/\{[^}]+\}/g, (match) => {
    const v = MSG_VARIABLES.find((vr) => vr.key === match)
    return v ? `**${v.sample}**` : match
  })
  const insertVar = (key: string) => {
    const el = textareaRef.current
    if (!el) { onChange({ messageBody: form.messageBody + key }); return }
    const start = el.selectionStart; const end = el.selectionEnd
    onChange({ messageBody: form.messageBody.slice(0, start) + key + form.messageBody.slice(end) })
    setTimeout(() => { el.focus(); el.setSelectionRange(start + key.length, start + key.length) }, 0)
  }
  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto">
      <div><h2 className="text-lg font-bold">الرسالة والجدولة</h2></div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">إدراج متغير</label>
            <div className="flex flex-wrap gap-1.5">
              {MSG_VARIABLES.map((v) => (
                <button key={v.key} onClick={() => insertVar(v.key)}
                  className="rounded-full border border-border bg-muted px-2.5 py-0.5 text-xs text-muted-foreground hover:bg-accent-marketing/10 hover:text-accent-marketing hover:border-accent-marketing/30 transition-colors font-inter">
                  {v.key}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">نص الرسالة *</label>
            <textarea ref={textareaRef}
              className="min-h-[180px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono shadow-sm focus:outline-none focus:ring-1 focus:ring-accent-marketing resize-none"
              placeholder="اكتب رسالتك هنا..." value={form.messageBody}
              onChange={(e) => onChange({ messageBody: e.target.value })} />
            <p className="text-xs text-muted-foreground text-end font-inter">{toAr(form.messageBody.length)} حرف</p>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium flex items-center gap-1.5"><Eye className="size-4" />معاينة</label>
          <div className="rounded-xl min-h-[200px] border border-brand-accent-light/60 bg-bg-hover p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-brand-accent-light/40">
              <div className="size-8 rounded-full bg-emerald-600 flex items-center justify-center shrink-0"><MessageCircle className="size-4 text-white" /></div>
              <div><p className="text-xs font-semibold text-gray-700">NHC Innovation</p><p className="text-[10px] text-gray-500">{form.channels[0] ?? 'WhatsApp'}</p></div>
            </div>
            <div className="rounded-lg bg-white p-3 shadow-sm max-w-[90%]">
              {form.messageBody ? (
                <p className="text-sm leading-relaxed text-gray-800 whitespace-pre-wrap">
                  {preview.split(/\*\*([^*]+)\*\*/g).map((part, i) =>
                    i % 2 === 1 ? <strong key={i} className="text-emerald-700">{part}</strong> : part)}
                </p>
              ) : <p className="text-sm text-muted-foreground italic">ستظهر الرسالة هنا...</p>}
            </div>
          </div>
        </div>
      </div>
      {/* Schedule */}
      <div className="flex flex-col gap-3">
        <label className="text-sm font-medium">توقيت الإرسال</label>
        <div className="flex gap-3">
          {([{v: 'immediate' as const, labelAr: 'إرسال فوري', icon: Zap},{v: 'scheduled' as const, labelAr: 'جدولة الإرسال', icon: Calendar}]).map((opt) => {
            const Icon = opt.icon; const selected = form.scheduleType === opt.v
            return (
              <button key={opt.v} onClick={() => onChange({ scheduleType: opt.v })}
                className={cn('flex flex-1 items-center gap-3 rounded-xl border-2 p-4 transition-all',
                  selected ? 'border-accent-marketing bg-accent-marketing/5' : 'border-border bg-background hover:border-muted-foreground/30')}>
                <Icon className={cn('size-5', selected ? 'text-accent-marketing' : 'text-muted-foreground')} />
                <span className={cn('text-sm font-medium', selected ? 'text-accent-marketing' : 'text-foreground')}>{opt.labelAr}</span>
              </button>
            )
          })}
        </div>
        {form.scheduleType === 'scheduled' && (
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">موعد الإرسال</label>
            <Input type="datetime-local" value={form.scheduledAt} onChange={(e) => onChange({ scheduledAt: e.target.value })} className="max-w-xs" />
          </div>
        )}
      </div>
      {/* Summary card */}
      <div className="rounded-xl border border-border bg-muted/30 p-4">
        <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">ملخص الحملة</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
          <div><p className="text-xs text-muted-foreground">الاسم</p><p className="font-medium mt-0.5 truncate">{form.nameAr || '—'}</p></div>
          <div><p className="text-xs text-muted-foreground">القنوات</p><p className="font-medium mt-0.5">{form.channels.length ? form.channels.join(' / ') : '—'}</p></div>
          <div><p className="text-xs text-muted-foreground">النوع</p><p className="font-medium mt-0.5">{form.scheduleType === 'immediate' ? 'فوري' : 'مجدول'}</p></div>
        </div>
      </div>
    </div>
  )
}

// ─── Campaign Wizard ──────────────────────────────────────────────────────────

function CampaignWizard({ onDone, onCancel }: { onDone: (c: Campaign) => void; onCancel: () => void }) {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState<WizardForm>(EMPTY_FORM)
  const update = (p: Partial<WizardForm>) => setForm((f) => ({ ...f, ...p }))

  const canNext = step === 1 ? form.nameAr.trim().length > 0
    : step === 2 ? form.channels.length > 0 : step === 3 ? true
    : form.messageBody.trim().length > 0

  const handleSubmit = () => {
    const reach = calcReach(form)
    const campaign: Campaign = {
      id: `camp-${Date.now()}`, nameAr: form.nameAr, type: form.type, descriptionAr: form.descriptionAr,
      channels: form.channels,
      audience: { city: form.cities.length ? form.cities : undefined, propertyInterest: form.interests.length ? form.interests : undefined, leadStage: form.stages.length ? form.stages : undefined, lastInteractionDays: form.lastInteractionDays ? Number(form.lastInteractionDays) : undefined, estimatedReach: reach },
      messageTemplate: { body: form.messageBody, variables: MSG_VARIABLES.filter((v) => form.messageBody.includes(v.key)).map((v) => v.key) },
      schedule: { type: form.scheduleType, scheduledAt: form.scheduleType === 'scheduled' ? form.scheduledAt : undefined },
      status: (form.scheduleType === 'immediate' ? 'Active' : 'Scheduled') as CampaignStatus,
      metrics: { sent: 0, delivered: 0, opened: 0, clicked: 0, converted: 0 },
      createdAt: new Date().toISOString(), createdBy: 'rep-001',
    }
    onDone(campaign)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-brand-dark">إنشاء حملة جديدة</h1>
          <p className="text-sm text-muted-foreground mt-0.5">الخطوة {toAr(step)} من {toAr(WIZARD_STEPS.length)}</p></div>
        <Button variant="ghost" onClick={onCancel}>إلغاء</Button>
      </div>
      <StepIndicator current={step} />
      <div className="min-h-[420px]">
        {step === 1 && <BasicsStep form={form} onChange={update} />}
        {step === 2 && <ChannelsStep form={form} onChange={update} />}
        {step === 3 && <AudienceStep form={form} onChange={update} />}
        {step === 4 && <MessageStep form={form} onChange={update} />}
      </div>
      <div className="flex items-center justify-between border-t border-border pt-4">
        <Button variant="outline" onClick={() => setStep((s) => s - 1)} disabled={step === 1} className="gap-1.5">
          <ChevronRight className="size-4" />السابق
        </Button>
        {step < WIZARD_STEPS.length ? (
          <Button className="bg-accent-marketing hover:bg-accent-marketing/90 text-white gap-1.5" onClick={() => setStep((s) => s + 1)} disabled={!canNext}>
            التالي<ChevronLeft className="size-4" />
          </Button>
        ) : (
          <Button className="bg-accent-marketing hover:bg-accent-marketing/90 text-white gap-1.5" onClick={handleSubmit} disabled={!canNext}>
            <Zap className="size-4" />إطلاق الحملة
          </Button>
        )}
      </div>
    </div>
  )
}

// ─── Metrics Drawer ───────────────────────────────────────────────────────────

function MetricsDrawer({ campaign, onClose }: { campaign: Campaign; onClose: () => void }) {
  const { sent, delivered, opened, clicked, converted } = campaign.metrics
  const steps = sent ? [
    { labelAr: 'أُرسل',  value: sent,      pct: 100 },
    { labelAr: 'وُصِّل', value: delivered, pct: Math.round((delivered / sent) * 100) },
    { labelAr: 'فُتح',   value: opened,    pct: Math.round((opened / sent) * 100) },
    { labelAr: 'نُقر',   value: clicked,   pct: Math.round((clicked / sent) * 100) },
    { labelAr: 'تحوَّل', value: converted, pct: Math.round((converted / sent) * 100) },
  ] : []

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/25 backdrop-blur-sm" onClick={onClose} />
      <div className="w-80 bg-card border-s border-border shadow-2xl flex flex-col overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-border shrink-0">
          <div>
            <h3 className="text-sm font-bold">{campaign.nameAr}</h3>
            <StatusPill type="campaign" value={campaign.status} className="mt-1" />
          </div>
          <button onClick={onClose}><X className="size-4" /></button>
        </div>
        <div className="p-5 flex flex-col gap-5">
          <div className="flex flex-wrap gap-1.5">
            {campaign.channels.map((ch) => <span key={ch} className={cn('rounded-full px-2 py-0.5 text-xs font-medium', CHANNEL_BADGE[ch])}>{ch}</span>)}
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">مسار الإرسال</p>
            {steps.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">لم يبدأ الإرسال بعد</p>
            ) : (
              <div className="space-y-2">
                {steps.map((s) => (
                  <div key={s.labelAr} className="flex items-center gap-2 text-xs">
                    <span className="w-12 text-muted-foreground shrink-0">{s.labelAr}</span>
                    <div className="flex-1"><Progress value={s.pct} className="h-1.5" /></div>
                    <span className="w-20 text-end font-medium font-inter">{s.value.toLocaleString('ar-SA')} <span className="text-muted-foreground">({toAr(s.pct)}٪)</span></span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-muted/50 p-3 text-center">
              <p className="text-lg font-bold text-accent-marketing font-inter">{campaign.audience.estimatedReach.toLocaleString('ar-SA')}</p>
              <p className="text-xs text-muted-foreground mt-0.5">وصول تقديري</p>
            </div>
            <div className="rounded-lg bg-muted/50 p-3 text-center">
              <p className="text-lg font-bold font-inter">{toAr(sent ? Math.round((converted / sent) * 100) : 0)}٪</p>
              <p className="text-xs text-muted-foreground mt-0.5">معدل التحويل</p>
            </div>
          </div>
          {(campaign.status === 'Active' || campaign.status === 'Scheduled') && (
            <Button variant="outline" className="w-full gap-1.5" onClick={() => { toast.success('تم إيقاف الحملة مؤقتاً'); onClose() }}>
              <Pause className="size-4" />إيقاف الحملة مؤقتاً
            </Button>
          )}
          {campaign.status === 'Draft' && (
            <Button variant="outline" className="w-full gap-1.5 text-accent-marketing" onClick={() => { toast.success('تم فتح محرر الحملة'); onClose() }}>
              <Edit2 className="size-4" />تعديل الحملة
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Master-Detail Layout ─────────────────────────────────────────────────────

function CampaignListItem({ campaign, isSelected, onClick }: { campaign: Campaign; isSelected: boolean; onClick: () => void }) {
  const convPct = campaign.metrics.sent ? Math.round((campaign.metrics.converted / campaign.metrics.sent) * 100) : 0
  return (
    <button
      onClick={onClick}
      className={cn('w-full text-start rounded-lg border p-3.5 transition-all hover:shadow-sm',
        isSelected ? 'border-accent-marketing bg-accent-marketing/5 shadow-sm' : 'border-border bg-card hover:border-accent-marketing/30')}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-sm font-semibold leading-snug flex-1 min-w-0 truncate">{campaign.nameAr}</p>
        <StatusPill type="campaign" value={campaign.status} className="shrink-0" />
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        {campaign.channels.slice(0,3).map((ch) => <span key={ch} className={cn('rounded-full px-2 py-0.5 text-[10px] font-medium', CHANNEL_BADGE[ch])}>{ch}</span>)}
      </div>
      <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
        <span><Users className="size-3 inline me-1" />{campaign.audience.estimatedReach.toLocaleString('ar-SA')}</span>
        {campaign.metrics.sent > 0 && <span className="text-success font-medium"><TrendingUp className="size-3 inline me-1" />{toAr(convPct)}٪</span>}
      </div>
    </button>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function MarketingPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [showWizard, setShowWizard] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [metricsTarget, setMetricsTarget] = useState<Campaign | null>(null)

  useEffect(() => {
    fetch('/api/campaigns')
      .then((r) => r.json())
      .then((data: Campaign[]) => {
        setCampaigns(data)
        setSelectedId(data[0]?.id ?? null)
      })
      .catch(() => toast.error('فشل تحميل الحملات'))
      .finally(() => setLoading(false))
  }, [])

  const selected = campaigns.find((c) => c.id === selectedId) ?? null
  const totalSent = campaigns.reduce((s, c) => s + c.metrics.sent, 0)
  const totalConverted = campaigns.reduce((s, c) => s + c.metrics.converted, 0)
  const active = campaigns.filter((c) => c.status === 'Active').length
  const avgConv = totalSent ? Math.round((totalConverted / totalSent) * 100) : 0

  const handleDone = async (c: Campaign) => {
    try {
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(c),
      })
      if (!res.ok) {
        toast.error(await readApiError(res, 'فشل إنشاء الحملة'))
        return
      }
      const saved: Campaign = await res.json()
      setCampaigns((prev) => [saved, ...prev])
      setSelectedId(saved.id)
      setShowWizard(false)
      toast.success(`تم إنشاء الحملة "${saved.nameAr}" بنجاح`)
    } catch {
      toast.error('فشل إنشاء الحملة')
    }
  }

  if (showWizard) return <CampaignWizard onDone={handleDone} onCancel={() => setShowWizard(false)} />

  if (loading) return <MarketingPageSkeleton />

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-dark">التسويق</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{toAr(campaigns.length)} حملة إجمالاً</p>
        </div>
        <Button className="bg-accent-marketing hover:bg-accent-marketing/90 text-white gap-1.5" onClick={() => setShowWizard(true)}>
          <Plus className="size-4" />إنشاء حملة جديدة
        </Button>
      </div>

      {campaigns.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-96 gap-4 text-muted-foreground">
          <div className="flex size-20 items-center justify-center rounded-full bg-error-bg">
            <Megaphone className="size-10 text-accent-marketing/40" />
          </div>
          <div className="text-center">
            <h2 className="text-lg font-semibold text-foreground">لا توجد حملات بعد</h2>
            <p className="text-sm mt-1">أنشئ أول حملة تسويقية للتواصل مع عملائك المحتملين</p>
          </div>
          <Button className="bg-accent-marketing hover:bg-accent-marketing/90 text-white gap-1.5 mt-2" onClick={() => setShowWizard(true)}>
            <Plus className="size-4" />إنشاء حملة جديدة
          </Button>
        </div>
      ) : (
        <>
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { labelAr: 'إجمالي الحملات', value: toAr(campaigns.length), icon: Megaphone, color: 'text-accent-marketing bg-accent-marketing/10' },
          { labelAr: 'الحملات النشطة', value: toAr(active), icon: BarChart3, color: 'text-emerald-600 bg-emerald-50' },
          { labelAr: 'إجمالي الرسائل', value: totalSent.toLocaleString('ar-SA'), icon: MessageCircle, color: 'text-brand bg-brand/10' },
          { labelAr: 'معدل التحويل', value: `${toAr(avgConv)}٪`, icon: TrendingUp, color: 'text-amber-600 bg-amber-50' },
        ].map((card) => {
          const Icon = card.icon
          return (
            <div key={card.labelAr} className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
              <div className={cn('flex size-11 items-center justify-center rounded-xl', card.color)}><Icon className="size-5" /></div>
              <div>
                <p className="text-2xl font-bold leading-none font-inter">{card.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{card.labelAr}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Master-detail split */}
      <div className="flex flex-col lg:grid lg:grid-cols-3 gap-4 min-h-120">
        {/* Campaign list */}
        <div className="flex flex-col gap-2 overflow-y-auto max-h-100 lg:max-h-150 pe-1">
          {campaigns.map((c) => (
            <CampaignListItem key={c.id} campaign={c} isSelected={selectedId === c.id}
              onClick={() => { setSelectedId(c.id); setMetricsTarget(c) }} />
          ))}
        </div>

        {/* Detail panel */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-card p-5">
          {selected ? (
            <div className="flex flex-col gap-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold">{selected.nameAr}</h2>
                  <p className="text-sm text-muted-foreground mt-1">{selected.descriptionAr}</p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusPill type="campaign" value={selected.status} />
                  <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => setMetricsTarget(selected)}>
                    <BarChart3 className="size-3.5" />عرض المقاييس
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  ['الوصول التقديري', selected.audience.estimatedReach.toLocaleString('ar-SA') + ' عميل'],
                  ['تاريخ الإنشاء', new Date(selected.createdAt).toLocaleDateString('ar-SA',{year:'numeric',month:'long',day:'numeric'})],
                  ['توقيت الإرسال', selected.schedule.type === 'immediate' ? 'فوري' : 'مجدول'],
                ].map(([label, val]) => (
                  <div key={String(label)} className="rounded-lg bg-muted/40 p-3">
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="text-sm font-semibold mt-0.5">{val}</p>
                  </div>
                ))}
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">القنوات</p>
                <div className="flex flex-wrap gap-2">
                  {selected.channels.map((ch) => (
                    <span key={ch} className={cn('flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium border', CHANNEL_BADGE[ch])}>{ch}</span>
                  ))}
                </div>
              </div>
              {selected.messageTemplate.body && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">قالب الرسالة</p>
                  <div className="rounded-lg bg-muted/40 p-4">
                    <p className="text-sm leading-relaxed font-inter">{selected.messageTemplate.body}</p>
                  </div>
                </div>
              )}
              {selected.metrics.sent > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">مؤشرات الأداء</p>
                  <div className="space-y-2">
                    {[
                      { l: 'أُرسل', v: selected.metrics.sent, p: 100 },
                      { l: 'وُصِّل', v: selected.metrics.delivered, p: Math.round(selected.metrics.delivered / selected.metrics.sent * 100) },
                      { l: 'فُتح',  v: selected.metrics.opened,    p: Math.round(selected.metrics.opened / selected.metrics.sent * 100) },
                      { l: 'تحوَّل',v: selected.metrics.converted,p: Math.round(selected.metrics.converted / selected.metrics.sent * 100) },
                    ].map((row) => (
                      <div key={row.l} className="flex items-center gap-2 text-xs">
                        <span className="w-12 text-muted-foreground">{row.l}</span>
                        <div className="flex-1"><Progress value={row.p} className="h-1.5" /></div>
                        <span className="w-24 text-end font-inter font-medium">{row.v.toLocaleString('ar-SA')} ({toAr(row.p)}٪)</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <Megaphone className="size-12 opacity-20 mb-3" />
              <p className="text-sm">اختر حملة لعرض تفاصيلها</p>
            </div>
          )}
        </div>
      </div>

      {/* Metrics drawer */}
      {metricsTarget && <MetricsDrawer campaign={metricsTarget} onClose={() => setMetricsTarget(null)} />}
        </>
      )}
    </div>
  )
}
