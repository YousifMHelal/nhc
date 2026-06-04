/**
 * Server-only data access layer.
 *
 * Runs in one of two modes, chosen at runtime by the presence of DATABASE_URL:
 *  - **Demo mode (no DATABASE_URL):** every query reads from the in-memory mock
 *    data in `./mock-data`, and mutations operate on those same arrays. The app
 *    runs as a fully self-contained, client-side demo with no backend — this is
 *    the default deployment mode (see the project design spec).
 *  - **Database mode (DATABASE_URL set):** queries hit PostgreSQL via Prisma.
 *
 * `./db` is only imported inside the DB branches, so demo mode never loads the
 * database client and never requires a connection string.
 */

import type {
  Lead,
  Customer,
  SalesRep,
  Opportunity,
  Contract,
  Request,
  Interaction,
  InteractionType,
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
  PipelineStage,
} from './types'

function hasDb() {
  return Boolean(process.env.DATABASE_URL)
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

// Prisma returns Date objects; our TS types use ISO strings.
function toIso(row: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(row).map(([k, v]) => [k, v instanceof Date ? v.toISOString() : v]),
  )
}

// Remove every element matching `pred` from `arr` in place (demo-mode deletes).
function removeWhere<T>(arr: T[], pred: (item: T) => boolean): void {
  for (let i = arr.length - 1; i >= 0; i--) {
    if (pred(arr[i])) arr.splice(i, 1)
  }
}

// Prisma enum InProgress ↔ TS display 'In Progress'
const TICKET_STATUS_FROM_DB: Record<string, string> = { InProgress: 'In Progress' }

function toTicket(row: Record<string, unknown>): Record<string, unknown> {
  const r = toIso(row)
  if (typeof r.status === 'string' && TICKET_STATUS_FROM_DB[r.status]) {
    r.status = TICKET_STATUS_FROM_DB[r.status]
  }
  return r
}

const STAGE_TO_DB: Record<string, string> = {
  'New': 'New', 'Contacted': 'Contacted', 'Qualified': 'Qualified',
  'Proposal': 'Proposal', 'Closed Won': 'ClosedWon', 'Closed Lost': 'ClosedLost',
}

const SOURCE_TO_DB: Record<string, string> = {
  'Web': 'Web', 'Social': 'Social', 'Referral': 'Referral',
  'Exhibition': 'Exhibition', 'Cold Call': 'ColdCall', 'Campaign': 'Campaign',
}

// Reverse maps: Prisma Client returns the enum identifier (e.g. 'ClosedWon'),
// but the UI works with the display form (e.g. 'Closed Won'). Convert on read.
const STAGE_FROM_DB: Record<string, string> = { ClosedWon: 'Closed Won', ClosedLost: 'Closed Lost' }
const SOURCE_FROM_DB: Record<string, string> = { ColdCall: 'Cold Call' }

function toLead(row: Record<string, unknown>): Lead {
  const r = toIso(row)
  if (typeof r.stage === 'string' && STAGE_FROM_DB[r.stage]) r.stage = STAGE_FROM_DB[r.stage]
  if (typeof r.source === 'string' && SOURCE_FROM_DB[r.source]) r.source = SOURCE_FROM_DB[r.source]
  return r as unknown as Lead
}

const INTEGRATION_TYPE_TO_DB: Record<string, string> = {
  'Real-time': 'RealTime', 'Batch': 'Batch', 'On-demand': 'OnDemand',
}

// ─── Leads ───────────────────────────────────────────────────────────────────

export async function getLeads(): Promise<Lead[]> {
  if (!hasDb()) {
    const { LEADS } = await import('./mock-data/leads')
    return LEADS
  }
  const { db } = await import('./db')
  const rows = await db.lead.findMany({ orderBy: { createdAt: 'desc' } })
  return rows.map(toLead)
}

export async function createLead(data: Omit<Lead, 'id' | 'createdAt'>): Promise<Lead> {
  if (!hasDb()) {
    const { LEADS } = await import('./mock-data/leads')
    const lead: Lead = { ...data, id: `lead-${Date.now()}`, createdAt: new Date().toISOString() }
    LEADS.unshift(lead)
    return lead
  }
  const { db } = await import('./db')
  const row = await db.lead.create({
    data: {
      nameAr: data.nameAr,
      phone: data.phone,
      email: data.email ?? null,
      source: (SOURCE_TO_DB[data.source] ?? data.source) as never,
      channel: data.channel as never,
      stage: (STAGE_TO_DB[data.stage] ?? data.stage) as never,
      aiScore: data.aiScore,
      salesRepId: data.salesRepId,
      propertyInterest: data.propertyInterest,
      city: data.city,
      budget: data.budget ?? null,
      notes: data.notes ?? null,
      lastContactDate: new Date(data.lastContactDate),
      customerId: data.customerId ?? null,
    },
  })
  return toLead(row)
}

export async function getLeadsByStage(stage: Lead['stage']): Promise<Lead[]> {
  if (!hasDb()) {
    const { getLeadsByStage: mock } = await import('./mock-data/leads')
    return mock(stage)
  }
  const { db } = await import('./db')
  const rows = await db.lead.findMany({
    where: { stage: (STAGE_TO_DB[stage] ?? stage) as never },
    orderBy: { createdAt: 'desc' },
  })
  return rows.map(toLead)
}

export async function getLeadById(id: string): Promise<Lead | undefined> {
  if (!hasDb()) {
    const { getLeadById: mock } = await import('./mock-data/leads')
    return mock(id)
  }
  const { db } = await import('./db')
  const row = await db.lead.findUnique({ where: { id } })
  return row ? toLead(row) : undefined
}

