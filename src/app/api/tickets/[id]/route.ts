import { NextResponse } from 'next/server'
import { updateTicket, deleteTicket } from '@/lib/queries'
import { parseJsonBody, validateId, ticketUpdateSchema } from '@/lib/validation'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const valid = validateId(id)
  if (!valid.ok) return valid.response
  const parsed = await parseJsonBody(req, ticketUpdateSchema)
  if (!parsed.ok) return parsed.response
  try {
    const ticket = await updateTicket(valid.data, parsed.data)
    return NextResponse.json(ticket)
  } catch (e) {
    console.error(e); return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const valid = validateId(id)
  if (!valid.ok) return valid.response
  try {
    await deleteTicket(valid.data)
    return new NextResponse(null, { status: 204 })
  } catch (e) {
    console.error(e); return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
