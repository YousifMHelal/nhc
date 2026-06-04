import { NextResponse } from 'next/server'
import { createCustomerOpportunity } from '@/lib/queries'

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    if (!body.titleAr?.trim()) {
      return NextResponse.json({ error: 'titleAr is required' }, { status: 400 })
    }
    const result = await createCustomerOpportunity(id, {
      titleAr: body.titleAr.trim(),
      project: body.project,
      unitType: body.unitType ?? '',
      valueRiyal: body.valueRiyal,
      stage: body.stage,
      probability: body.probability,
      salesRepId: body.salesRepId,
    })
    return NextResponse.json(result, { status: 201 })
  } catch (e) {
    console.error(e); return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
