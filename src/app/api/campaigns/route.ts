import { NextResponse } from 'next/server'
import { getCampaigns, createCampaign } from '@/lib/queries'

export async function GET() {
  try {
    const campaigns = await getCampaigns()
    return NextResponse.json(campaigns)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const campaign = await createCampaign(body)
    return NextResponse.json(campaign, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
