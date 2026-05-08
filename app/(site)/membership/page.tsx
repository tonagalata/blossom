import Link from 'next/link'
import { listPlans } from '@/lib/db'
import PlanButton from './PlanButton'

export const dynamic = 'force-dynamic'

export default async function MembershipPage() {
  const plans = await listPlans(true).catch(() => [])

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Membership</h1>
        <p className="page-subtitle">
          Join the Events in Bloom community for exclusive perks, priority booking, and more.
        </p>
      </div>

      {plans.length === 0 ? (
        <div className="membership-empty">
          <p>Membership plans are coming soon. Check back shortly!</p>
        </div>
      ) : (
        <section className="plans-section">
          <div className="plans-grid">
            {plans.map(plan => (
              <div key={plan.id} className="plan-card">
                <div className="plan-card-header">
                  <h2 className="plan-name">{plan.name}</h2>
                  <div className="plan-price">
                    <span className="plan-amount">${(plan.amount / 100).toFixed(0)}</span>
                    <span className="plan-interval">/{plan.interval}</span>
                  </div>
                </div>
                {plan.description && (
                  <p className="plan-description">{plan.description}</p>
                )}
                {plan.features.length > 0 && (
                  <ul className="plan-features">
                    {plan.features.map((f, i) => (
                      <li key={i} className="plan-feature">
                        <span className="plan-check">✓</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                )}
                <PlanButton planId={plan.id} />
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="membership-login-hint">
        Already a member?{' '}
        <Link href="/members/login" className="link">Sign in</Link>
      </div>
    </>
  )
}
