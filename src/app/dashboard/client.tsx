'use client'

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import {
  Users, TrendingUp, FileText, Cpu, Plus, Megaphone, BarChart2,
  PhoneCall, Calendar, ChevronLeft,
  Zap, Star, MapPin, Clock,
} from 'lucide-react'
import { KpiCard } from '@/components/shared/kpi-card'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import type { Activity, FunnelStage, ChannelPerformance } from '@/lib/types'
import { toAr } from '@/lib/utils'

interface KpiData {
  totalLeads: number
  totalLeadsGrowth: number
  conversionRate: number
  conversionRateGrowth: number
  openOpportunities: number
  openOpportunitiesValue: number
  campaignPerformance: number
  campaignPerformanceGrowth: number
  revenueThisMonth?: number
  revenueGrowth?: number
}

interface Props {
  kpi: KpiData
  funnelStages: FunnelStage[]
  revenueTrend: { monthAr: string; revenue: number; leads: number }[]
  channelPerformance: ChannelPerformance[]
  activities: Activity[]
}

const ACTIVITY_ICONS: Record<string, React.ElementType> = {
  lead_added:           Users,
  stage_changed:        TrendingUp,
  interaction_logged:   PhoneCall,
  contract_signed:      FileText,
  campaign_sent:        Megaphone,
  ticket_created:       Star,
  score_updated:        Cpu,
  opportunity_created:  Zap,
}

const ACTIVITY_COLORS: Record<string, string> = {
  lead_added:           'bg-success-bg text-success',
  stage_changed:        'bg-info-bg text-info',
  interaction_logged:   'bg-info-bg text-info',
  contract_signed:      'bg-purple-bg text-purple',
  campaign_sent:        'bg-error-bg text-danger',
  ticket_created:       'bg-error-bg text-danger',
  score_updated:        'bg-purple-bg text-purple',
  opportunity_created:  'bg-warning-bg text-warning',
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 60) return `منذ ${toAr(mins)} د`
  const hrs = Math.floor(diff / 3_600_000)
  if (hrs < 24) return `منذ ${toAr(hrs)} س`
  return `منذ ${toAr(Math.floor(diff / 86_400_000))} ي`
}

function todayAr(): string {
  return new Date().toLocaleDateString('ar-SA', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })
}