export async function deleteLead(id: string): Promise<void> {
  if (!hasDb()) {
    const { LEADS } = await import('./mock-data/leads')
    const { LEAD_SCORES } = await import('./mock-data/lead-scores')
    removeWhere(LEADS, (l) => l.id === id)
    removeWhere(LEAD_SCORES, (s) => s.leadId === id)
    return
  }
  const { db } = await import('./db')
  await db.$transaction([
    db.leadScore.deleteMany({ where: { leadId: id } }),
    db.lead.delete({ where: { id } }),
  ])
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

/**
 * Customers as shown in Customer 360. A pipeline lead is a "customer" the moment
 * it appears in the board, so we surface every lead here as a customer profile —
 * not only the few that reached "Closed Won". Real (converted) customer rows take
 * precedence; a lead already linked to a customer is dropped to avoid duplicates.
 */
export async function getCustomersWithLeads(): Promise<Customer[]> {
  if (!hasDb()) {
    const { CUSTOMERS } = await import('./mock-data/customers')
    const { LEADS } = await import('./mock-data/leads')
    const leadCustomers = LEADS.filter((l) => !l.customerId).map((l) => leadToCustomer(l))
    return [...CUSTOMERS, ...leadCustomers]
  }
  const { db } = await import('./db')
  const [customerRows, leadRows] = await Promise.all([
    db.customer.findMany({ orderBy: { createdAt: 'desc' } }),
    db.lead.findMany({ orderBy: { createdAt: 'desc' } }),
  ])
  const customers = customerRows.map((r) => toIso(r) as unknown as Customer)
  const leadCustomers = leadRows
    .filter((l) => !l.customerId)
    .map((l) => leadToCustomer(toLead(l)))
  return [...customers, ...leadCustomers]
}

export async function getCustomerById(id: string): Promise<Customer | undefined> {
  if (!hasDb()) {
    const { getCustomerById: mock } = await import('./mock-data/customers')
    const c = mock(id)
    if (c) return c
    // A Customer 360 id may belong to an unconverted pipeline lead.
    const { getLeadById } = await import('./mock-data/leads')
    const lead = getLeadById(id)
    return lead ? leadToCustomer(lead) : undefined
  }
  const { db } = await import('./db')
  const row = await db.customer.findUnique({ where: { id } })
  return row ? (toIso(row) as unknown as Customer) : undefined
}

export async function deleteCustomer(id: string): Promise<void> {
  if (!hasDb()) {
    const { CUSTOMERS } = await import('./mock-data/customers')
    const ci = CUSTOMERS.findIndex((c) => c.id === id)
    if (ci < 0) {
      // No customer row — it may be an unconverted pipeline lead.
      const { getLeadById } = await import('./mock-data/leads')
      if (getLeadById(id)) return deleteLead(id)
      throw new Error(`No customer or lead with id ${id}`)
    }
    const { TIMELINE_EVENTS, INTERACTIONS } = await import('./mock-data/interactions')
    const { OPPORTUNITIES } = await import('./mock-data/opportunities')
    const { CONTRACTS } = await import('./mock-data/contracts')
    const { REQUESTS } = await import('./mock-data/requests')
    const { LEADS } = await import('./mock-data/leads')
    removeWhere(TIMELINE_EVENTS, (e) => e.customerId === id)
    removeWhere(INTERACTIONS, (e) => e.customerId === id)
    removeWhere(REQUESTS, (e) => e.customerId === id)
    removeWhere(CONTRACTS, (e) => e.customerId === id)
    removeWhere(OPPORTUNITIES, (e) => e.customerId === id)
    LEADS.forEach((l) => { if (l.customerId === id) l.customerId = undefined })
    CUSTOMERS.splice(ci, 1)
    return
  }
  const { db } = await import('./db')
  // A Customer 360 id may belong to a pipeline lead that was never converted
  // (no customer row exists). In that case delete the underlying lead instead.
  const customer = await db.customer.findUnique({ where: { id }, select: { id: true } })
  if (!customer) {
    const lead = await db.lead.findUnique({ where: { id }, select: { id: true } })
    if (lead) return deleteLead(id)
    throw new Error(`No customer or lead with id ${id}`)
  }
  // Dependent rows reference the customer with required FKs, so they must be
  // removed first. Leads keep their row but lose the customer link.
  await db.$transaction([
    db.timelineEvent.deleteMany({ where: { customerId: id } }),
    db.interaction.deleteMany({ where: { customerId: id } }),
    db.request.deleteMany({ where: { customerId: id } }),
    db.contract.deleteMany({ where: { customerId: id } }),
    db.opportunity.deleteMany({ where: { customerId: id } }),
    db.activity.updateMany({ where: { customerId: id }, data: { customerId: null } }),
    db.lead.updateMany({ where: { customerId: id }, data: { customerId: null } }),
    db.customer.delete({ where: { id } }),
  ])
}

// Derive a customer segment from the lead's AI score.
function segmentFromScore(aiScore: number): string {
  if (aiScore >= 85) return 'VIP'
  if (aiScore >= 60) return 'Standard'
  return 'New'
}

// Project a lead onto the Customer shape for the Customer 360 view. Customer
// requires nic/email/nationality, which leads may lack — we synthesize the same
// placeholders convertLeadToCustomer() persists, so a lead and its eventual
// converted customer stay recognizable.
function leadToCustomer(lead: Lead): Customer {
  return {
    id: lead.id,
    nameAr: lead.nameAr,
    nic: `LEAD-${lead.id}`,
    phone: lead.phone,
    email: lead.email ?? `${lead.id}@lead.nhc.sa`,
    segment: segmentFromScore(lead.aiScore) as Customer['segment'],
    city: lead.city,
    propertyInterest: lead.propertyInterest,
    aiScore: lead.aiScore,
    salesRepId: lead.salesRepId,
    createdAt: lead.createdAt,
    nationality: 'غير محدد',
  }
}

/**
 * Convert a won lead into a customer (real-CRM behaviour).
 * Idempotent: if the lead is already linked to a customer, that customer is
 * returned unchanged. Customer requires nic/email/nationality, which leads may
 * lack — we synthesize unique placeholders so the record is valid.
 */
export async function convertLeadToCustomer(leadId: string): Promise<Customer> {
  if (!hasDb()) {
    const { LEADS } = await import('./mock-data/leads')
    const { CUSTOMERS } = await import('./mock-data/customers')
    const lead = LEADS.find((l) => l.id === leadId)
    if (!lead) throw new Error(`Lead ${leadId} not found`)
    if (lead.customerId) {
      const existing = CUSTOMERS.find((c) => c.id === lead.customerId)
      if (existing) return existing
    }
    const customer: Customer = { ...leadToCustomer(lead), id: `cust-${Date.now()}` }
    CUSTOMERS.unshift(customer)
    lead.customerId = customer.id
    return customer
  }
  const { db } = await import('./db')
  const lead = await db.lead.findUnique({ where: { id: leadId } })
  if (!lead) throw new Error(`Lead ${leadId} not found`)

  // Already converted — return the existing customer.
  if (lead.customerId) {
    const existing = await db.customer.findUnique({ where: { id: lead.customerId } })
    if (existing) return toIso(existing) as unknown as Customer
  }

  const customer = await db.$transaction(async (tx) => {
    const created = await tx.customer.create({
      data: {
        nameAr: lead.nameAr,
        nic: `LEAD-${lead.id}`,
        phone: lead.phone,
        email: lead.email ?? `${lead.id}@lead.nhc.sa`,
        segment: segmentFromScore(lead.aiScore) as never,
        city: lead.city,
        propertyInterest: lead.propertyInterest,
        aiScore: lead.aiScore,
        salesRepId: lead.salesRepId ?? '',
        nationality: 'غير محدد',
      },
    })
    await tx.lead.update({ where: { id: lead.id }, data: { customerId: created.id } })
    return created
  })

  return toIso(customer) as unknown as Customer
}

// Map the InteractionType display value to the Prisma enum identifier.
const INTERACTION_TYPE_TO_DB: Record<string, string> = { 'Site Visit': 'SiteVisit' }

// Arabic timeline title per interaction type.
const INTERACTION_LABEL_AR: Record<string, string> = {
  Call: 'مكالمة هاتفية', Message: 'رسالة', Email: 'بريد إلكتروني', Meeting: 'اجتماع',
  'Site Visit': 'زيارة موقع', Document: 'مستند', System: 'حدث نظام',
}

/**
 * Resolve a Customer 360 id to a real Customer row id. A Customer 360 entry may
 * be an unconverted pipeline lead (no customer row yet); dependent records
 * (interactions, opportunities) require a Customer FK, so we convert on demand.
 */
export async function ensureCustomerId(id: string): Promise<string> {
  if (!hasDb()) {
    const { CUSTOMERS } = await import('./mock-data/customers')
    if (CUSTOMERS.some((c) => c.id === id)) return id
    const { LEADS } = await import('./mock-data/leads')
    const lead = LEADS.find((l) => l.id === id)
    if (!lead) throw new Error(`No customer or lead with id ${id}`)
    if (lead.customerId) return lead.customerId
    return (await convertLeadToCustomer(id)).id
  }
  const { db } = await import('./db')
  const customer = await db.customer.findUnique({ where: { id }, select: { id: true } })
  if (customer) return customer.id
  const lead = await db.lead.findUnique({ where: { id }, select: { id: true, customerId: true } })
  if (!lead) throw new Error(`No customer or lead with id ${id}`)
  if (lead.customerId) return lead.customerId
  const created = await convertLeadToCustomer(id)
  return created.id
}

/**
 * Persist a logged interaction: writes both the Interaction row and a matching
 * TimelineEvent so it surfaces in the customer timeline. Returns the timeline
 * event plus the resolved customerId (which differs from `rawCustomerId` when a
 * lead was just converted).
 */
export async function createCustomerInteraction(
  rawCustomerId: string,
  data: { type: InteractionType; channel: string; note: string; salesRepId?: string },
): Promise<{ event: TimelineEvent; customerId: string }> {
  if (!hasDb()) {
    const customerId = await ensureCustomerId(rawCustomerId)
    const { INTERACTIONS, TIMELINE_EVENTS } = await import('./mock-data/interactions')
    const date = new Date().toISOString()
    const interaction: Interaction = {
      id: `int-${Date.now()}`,
      customerId,
      type: data.type,
      channel: data.channel as Interaction['channel'],
      date,
      note: data.note,
      salesRepId: data.salesRepId,
    }
    INTERACTIONS.unshift(interaction)
    const event: TimelineEvent = {
      id: `tl-${Date.now()}`,
      customerId,
      entityType: 'Interaction',
      entityId: interaction.id,
      titleAr: INTERACTION_LABEL_AR[data.type] ?? 'تفاعل جديد',
      descriptionAr: data.note || 'تم تسجيل التفاعل',
      date,
      type: data.type,
      channel: data.channel as TimelineEvent['channel'],
    }
    TIMELINE_EVENTS.unshift(event)
    return { event, customerId }
  }
  const { db } = await import('./db')
  const customerId = await ensureCustomerId(rawCustomerId)
  const date = new Date()
  const interaction = await db.interaction.create({
    data: {
      customerId,
      type: (INTERACTION_TYPE_TO_DB[data.type] ?? data.type) as never,
      channel: data.channel,
      date,
      note: data.note,
      salesRepId: data.salesRepId ?? null,
    },
  })
  const event = await db.timelineEvent.create({
    data: {
      customerId,
      entityType: 'Interaction',
      entityId: interaction.id,
      titleAr: INTERACTION_LABEL_AR[data.type] ?? 'تفاعل جديد',
      descriptionAr: data.note || 'تم تسجيل التفاعل',
      date,
      type: data.type,
      channel: data.channel,
    },
  })
  return { event: toIso(event) as unknown as TimelineEvent, customerId }
}

/**
 * Persist a new opportunity for a customer (converting a lead first if needed),
 * and record a matching timeline event. Returns the created opportunity, the
 * timeline event, and the resolved customerId.
 */
export async function createCustomerOpportunity(
  rawCustomerId: string,
  data: {
    titleAr: string
    project?: string
    unitType: string
    valueRiyal?: number
    stage?: string
    probability?: number
    salesRepId?: string
  },
): Promise<{ opportunity: Opportunity; event: TimelineEvent; customerId: string }> {
  if (!hasDb()) {
    const customerId = await ensureCustomerId(rawCustomerId)
    const { CUSTOMERS } = await import('./mock-data/customers')
    const { OPPORTUNITIES } = await import('./mock-data/opportunities')
    const { TIMELINE_EVENTS } = await import('./mock-data/interactions')
    const customer = CUSTOMERS.find((c) => c.id === customerId)
    const salesRepId = data.salesRepId ?? customer?.salesRepId ?? ''
    const opportunity: Opportunity = {
      id: `opp-${Date.now()}`,
      customerId,
      titleAr: data.titleAr,
      project: data.project ?? 'غير محدد',
      unitType: data.unitType,
      valueRiyal: data.valueRiyal ?? 1_500_000,
      stage: (data.stage ?? 'تحديد الاهتمام') as Opportunity['stage'],
      probability: data.probability ?? 20,
      expectedCloseDate: new Date(Date.now() + 30 * 86_400_000).toISOString(),
      salesRepId,
      createdAt: new Date().toISOString(),
    }
    OPPORTUNITIES.unshift(opportunity)
    const event: TimelineEvent = {
      id: `tl-${Date.now()}-opp`,
      customerId,
      entityType: 'Opportunity',
      entityId: opportunity.id,
      titleAr: `فرصة جديدة: ${data.titleAr}`,
      descriptionAr: `${data.project ?? 'غير محدد'} · ${data.unitType}`,
      date: new Date().toISOString(),
      type: 'opportunity',
    }
    TIMELINE_EVENTS.unshift(event)
    return { opportunity, event, customerId }
  }
  const { db } = await import('./db')
  const customerId = await ensureCustomerId(rawCustomerId)
  const customer = await db.customer.findUnique({ where: { id: customerId }, select: { salesRepId: true } })
  const salesRepId = data.salesRepId ?? customer?.salesRepId ?? null
  const stage = data.stage ?? 'تحديد الاهتمام'
  const opportunity = await db.opportunity.create({
    data: {
      customerId,
      titleAr: data.titleAr,
      project: data.project ?? 'غير محدد',
      unitType: data.unitType,
      valueRiyal: data.valueRiyal ?? 1_500_000,
      stage,
      probability: data.probability ?? 20,
      expectedCloseDate: new Date(Date.now() + 30 * 86_400_000),
      salesRepId,
    },
  })
  const event = await db.timelineEvent.create({
    data: {
      customerId,
      entityType: 'Opportunity',
      entityId: opportunity.id,
      titleAr: `فرصة جديدة: ${data.titleAr}`,
      descriptionAr: `${data.project ?? 'غير محدد'} · ${data.unitType}`,
      date: new Date(),
      type: 'opportunity',
    },
  })
  return {
    opportunity: toIso(opportunity) as unknown as Opportunity,
    event: toIso(event) as unknown as TimelineEvent,
    customerId,
  }
}

/**
 * Assign a sales rep to a Customer 360 entry, writing through to BOTH sides of a
 * lead↔customer pair so the pipeline and Customer 360 always agree on the rep.
 * - A customer id also updates every linked pipeline lead.
 * - A lead id also updates the customer it was converted into (if any).
 */
export async function assignSalesRep(rawCustomerId: string, salesRepId: string): Promise<void> {
  if (!hasDb()) {
    const { CUSTOMERS } = await import('./mock-data/customers')
    const { LEADS } = await import('./mock-data/leads')
    const customer = CUSTOMERS.find((c) => c.id === rawCustomerId)
    if (customer) {
      customer.salesRepId = salesRepId
      LEADS.forEach((l) => { if (l.customerId === rawCustomerId) l.salesRepId = salesRepId })
      return
    }
    const lead = LEADS.find((l) => l.id === rawCustomerId)
    if (lead) {
      lead.salesRepId = salesRepId
      if (lead.customerId) {
        const linked = CUSTOMERS.find((c) => c.id === lead.customerId)
        if (linked) linked.salesRepId = salesRepId
      }
      return
    }
    throw new Error(`No customer or lead with id ${rawCustomerId}`)
  }
  const { db } = await import('./db')
  const customer = await db.customer.findUnique({ where: { id: rawCustomerId }, select: { id: true } })
  if (customer) {
    await db.$transaction([
      db.customer.update({ where: { id: rawCustomerId }, data: { salesRepId } }),
      db.lead.updateMany({ where: { customerId: rawCustomerId }, data: { salesRepId } }),
    ])
    return
  }
  const lead = await db.lead.findUnique({ where: { id: rawCustomerId }, select: { id: true, customerId: true } })
  if (lead) {
    await db.$transaction([
      db.lead.update({ where: { id: rawCustomerId }, data: { salesRepId } }),
      ...(lead.customerId
        ? [db.customer.update({ where: { id: lead.customerId }, data: { salesRepId } })]
        : []),
    ])
    return
  }
  throw new Error(`No customer or lead with id ${rawCustomerId}`)
}

// ─── Sales Reps ──────────────────────────────────────────────────────────────

export async function getSalesReps(): Promise<SalesRep[]> {
  if (!hasDb()) {
    const { SALES_REPS } = await import('./mock-data/sales-reps')
    return SALES_REPS
  }
  const { db } = await import('./db')
  const rows = await db.salesRep.findMany({ orderBy: { rank: 'asc' } })
  return rows.map((r) => ({ ...toIso(r), leads: r.leadsCount }) as unknown as SalesRep)
}

export async function createSalesRep(data: { nameAr: string; email?: string; phone?: string; region?: string }): Promise<SalesRep> {
  const initials = data.nameAr.trim().split(/\s+/).map((w) => w[0]).join('').slice(0, 2)
  if (!hasDb()) {
    const { SALES_REPS } = await import('./mock-data/sales-reps')
    const id = `rep-${Date.now()}`
    const rep: SalesRep = {
      id,
      nameAr: data.nameAr.trim(),
      email: data.email?.trim() || `${id}@nhc.sa`,
      phone: data.phone?.trim() || '',
      avatarInitials: initials,
      leads: 0,
      conversions: 0,
      revenue: 0,
      rank: SALES_REPS.length + 1,
      region: data.region?.trim() || '',
    }
    SALES_REPS.push(rep)
    return rep
  }
  const { db } = await import('./db')
  const count = await db.salesRep.count()
  const row = await db.salesRep.create({
    data: {
      nameAr: data.nameAr.trim(),
      email: data.email?.trim() || `rep-${Date.now()}@nhc.sa`,
      phone: data.phone?.trim() || '',
      avatarInitials: initials,
      region: data.region?.trim() || '',
      rank: count + 1,
    },
  })
  return { ...toIso(row), leads: row.leadsCount } as unknown as SalesRep
}

export async function deleteSalesRep(id: string): Promise<void> {
  if (!hasDb()) {
    const { SALES_REPS } = await import('./mock-data/sales-reps')
    const { LEADS } = await import('./mock-data/leads')
    const { OPPORTUNITIES } = await import('./mock-data/opportunities')
    const { INTERACTIONS } = await import('./mock-data/interactions')
    LEADS.forEach((l) => { if (l.salesRepId === id) l.salesRepId = '' })
    OPPORTUNITIES.forEach((o) => { if (o.salesRepId === id) o.salesRepId = '' })
    INTERACTIONS.forEach((it) => { if (it.salesRepId === id) it.salesRepId = undefined })
    removeWhere(SALES_REPS, (r) => r.id === id)
    return
  }
  const { db } = await import('./db')
  await db.$transaction([
    db.lead.updateMany({ where: { salesRepId: id }, data: { salesRepId: null } }),
    db.opportunity.updateMany({ where: { salesRepId: id }, data: { salesRepId: null } }),
    db.interaction.updateMany({ where: { salesRepId: id }, data: { salesRepId: null } }),
    db.activity.updateMany({ where: { salesRepId: id }, data: { salesRepId: null } }),
    db.salesRep.delete({ where: { id } }),
  ])
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

// ─── Timeline Events ──────────────────────────────────────────────────────────

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

/**
 * Live lead scoring. Scores are computed on demand from each lead's current
 * attributes and real interaction history via the trained model, never read
 * from a static snapshot — so every lead (including ones created at runtime)
 * always has an up-to-date score and breakdown. The lead's last persisted
 * `aiScore` is used as the baseline to derive the trend.
 */
export async function getLeadScores(): Promise<LeadScore[]> {
  if (!hasDb()) {
    const { LEADS } = await import('./mock-data/leads')
    const { INTERACTIONS } = await import('./mock-data/interactions')
    const { leadScoreDetail } = await import('./ai/leadScore')
    const counts = new Map<string, number>()
    for (const it of INTERACTIONS) counts.set(it.customerId, (counts.get(it.customerId) ?? 0) + 1)
    return LEADS
      .map((lead) => {
        const count = lead.customerId ? counts.get(lead.customerId) ?? 0 : 0
        return leadScoreDetail(lead, count, lead.aiScore)
      })
      .sort((a, b) => b.totalScore - a.totalScore)
  }
  const { db } = await import('./db')
  const { leadScoreDetail } = await import('./ai/leadScore')

  const [leadRows, interactionRows] = await Promise.all([
    db.lead.findMany({ orderBy: { createdAt: 'desc' } }),
    db.interaction.findMany({ select: { customerId: true } }),
  ])

  // interactions logged per customer → interaction count for any linked lead
  const interactionCounts = new Map<string, number>()
  for (const { customerId } of interactionRows) {
    interactionCounts.set(customerId, (interactionCounts.get(customerId) ?? 0) + 1)
  }

  return leadRows
    .map((row) => {
      const lead = toLead(row)
      const count = lead.customerId ? interactionCounts.get(lead.customerId) ?? 0 : 0
      return leadScoreDetail(lead, count, lead.aiScore)
    })
    .sort((a, b) => b.totalScore - a.totalScore)
}

export async function getLeadScore(leadId: string): Promise<LeadScore | undefined> {
  if (!hasDb()) {
    const { getLeadById } = await import('./mock-data/leads')
    const { INTERACTIONS } = await import('./mock-data/interactions')
    const { leadScoreDetail } = await import('./ai/leadScore')
    const lead = getLeadById(leadId)
    if (!lead) return undefined
    const count = lead.customerId
      ? INTERACTIONS.filter((it) => it.customerId === lead.customerId).length
      : 0
    return leadScoreDetail(lead, count, lead.aiScore)
  }
  const { db } = await import('./db')
  const { leadScoreDetail } = await import('./ai/leadScore')

  const row = await db.lead.findUnique({ where: { id: leadId } })
  if (!row) return undefined

  const lead = toLead(row)
  const count = lead.customerId
    ? await db.interaction.count({ where: { customerId: lead.customerId } })
    : 0
  return leadScoreDetail(lead, count, lead.aiScore)
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
  return rows.map((r) => toTicket(r) as unknown as Ticket)
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
  return rows.map((r) => toTicket(r) as unknown as Ticket)
}

export async function getTicketById(id: string): Promise<Ticket | undefined> {
  if (!hasDb()) {
    const { getTicketById: mock } = await import('./mock-data/tickets')
    return mock(id)
  }
  const { db } = await import('./db')
  const row = await db.ticket.findUnique({ where: { id } })
  return row ? (toTicket(row) as unknown as Ticket) : undefined
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

// ─── Analytics ────────────────────────────────────────────────────────────────
// In demo mode these return the curated mock aggregates; with a database they
// are computed live from the underlying rows.

const OPP_CLOSED_STAGE = 'مغلقة'

function monthBounds(offset = 0): { start: Date; end: Date } {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth() + offset, 1)
  const end = new Date(now.getFullYear(), now.getMonth() + offset + 1, 1)
  return { start, end }
}

function growthPct(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0
  return Math.round(((current - previous) / previous) * 100)
}

export async function getKpiData(): Promise<KpiData> {
  if (!hasDb()) {
    const { KPI_DATA } = await import('./mock-data/analytics')
    return KPI_DATA
  }
  const { db } = await import('./db')
  const thisMonth = monthBounds(0)
  const lastMonth = monthBounds(-1)

  const [
    totalLeads,
    leadsThisMonth,
    leadsLastMonth,
    wonLeads,
    openOpps,
    contractsThisMonth,
    contractsLastMonth,
    campaigns,
  ] = await Promise.all([
    db.lead.count(),
    db.lead.count({ where: { createdAt: { gte: thisMonth.start, lt: thisMonth.end } } }),
    db.lead.count({ where: { createdAt: { gte: lastMonth.start, lt: lastMonth.end } } }),
    db.lead.count({ where: { stage: 'ClosedWon' as never } }),
    db.opportunity.findMany({ where: { stage: { not: OPP_CLOSED_STAGE } } }),
    db.contract.findMany({ where: { signedDate: { gte: thisMonth.start, lt: thisMonth.end } } }),
    db.contract.findMany({ where: { signedDate: { gte: lastMonth.start, lt: lastMonth.end } } }),
    db.campaign.findMany(),
  ])

  const conversionRate = totalLeads > 0 ? Math.round((wonLeads / totalLeads) * 100) : 0
  const openOpportunitiesValue = openOpps.reduce((s, o) => s + o.valueRiyal, 0)
  const revenueThisMonth = contractsThisMonth.reduce((s, c) => s + c.valueRiyal, 0)
  const revenueLastMonth = contractsLastMonth.reduce((s, c) => s + c.valueRiyal, 0)

  const rates = campaigns
    .map((c) => {
      const m = c.metrics as { sent?: number; converted?: number } | null
      if (!m || !m.sent) return null
      return ((m.converted ?? 0) / m.sent) * 100
    })
    .filter((r): r is number => r !== null)
  const campaignPerformance = rates.length
    ? Math.round(rates.reduce((s, r) => s + r, 0) / rates.length)
    : 0

  return {
    totalLeads,
    totalLeadsGrowth: growthPct(leadsThisMonth, leadsLastMonth),
    conversionRate,
    conversionRateGrowth: 0,
    openOpportunities: openOpps.length,
    openOpportunitiesValue,
    campaignPerformance,
    campaignPerformanceGrowth: 0,
    revenueThisMonth,
    revenueGrowth: growthPct(revenueThisMonth, revenueLastMonth),
  }
}

const FUNNEL_STAGE_META: { stage: PipelineStage; nameAr: string; color: string }[] = [
  { stage: 'New', nameAr: 'جديد', color: 'var(--color-brand-accent)' },
  { stage: 'Contacted', nameAr: 'تم التواصل', color: 'var(--color-success)' },
  { stage: 'Qualified', nameAr: 'مؤهَّل', color: 'var(--color-brand)' },
  { stage: 'Proposal', nameAr: 'عرض سعر', color: 'var(--color-warning)' },
  { stage: 'Closed Won', nameAr: 'مغلق - ربح', color: 'var(--color-brand-dark)' },
]

export async function getFunnelStages(): Promise<FunnelStage[]> {
  if (!hasDb()) {
    const { FUNNEL_STAGES } = await import('./mock-data/analytics')
    return FUNNEL_STAGES
  }
  const { db } = await import('./db')
  const [grouped, openOppValue, wonContractValue] = await Promise.all([
    db.lead.groupBy({ by: ['stage'], _count: { _all: true } }),
    db.opportunity.aggregate({ where: { stage: { not: OPP_CLOSED_STAGE } }, _sum: { valueRiyal: true } }),
    db.contract.aggregate({ _sum: { valueRiyal: true } }),
  ])

  const countByStage = new Map<string, number>()
  for (const g of grouped) countByStage.set(g.stage as unknown as string, g._count._all)

  const topCount = countByStage.get('New') ?? 0
  return FUNNEL_STAGE_META.map((meta) => {
    const dbStage = STAGE_TO_DB[meta.stage]
    const count = countByStage.get(dbStage) ?? 0
    let value = 0
    if (meta.stage === 'Proposal') value = openOppValue._sum.valueRiyal ?? 0
    else if (meta.stage === 'Closed Won') value = wonContractValue._sum.valueRiyal ?? 0
    return {
      stage: meta.stage,
      nameAr: meta.nameAr,
      count,
      value,
      conversionRate: topCount > 0 ? Math.round((count / topCount) * 1000) / 10 : 0,
      color: meta.color,
    }
  })
}

export async function getChannelPerformance(): Promise<ChannelPerformance[]> {
  if (!hasDb()) {
    const { CHANNEL_PERFORMANCE } = await import('./mock-data/analytics')
    return CHANNEL_PERFORMANCE
  }
  const { db } = await import('./db')
  const leads = await db.lead.findMany({
    select: { channel: true, source: true, stage: true, customerId: true },
  })
  if (leads.length === 0) return []

  const contracts = await db.contract.groupBy({ by: ['customerId'], _sum: { valueRiyal: true } })
  const revenueByCustomer = new Map<string, number>()
  for (const c of contracts) revenueByCustomer.set(c.customerId, c._sum.valueRiyal ?? 0)

  type Bucket = { leads: number; conversions: number; revenue: number }
  const buckets = new Map<string, Bucket>()
  const bump = (key: string): Bucket => {
    let b = buckets.get(key)
    if (!b) { b = { leads: 0, conversions: 0, revenue: 0 }; buckets.set(key, b) }
    return b
  }

  for (const l of leads) {
    const key = (l.source as unknown as string) === 'Referral' ? 'Referral' : (l.channel as unknown as string)
    const b = bump(key)
    b.leads += 1
    if ((l.stage as unknown as string) === 'ClosedWon') {
      b.conversions += 1
      if (l.customerId) b.revenue += revenueByCustomer.get(l.customerId) ?? 0
    }
  }

  return Array.from(buckets.entries())
    .map(([channel, b]) => ({
      channel: channel as ChannelPerformance['channel'],
      leads: b.leads,
      conversions: b.conversions,
      conversionRate: b.leads > 0 ? Math.round((b.conversions / b.leads) * 1000) / 10 : 0,
      revenue: b.revenue,
    }))
    .sort((a, b) => b.leads - a.leads)
}

const ARABIC_MONTHS = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر']

export async function getRevenueTrend() {
  if (!hasDb()) {
    const { REVENUE_TREND } = await import('./mock-data/analytics')
    return REVENUE_TREND
  }
  const { db } = await import('./db')
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth() - 11, 1)

  const [contracts, leads] = await Promise.all([
    db.contract.findMany({
      where: { signedDate: { gte: start } },
      select: { signedDate: true, valueRiyal: true },
    }),
    db.lead.findMany({
      where: { createdAt: { gte: start } },
      select: { createdAt: true },
    }),
  ])

  const months = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1)
    return { key: `${d.getFullYear()}-${d.getMonth()}`, monthAr: ARABIC_MONTHS[d.getMonth()], revenue: 0, leads: 0 }
  })
  const byKey = new Map(months.map((m) => [m.key, m]))

  for (const c of contracts) {
    if (!c.signedDate) continue
    const m = byKey.get(`${c.signedDate.getFullYear()}-${c.signedDate.getMonth()}`)
    if (m) m.revenue += c.valueRiyal
  }
  for (const l of leads) {
    const m = byKey.get(`${l.createdAt.getFullYear()}-${l.createdAt.getMonth()}`)
    if (m) m.leads += 1
  }

  return months.map(({ monthAr, revenue, leads }) => ({ monthAr, revenue, leads }))
}

