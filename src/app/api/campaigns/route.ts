import { NextResponse } from 'next/server'
import { getCampaigns, createCampaign } from '@/lib/queries'
import { parseJsonBody, campaignCreateSchema } from '@/lib/validation'

export async function GET() {
  try {
    const campaigns = await getCampaigns()
    return NextResponse.json(campaigns)
  } catch (e) {
    console.error(e); return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const parsed = await parseJsonBody(req, campaignCreateSchema)
  if (!parsed.ok) return parsed.response
  try {
    const campaign = await createCampaign(parsed.data)
    return NextResponse.json(campaign, { status: 201 })
  } catch (e) {
    console.error(e); return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
