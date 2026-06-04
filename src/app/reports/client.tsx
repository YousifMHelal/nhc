'use client'

import { useMemo, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Download, FileText, Users, Target, TrendingUp, BarChart3, Trophy, BarChart2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { KpiCard } from '@/components/shared/kpi-card'
import { cn, toAr } from '@/lib/utils'
import type { KpiData, FunnelStage, ChannelPerformance, SalesRep } from '@/lib/types'

// ─── Date ranges ──────────────────────────────────────────────────────────────

const DATE_RANGES = [
  { label: 'آخر ٧ أيام',  value: '7d'  },
  { label: 'آخر ٣٠ يومًا',value: '30d' },
  { label: 'آخر ٩٠ يومًا',value: '90d' },
  { label: 'هذا العام',   value: 'ytd' },
]

// Simulated data multipliers per range (applied to mock data)
const RANGE_FACTOR: Record<string, number> = { '7d': 0.23, '30d': 1, '90d': 2.9, 'ytd': 9.4 }

const CHANNEL_COLORS: Record<string, string> = {
  WhatsApp: 'var(--color-accent-pipeline)',
  Web:      'var(--color-brand)',
  Referral: 'var(--color-accent-lead-scoring)',
  Social:   'var(--color-accent-marketing)',
  SMS:      'var(--color-accent-integrations)',
  Email:    'var(--color-accent-customer360)',
}
const RANK_COLORS = ['text-amber-500', 'text-slate-400', 'text-orange-700']

function fmtM(n: number) {
  if (!n || isNaN(n)) return toAr(0)
  return `${toAr((n / 1_000_000).toFixed(1))}م`
}

type RevenueTrend = { monthAr: string; revenue: number; leads: number }

interface ReportsClientProps {
  kpiData: KpiData
  funnelStages: FunnelStage[]
  channelPerformance: ChannelPerformance[]
  revenueTrend: RevenueTrend[]
  salesReps: SalesRep[]
}

function exportCSV(channelPerformance: ChannelPerformance[]) {
  const header = 'القناة,العملاء,التحويلات,معدل التحويل (%),الإيرادات (ريال)\n'
  const rows = channelPerformance.map((r) => `${r.channel},${r.leads},${r.conversions},${r.conversionRate},${r.revenue}`).join('\n')
  const blob = new Blob(['﻿' + header + rows], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = 'nhc-channel-performance.csv'; a.click()
  URL.revokeObjectURL(url)
}

// ─── Components ───────────────────────────────────────────────────────────────

function RevenueTrendChart({ factor, revenueTrend }: { factor: number; revenueTrend: RevenueTrend[] }) {
  const data = useMemo(() => {
    const count = factor <= 0.25 ? 7 : revenueTrend.length
    return revenueTrend.slice(-Math.ceil(count)).map((d) => ({
      ...d,
      revenue: Math.round(d.revenue * factor),
    }))
  }, [factor, revenueTrend])

  const hasData = data.some((d) => d.revenue > 0)

  return (
    <div className="lg:col-span-3 rounded-xl border border-border bg-card p-5">
      <h2 className="text-sm font-semibold mb-4">اتجاه الإيرادات</h2>
      {!hasData ? (
        <div className="flex flex-col items-center justify-center h-52 text-muted-foreground gap-2">
          <BarChart2 className="size-8 opacity-20" />
          <p className="text-sm">لا توجد بيانات إيرادات بعد</p>
        </div>
      ) : (
        <div dir="ltr" className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} barSize={30}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="monthAr" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={(v: number) => `${toAr((v / 1_000_000).toFixed(0))}م`} width={38} axisLine={false} tickLine={false} />
              <Tooltip
                formatter={(v: unknown) => [`${(v as number).toLocaleString('ar-SA')} ريال`, 'الإيرادات']}
                cursor={{ fill: 'var(--color-bg-hover)' }}
              />
              <Bar dataKey="revenue" fill="var(--color-brand)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}

function FunnelPanel({ factor, funnelStages }: { factor: number; funnelStages: FunnelStage[] }) {
  const data = useMemo(() => funnelStages.map((s) => ({
    ...s,
    count: Math.round((Number(s.count) || 0) * factor),
  })), [factor, funnelStages])
  const topCount = Math.max(...data.map((s) => s.count), 0)
  const max = Math.max(topCount, 1)
  const hasData = data.some((s) => s.count > 0)
  return (
    <div className="lg:col-span-2 rounded-xl border border-border bg-card p-5">
      <h2 className="text-sm font-semibold mb-5">مسار تحويل العملاء</h2>
      {!hasData ? (
        <div className="flex flex-col items-center justify-center py-10 text-muted-foreground gap-2">
          <BarChart3 className="size-8 opacity-20" />
          <p className="text-sm">لا توجد بيانات للمسار بعد</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {data.map((stage) => {
            const pct = Math.round((stage.count / max) * 100)
            const safePct = isNaN(pct) ? 0 : pct
            return (
              <div key={stage.stage} className="flex items-center gap-2">
                <span className="w-20 text-end text-xs text-muted-foreground shrink-0">{stage.nameAr}</span>
                <div className="flex-1 h-6 bg-muted rounded-full overflow-hidden">
                  <div className="h-full rounded-full flex items-center justify-end pe-2 transition-all duration-500"
                    style={{ width: `${safePct}%`, backgroundColor: stage.color }}>
                    {safePct > 15 && <span className="text-white text-[11px] font-bold font-inter">{toAr(stage.count)}</span>}
                  </div>
                </div>
                <span className="w-8 text-[11px] text-muted-foreground shrink-0 font-inter">{toAr(safePct)}٪</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function ChannelChart({ factor, channelPerformance }: { factor: number; channelPerformance: ChannelPerformance[] }) {
  const data = useMemo(() => channelPerformance.map((c) => ({
    ...c, leads: Math.round(c.leads * factor), conversions: Math.round(c.conversions * factor),
  })), [factor, channelPerformance])
  return (
    <div className="lg:col-span-3 rounded-xl border border-border bg-card p-5">
      <h2 className="text-sm font-semibold mb-4">أداء القنوات — عملاء وتحويلات</h2>
      {data.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-muted-foreground gap-2">
          <BarChart2 className="size-8 opacity-20" />
          <p className="text-sm">لا توجد بيانات قنوات بعد</p>
        </div>
      ) : (
        <>
          <div dir="ltr" className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} barSize={16} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="channel" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={28} />
                <Tooltip
                  formatter={(v: unknown, name: unknown) => [v as number, name === 'leads' ? 'عملاء' : 'تحويلات']}
                />
                <Bar dataKey="leads" name="leads" radius={[2, 2, 0, 0]}>
                  {data.map((e) => <Cell key={`leads-${e.channel}`} fill={CHANNEL_COLORS[e.channel] ?? 'var(--color-brand)'} fillOpacity={0.3} />)}
                </Bar>
                <Bar dataKey="conversions" name="conversions" radius={[2, 2, 0, 0]}>
                  {data.map((e) => <Cell key={`conv-${e.channel}`} fill={CHANNEL_COLORS[e.channel] ?? 'var(--color-brand)'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {data.map((ch) => (
              <span key={ch.channel} className="flex items-center gap-1.5 rounded-full border border-border px-2.5 py-0.5 text-[11px]">
                <span className="size-2 rounded-full shrink-0" style={{ backgroundColor: CHANNEL_COLORS[ch.channel] }} />
                {ch.channel}
                <span className="text-muted-foreground font-medium font-inter">{toAr(ch.conversionRate)}٪</span>
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function Leaderboard({ salesReps }: { salesReps: SalesRep[] }) {
  return (
    <div className="lg:col-span-2 rounded-xl border border-border bg-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="size-4 text-amber-500" />
        <h2 className="text-sm font-semibold">لوحة الشرف</h2>
      </div>
      {salesReps.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground gap-2">
          <Trophy className="size-8 opacity-20" />
          <p className="text-sm">لا يوجد بيانات مندوبين بعد</p>
        </div>
      ) : (
        <div className="flex flex-col gap-1">
          {salesReps.map((rep) => {
            const convRate = rep.leads ? Math.round((rep.conversions / rep.leads) * 100) : 0
            return (
              <div key={rep.id} className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-muted/40 transition-colors">
                <span className={cn('w-5 text-sm font-bold text-center shrink-0', RANK_COLORS[rep.rank - 1] ?? 'text-muted-foreground')}>{rep.rank}</span>
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent-reports/15 text-accent-reports text-[11px] font-bold">{rep.avatarInitials}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold truncate">{rep.nameAr}</p>
                  <p className="text-[10px] text-muted-foreground">{rep.region}</p>
                </div>
                <div className="text-end shrink-0">
                  <p className="text-xs font-bold text-accent-reports font-inter">{fmtM(rep.revenue)} ريال</p>
                  <p className="text-[10px] text-muted-foreground font-inter">{toAr(convRate)}٪ تحويل</p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function ReportsClient({ kpiData, funnelStages, channelPerformance, revenueTrend, salesReps }: ReportsClientProps) {
  const [dateRange, setDateRange] = useState('30d')
  const factor = RANGE_FACTOR[dateRange] ?? 1

  const kpi = useMemo(() => ({
    totalLeads: Math.round(kpiData.totalLeads * factor),
    conversionRate: kpiData.conversionRate,
    revenue: Math.round((kpiData.revenueThisMonth ?? 0) * factor),
    opportunities: Math.round(kpiData.openOpportunities * factor),
  }), [factor, kpiData])

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-brand-dark">التقارير والتحليلات</h1>
          <p className="text-sm text-muted-foreground mt-0.5">نظرة شاملة على الأداء والمبيعات</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Date range picker */}
          <div className="flex rounded-lg border border-border overflow-hidden overflow-x-auto">
            {DATE_RANGES.map((r) => (
              <button key={r.value} onClick={() => setDateRange(r.value)}
                className={cn('px-3 py-1.5 text-xs font-medium transition-colors',
                  dateRange === r.value ? 'bg-accent-reports text-white' : 'bg-background text-muted-foreground hover:bg-muted')}>
                {r.label}
              </button>
            ))}
          </div>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => exportCSV(channelPerformance)}>
            <Download className="size-3.5" />تصدير CSV
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => window.print()}>
            <FileText className="size-3.5" />طباعة PDF
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard labelAr="إجمالي العملاء المحتملين" value={kpi.totalLeads.toLocaleString('ar-SA')}
          growth={kpiData.totalLeadsGrowth} icon={Users} accentClass="text-accent-reports" accentBgClass="bg-accent-reports/10" />
        <KpiCard labelAr="معدل التحويل" value={`${toAr(kpi.conversionRate)}٪`}
          growth={kpiData.conversionRateGrowth} icon={Target} accentClass="text-success" accentBgClass="bg-success/10" />
        <KpiCard labelAr="إيرادات الفترة" value={`${fmtM(kpi.revenue)} ريال`}
          growth={kpiData.revenueGrowth} icon={TrendingUp} accentClass="text-warning" accentBgClass="bg-warning/10" />
        <KpiCard labelAr="فرص نشطة" value={toAr(kpi.opportunities)}
          icon={BarChart3} accentClass="text-brand" accentBgClass="bg-brand/10" />
      </div>

      {/* Row 2: Revenue + Funnel */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <RevenueTrendChart factor={factor} revenueTrend={revenueTrend} />
        <FunnelPanel factor={factor} funnelStages={funnelStages} />
      </div>

      {/* Row 3: Channel + Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <ChannelChart factor={factor} channelPerformance={channelPerformance} />
        <Leaderboard salesReps={salesReps} />
      </div>
    </div>
  )
}
