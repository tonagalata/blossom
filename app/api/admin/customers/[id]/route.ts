import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/requireAdmin'
import { getCustomer, updateCustomer, deleteCustomer, listProposals, listInvoices } from '@/lib/db'

type Params = { params: Promise<{ id: string }> }

export async function GET(_: NextRequest, { params }: Params) {
  const err = await requireAdmin()
  if (err) return err

  const { id } = await params
  const customer = await getCustomer(id)
  if (!customer) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const [proposals, invoices] = await Promise.all([
    listProposals({ customerId: id }),
    listInvoices({ customerId: id }),
  ])
  return NextResponse.json({ customer, proposals, invoices })
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const err = await requireAdmin()
  if (err) return err

  const { id } = await params
  const { firstName, lastName, email, phone, company, address, notes } = await request.json()
  await updateCustomer(id, {
    first_name: firstName, last_name: lastName, email, phone, company, address, notes,
  })
  return NextResponse.json({ ok: true })
}

export async function DELETE(_: NextRequest, { params }: Params) {
  const err = await requireAdmin()
  if (err) return err

  const { id } = await params
  await deleteCustomer(id)
  return NextResponse.json({ ok: true })
}
