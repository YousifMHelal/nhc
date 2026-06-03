/**
 * Server-only data access layer.
 * Falls back to mock data when DATABASE_URL is not set so the prototype
 * works without a database. Swap to DB queries by adding DATABASE_URL.
 */

import type {
  Lead,
  Customer,
  SalesRep,
  Opportunity,
  Contract,
  Request,
  Interaction,
  TimelineEvent,
  LeadScore,
  Campaign,
  Journey,
  Ticket,
  Integration,
  Activity,
  KpiData,
  FunnelStage,
  ChannelPerformance,
} from './types'

function hasDb() {
  return Boolean(process.env.DATABASE_URL)
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

// Prisma returns Date objects; our TS types use ISO strings — normalise here.
function toIso(row: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(row).map(([k, v]) => [k, v instanceof Date ? v.toISOString() : v]),
  )
}

// ─── Leads ───────────────────────────────────────────────────────────────────

export async function getLeads(): Promise<Lead[]> {
  if (!hasDb()) {
    const { LEADS } = await import('./mock-data/leads')
    return LEADS
  }
  const { db } = await import('./db')
  const rows = await db.lead.findMany({ orderBy: { createdAt: 'desc' } })
  return rows.map((r) => toIso(r) as unknown as Lead)
}

export async function getLeadsByStage(stage: Lead['stage']): Promise<Lead[]> {
  if (!hasDb()) {
    const { getLeadsByStage: mock } = await import('./mock-data/leads')
    return mock(stage)
  }
  const { db } = await import('./db')
  const stageMap: Record<string, string> = {
    'New': 'New',
    'Contacted': 'Contacted',
    'Qualified': 'Qualified',
    'Proposal': 'Proposal',
    'Closed Won': 'ClosedWon',
    'Closed Lost': 'ClosedLost',
  }
  const rows = await db.lead.findMany({
    where: { stage: stageMap[stage] as never },
    orderBy: { createdAt: 'desc' },
  })
  return rows.map((r) => toIso(r) as unknown as Lead)
}

export async function getLeadById(id: string): Promise<Lead | undefined> {
  if (!hasDb()) {
    const { getLeadById: mock } = await import('./mock-data/leads')
    return mock(id)
  }
  const { db } = await import('./db')
  const row = await db.lead.findUnique({ where: { id } })
  return row ? (toIso(row) as unknown as Lead) : undefined
}

// ─── Customers ───────────────────────────────────────────────────────────────

export async function getCustomers(): Promise<Customer[]> {
  if (!hasDb()) {
    const { CUSTOMERS } = await import('./mock-data/customers')
    return CUSTOMERS
  }
  const { db } = await import('./db')
  const rows = await db.customer.findMany({ orderBy: { createdAt: 'desc' } })
  return rows.map((r) => toIso(r) as unknown as Customer)
}

export async function getCustomerById(id: string): Promise<Customer | undefined> {
  if (!hasDb()) {
    const { getCustomerById: mock } = await import('./mock-data/customers')
    return mock(id)
  }
  const { db } = await import('./db')
  const row = await db.customer.findUnique({ where: { id } })
  return row ? (toIso(row) as unknown as Customer) : undefined
}

// ─── Sales Reps ──────────────────────────────────────────────────────────────

export async function getSalesReps(): Promise<SalesRep[]> {
  if (!hasDb()) {
    const { SALES_REPS } = await import('./mock-data/sales-reps')
    return SALES_REPS
  }
  const { db } = await import('./db')
  const rows = await db.salesRep.findMany({ orderBy: { rank: 'asc' } })
  // DB field is leadsCount; type expects leads
  return rows.map((r) => ({ ...toIso(r), leads: r.leadsCount }) as unknown as SalesRep)
}

export async function getSalesRepById(id: string): Promise<SalesRep | undefined> {
  if (!hasDb()) {
    const { getSalesRepById: mock } = await import('./mock-data/sales-reps')
    return mock(id)
  }
  const { db } = await import('./db')
  const row = await db.salesRep.findUnique({ where: { id } })
  return row ? ({ ...toIso(row), leads: row.leadsCount } as unknown as SalesRep) : undefined
}

// ─── All timeline events (for Customer 360 client-side filtering) ─────────────

export async function getAllTimelineEvents(): Promise<TimelineEvent[]> {
  if (!hasDb()) {
    const { TIMELINE_EVENTS } = await import('./mock-data/interactions')
    return TIMELINE_EVENTS
  }
  const { db } = await import('./db')
  const rows = await db.timelineEvent.findMany({ orderBy: { date: 'desc' } })
  return rows.map((r) => toIso(r) as unknown as TimelineEvent)
}

