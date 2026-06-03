import { NextResponse } from 'next/server'
import { getTickets, createTicket } from '@/lib/queries'

export async function GET() {
  try {
    const tickets = await getTickets()
    return NextResponse.json(tickets)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const ticket = await createTicket(body)
    return NextResponse.json(ticket, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
