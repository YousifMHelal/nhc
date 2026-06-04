import { NextResponse } from 'next/server'
import { z } from 'zod'
import { deleteLead, updateLeadStage } from '@/lib/queries'
import { validateId, parseJsonBody, pipelineStageSchema } from '@/lib/validation'

const stageUpdateSchema = z.object({ stage: pipelineStageSchema })

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const valid = validateId(id)
  if (!valid.ok) return valid.response
  const body = await parseJsonBody(req, stageUpdateSchema)
  if (!body.ok) return body.response
  try {
    const lead = await updateLeadStage(valid.data, body.data.stage)
    return NextResponse.json(lead)
  } catch (e) {
    console.error(e); return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const valid = validateId(id)
  if (!valid.ok) return valid.response
  try {
    await deleteLead(valid.data)
    return new NextResponse(null, { status: 204 })
  } catch (e) {
    console.error(e); return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