// ─── Journey Mutations ───────────────────────────────────────────────────────

export async function createJourney(data: Omit<Journey, 'id' | 'createdAt'>): Promise<Journey> {
  if (!hasDb()) {
    const { JOURNEYS } = await import('./mock-data/journeys')
    const journey: Journey = { ...data, id: `jrn-${Date.now()}`, createdAt: new Date().toISOString() }
    JOURNEYS.unshift(journey)
    return journey
  }
  const { db } = await import('./db')
  const row = await db.journey.create({
    data: {
      nameAr: data.nameAr,
      descriptionAr: data.descriptionAr ?? '',
      status: data.status as never,
      nodes: data.nodes as never,
      edges: data.edges as never,
      trigger: data.trigger,
      enrolledCount: data.enrolledCount,
      completedCount: data.completedCount,
    },
  })
  return toIso(row) as unknown as Journey
}

export async function updateJourney(id: string, data: Partial<Omit<Journey, 'id' | 'createdAt'>>): Promise<Journey> {
  if (!hasDb()) {
    const { JOURNEYS } = await import('./mock-data/journeys')
    const journey = JOURNEYS.find((j) => j.id === id)
    if (!journey) throw new Error(`Journey ${id} not found`)
    Object.assign(journey, data)
    return journey
  }
  const { db } = await import('./db')
  const row = await db.journey.update({
    where: { id },
    data: {
      ...(data.nameAr !== undefined && { nameAr: data.nameAr }),
      ...(data.descriptionAr !== undefined && { descriptionAr: data.descriptionAr }),
      ...(data.status !== undefined && { status: data.status as never }),
      ...(data.nodes !== undefined && { nodes: data.nodes as never }),
      ...(data.edges !== undefined && { edges: data.edges as never }),
      ...(data.trigger !== undefined && { trigger: data.trigger }),
    },
  })
  return toIso(row) as unknown as Journey
}

