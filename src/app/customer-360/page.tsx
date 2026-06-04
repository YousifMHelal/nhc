import {
  getCustomersWithLeads,
  getAllTimelineEvents,
  getAllOpportunities,
  getAllContracts,
  getSalesReps,
} from '@/lib/queries'
import { UNITS } from '@/lib/mock-data/units'
import { Customer360Client } from './client'

export default async function Customer360Page() {
  const [customers, allTimeline, allOpportunities, allContracts, salesReps] = await Promise.all([
    getCustomersWithLeads(),
    getAllTimelineEvents(),
    getAllOpportunities(),
    getAllContracts(),
    getSalesReps(),
  ])

  const availableUnits = UNITS.filter((u) => u.status === 'Available')

  return (
    <Customer360Client
      customers={customers}
      allTimeline={allTimeline}
      allOpportunities={allOpportunities}
      allContracts={allContracts}
      availableUnits={availableUnits}
      salesReps={salesReps}
    />
  )
}
