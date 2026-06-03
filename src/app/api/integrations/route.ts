import { NextResponse } from 'next/server'
import { getIntegrations } from '@/lib/queries'

export async function GET() {
  try {
    const integrations = await getIntegrations()
    return NextResponse.json(integrations)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