export async function deleteJourney(id: string): Promise<void> {
  if (!hasDb()) {
    const { JOURNEYS } = await import('./mock-data/journeys')
    removeWhere(JOURNEYS, (j) => j.id === id)
    return
  }
  const { db } = await import('./db')
  await db.journey.delete({ where: { id } })
}

// ─── Campaign Mutations ──────────────────────────────────────────────────────

export async function createCampaign(data: Omit<Campaign, 'id' | 'createdAt'>): Promise<Campaign> {
  if (!hasDb()) {
    const { CAMPAIGNS } = await import('./mock-data/campaigns')
    const campaign: Campaign = { ...data, id: `cmp-${Date.now()}`, createdAt: new Date().toISOString() }
    CAMPAIGNS.unshift(campaign)
    return campaign
  }
  const { db } = await import('./db')
  const row = await db.campaign.create({
    data: {
      nameAr: data.nameAr,
      type: data.type,
      descriptionAr: data.descriptionAr,
      channels: data.channels as never,
      audience: data.audience as never,
      messageTemplate: data.messageTemplate as never,
      schedule: data.schedule as never,
      status: data.status as never,
      metrics: data.metrics as never,
      createdBy: data.createdBy,
    },
  })
  return toIso(row) as unknown as Campaign
}

export async function updateCampaign(id: string, data: Partial<Omit<Campaign, 'id' | 'createdAt'>>): Promise<Campaign> {
  if (!hasDb()) {
    const { CAMPAIGNS } = await import('./mock-data/campaigns')
    const campaign = CAMPAIGNS.find((c) => c.id === id)
    if (!campaign) throw new Error(`Campaign ${id} not found`)
    Object.assign(campaign, data)
    return campaign
  }
  const { db } = await import('./db')
  const row = await db.campaign.update({
    where: { id },
    data: {
      ...(data.nameAr !== undefined && { nameAr: data.nameAr }),
      ...(data.status !== undefined && { status: data.status as never }),
      ...(data.metrics !== undefined && { metrics: data.metrics as never }),
    },
  })
  return toIso(row) as unknown as Campaign
}

