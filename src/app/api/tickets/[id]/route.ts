import { NextResponse } from 'next/server'
import { updateTicket } from '@/lib/queries'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const ticket = await updateTicket(id, body)
    return NextResponse.json(ticket)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
