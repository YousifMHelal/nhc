'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'
import {
  Users,
  TrendingUp,
  BarChart2,
  Megaphone,
  Banknote,
  Target,
} from 'lucide-react'
import { KpiCard } from '@/components/shared/kpi-card'
import type { KpiData, FunnelStage, ChannelPerformance } from '@/lib/types'

const fmt = (n: number) =>
  n >= 1_000_000
    ? `${(n / 1_000_000).toFixed(1)} م`
    : n >= 1_000
    ? `${(n / 1_000).toFixed(0)} ألف`
    : String(n)

interface RevenueTrend {
  monthAr: string
  revenue: number
  leads: number
}

interface Props {
  kpi: KpiData
  funnelStages: FunnelStage[]
  revenueTrend: RevenueTrend[]
  channelPerformance: ChannelPerformance[]
}

export function DashboardClient({ kpi, funnelStages, revenueTrend, channelPerformance }: Props) {
  return (
    <div className="space-y-6">
      {/* KPI grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <KpiCard
          labelAr="إجمالي العملاء المحتملين"
          value={kpi.totalLeads.toLocaleString('ar-SA')}
          growth={kpi.totalLeadsGrowth}
          icon={Users}
          accentClass="text-brand"
          accentBgClass="bg-blue-50"
        />
        <KpiCard
          labelAr="معدل التحويل"
          value={`${kpi.conversionRate}٪`}
          growth={kpi.conversionRateGrowth}
          icon={TrendingUp}
          accentClass="text-accent-pipeline"
          accentBgClass="bg-emerald-50"
        />
        <KpiCard
          labelAr="الفرص المفتوحة"
          value={`${kpi.openOpportunities} فرصة`}
          growth={undefined}
          icon={Target}
          accentClass="text-accent-customer360"
          accentBgClass="bg-violet-50"
        />
        <KpiCard
          labelAr="أداء الحملات"
          value={`${kpi.campaignPerformance}٪`}
          growth={kpi.campaignPerformanceGrowth}
          icon={Megaphone}
          accentClass="text-accent-marketing"
          accentBgClass="bg-rose-50"
        />
        <KpiCard
          labelAr="الإيرادات هذا الشهر"
          value={`${(kpi.revenueThisMonth / 1_000_000).toFixed(1)} م ريال`}
          growth={kpi.revenueGrowth}
          icon={Banknote}
          accentClass="text-accent-lead-scoring"
          accentBgClass="bg-amber-50"
        />
        <KpiCard
          labelAr="قيمة الفرص المفتوحة"
          value={`${(kpi.openOpportunitiesValue / 1_000_000).toFixed(0)} م ريال`}
          growth={undefined}
          icon={BarChart2}
          accentClass="text-brand"
          accentBgClass="bg-blue-50"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        {/* Revenue trend */}
        <div className="lg:col-span-3 rounded-xl border border-border bg-card p-5">
          <h3 className="mb-4 text-sm font-semibold text-foreground">
            الإيرادات الشهرية (ريال)
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={revenueTrend} barSize={32}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis
                dataKey="monthAr"
                tick={{ fontSize: 12, fill: 'var(--color-muted-foreground)' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tickFormatter={fmt}
                tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }}
                axisLine={false}
                tickLine={false}
                width={50}
              />
              <Tooltip
                formatter={(v) => [`${(Number(v) / 1_000_000).toFixed(1)} م ريال`, 'الإيرادات']}
                contentStyle={{
                  borderRadius: '8px',
                  border: '1px solid var(--color-border)',
                  fontSize: '13px',
                }}
              />
              <Bar dataKey="revenue" fill="var(--color-brand)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Funnel donut */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-card p-5">
          <h3 className="mb-4 text-sm font-semibold text-foreground">مسار التحويل</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={funnelStages}
                dataKey="count"
                nameKey="nameAr"
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={3}
              >
                {funnelStages.map((stage, i) => (
                  <Cell key={i} fill={stage.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(v, _name, entry) => [v, (entry as { name?: string }).name ?? '']}
                contentStyle={{
                  borderRadius: '8px',
                  border: '1px solid var(--color-border)',
                  fontSize: '13px',
                }}
              />
              <Legend
                formatter={(value) => <span style={{ fontSize: 12, color: 'var(--color-muted-foreground)' }}>{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Channel performance */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="mb-4 text-sm font-semibold text-foreground">أداء القنوات</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-right text-xs font-medium text-muted-foreground">
                <th className="pb-3 pe-4">القناة</th>
                <th className="pb-3 pe-4 text-start">العملاء المحتملون</th>
                <th className="pb-3 pe-4 text-start">التحويلات</th>
                <th className="pb-3 pe-4 text-start">معدل التحويل</th>
                <th className="pb-3 text-start">الإيرادات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {channelPerformance.map((ch) => (
                <tr key={ch.channel} className="text-right">
                  <td className="py-3 pe-4 font-medium">{ch.channel}</td>
                  <td className="py-3 pe-4 text-start text-muted-foreground">
                    {ch.leads}
                  </td>
                  <td className="py-3 pe-4 text-start text-muted-foreground">
                    {ch.conversions}
                  </td>
                  <td className="py-3 pe-4 text-start">
                    <span
                      className={
                        ch.conversionRate >= 25
                          ? 'text-success font-semibold'
                          : ch.conversionRate >= 15
                          ? 'text-accent-lead-scoring font-semibold'
                          : 'text-muted-foreground'
                      }
                    >
                      {ch.conversionRate}٪
                    </span>
                  </td>
                  <td className="py-3 text-start font-medium">
                    {(ch.revenue / 1_000_000).toFixed(1)} م
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
