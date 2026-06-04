import { NextResponse } from 'next/server'
import { getJourneys, createJourney } from '@/lib/queries'
import { parseJsonBody, journeyCreateSchema } from '@/lib/validation'

export async function GET() {
  try {
    const journeys = await getJourneys()
    return NextResponse.json(journeys)
  } catch (e) {
    console.error(e); return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const parsed = await parseJsonBody(req, journeyCreateSchema)
  if (!parsed.ok) return parsed.response
  try {
    const journey = await createJourney(parsed.data)
    return NextResponse.json(journey, { status: 201 })
  } catch (e) {
    console.error(e); return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
