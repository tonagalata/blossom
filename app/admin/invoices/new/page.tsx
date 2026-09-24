'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { InvoiceBuilder } from '../InvoiceBuilder'

function NewInvoiceInner() {
  const searchParams = useSearchParams()
  const customerId = searchParams.get('customerId') ?? undefined
  return <InvoiceBuilder initialCustomerId={customerId} />
}

export default function NewInvoicePage() {
  return (
    <Suspense>
      <NewInvoiceInner />
    </Suspense>
  )
}
