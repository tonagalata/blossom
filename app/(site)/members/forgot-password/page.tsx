'use client'
import { useState } from 'react'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/members/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (!res.ok) {
        const d = await res.json()
        setError(d.error || 'Something went wrong.')
        return
      }
      setSubmitted(true)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-form">
        <h1 className="auth-title">Forgot Password</h1>
        {submitted ? (
          <>
            <p style={{ color: '#333', margin: 0 }}>
              If that email is registered, you&apos;ll receive a reset link shortly. Check your inbox.
            </p>
            <Link href="/members/login" className="btn auth-submit" style={{ textAlign: 'center' }}>
              Back to Sign In
            </Link>
          </>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'contents' }}>
            {error && <p className="form-error">{error}</p>}
            <p style={{ color: '#666', margin: 0, fontSize: '0.95rem' }}>
              Enter your email and we&apos;ll send you a link to reset your password.
            </p>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                className="form-input"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>
            <button type="submit" className="btn auth-submit" disabled={loading}>
              {loading ? 'Sending…' : 'Send Reset Link'}
            </button>
            <p className="auth-alt">
              <Link href="/members/login" className="link">Back to Sign In</Link>
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