export function DashboardClient({ kpi, funnelStages, activities }: Props) {
  const router = useRouter()
  const funnelMax = funnelStages[0]?.count ?? 1

  const openOppsCount = kpi.openOpportunities
  const followUpCount = Math.min(openOppsCount, 9)

  return (
    <div className="space-y-6">

      {/* ── Greeting / summary header ─────────────────────────────────────── */}
      <div className="rounded-xl bg-brand-dark px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
        <div className="space-y-1">
          <h1 className="text-xl font-bold text-white leading-tight">
            مرحباً، محمد 👋
          </h1>
          <div className="flex items-center gap-2 text-white/60 text-xs">
            <Clock className="size-3.5 shrink-0" />
            <span>{todayAr()}</span>
          </div>
          {followUpCount > 0 ? (
            <p className="text-sm text-white/75 mt-1">
              لديك <span className="text-brand-accent font-semibold">{toAr(followUpCount)} فرص</span> تحتاج متابعة اليوم
            </p>
          ) : (
            <p className="text-sm text-white/75 mt-1">لا توجد فرص معلقة اليوم</p>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            size="sm"
            className="bg-brand-accent text-brand-dark hover:bg-brand-accent/90 gap-1.5 font-semibold shadow-sm"
            onClick={() => router.push('/pipeline')}
          >
            <Plus className="size-4" />
            إضافة عميل
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="border-white/20 text-white hover:bg-white/10 hover:text-white gap-1.5 bg-transparent"
            onClick={() => router.push('/marketing')}
          >
            <Megaphone className="size-4" />
            حملة جديدة
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="border-white/20 text-white hover:bg-white/10 hover:text-white gap-1.5 bg-transparent"
            onClick={() => router.push('/reports')}
          >
            <BarChart2 className="size-4" />
            التقارير
          </Button>
        </div>
      </div>

      {/* ── KPI cards ─────────────────────────────────────────────────────── */}
      <section className="space-y-3">
        <h2 className="text-sm font-bold text-brand" style={{ fontFamily: 'var(--font-cairo)' }}>
          مؤشرات الأداء الرئيسية
        </h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="cursor-pointer" onClick={() => router.push('/pipeline')} title="انتقل إلى خط المبيعات">
            <KpiCard
              labelAr="إجمالي العملاء المحتملين"
              value={kpi.totalLeads.toLocaleString('ar-SA')}
              growth={kpi.totalLeadsGrowth}
              icon={Users}
              accentClass="text-brand"
              accentBgClass="bg-brand/10"
              accentBarClass="bg-brand"
            />
          </div>
          <div className="cursor-pointer" onClick={() => router.push('/reports')} title="انتقل إلى التقارير">
            <KpiCard
              labelAr="معدل التحويل"
              value={`${toAr(kpi.conversionRate)}٪`}
              growth={kpi.conversionRateGrowth}
              icon={TrendingUp}
              accentClass="text-accent-pipeline"
              accentBgClass="bg-success-bg"
              accentBarClass="bg-accent-pipeline"
            />
          </div>
          <div className="cursor-pointer" onClick={() => router.push('/reports')} title="انتقل إلى التقارير">
            <KpiCard
              labelAr="فرص نشطة"
              value={kpi.openOpportunities.toLocaleString('ar-SA')}
              growth={kpi.revenueGrowth ?? 0}
              icon={FileText}
              accentClass="text-accent-customer360"
              accentBgClass="bg-purple-bg"
              accentBarClass="bg-accent-customer360"
            />
          </div>
          <div className="cursor-pointer" onClick={() => router.push('/lead-scoring')} title="انتقل إلى تقييم العملاء">
            <KpiCard
              labelAr="دقة نموذج AI"
              value={`${toAr(kpi.campaignPerformance)}٪`}
              growth={kpi.campaignPerformanceGrowth}
              icon={Cpu}
              accentClass="text-purple"
              accentBgClass="bg-purple-bg"
              accentBarClass="bg-purple"
              isPurple
            />
          </div>
        </div>
      </section>

      {/* ── Charts row ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Sales Funnel */}
        <div className="lg:col-span-3 rounded-xl bg-card border border-border p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-brand" style={{ fontFamily: 'var(--font-cairo)' }}>
              مسار المبيعات
            </h2>
            <span className="text-xs text-muted-foreground">{toAr(funnelStages.length)} مراحل</span>
          </div>
          <div dir="ltr">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={funnelStages}
                layout="vertical"
                barSize={22}
                margin={{ left: 10, right: 36 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--color-border)" />
                <XAxis
                  type="number"
                  tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="nameAr"
                  tick={{ fontSize: 12, fill: 'var(--color-foreground)' }}
                  axisLine={false}
                  tickLine={false}
                  width={72}
                />
                <Tooltip
                  formatter={(v: unknown, _: unknown, entry: { payload?: FunnelStage }) => {
                    const stage = entry?.payload
                    const pct = stage ? Math.round((Number(v) / funnelMax) * 100) : 0
                    return [`${toAr(Number(v))} عميل (${toAr(pct)}٪)`, 'العدد']
                  }}
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid var(--color-border)',
                    fontSize: '13px',
                    direction: 'rtl',
                    boxShadow: '0 4px 12px rgba(0,0,0,.12)',
                  }}
                />
                <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                  {funnelStages.map((stage, i) => (
                    <Cell key={i} fill={stage.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Activity Feed */}
        <div className="lg:col-span-2 rounded-xl bg-card border border-border p-5 flex flex-col shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-brand" style={{ fontFamily: 'var(--font-cairo)' }}>
              آخر النشاطات
            </h2>
            <button
              onClick={() => router.push('/pipeline')}
              className="text-xs text-brand hover:text-brand/80 flex items-center gap-0.5 transition-colors"
            >
              عرض الكل <ChevronLeft className="size-3" />
            </button>
          </div>
          <div className="flex flex-col gap-2 overflow-y-auto max-h-55 pe-1 scrollbar-none">
            {activities.slice(0, 10).map((act) => {
              const Icon = ACTIVITY_ICONS[act.type] ?? Calendar
              const colorCls = ACTIVITY_COLORS[act.type] ?? 'bg-neutral-bg text-neutral'
              return (
                <button
                  key={act.id}
                  className="flex items-start gap-3 text-start rounded-lg p-2 -mx-2 hover:bg-bg-hover transition-colors duration-150 group"
                  onClick={() => {
                    if (act.entityType === 'lead' || act.entityType === 'customer') router.push('/customer-360')
                    else if (act.entityType === 'campaign') router.push('/marketing')
                    else if (act.entityType === 'ticket') router.push('/support')
                  }}
                >
                  <div className={`flex size-8 shrink-0 items-center justify-center rounded-full ${colorCls}`}>
                    <Icon className="size-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground leading-snug truncate group-hover:text-brand transition-colors">
                      {act.titleAr}
                    </p>
                    <p className="text-[11px] text-muted-foreground leading-snug mt-0.5 line-clamp-1">
                      {act.customerNameAr ? `${act.customerNameAr} — ` : ''}{act.descriptionAr}
                    </p>
                  </div>
                  <span className="text-[10px] text-muted-foreground shrink-0 mt-0.5 tabular-nums">
                    {timeAgo(act.date)}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Quick-stats row ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'إجمالي العملاء',   value: toAr(kpi.totalLeads),             sub: `${kpi.totalLeadsGrowth >= 0 ? '+' : ''}${toAr(kpi.totalLeadsGrowth)}٪ هذا الشهر`,                              color: 'text-brand',   bg: 'bg-brand/10',   Icon: Users    },
          { label: 'فرص نشطة',         value: toAr(kpi.openOpportunities),      sub: 'قيد المتابعة الحالية',                                                                                          color: 'text-warning', bg: 'bg-warning-bg', Icon: Calendar },
          { label: 'معدل التحويل',     value: `${toAr(kpi.conversionRate)}٪`,   sub: 'نسبة الإغلاق الكلية',                                                                                          color: 'text-info',    bg: 'bg-info-bg',    Icon: MapPin   },
          { label: 'أداء الحملات',     value: `${toAr(kpi.campaignPerformance)}٪`, sub: `${kpi.campaignPerformanceGrowth >= 0 ? '+' : ''}${toAr(kpi.campaignPerformanceGrowth)}٪ مقارنة بالسابق`, color: 'text-danger',  bg: 'bg-error-bg',   Icon: Star     },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-xl bg-card border border-border p-4 flex items-center gap-3 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-150"
          >
            <div className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${s.bg}`}>
              <s.Icon className={`size-5 ${s.color}`} />
            </div>
            <div className="min-w-0">
              <p className="text-lg font-bold font-inter tabular-nums text-foreground leading-tight">{s.value}</p>
              <p className="text-[11px] text-muted-foreground leading-snug truncate">{s.label}</p>
              <p className="text-[10px] font-medium leading-snug" style={{ color: 'var(--color-brand-accent)' }}>{s.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Quick Actions ─────────────────────────────────────────────────── */}
      <section className="space-y-3">
        <h2 className="text-sm font-bold text-brand" style={{ fontFamily: 'var(--font-cairo)' }}>
          إجراءات سريعة
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            {
              Icon: Plus,
              labelAr: 'إضافة عميل محتمل',
              subLabelAr: 'إدخال عميل جديد في خط المبيعات',
              path: '/pipeline',
              color: 'text-brand',
              bg: 'bg-brand/10',
            },
            {
              Icon: Megaphone,
              labelAr: 'حملة تسويقية جديدة',
              subLabelAr: 'بناء وإطلاق حملة جديدة',
              path: '/marketing',
              color: 'text-accent-marketing',
              bg: 'bg-error-bg',
            },
            {
              Icon: BarChart2,
              labelAr: 'عرض التقارير',
              subLabelAr: 'تحليل الأداء والمبيعات',
              path: '/reports',
              color: 'text-accent-reports',
              bg: 'bg-purple-bg',
            },
          ].map((qa) => (
            <button
              key={qa.path}
              onClick={() => router.push(qa.path)}
              className="rounded-xl border border-border bg-card p-4 flex items-center gap-4 hover:shadow-md hover:border-brand/30 hover:-translate-y-0.5 transition-all duration-150 text-start group"
            >
              <div className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${qa.bg} transition-transform duration-150 group-hover:scale-110`}>
                <qa.Icon className={`size-5 ${qa.color}`} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground group-hover:text-brand transition-colors">{qa.labelAr}</p>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{qa.subLabelAr}</p>
              </div>
              <ChevronLeft className="size-4 text-muted-foreground shrink-0 group-hover:text-brand transition-colors" />
            </button>
          ))}
        </div>
      </section>

    </div>
  )
}
