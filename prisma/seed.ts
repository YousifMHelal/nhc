/**
 * Seed the Neon database from the same mock-data fixtures used by the UI.
 * Run with: npx prisma db seed
 */

import 'dotenv/config'
import { neonConfig } from '@neondatabase/serverless'
import { PrismaNeon } from '@prisma/adapter-neon'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../src/generated/prisma/client'
import ws from 'ws'

const url = process.env.DATABASE_URL!
let prisma: PrismaClient

if (url.includes('neon.tech') || url.includes('.neon.')) {
  neonConfig.webSocketConstructor = ws
  const adapter = new PrismaNeon({ connectionString: url })
  prisma = new PrismaClient({ adapter })
} else {
  const adapter = new PrismaPg({ connectionString: url })
  prisma = new PrismaClient({ adapter })
}

// ─── Enum adapters (mock string values → Prisma enum names) ──────────────────

const pipelineStageMap: Record<string, string> = {
  'New': 'New',
  'Contacted': 'Contacted',
  'Qualified': 'Qualified',
  'Proposal': 'Proposal',
  'Closed Won': 'ClosedWon',
  'Closed Lost': 'ClosedLost',
}

const customerSegmentMap: Record<string, string> = {
  'VIP': 'VIP',
  'Standard': 'Standard',
  'At-Risk': 'AtRisk',
  'New': 'New',
}

const leadSourceMap: Record<string, string> = {
  'Web': 'Web',
  'Social': 'Social',
  'Referral': 'Referral',
  'Exhibition': 'Exhibition',
  'Cold Call': 'ColdCall',
  'Campaign': 'Campaign',
}

const interactionTypeMap: Record<string, string> = {
  'Call': 'Call',
  'Message': 'Message',
  'Email': 'Email',
  'Meeting': 'Meeting',
  'Site Visit': 'SiteVisit',
  'Document': 'Document',
  'System': 'System',
}

const ticketStatusMap: Record<string, string> = {
  'Open': 'Open',
  'In Progress': 'InProgress',
  'Resolved': 'Resolved',
  'Closed': 'Closed',
}

const requestStatusMap: Record<string, string> = {
  'Open': 'Open',
  'In Progress': 'InProgress',
  'Resolved': 'Resolved',
  'Closed': 'Closed',
}

const integrationTypeMap: Record<string, string> = {
  'Real-time': 'RealTime',
  'Batch': 'Batch',
  'On-demand': 'OnDemand',
}

function d(iso: string | undefined): Date | undefined {
  return iso ? new Date(iso) : undefined
}

// ─── Seed functions ──────────────────────────────────────────────────────────

async function seedSalesReps() {
  const { SALES_REPS } = await import('../src/lib/mock-data/sales-reps')
  for (const rep of SALES_REPS) {
    await prisma.salesRep.upsert({
      where: { id: rep.id },
      update: {},
      create: {
        id: rep.id,
        nameAr: rep.nameAr,
        email: rep.email,
        phone: rep.phone,
        avatarInitials: rep.avatarInitials,
        leadsCount: rep.leads,
        conversions: rep.conversions,
        revenue: rep.revenue,
        rank: rep.rank,
        region: rep.region,
      },
    })
  }
  console.log(`✓ ${SALES_REPS.length} sales reps`)
}

async function seedCustomers() {
  const { CUSTOMERS } = await import('../src/lib/mock-data/customers')
  for (const c of CUSTOMERS) {
    await prisma.customer.upsert({
      where: { id: c.id },
      update: {},
      create: {
        id: c.id,
        nameAr: c.nameAr,
        nic: c.nic,
        phone: c.phone,
        email: c.email,
        segment: customerSegmentMap[c.segment] as never,
        city: c.city,
        propertyInterest: c.propertyInterest,
        aiScore: c.aiScore,
        salesRepId: c.salesRepId,
        address: c.address,
        nationality: c.nationality,
        createdAt: d(c.createdAt)!,
      },
    })
  }
  console.log(`✓ ${CUSTOMERS.length} customers`)
}

