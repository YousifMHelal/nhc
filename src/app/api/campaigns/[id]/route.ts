import { NextResponse } from 'next/server'
import { updateCampaign } from '@/lib/queries'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const campaign = await updateCampaign(id, body)
    return NextResponse.json(campaign)
  } catch (e) {
    console.error(e); return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
