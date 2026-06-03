'use client'

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import {
  Users, TrendingUp, FileText, Cpu, Plus, Megaphone, BarChart2,
  PhoneCall, MessageSquare, Mail, Building2, Star, Zap, Calendar,
  ChevronRight,
} from 'lucide-react'
import { KpiCard } from '@/components/shared/kpi-card'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import type { Activity, FunnelStage, ChannelPerformance } from '@/lib/types'

interface KpiData {
  totalLeads: number
  totalLeadsGrowth: number
  conversionRate: number
  conversionRateGrowth: number
  openOpportunities: number
  campaignPerformance: number
  campaignPerformanceGrowth: number
}

interface Props {
  kpi: KpiData
  funnelStages: FunnelStage[]
  revenueTrend: { monthAr: string; revenue: number; leads: number }[]
  channelPerformance: ChannelPerformance[]
  activities: Activity[]
}

const ACTIVITY_ICONS: Record<string, React.ElementType> = {
  lead_added: Users,
  stage_changed: TrendingUp,
  interaction_logged: PhoneCall,
  contract_signed: FileText,
  campaign_sent: Megaphone,
  ticket_created: Star,
  score_updated: Cpu,
  opportunity_created: Zap,
}

const ACTIVITY_COLORS: Record<string, string> = {
  lead_added: 'bg-emerald-100 text-emerald-700',
  stage_changed: 'bg-blue-100 text-blue-700',
  interaction_logged: 'bg-sky-100 text-sky-700',
  contract_signed: 'bg-violet-100 text-violet-700',
  campaign_sent: 'bg-rose-100 text-rose-700',
  ticket_created: 'bg-red-100 text-red-700',
  score_updated: 'bg-purple-100 text-purple-700',
  opportunity_created: 'bg-amber-100 text-amber-700',
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 60) return `منذ ${mins} دقيقة`
  const hrs = Math.floor(diff / 3_600_000)
  if (hrs < 24) return `منذ ${hrs} ساعة`
  return `منذ ${Math.floor(diff / 86_400_000)} يوم`
}