export async function getAllOpportunities(): Promise<Opportunity[]> {
  return getOpportunities()
}

export async function getAllContracts(): Promise<Contract[]> {
  if (!hasDb()) {
    const { CONTRACTS } = await import('./mock-data/contracts')
    return CONTRACTS
  }
  const { db } = await import('./db')
  const rows = await db.contract.findMany()
  return rows.map((r) => toIso(r) as unknown as Contract)
}

// ─── Opportunities ───────────────────────────────────────────────────────────

export async function getOpportunities(): Promise<Opportunity[]> {
  if (!hasDb()) {
    const { OPPORTUNITIES } = await import('./mock-data/opportunities')
    return OPPORTUNITIES
  }
  const { db } = await import('./db')
  const rows = await db.opportunity.findMany({ orderBy: { createdAt: 'desc' } })
  return rows.map((r) => toIso(r) as unknown as Opportunity)
}

export async function getOpportunitiesByCustomer(customerId: string): Promise<Opportunity[]> {
  if (!hasDb()) {
    const { getOpportunitiesByCustomer: mock } = await import('./mock-data/opportunities')
    return mock(customerId)
  }
  const { db } = await import('./db')
  const rows = await db.opportunity.findMany({
    where: { customerId },
    orderBy: { createdAt: 'desc' },
  })
  return rows.map((r) => toIso(r) as unknown as Opportunity)
}

// ─── Contracts ───────────────────────────────────────────────────────────────

export async function getContractsByCustomer(customerId: string): Promise<Contract[]> {
  if (!hasDb()) {
    const { getContractsByCustomer: mock } = await import('./mock-data/contracts')
    return mock(customerId)
  }
  const { db } = await import('./db')
  const rows = await db.contract.findMany({ where: { customerId } })
  return rows.map((r) => toIso(r) as unknown as Contract)
}

// ─── Requests ────────────────────────────────────────────────────────────────

export async function getRequestsByCustomer(customerId: string): Promise<Request[]> {
  if (!hasDb()) {
    const { getRequestsByCustomer: mock } = await import('./mock-data/requests')
    return mock(customerId)
  }
  const { db } = await import('./db')
  const rows = await db.request.findMany({
    where: { customerId },
    orderBy: { createdAt: 'desc' },
  })
  return rows.map((r) => toIso(r) as unknown as Request)
}

// ─── Interactions & Timeline ──────────────────────────────────────────────────

export async function getInteractionsByCustomer(customerId: string): Promise<Interaction[]> {
  if (!hasDb()) {
    const { getInteractionsByCustomer: mock } = await import('./mock-data/interactions')
    return mock(customerId)
  }
  const { db } = await import('./db')
  const rows = await db.interaction.findMany({
    where: { customerId },
    orderBy: { date: 'desc' },
  })
  return rows.map((r) => toIso(r) as unknown as Interaction)
}

export async function getTimelineByCustomer(customerId: string): Promise<TimelineEvent[]> {
  if (!hasDb()) {
    const { getTimelineByCustomer: mock } = await import('./mock-data/interactions')
    return mock(customerId)
  }
  const { db } = await import('./db')
  const rows = await db.timelineEvent.findMany({
    where: { customerId },
    orderBy: { date: 'desc' },
  })
  return rows.map((r) => toIso(r) as unknown as TimelineEvent)
}

// ─── Lead Scores ─────────────────────────────────────────────────────────────

export async function getLeadScores(): Promise<LeadScore[]> {
  if (!hasDb()) {
    const { LEAD_SCORES } = await import('./mock-data/lead-scores')
    return LEAD_SCORES
  }
  const { db } = await import('./db')
  const rows = await db.leadScore.findMany({ orderBy: { totalScore: 'desc' } })
  return rows.map((r) => toIso(r) as unknown as LeadScore)
}

export async function getLeadScore(leadId: string): Promise<LeadScore | undefined> {
  if (!hasDb()) {
    const { getLeadScore: mock } = await import('./mock-data/lead-scores')
    return mock(leadId)
  }
  const { db } = await import('./db')
  const row = await db.leadScore.findUnique({ where: { leadId } })
  return row ? (toIso(row) as unknown as LeadScore) : undefined
}

// ─── Campaigns ───────────────────────────────────────────────────────────────

export async function getCampaigns(): Promise<Campaign[]> {
  if (!hasDb()) {
    const { CAMPAIGNS } = await import('./mock-data/campaigns')
    return CAMPAIGNS
  }
  const { db } = await import('./db')
  const rows = await db.campaign.findMany({ orderBy: { createdAt: 'desc' } })
  return rows.map((r) => toIso(r) as unknown as Campaign)
}

