import { getKpiData, getFunnelStages, getRevenueTrend, getChannelPerformance, getSalesReps } from '@/lib/queries'
import { ReportsClient } from './client'

export default async function ReportsPage() {
  const [kpiData, funnelStages, revenueTrend, channelPerformance, salesReps] = await Promise.all([
    getKpiData(),
    getFunnelStages(),
    getRevenueTrend(),
    getChannelPerformance(),
    getSalesReps(),
  ])

  return (
    <ReportsClient
      kpiData={kpiData}
      funnelStages={funnelStages}
      revenueTrend={revenueTrend}
      channelPerformance={channelPerformance}
      salesReps={salesReps}
    />
  )
}