async function seedLeads() {
  const { LEADS } = await import('../src/lib/mock-data/leads')
  for (const l of LEADS) {
    await prisma.lead.upsert({
      where: { id: l.id },
      update: {},
      create: {
        id: l.id,
        customerId: l.customerId ?? null,
        nameAr: l.nameAr,
        phone: l.phone,
        email: l.email ?? null,
        source: leadSourceMap[l.source] as never,
        channel: l.channel as never,
        stage: pipelineStageMap[l.stage] as never,
        aiScore: l.aiScore,
        salesRepId: l.salesRepId,
        propertyInterest: l.propertyInterest,
        city: l.city,
        lastContactDate: new Date(l.lastContactDate),
        notes: l.notes ?? null,
        budget: l.budget ?? null,
        createdAt: new Date(l.createdAt),
      },
    })
  }
  console.log(`✓ ${LEADS.length} leads`)
}

async function seedOpportunities() {
  const { OPPORTUNITIES } = await import('../src/lib/mock-data/opportunities')
  for (const o of OPPORTUNITIES) {
    await prisma.opportunity.upsert({
      where: { id: o.id },
      update: {},
      create: {
        id: o.id,
        customerId: o.customerId,
        titleAr: o.titleAr,
        project: o.project,
        unitType: o.unitType,
        unitId: o.unitId ?? null,
        valueRiyal: o.valueRiyal,
        stage: o.stage,
        probability: o.probability,
        expectedCloseDate: new Date(o.expectedCloseDate),
        salesRepId: o.salesRepId,
        notes: o.notes ?? null,
        createdAt: new Date(o.createdAt),
      },
    })
  }
  console.log(`✓ ${OPPORTUNITIES.length} opportunities`)
}

async function seedContracts() {
  const { CONTRACTS } = await import('../src/lib/mock-data/contracts')
  for (const c of CONTRACTS) {
    await prisma.contract.upsert({
      where: { id: c.id },
      update: {},
      create: {
        id: c.id,
        customerId: c.customerId,
        opportunityId: c.opportunityId,
        project: c.project,
        unitId: c.unitId,
        unitType: c.unitType,
        valueRiyal: c.valueRiyal,
        status: c.status as never,
        signedDate: d(c.signedDate),
        startDate: new Date(c.startDate),
        endDate: d(c.endDate),
        paymentPlan: c.paymentPlan,
      },
    })
  }
  console.log(`✓ ${CONTRACTS.length} contracts`)
}

async function seedRequests() {
  const { REQUESTS } = await import('../src/lib/mock-data/requests')
  for (const r of REQUESTS) {
    await prisma.request.upsert({
      where: { id: r.id },
      update: {},
      create: {
        id: r.id,
        customerId: r.customerId,
        type: r.type,
        descriptionAr: r.descriptionAr,
        status: requestStatusMap[r.status] as never,
        priority: r.priority as never,
        assignedTo: r.assignedTo ?? null,
        createdAt: new Date(r.createdAt),
        resolvedAt: d(r.resolvedAt),
      },
    })
  }
  console.log(`✓ ${REQUESTS.length} requests`)
}

async function seedInteractions() {
  const { INTERACTIONS, TIMELINE_EVENTS } = await import('../src/lib/mock-data/interactions')
  for (const i of INTERACTIONS) {
    await prisma.interaction.upsert({
      where: { id: i.id },
      update: {},
      create: {
        id: i.id,
        customerId: i.customerId,
        type: interactionTypeMap[i.type] as never,
        channel: i.channel,
        date: new Date(i.date),
        note: i.note,
        salesRepId: i.salesRepId ?? null,
        duration: i.duration ?? null,
      },
    })
  }
  console.log(`✓ ${INTERACTIONS.length} interactions`)

  for (const t of TIMELINE_EVENTS) {
    await prisma.timelineEvent.upsert({
      where: { id: t.id },
      update: {},
      create: {
        id: t.id,
        customerId: t.customerId,
        entityType: t.entityType,
        entityId: t.entityId,
        titleAr: t.titleAr,
        descriptionAr: t.descriptionAr,
        date: new Date(t.date),
        type: t.type,
        channel: t.channel ?? null,
      },
    })
  }
  console.log(`✓ ${TIMELINE_EVENTS.length} timeline events`)
}

async function seedLeadScores() {
  const { LEAD_SCORES } = await import('../src/lib/mock-data/lead-scores')
  for (const s of LEAD_SCORES) {
    await prisma.leadScore.upsert({
      where: { leadId: s.leadId },
      update: {},
      create: {
        leadId: s.leadId,
        totalScore: s.totalScore,
        maxScore: s.maxScore,
        grade: s.grade as never,
        factors: s.factors as never,
        trend: s.trend,
        topFactors: s.topFactors as never,
      },
    })
  }
  console.log(`✓ ${LEAD_SCORES.length} lead scores`)
}

