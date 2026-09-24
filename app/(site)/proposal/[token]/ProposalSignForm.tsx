'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import SignaturePad from '@/components/SignaturePad'

export default function ProposalSignForm({ token }: { token: string }) {
  const router = useRouter()
  const [signerName, setSignerName] = useState('')
  const [signerEmail, setSignerEmail] = useState('')
  const [signatureData, setSignatureData] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState<'accepted' | 'declined' | null>(null)
  const [error, setError] = useState('')

  async function handleDecision(decision: 'accepted' | 'declined') {
    if (!signerName || !signerEmail) { setError('Please enter your name and email.'); return }
    if (decision === 'accepted' && !signatureData) { setError('Please sign to accept this proposal.'); return }
    setSubmitting(decision)
    setError('')
    const res = await fetch(`/api/proposal/${token}/sign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ signerName, signerEmail, signatureData, decision }),
    })
    setSubmitting(null)
    if (res.ok) {
      router.refresh()
    } else {
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? 'Something went wrong. Please try again.')
    }
  }

  return (
    <div className="doc-sign-section">
      <h3>Accept & Sign</h3>
      <div className="doc-sign-fields">
        <input className="form-input" placeholder="Full name" value={signerName} onChange={e => setSignerName(e.target.value)} />
        <input className="form-input" type="email" placeholder="Email" value={signerEmail} onChange={e => setSignerEmail(e.target.value)} />
      </div>
      <SignaturePad onChange={setSignatureData} />
      {error && <p className="doc-error" style={{ marginTop: 16 }}>{error}</p>}
      <div className="doc-sign-actions">
        <button type="button" className="btn btn-solid" onClick={() => handleDecision('declined')} disabled={submitting !== null}>
          {submitting === 'declined' ? 'Submitting…' : 'Decline'}
        </button>
        <button type="button" className="btn btn-gold" onClick={() => handleDecision('accepted')} disabled={submitting !== null}>
          {submitting === 'accepted' ? 'Submitting…' : 'Accept & Sign'}
        </button>
      </div>
    </div>
  )
}
