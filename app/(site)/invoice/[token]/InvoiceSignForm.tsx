'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import SignaturePad from '@/components/SignaturePad'

export default function InvoiceSignForm({ token }: { token: string }) {
  const router = useRouter()
  const [signerName, setSignerName] = useState('')
  const [signerEmail, setSignerEmail] = useState('')
  const [signatureData, setSignatureData] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSign() {
    if (!signerName || !signerEmail) { setError('Please enter your name and email.'); return }
    if (!signatureData) { setError('Please sign to accept the terms.'); return }
    setSubmitting(true)
    setError('')
    const res = await fetch(`/api/invoice/${token}/sign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ signerName, signerEmail, signatureData }),
    })
    setSubmitting(false)
    if (res.ok) {
      router.refresh()
    } else {
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? 'Something went wrong. Please try again.')
    }
  }

  return (
    <div className="doc-sign-section">
      <h3>Sign to Continue</h3>
      <div className="doc-sign-fields">
        <input className="form-input" placeholder="Full name" value={signerName} onChange={e => setSignerName(e.target.value)} />
        <input className="form-input" type="email" placeholder="Email" value={signerEmail} onChange={e => setSignerEmail(e.target.value)} />
      </div>
      <SignaturePad onChange={setSignatureData} />
      {error && <p className="doc-error" style={{ marginTop: 16 }}>{error}</p>}
      <div className="doc-sign-actions">
        <button type="button" className="btn btn-gold" onClick={handleSign} disabled={submitting}>
          {submitting ? 'Submitting…' : 'Sign & Continue'}
        </button>
      </div>
    </div>
  )
}