async function seedCampaigns() {
  const { CAMPAIGNS } = await import('../src/lib/mock-data/campaigns')
  for (const c of CAMPAIGNS) {
    await prisma.campaign.upsert({
      where: { id: c.id },
      update: {},
      create: {
        id: c.id,
        nameAr: c.nameAr,
        type: c.type,
        descriptionAr: c.descriptionAr,
        channels: c.channels as never,
        audience: c.audience as never,
        messageTemplate: c.messageTemplate as never,
        schedule: c.schedule as never,
        status: c.status as never,
        metrics: c.metrics as never,
        createdBy: c.createdBy,
        createdAt: new Date(c.createdAt),
      },
    })
  }
  console.log(`✓ ${CAMPAIGNS.length} campaigns`)
}

async function seedJourneys() {
  const { JOURNEYS } = await import('../src/lib/mock-data/journeys')
  for (const j of JOURNEYS) {
    await prisma.journey.upsert({
      where: { id: j.id },
      update: {},
      create: {
        id: j.id,
        nameAr: j.nameAr,
        descriptionAr: j.descriptionAr ?? null,
        status: j.status as never,
        nodes: j.nodes as never,
        edges: j.edges as never,
        trigger: j.trigger,
        activatedAt: d(j.activatedAt),
        enrolledCount: j.enrolledCount,
        completedCount: j.completedCount,
        createdAt: new Date(j.createdAt),
      },
    })
  }
  console.log(`✓ ${JOURNEYS.length} journeys`)
}

async function seedTickets() {
  const { TICKETS } = await import('../src/lib/mock-data/tickets')
  for (const t of TICKETS) {
    await prisma.ticket.upsert({
      where: { id: t.id },
      update: {},
      create: {
        id: t.id,
        titleAr: t.titleAr,
        descriptionAr: t.descriptionAr,
        severity: t.severity as never,
        status: ticketStatusMap[t.status] as never,
        level: t.level as never,
        assignedTo: t.assignedTo,
        customerId: t.customerId ?? null,
        slaDeadline: new Date(t.slaDeadline),
        slaHours: t.slaHours,
        steps: t.steps as never,
        rcaLink: t.rcaLink ?? null,
        escalationHistory: t.escalationHistory as never,
        comments: t.comments as never,
        createdAt: new Date(t.createdAt),
        resolvedAt: d(t.resolvedAt),
      },
    })
  }
  console.log(`✓ ${TICKETS.length} tickets`)
}

async function seedIntegrations() {
  const { INTEGRATIONS } = await import('../src/lib/mock-data/integrations')
  for (const i of INTEGRATIONS) {
    await prisma.integration.upsert({
      where: { nameEn: i.nameEn },
      update: {},
      create: {
        id: i.id,
        nameAr: i.nameAr,
        nameEn: i.nameEn,
        category: i.category,
        type: integrationTypeMap[i.type] as never,
        status: i.status as never,
        lastSync: new Date(i.lastSync),
        recordCount: i.recordCount,
        auditLog: i.auditLog as never,
        description: i.description ?? null,
      },
    })
  }
  console.log(`✓ ${INTEGRATIONS.length} integrations`)
}

async function seedActivities() {
  const { ACTIVITIES } = await import('../src/lib/mock-data/activities')
  for (const a of ACTIVITIES) {
    await prisma.activity.upsert({
      where: { id: a.id },
      update: {},
      create: {
        id: a.id,
        type: a.type as never,
        titleAr: a.titleAr,
        descriptionAr: a.descriptionAr,
        entityId: a.entityId,
        entityType: a.entityType,
        date: new Date(a.date),
        salesRepId: a.salesRepId ?? null,
        customerId: null,
        customerNameAr: a.customerNameAr ?? null,
      },
    })
  }
  console.log(`✓ ${ACTIVITIES.length} activities`)
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🌱 Seeding NHC CRM database…\n')

  // Insert in dependency order
  await seedSalesReps()
  await seedCustomers()
  await seedLeads()
  await seedOpportunities()
  await seedContracts()
  await seedRequests()
  await seedInteractions()
  await seedLeadScores()
  await seedCampaigns()
  await seedJourneys()
  await seedTickets()
  await seedIntegrations()
  await seedActivities()

  console.log('\n✅ Seed complete.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
