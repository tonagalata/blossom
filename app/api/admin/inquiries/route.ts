import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/requireAdmin'
import { listInquiries } from '@/lib/db'

export async function GET() {
  const err = await requireAdmin()
  if (err) return err

  const inquiries = await listInquiries()
  return NextResponse.json({ inquiries })
}
