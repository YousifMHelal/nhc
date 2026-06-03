'use client'

import { useState } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { Download, FileText, Users, Target, TrendingUp, BarChart3, Trophy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { KpiCard } from '@/components/shared/kpi-card'
import { KPI_DATA, FUNNEL_STAGES, CHANNEL_PERFORMANCE, REVENUE_TREND, SALES_REPS } from '@/lib/mock-data'
import { cn } from '@/lib/utils'

// ─── Constants ────────────────────────────────────────────────────────────────

const DATE_RANGES = [
  { label: 'آخر ٣٠ يومًا', value: '30d' },
  { label: 'آخر ٩٠ يومًا', value: '90d' },
  { label: 'هذا العام', value: 'ytd' },
  { label: 'السنة الماضية', value: 'ly' },
]

const CHANNEL_COLORS: Record<string, string> = {
  WhatsApp: '#059669',
  Web: '#1B6CA8',
  Referral: '#D97706',
  Social: '#E11D48',
  SMS: '#0284C7',
  Email: '#7C3AED',
}

const RANK_COLORS = ['text-amber-500', 'text-slate-400', 'text-orange-700']

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtM(n: number) {
  return `${(n / 1_000_000).toFixed(1)}م`
}

function exportCSV() {
  const header = 'القناة,العملاء,التحويلات,معدل التحويل (%),الإيرادات (ريال)\n'
  const rows = CHANNEL_PERFORMANCE.map(
    (r) => `${r.channel},${r.leads},${r.conversions},${r.conversionRate},${r.revenue}`
  ).join('\n')
  const blob = new Blob(['﻿' + header + rows], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'nhc-channel-performance.csv'
  a.click()
  URL.revokeObjectURL(url)
}

// ─── Revenue Trend Chart ──────────────────────────────────────────────────────

function RevenueTrendChart() {
  return (
    <div className="col-span-3 rounded-xl border border-border bg-card p-5">
      <h2 className="text-sm font-semibold mb-4">اتجاه الإيرادات الشهرية</h2>
      <div dir="ltr" className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={REVENUE_TREND} barSize={30}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis dataKey="monthAr" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis
              tick={{ fontSize: 10 }}
              tickFormatter={(v: number) => `${(v / 1_000_000).toFixed(0)}م`}
              width={38}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              formatter={(v: unknown) => [`${(v as number).toLocaleString('ar-SA')} ريال`, 'الإيرادات']}
              cursor={{ fill: 'rgba(67,56,202,0.05)' }}
            />
            <Bar dataKey="revenue" fill="#4338CA" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

// ─── Funnel Panel ─────────────────────────────────────────────────────────────

function FunnelPanel() {
  const max = FUNNEL_STAGES[0].count
  return (
    <div className="col-span-2 rounded-xl border border-border bg-card p-5">
      <h2 className="text-sm font-semibold mb-5">مسار تحويل العملاء</h2>
      <div className="flex flex-col gap-3">
        {FUNNEL_STAGES.map((stage) => {
          const pct = Math.round((stage.count / max) * 100)
          return (
            <div key={stage.stage} className="flex items-center gap-2">
              <span className="w-20 text-end text-xs text-muted-foreground shrink-0">{stage.nameAr}</span>
              <div className="flex-1 h-6 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full flex items-center justify-end pe-2 transition-all"
                  style={{ width: `${pct}%`, backgroundColor: stage.color }}
                >
                  <span className="text-white text-[11px] font-bold">{stage.count}</span>
                </div>
              </div>
              <span className="w-8 text-[11px] text-muted-foreground shrink-0">{pct}%</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Channel Performance Chart ────────────────────────────────────────────────

function ChannelChart() {
  return (
    <div className="col-span-3 rounded-xl border border-border bg-card p-5">
      <h2 className="text-sm font-semibold mb-4">أداء القنوات — عملاء وتحويلات</h2>
      <div dir="ltr" className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={CHANNEL_PERFORMANCE} barSize={16} barGap={2}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis dataKey="channel" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={28} />
            <Tooltip
              formatter={(v: unknown, name: unknown) => [
                v as number,
                name === 'leads' ? 'عملاء' : 'تحويلات',
              ]}
            />
            <Bar dataKey="leads" name="leads" radius={[2, 2, 0, 0]}>
              {CHANNEL_PERFORMANCE.map((e) => (
                <Cell key={`leads-${e.channel}`} fill={CHANNEL_COLORS[e.channel] ?? '#4338CA'} fillOpacity={0.3} />
              ))}
            </Bar>
            <Bar dataKey="conversions" name="conversions" radius={[2, 2, 0, 0]}>
              {CHANNEL_PERFORMANCE.map((e) => (
                <Cell key={`conv-${e.channel}`} fill={CHANNEL_COLORS[e.channel] ?? '#4338CA'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {CHANNEL_PERFORMANCE.map((ch) => (
          <span
            key={ch.channel}
            className="flex items-center gap-1.5 rounded-full border border-border px-2.5 py-0.5 text-[11px]"
          >
            <span
              className="size-2 rounded-full shrink-0"
              style={{ backgroundColor: CHANNEL_COLORS[ch.channel] }}
            />
            {ch.channel}
            <span className="text-muted-foreground font-medium">{ch.conversionRate}%</span>
          </span>
        ))}
      </div>
    </div>
  )
}

// ─── Leaderboard ──────────────────────────────────────────────────────────────

function Leaderboard() {
  return (
    <div className="col-span-2 rounded-xl border border-border bg-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="size-4 text-amber-500" />
        <h2 className="text-sm font-semibold">لوحة الشرف</h2>
      </div>
      <div className="flex flex-col gap-1">
        {SALES_REPS.map((rep) => {
          const convRate = rep.leads ? Math.round((rep.conversions / rep.leads) * 100) : 0
          return (
            <div
              key={rep.id}
              className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-muted/40 transition-colors"
            >
              <span
                className={cn(
                  'w-5 text-sm font-bold text-center shrink-0',
                  RANK_COLORS[rep.rank - 1] ?? 'text-muted-foreground'
                )}
              >
                {rep.rank}
              </span>
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent-reports/15 text-accent-reports text-[11px] font-bold">
                {rep.avatarInitials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold truncate">{rep.nameAr}</p>
                <p className="text-[10px] text-muted-foreground">{rep.region}</p>
              </div>
              <div className="text-end shrink-0">
                <p className="text-xs font-bold text-accent-reports">{fmtM(rep.revenue)} ريال</p>
                <p className="text-[10px] text-muted-foreground">{convRate}% تحويل</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState('30d')

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-accent-reports">التقارير والتحليلات</h1>
          <p className="text-sm text-muted-foreground mt-0.5">نظرة شاملة على الأداء والمبيعات</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex rounded-lg border border-border overflow-hidden">
            {DATE_RANGES.map((r) => (
              <button
                key={r.value}
                onClick={() => setDateRange(r.value)}
                className={cn(
                  'px-3 py-1.5 text-xs font-medium transition-colors',
                  dateRange === r.value
                    ? 'bg-accent-reports text-white'
                    : 'bg-background text-muted-foreground hover:bg-muted'
                )}
              >
                {r.label}
              </button>
            ))}
          </div>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={exportCSV}>
            <Download className="size-3.5" />
            تصدير CSV
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => window.print()}>
            <FileText className="size-3.5" />
            طباعة PDF
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4">
        <KpiCard
          labelAr="إجمالي العملاء المحتملين"
          value={KPI_DATA.totalLeads.toLocaleString('ar-SA')}
          growth={KPI_DATA.totalLeadsGrowth}
          icon={Users}
          accentClass="text-accent-reports"
          accentBgClass="bg-accent-reports/10"
        />
        <KpiCard
          labelAr="معدل التحويل"
          value={`${KPI_DATA.conversionRate}%`}
          growth={KPI_DATA.conversionRateGrowth}
          icon={Target}
          accentClass="text-success"
          accentBgClass="bg-success/10"
        />
        <KpiCard
          labelAr="إيرادات الشهر"
          value={`${fmtM(KPI_DATA.revenueThisMonth)} ريال`}
          growth={KPI_DATA.revenueGrowth}
          icon={TrendingUp}
          accentClass="text-warning"
          accentBgClass="bg-warning/10"
        />
        <KpiCard
          labelAr="فرص نشطة"
          value={`${KPI_DATA.openOpportunities}`}
          icon={BarChart3}
          accentClass="text-brand"
          accentBgClass="bg-brand/10"
        />
      </div>

      {/* Row 2: Revenue + Funnel */}
      <div className="grid grid-cols-5 gap-4">
        <RevenueTrendChart />
        <FunnelPanel />
      </div>

      {/* Row 3: Channel + Leaderboard */}
      <div className="grid grid-cols-5 gap-4">
        <ChannelChart />
        <Leaderboard />
      </div>
    </div>
  )
}
