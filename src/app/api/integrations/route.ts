import { NextResponse } from 'next/server'
import { getIntegrations, createIntegration } from '@/lib/queries'

export async function GET() {
  try {
    const integrations = await getIntegrations()
    return NextResponse.json(integrations)
  } catch (e) {
    console.error(e); return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const integration = await createIntegration(body)
    return NextResponse.json(integration, { status: 201 })
  } catch (e) {
    console.error(e); return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
