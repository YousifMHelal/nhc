import { NextResponse } from 'next/server'
import { deleteLead } from '@/lib/queries'
import { validateId } from '@/lib/validation'

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