export function DashboardClient({ kpi, funnelStages, activities }: Props) {
  const router = useRouter()
  const funnelMax = funnelStages[0]?.count ?? 1

  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl bg-gradient-to-l from-brand-dark to-brand px-6 py-5 text-white shadow-md">
        <div>
          <h1 className="text-xl font-bold tracking-tight">لوحة التحكم</h1>
          <p className="text-sm text-white/70 mt-0.5">مرحباً محمد — إليك ملخص أداء اليوم</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            size="sm"
            className="bg-white text-brand hover:bg-white/90 gap-1.5 font-semibold shadow-sm"
            onClick={() => router.push('/pipeline')}
          >
            <Plus className="size-4" />
            إضافة عميل
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="border-white/30 text-white hover:bg-white/10 hover:text-white gap-1.5 bg-transparent"
            onClick={() => router.push('/marketing')}
          >
            <Megaphone className="size-4" />
            حملة جديدة
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="border-white/30 text-white hover:bg-white/10 hover:text-white gap-1.5 bg-transparent"
            onClick={() => router.push('/reports')}
          >
            <BarChart2 className="size-4" />
            التقارير
          </Button>
        </div>
      </div>

      {/* ── KPI Row (4 exact spec cards) ────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div
          className="cursor-pointer"
          onClick={() => router.push('/pipeline')}
          title="انتقل إلى خط المبيعات"
        >
          <KpiCard
            labelAr="إجمالي العملاء المحتملين"
            value={(1284).toLocaleString('ar-SA')}
            growth={kpi.totalLeadsGrowth}
            icon={Users}
            accentClass="text-brand"
            accentBgClass="bg-brand/10"
            accentBarClass="bg-brand"
            tooltip="مقارنة بـ ١٠٨٨ الشهر الماضي"
          />
        </div>
        <div
          className="cursor-pointer"
          onClick={() => router.push('/reports')}
          title="انتقل إلى التقارير"
        >
          <KpiCard
            labelAr="معدل التحويل"
            value="٦٨٪"
            growth={kpi.conversionRateGrowth}
            icon={TrendingUp}
            accentClass="text-accent-pipeline"
            accentBgClass="bg-emerald-50"
            accentBarClass="bg-accent-pipeline"
            tooltip="مقارنة بـ ٦٣٪ الشهر الماضي"
          />
        </div>
        <div
          className="cursor-pointer"
          onClick={() => router.push('/reports')}
          title="انتقل إلى التقارير"
        >
          <KpiCard
            labelAr="عقود نشطة"
            value={(347).toLocaleString('ar-SA')}
            growth={12}
            icon={FileText}
            accentClass="text-accent-customer360"
            accentBgClass="bg-violet-50"
            accentBarClass="bg-accent-customer360"
            tooltip="مقارنة بـ ٣١٠ الشهر الماضي"
          />
        </div>
        <div
          className="cursor-pointer"
          onClick={() => router.push('/lead-scoring')}
          title="انتقل إلى تقييم العملاء"
        >
          <KpiCard
            labelAr="دقة نموذج AI"
            value="٩٤٪"
            icon={Cpu}
            accentClass="text-purple"
            accentBgClass="bg-purple/10"
            accentBarClass="bg-purple"
            isPurple
          />
        </div>
      </div>

      {/* ── Charts Row ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        {/* Sales Funnel — bar chart */}
        <div className="lg:col-span-3 rounded-xl border border-border bg-card p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-foreground">مسار المبيعات</h3>
          <div dir="ltr">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={funnelStages}
                layout="vertical"
                barSize={24}
                margin={{ left: 10, right: 30 }}
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
                    return [`${v} عميل (${pct}٪ من الإجمالي)`, 'العدد']
                  }}
                  contentStyle={{ borderRadius: '8px', border: '1px solid var(--color-border)', fontSize: '13px', direction: 'rtl' }}
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
        <div className="lg:col-span-2 rounded-xl border border-border bg-card p-5 flex flex-col shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground">آخر النشاطات</h3>
            <button
              onClick={() => router.push('/pipeline')}
              className="text-xs text-brand hover:underline flex items-center gap-0.5"
            >
              عرض الكل <ChevronRight className="size-3" />
            </button>
          </div>
          <div className="flex flex-col gap-3 overflow-y-auto max-h-[220px] pe-1">
            {activities.slice(0, 10).map((act) => {
              const Icon = ACTIVITY_ICONS[act.type] ?? Calendar
              const colorCls = ACTIVITY_COLORS[act.type] ?? 'bg-muted text-muted-foreground'
              return (
                <button
                  key={act.id}
                  className="flex items-start gap-3 text-start hover:bg-bg-hover rounded-lg p-2 -mx-2 transition-colors"
                  onClick={() => {
                    if (act.entityType === 'lead' || act.entityType === 'customer') {
                      router.push('/customer-360')
                    } else if (act.entityType === 'campaign') {
                      router.push('/marketing')
                    } else if (act.entityType === 'ticket') {
                      router.push('/support')
                    }
                  }}
                >
                  <div className={`flex size-8 shrink-0 items-center justify-center rounded-full ${colorCls}`}>
                    <Icon className="size-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground leading-snug truncate">{act.titleAr}</p>
                    <p className="text-[11px] text-muted-foreground leading-snug mt-0.5 line-clamp-1">
                      {act.customerNameAr ? `${act.customerNameAr} — ` : ''}{act.descriptionAr}
                    </p>
                  </div>
                  <span className="text-[10px] text-muted-foreground shrink-0 mt-0.5">{timeAgo(act.date)}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Quick Actions ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { icon: Plus,     labelAr: 'إضافة عميل محتمل',  subLabelAr: 'إدخال عميل جديد في خط المبيعات', path: '/pipeline',  color: 'text-brand bg-brand/10' },
          { icon: Megaphone,labelAr: 'حملة تسويقية جديدة', subLabelAr: 'بناء وإطلاق حملة جديدة',         path: '/marketing', color: 'text-accent-marketing bg-accent-marketing/10' },
          { icon: BarChart2, labelAr: 'عرض التقارير',       subLabelAr: 'تحليل الأداء والمبيعات',        path: '/reports',   color: 'text-accent-reports bg-accent-reports/10' },
        ].map((qa) => (
          <button
            key={qa.path}
            onClick={() => router.push(qa.path)}
            className="rounded-xl border border-border bg-card p-5 flex items-center gap-4 hover:shadow-md hover:border-brand/30 transition-all text-start"
          >
            <div className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${qa.color}`}>
              <qa.icon className="size-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{qa.labelAr}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{qa.subLabelAr}</p>
            </div>
            <ChevronRight className="size-4 text-muted-foreground ms-auto shrink-0" />
          </button>
        ))}
      </div>
    </div>
  )
}
