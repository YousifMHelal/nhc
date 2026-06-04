import { NextResponse } from 'next/server'
import { convertLeadToCustomer } from '@/lib/queries'
import { validateId } from '@/lib/validation'

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const valid = validateId(id)
  if (!valid.ok) return valid.response
  try {
    const customer = await convertLeadToCustomer(valid.data)
    return NextResponse.json(customer, { status: 201 })
  } catch (e) {
    console.error(e); return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
