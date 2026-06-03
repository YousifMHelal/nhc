import { getLeads, getSalesReps } from '@/lib/queries'
import { PipelineClient } from './client'

export default async function PipelinePage() {
  const [leads, salesReps] = await Promise.all([getLeads(), getSalesReps()])
  return <PipelineClient initialLeads={leads} salesReps={salesReps} />
}
