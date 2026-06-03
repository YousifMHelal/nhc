import { NextResponse } from 'next/server'
import { updateIntegration } from '@/lib/queries'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const integration = await updateIntegration(id, body)
    return NextResponse.json(integration)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
