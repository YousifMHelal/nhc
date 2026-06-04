import { NextResponse } from 'next/server'
import { getJourneys, createJourney } from '@/lib/queries'

export async function GET() {
  try {
    const journeys = await getJourneys()
    return NextResponse.json(journeys)
  } catch (e) {
    console.error(e); return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const journey = await createJourney(body)
    return NextResponse.json(journey, { status: 201 })
  } catch (e) {
    console.error(e); return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
