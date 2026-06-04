import { NextResponse } from 'next/server'
import { getSalesReps, createSalesRep, deleteSalesRep } from '@/lib/queries'

export async function GET() {
  try {
    const reps = await getSalesReps()
    return NextResponse.json(reps)
  } catch (e) {
    console.error(e); return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    if (!body.nameAr?.trim()) {
      return NextResponse.json({ error: 'nameAr is required' }, { status: 400 })
    }
    const rep = await createSalesRep(body)
    return NextResponse.json(rep, { status: 201 })
  } catch (e) {
    console.error(e); return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const { id } = await req.json()
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })
    await deleteSalesRep(id)
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error(e); return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
