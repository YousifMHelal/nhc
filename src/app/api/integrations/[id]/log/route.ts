import { NextResponse } from 'next/server'
import { appendAuditEntry } from '@/lib/queries'
import { parseJsonBody, validateId, auditLogEntrySchema } from '@/lib/validation'

// Called by the server-side interceptor (or Test Connection) whenever
// an outbound call is made through this integration.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const valid = validateId(id)
  if (!valid.ok) return valid.response
  const parsed = await parseJsonBody(req, auditLogEntrySchema)
  if (!parsed.ok) return parsed.response
  try {
    const integration = await appendAuditEntry(valid.data, parsed.data)
    return NextResponse.json(integration)
  } catch (e) {
    console.error(e); return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