// ─── Ticket Mutations ────────────────────────────────────────────────────────

export async function createTicket(data: Omit<Ticket, 'id' | 'createdAt'>): Promise<Ticket> {
  if (!hasDb()) {
    const { TICKETS } = await import('./mock-data/tickets')
    const ticket: Ticket = { ...data, id: `TKT-${Date.now()}`, createdAt: new Date().toISOString() }
    TICKETS.unshift(ticket)
    return ticket
  }
  const { db } = await import('./db')
  const row = await db.ticket.create({
    data: {
      titleAr: data.titleAr,
      descriptionAr: data.descriptionAr,
      severity: data.severity as never,
      status: data.status.replace(' ', '') as never,
      level: data.level as never,
      assignedTo: data.assignedTo,
      customerId: data.customerId ?? null,
      slaDeadline: new Date(data.slaDeadline),
      slaHours: data.slaHours,
      steps: data.steps as never,
      rcaLink: data.rcaLink ?? null,
      escalationHistory: data.escalationHistory as never,
      comments: data.comments as never,
    },
  })
  return toTicket(row) as unknown as Ticket
}

export async function updateTicket(id: string, data: Partial<Pick<Ticket, 'status' | 'assignedTo' | 'steps' | 'comments' | 'escalationHistory' | 'resolvedAt'>>): Promise<Ticket> {
  if (!hasDb()) {
    const { TICKETS } = await import('./mock-data/tickets')
    const ticket = TICKETS.find((t) => t.id === id)
    if (!ticket) throw new Error(`Ticket ${id} not found`)
    Object.assign(ticket, data)
    return ticket
  }
  const { db } = await import('./db')
  const row = await db.ticket.update({
    where: { id },
    data: {
      ...(data.status !== undefined && { status: data.status.replace(' ', '') as never }),
      ...(data.assignedTo !== undefined && { assignedTo: data.assignedTo }),
      ...(data.steps !== undefined && { steps: data.steps as never }),
      ...(data.comments !== undefined && { comments: data.comments as never }),
      ...(data.escalationHistory !== undefined && { escalationHistory: data.escalationHistory as never }),
      ...(data.resolvedAt !== undefined && { resolvedAt: data.resolvedAt ? new Date(data.resolvedAt) : null }),
    },
  })
  return toTicket(row) as unknown as Ticket
}

