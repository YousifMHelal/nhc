import {
  getCustomers,
  getAllTimelineEvents,
  getAllOpportunities,
  getAllContracts,
} from '@/lib/queries'
import { Customer360Client } from './client'

export default async function Customer360Page() {
  const [customers, allTimeline, allOpportunities, allContracts] = await Promise.all([
    getCustomers(),
    getAllTimelineEvents(),
    getAllOpportunities(),
    getAllContracts(),
  ])

  return (
    <Customer360Client
      customers={customers}
      allTimeline={allTimeline}
      allOpportunities={allOpportunities}
      allContracts={allContracts}
    />
  )
}
