import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/requireAdmin'
import { listAllMemberInquiries } from '@/lib/db'

export async function GET() {
  const err = await requireAdmin()
  if (err) return err

  const inquiries = await listAllMemberInquiries()
  return NextResponse.json({ inquiries })
}
