'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { ProposalBuilder } from '../ProposalBuilder'

function NewProposalInner() {
  const searchParams = useSearchParams()
  const customerId = searchParams.get('customerId') ?? undefined
  return <ProposalBuilder initialCustomerId={customerId} />
}

export default function NewProposalPage() {
  return (
    <Suspense>
      <NewProposalInner />
    </Suspense>
  )
}
