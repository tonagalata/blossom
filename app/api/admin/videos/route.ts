import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/requireAdmin'
import { listBuiltinVideos } from '@/lib/store'

export async function GET() {
  const err = await requireAdmin()
  if (err) return err

  const builtin = await listBuiltinVideos()
  return NextResponse.json({ builtin })
}
