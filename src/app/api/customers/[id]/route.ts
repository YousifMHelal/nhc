import { NextResponse } from 'next/server'
import { deleteCustomer, assignSalesRep } from '@/lib/queries'

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await deleteCustomer(id)
    return new NextResponse(null, { status: 204 })
  } catch (e) {
    console.error(e); return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    if (!body.salesRepId) {
      return NextResponse.json({ error: 'salesRepId is required' }, { status: 400 })
    }
    await assignSalesRep(id, body.salesRepId)
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error(e); return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
