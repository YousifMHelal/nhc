import {
  getKpiData,
  getFunnelStages,
  getRevenueTrend,
  getChannelPerformance,
} from '@/lib/queries'
import { DashboardClient } from './client'

export default async function DashboardPage() {
  const [kpi, funnelStages, revenueTrend, channelPerformance] = await Promise.all([
    getKpiData(),
    getFunnelStages(),
    getRevenueTrend(),
    getChannelPerformance(),
  ])

  return (
    <DashboardClient
      kpi={kpi}
      funnelStages={funnelStages}
      revenueTrend={revenueTrend}
      channelPerformance={channelPerformance}
    />
  )
}
