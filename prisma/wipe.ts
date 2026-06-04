/**
 * Empty all data from the database (keeps schema/migrations intact).
 * Run with: npx tsx prisma/wipe.ts
 * Deletes in FK-safe order: children before parents.
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
  prisma = new PrismaClient({ adapter: new PrismaNeon({ connectionString: url }) })
} else {
  prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) })
}

async function main() {
  // Order matters: delete rows that reference others first.
  await prisma.activity.deleteMany()
  await prisma.timelineEvent.deleteMany()
  await prisma.interaction.deleteMany()
  await prisma.request.deleteMany()
  await prisma.contract.deleteMany()
  await prisma.opportunity.deleteMany()
  await prisma.leadScore.deleteMany()
  await prisma.lead.deleteMany()
  await prisma.ticket.deleteMany()
  await prisma.customer.deleteMany()
  await prisma.salesRep.deleteMany()
  // Independent tables
  await prisma.campaign.deleteMany()
  await prisma.journey.deleteMany()
  await prisma.integration.deleteMany()

  console.log('Database emptied.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
