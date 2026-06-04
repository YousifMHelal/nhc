import { NextResponse } from 'next/server'
import { getIntegrations, createIntegration } from '@/lib/queries'
import { parseJsonBody, integrationCreateSchema } from '@/lib/validation'

export async function GET() {
  try {
    const integrations = await getIntegrations()
    return NextResponse.json(integrations)
  } catch (e) {
    console.error(e); return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const parsed = await parseJsonBody(req, integrationCreateSchema)
  if (!parsed.ok) return parsed.response
  try {
    const integration = await createIntegration(parsed.data)
    return NextResponse.json(integration, { status: 201 })
  } catch (e) {
    console.error(e); return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
