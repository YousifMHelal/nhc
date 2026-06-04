import { NextResponse } from 'next/server'
import { getLeads, createLead } from '@/lib/queries'
import { parseJsonBody, leadCreateSchema } from '@/lib/validation'

export async function GET() {
  try {
    const leads = await getLeads()
    return NextResponse.json(leads)
  } catch (e) {
    console.error(e); return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const parsed = await parseJsonBody(req, leadCreateSchema)
  if (!parsed.ok) return parsed.response
  try {
    const lead = await createLead(parsed.data)
    return NextResponse.json(lead, { status: 201 })
  } catch (e) {
    console.error(e); return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
