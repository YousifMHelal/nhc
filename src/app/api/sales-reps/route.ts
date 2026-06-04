import { NextResponse } from 'next/server'
import { getSalesReps, createSalesRep, deleteSalesRep } from '@/lib/queries'
import { parseJsonBody, salesRepCreateSchema, salesRepDeleteSchema } from '@/lib/validation'

export async function GET() {
  try {
    const reps = await getSalesReps()
    return NextResponse.json(reps)
  } catch (e) {
    console.error(e); return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const parsed = await parseJsonBody(req, salesRepCreateSchema)
  if (!parsed.ok) return parsed.response
  try {
    const rep = await createSalesRep(parsed.data)
    return NextResponse.json(rep, { status: 201 })
  } catch (e) {
    console.error(e); return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  const parsed = await parseJsonBody(req, salesRepDeleteSchema)
  if (!parsed.ok) return parsed.response
  try {
    await deleteSalesRep(parsed.data.id)
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error(e); return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