export async function getCampaignById(id: string): Promise<Campaign | undefined> {
  if (!hasDb()) {
    const { getCampaignById: mock } = await import('./mock-data/campaigns')
    return mock(id)
  }
  const { db } = await import('./db')
  const row = await db.campaign.findUnique({ where: { id } })
  return row ? (toIso(row) as unknown as Campaign) : undefined
}

// ─── Journeys ────────────────────────────────────────────────────────────────

export async function getJourneys(): Promise<Journey[]> {
  if (!hasDb()) {
    const { JOURNEYS } = await import('./mock-data/journeys')
    return JOURNEYS
  }
  const { db } = await import('./db')
  const rows = await db.journey.findMany({ orderBy: { createdAt: 'desc' } })
  return rows.map((r) => toIso(r) as unknown as Journey)
}

export async function getJourneyById(id: string): Promise<Journey | undefined> {
  if (!hasDb()) {
    const { getJourneyById: mock } = await import('./mock-data/journeys')
    return mock(id)
  }
  const { db } = await import('./db')
  const row = await db.journey.findUnique({ where: { id } })
  return row ? (toIso(row) as unknown as Journey) : undefined
}

// ─── Tickets ─────────────────────────────────────────────────────────────────

export async function getTickets(): Promise<Ticket[]> {
  if (!hasDb()) {
    const { TICKETS } = await import('./mock-data/tickets')
    return TICKETS
  }
  const { db } = await import('./db')
  const rows = await db.ticket.findMany({ orderBy: { createdAt: 'desc' } })
  return rows.map((r) => toIso(r) as unknown as Ticket)
}

export async function getOpenTickets(): Promise<Ticket[]> {
  if (!hasDb()) {
    const { getOpenTickets: mock } = await import('./mock-data/tickets')
    return mock()
  }
  const { db } = await import('./db')
  const rows = await db.ticket.findMany({
    where: { status: { in: ['Open', 'InProgress'] as never[] } },
    orderBy: { slaDeadline: 'asc' },
  })
  return rows.map((r) => toIso(r) as unknown as Ticket)
}

export async function getTicketById(id: string): Promise<Ticket | undefined> {
  if (!hasDb()) {
    const { getTicketById: mock } = await import('./mock-data/tickets')
    return mock(id)
  }
  const { db } = await import('./db')
  const row = await db.ticket.findUnique({ where: { id } })
  return row ? (toIso(row) as unknown as Ticket) : undefined
}

// ─── Integrations ────────────────────────────────────────────────────────────

export async function getIntegrations(): Promise<Integration[]> {
  if (!hasDb()) {
    const { INTEGRATIONS } = await import('./mock-data/integrations')
    return INTEGRATIONS
  }
  const { db } = await import('./db')
  const rows = await db.integration.findMany({ orderBy: { nameEn: 'asc' } })
  return rows.map((r) => toIso(r) as unknown as Integration)
}

export async function getIntegrationById(id: string): Promise<Integration | undefined> {
  if (!hasDb()) {
    const { getIntegrationById: mock } = await import('./mock-data/integrations')
    return mock(id)
  }
  const { db } = await import('./db')
  const row = await db.integration.findUnique({ where: { id } })
  return row ? (toIso(row) as unknown as Integration) : undefined
}

// ─── Activities ──────────────────────────────────────────────────────────────

export async function getActivities(limit = 20): Promise<Activity[]> {
  if (!hasDb()) {
    const { ACTIVITIES } = await import('./mock-data/activities')
    return ACTIVITIES.slice(0, limit)
  }
  const { db } = await import('./db')
  const rows = await db.activity.findMany({
    orderBy: { date: 'desc' },
    take: limit,
  })
  return rows.map((r) => toIso(r) as unknown as Activity)
}

// ─── Analytics (always from mock — computed from aggregations in a real app) ──

export async function getKpiData(): Promise<KpiData> {
  const { KPI_DATA } = await import('./mock-data/analytics')
  return KPI_DATA
}

export async function getFunnelStages(): Promise<FunnelStage[]> {
  const { FUNNEL_STAGES } = await import('./mock-data/analytics')
  return FUNNEL_STAGES
}

export async function getChannelPerformance(): Promise<ChannelPerformance[]> {
  const { CHANNEL_PERFORMANCE } = await import('./mock-data/analytics')
  return CHANNEL_PERFORMANCE
}

export async function getRevenueTrend() {
  const { REVENUE_TREND } = await import('./mock-data/analytics')
  return REVENUE_TREND
}
