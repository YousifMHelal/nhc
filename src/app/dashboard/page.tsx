import { getKpiData, getFunnelStages, getRevenueTrend, getChannelPerformance, getActivities } from '@/lib/queries'
import { DashboardClient } from './client'

export default async function DashboardPage() {
  const [kpi, funnelStages, revenueTrend, channelPerformance, activities] = await Promise.all([
    getKpiData(),
    getFunnelStages(),
    getRevenueTrend(),
    getChannelPerformance(),
    getActivities(10),
  ])

  return (
    <DashboardClient
      kpi={kpi}
      funnelStages={funnelStages}
      revenueTrend={revenueTrend}
      channelPerformance={channelPerformance}
      activities={activities}
    />
  )
}
