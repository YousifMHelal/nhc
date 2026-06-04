import { NextResponse } from 'next/server'
import { updateCampaign } from '@/lib/queries'
import { parseJsonBody, validateId, campaignUpdateSchema } from '@/lib/validation'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const valid = validateId(id)
  if (!valid.ok) return valid.response
  const parsed = await parseJsonBody(req, campaignUpdateSchema)
  if (!parsed.ok) return parsed.response
  try {
    const campaign = await updateCampaign(valid.data, parsed.data)
    return NextResponse.json(campaign)
  } catch (e) {
    console.error(e); return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
