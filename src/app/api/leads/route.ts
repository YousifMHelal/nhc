import { NextResponse } from 'next/server'
import { getLeads, createLead } from '@/lib/queries'

export async function GET() {
  try {
    const leads = await getLeads()
    return NextResponse.json(leads)
  } catch (e) {
    console.error(e); return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const lead = await createLead(body)
    return NextResponse.json(lead, { status: 201 })
  } catch (e) {
    console.error(e); return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
