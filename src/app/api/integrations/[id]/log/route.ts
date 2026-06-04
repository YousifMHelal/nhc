import { NextResponse } from 'next/server'
import { appendAuditEntry } from '@/lib/queries'
import type { AuditLogEntry } from '@/lib/types'

// Called by the server-side interceptor (or Test Connection) whenever
// an outbound call is made through this integration.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const entry: AuditLogEntry = await req.json()
    const integration = await appendAuditEntry(id, entry)
    return NextResponse.json(integration)
  } catch (e) {
    console.error(e); return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
