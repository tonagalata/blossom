import { randomUUID } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/requireAdmin'
import { listCustomers, searchCustomers, createCustomer } from '@/lib/db'

export async function GET(request: NextRequest) {
  const err = await requireAdmin()
  if (err) return err

  const q = request.nextUrl.searchParams.get('q')
  const customers = q ? await searchCustomers(q) : await listCustomers()
  return NextResponse.json({ customers })
}

export async function POST(request: NextRequest) {
  const err = await requireAdmin()
  if (err) return err

  const { firstName, lastName, email, phone, company, address, notes, inquiryId } = await request.json()
  if (!email) {
    return NextResponse.json({ error: 'Email is required.' }, { status: 400 })
  }

  const id = randomUUID()
  await createCustomer({
    id,
    first_name: firstName || null,
    last_name: lastName || null,
    email,
    phone: phone || null,
    company: company || null,
    address: address || null,
    notes: notes || null,
    source: inquiryId ? 'inquiry' : 'manual',
    inquiry_id: inquiryId || null,
  })
  return NextResponse.json({ id })
}
