import { NextResponse } from 'next/server'
import { convertLeadToCustomer } from '@/lib/queries'

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const customer = await convertLeadToCustomer(id)
    return NextResponse.json(customer, { status: 201 })
  } catch (e) {
    console.error(e); return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
