import { NextResponse } from 'next/server'
import { updateJourney, deleteJourney } from '@/lib/queries'
import { parseJsonBody, validateId, journeyUpdateSchema } from '@/lib/validation'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const valid = validateId(id)
  if (!valid.ok) return valid.response
  const parsed = await parseJsonBody(req, journeyUpdateSchema)
  if (!parsed.ok) return parsed.response
  try {
    const journey = await updateJourney(valid.data, parsed.data)
    return NextResponse.json(journey)
  } catch (e) {
    console.error(e); return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const valid = validateId(id)
  if (!valid.ok) return valid.response
  try {
    await deleteJourney(valid.data)
    return new NextResponse(null, { status: 204 })
  } catch (e) {
    console.error(e); return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
