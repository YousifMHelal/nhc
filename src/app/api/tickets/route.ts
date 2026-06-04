import { NextResponse } from 'next/server'
import { getTickets, createTicket } from '@/lib/queries'
import { parseJsonBody, ticketCreateSchema } from '@/lib/validation'

export async function GET() {
  try {
    const tickets = await getTickets()
    return NextResponse.json(tickets)
  } catch (e) {
    console.error(e); return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const parsed = await parseJsonBody(req, ticketCreateSchema)
  if (!parsed.ok) return parsed.response
  try {
    const ticket = await createTicket(parsed.data)
    return NextResponse.json(ticket, { status: 201 })
  } catch (e) {
    console.error(e); return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
