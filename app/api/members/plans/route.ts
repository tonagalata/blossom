import { NextResponse } from 'next/server'
import { listPlans } from '@/lib/db'

export async function GET() {
  const plans = await listPlans(true)
  return NextResponse.json({ plans })
}