export async function deleteTicket(id: string): Promise<void> {
  if (!hasDb()) {
    const { TICKETS } = await import('./mock-data/tickets')
    removeWhere(TICKETS, (t) => t.id === id)
    return
  }
  const { db } = await import('./db')
  await db.ticket.delete({ where: { id } })
}

// ─── Integration Mutations ───────────────────────────────────────────────────

export async function createIntegration(data: {
  nameAr: string
  nameEn: string
  category: string
  type: Integration['type']
  status: Integration['status']
  description?: string
  endpoint?: string
}): Promise<Integration> {
  if (!hasDb()) {
    const { INTEGRATIONS } = await import('./mock-data/integrations')
    const integration: Integration = {
      id: `int-${Date.now()}`,
      nameAr: data.nameAr,
      nameEn: data.nameEn,
      category: data.category,
      type: data.type,
      status: data.status,
      lastSync: new Date().toISOString(),
      recordCount: 0,
      auditLog: [],
      description: data.description,
      endpoint: data.endpoint,
    }
    INTEGRATIONS.unshift(integration)
    return integration
  }
  const { db } = await import('./db')
  const row = await db.integration.create({
    data: {
      nameAr: data.nameAr,
      nameEn: data.nameEn,
      category: data.category,
      type: (INTEGRATION_TYPE_TO_DB[data.type] ?? data.type) as never,
      status: data.status as never,
      description: data.description,
      endpoint: data.endpoint,
      lastSync: new Date(),
      recordCount: 0,
      auditLog: [],
    },
  })
  return toIso(row) as unknown as Integration
}

