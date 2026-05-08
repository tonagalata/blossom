'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get('next') || '/members'
  const justReset = searchParams.get('reset') === '1'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/members/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Login failed')
        return
      }
      router.push(next)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="auth-form">
      <h1 className="auth-title">Member Sign In</h1>
      {justReset && <p className="form-success">Password updated. Sign in with your new password.</p>}
      {error && <p className="form-error">{error}</p>}
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
      <div className="form-group">
        <label className="form-label">Password</label>
        <input
          type="password"
          className="form-input"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
      </div>
      <button type="submit" className="btn auth-submit" disabled={loading}>
        {loading ? 'Signing in…' : 'Sign In'}
      </button>
      <p className="auth-alt">
        <Link href="/members/forgot-password" className="link">Forgot password?</Link>
      </p>
      <p className="auth-alt">
        Not a member yet?{' '}
        <Link href="/membership" className="link">View plans</Link>
      </p>
    </form>
  )
}

export default function LoginPage() {
  return (
    <div className="auth-page">
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  )
}
