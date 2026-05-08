'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

interface Plan {
  id: string
  name: string
  amount: number
  interval: string
}

function SignupForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const planIdParam = searchParams.get('plan') || ''

  useEffect(() => {
    fetch('/api/members/me').then(r => { if (r.ok) router.replace('/members') }).catch(() => {})
  }, [router])

  const [plans, setPlans] = useState<Plan[]>([])
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [planId, setPlanId] = useState(planIdParam)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch('/api/members/plans')
      .then(r => r.json())
      .then(d => {
        setPlans(d.plans || [])
        if (!planId && d.plans?.length) setPlanId(d.plans[0].id)
      })
      .catch(() => {})
  }, [planId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!planId) { setError('Please select a plan.'); return }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return }
    setLoading(true)
    try {
      const signupRes = await fetch('/api/members/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName, lastName, email, password }),
      })
      const signupData = await signupRes.json()
      if (!signupRes.ok) {
        setError(signupData.error || 'Signup failed')
        return
      }
      const subRes = await fetch('/api/members/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId }),
      })
      const subData = await subRes.json()
      if (!subRes.ok) {
        setError(subData.error || 'Could not start subscription')
        return
      }
      window.location.href = subData.url
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="auth-form">
      <h1 className="auth-title">Create Your Account</h1>
      {error && <p className="form-error">{error}</p>}
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">First Name</label>
          <input className="form-input" value={firstName} onChange={e => setFirstName(e.target.value)} required />
        </div>
        <div className="form-group">
          <label className="form-label">Last Name</label>
          <input className="form-input" value={lastName} onChange={e => setLastName(e.target.value)} />
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">Email</label>
        <input type="email" className="form-input" value={email} onChange={e => setEmail(e.target.value)} required />
      </div>
      <div className="form-group">
        <label className="form-label">Password</label>
        <input type="password" className="form-input" value={password} onChange={e => setPassword(e.target.value)} required minLength={8} />
      </div>
      {plans.length > 0 && (
        <div className="form-group">
          <label className="form-label">Plan</label>
          <select className="form-input" value={planId} onChange={e => setPlanId(e.target.value)} required>
            {plans.map(p => (
              <option key={p.id} value={p.id}>
                {p.name} — ${(p.amount / 100).toFixed(0)}/{p.interval}
              </option>
            ))}
          </select>
        </div>
      )}
      <button type="submit" className="btn auth-submit" disabled={loading}>
        {loading ? 'Creating account…' : 'Create Account & Subscribe'}
      </button>
      <p className="auth-alt">
        Already a member?{' '}
        <Link href="/members/login" className="link">Sign in</Link>
      </p>
    </form>
  )
}

export default function SignupPage() {
  return (
    <div className="auth-page">
      <Suspense>
        <SignupForm />
      </Suspense>
    </div>
  )
}
