import { NextResponse } from 'next/server'
import { getJourneys, createJourney } from '@/lib/queries'

export async function GET() {
  try {
    const journeys = await getJourneys()
    return NextResponse.json(journeys)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const journey = await createJourney(body)
    return NextResponse.json(journey, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
