import { NextResponse } from 'next/server'
import { deleteCustomer, assignSalesRep } from '@/lib/queries'
import { parseJsonBody, validateId, assignSalesRepSchema } from '@/lib/validation'

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const valid = validateId(id)
  if (!valid.ok) return valid.response
  try {
    await deleteCustomer(valid.data)
    return new NextResponse(null, { status: 204 })
  } catch (e) {
    console.error(e); return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const valid = validateId(id)
  if (!valid.ok) return valid.response
  const parsed = await parseJsonBody(req, assignSalesRepSchema)
  if (!parsed.ok) return parsed.response
  try {
    await assignSalesRep(valid.data, parsed.data.salesRepId)
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error(e); return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
