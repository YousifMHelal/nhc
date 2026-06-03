import { neonConfig } from '@neondatabase/serverless'
import { PrismaNeon } from '@prisma/adapter-neon'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@/generated/prisma/client'
import ws from 'ws'

function createClient() {
  const url = process.env.DATABASE_URL!
  if (url.includes('neon.tech') || url.includes('.neon.')) {
    // Neon serverless — WebSocket adapter
    neonConfig.webSocketConstructor = ws
    const adapter = new PrismaNeon({ connectionString: url })
    return new PrismaClient({ adapter })
  }
  // Standard Postgres (Docker, Supabase, Railway, local) — pg adapter
  const adapter = new PrismaPg({ connectionString: url })
  return new PrismaClient({ adapter })
}

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createClient> | undefined
}

export const db = globalForPrisma.prisma ?? createClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db
}
