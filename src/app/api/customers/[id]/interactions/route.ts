import { NextResponse } from 'next/server'
import { createCustomerInteraction } from '@/lib/queries'

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    if (!body.type) {
      return NextResponse.json({ error: 'type is required' }, { status: 400 })
    }
    const result = await createCustomerInteraction(id, {
      type: body.type,
      channel: body.channel ?? '',
      note: body.note ?? '',
      salesRepId: body.salesRepId,
    })
    return NextResponse.json(result, { status: 201 })
  } catch (e) {
    console.error(e); return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
