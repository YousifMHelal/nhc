import { NextResponse } from 'next/server'
import { createCustomerInteraction } from '@/lib/queries'
import { parseJsonBody, validateId, interactionCreateSchema } from '@/lib/validation'

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const valid = validateId(id)
  if (!valid.ok) return valid.response
  const parsed = await parseJsonBody(req, interactionCreateSchema)
  if (!parsed.ok) return parsed.response
  try {
    const result = await createCustomerInteraction(valid.data, parsed.data)
    return NextResponse.json(result, { status: 201 })
  } catch (e) {
    console.error(e); return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
