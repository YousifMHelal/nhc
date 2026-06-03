import { getLeads, getLeadScores, getSalesReps } from '@/lib/queries'
import { LeadScoringClient } from './client'

export default async function LeadScoringPage() {
  const [leads, scores, salesReps] = await Promise.all([
    getLeads(),
    getLeadScores(),
    getSalesReps(),
  ])

  return <LeadScoringClient leads={leads} scores={scores} salesReps={salesReps} />
}