function deriveIntegrationStatus(statusCode: number): Integration['status'] {
  if (statusCode < 400) return 'Active'
  if (statusCode === 401 || statusCode === 403) return 'Warning'
  return 'Error'
}

export async function appendAuditEntry(
  id: string,
  entry: import('./types').AuditLogEntry,
): Promise<Integration> {
  const newStatus = deriveIntegrationStatus(entry.statusCode)
  if (!hasDb()) {
    const { INTEGRATIONS } = await import('./mock-data/integrations')
    const integration = INTEGRATIONS.find((i) => i.id === id)
    if (!integration) throw new Error(`Integration ${id} not found`)
    integration.auditLog = [entry, ...(integration.auditLog ?? [])]
    integration.lastSync = entry.timestamp
    integration.status = newStatus
    if (entry.statusCode < 400) integration.recordCount += entry.records
    return integration
  }
  const { db } = await import('./db')
  const current = await db.integration.findUniqueOrThrow({ where: { id } })
  const existing = Array.isArray(current.auditLog) ? current.auditLog : []
  const updated = await db.integration.update({
    where: { id },
    data: {
      auditLog: [entry, ...existing] as never,
      lastSync: new Date(entry.timestamp),
      status: newStatus as never,
      ...(entry.statusCode < 400 && { recordCount: { increment: entry.records } }),
    },
  })
  return toIso(updated) as unknown as Integration
}

export async function deleteIntegration(id: string): Promise<void> {
  if (!hasDb()) {
    const { INTEGRATIONS } = await import('./mock-data/integrations')
    removeWhere(INTEGRATIONS, (i) => i.id === id)
    return
  }
  const { db } = await import('./db')
  await db.integration.delete({ where: { id } })
}

export async function updateIntegration(id: string, data: Partial<Pick<Integration, 'status' | 'recordCount' | 'lastSync' | 'auditLog'>>): Promise<Integration> {
  if (!hasDb()) {
    const { INTEGRATIONS } = await import('./mock-data/integrations')
    const integration = INTEGRATIONS.find((i) => i.id === id)
    if (!integration) throw new Error(`Integration ${id} not found`)
    Object.assign(integration, data)
    return integration
  }
  const { db } = await import('./db')
  const row = await db.integration.update({
    where: { id },
    data: {
      ...(data.status !== undefined && { status: data.status as never }),
      ...(data.recordCount !== undefined && { recordCount: data.recordCount }),
      ...(data.lastSync !== undefined && { lastSync: new Date(data.lastSync) }),
      ...(data.auditLog !== undefined && { auditLog: data.auditLog as never }),
    },
  })
  return toIso(row) as unknown as Integration
}
