import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/requireAdmin'
import { listMembers } from '@/lib/db'

export async function GET() {
  const err = await requireAdmin()
  if (err) return err

  const members = await listMembers()
  const safe = members.map(({ password_hash: _, ...m }) => m)
  return NextResponse.json({ members: safe })
}
