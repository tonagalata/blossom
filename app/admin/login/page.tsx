'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })
    setLoading(false)
    if (res.ok) {
      router.push('/admin/portfolio')
    } else {
      setError('Incorrect password.')
    }
  }

  return (
    <div className="admin-login-page">
      <div className="admin-login-box">
        <div className="admin-login-logo">
          <span className="logo-bloom">Events</span>
          <span className="logo-bloom"> in </span>
          <span className="logo-bloom">Bloom</span>
        </div>
        <h1 className="admin-login-title">Admin Access</h1>
        <form onSubmit={handleSubmit} className="admin-login-form">
          <input
            type="password"
            className="admin-input"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            autoFocus
          />
          {error && <p className="admin-login-error">{error}</p>}
          <button type="submit" className="admin-btn admin-btn-primary" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  )
}
