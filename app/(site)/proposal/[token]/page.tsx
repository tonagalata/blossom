import { notFound } from 'next/navigation'
import { getProposalByToken, markProposalViewed } from '@/lib/db'
import ProposalSignForm from './ProposalSignForm'

export const dynamic = 'force-dynamic'

function fmtMoney(cents: number, currency: string) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(cents / 100)
}

export default async function ProposalPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  let proposal = await getProposalByToken(token)
  if (!proposal) notFound()

  if (proposal.status === 'sent') {
    await markProposalViewed(token)
    proposal = await getProposalByToken(token)
    if (!proposal) notFound()
  }

  return (
    <div className="doc-page">
      <div className="doc-box">
        <p className="doc-brand">Events in Bloom</p>
        <p className="doc-eyebrow">
          Proposal · <a href={`/api/proposal/${token}/pdf`} className="doc-pdf-link">Download PDF</a>
        </p>
        <h1 className="doc-title">{proposal.title}</h1>
        <p className="doc-meta">
          {proposal.event_date && <>Event date: {new Date(proposal.event_date).toLocaleDateString()} · </>}
          {proposal.valid_until && <>Valid until {new Date(proposal.valid_until).toLocaleDateString()}</>}
        </p>

        <table className="doc-table">
          <thead>
            <tr><th>Item</th><th>Qty</th><th className="doc-num">Amount</th></tr>
          </thead>
          <tbody>
            {proposal.line_items.map(item => (
              <tr key={item.id}>
                <td>
                  <div className="doc-item-row">
                    {item.image_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.image_url} alt="" className="doc-item-img" />
                    )}
                    <div>
                      {item.title}
                      {item.description && <div className="doc-item-desc">{item.description}</div>}
                    </div>
                  </div>
                </td>
                <td>{item.qty}</td>
                <td className="doc-num">{fmtMoney(item.qty * item.unit_price, proposal.currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="doc-totals">
          <div className="doc-totals-row"><span>Subtotal</span><span>{fmtMoney(proposal.subtotal, proposal.currency)}</span></div>
          {proposal.tax_rate > 0 && (
            <div className="doc-totals-row"><span>Tax ({(proposal.tax_rate * 100).toFixed(1)}%)</span><span>{fmtMoney(proposal.tax_amount, proposal.currency)}</span></div>
          )}
          <div className="doc-totals-row doc-total"><span>Total</span><span>{fmtMoney(proposal.total, proposal.currency)}</span></div>
          {proposal.deposit_percentage > 0 && (
            <div className="doc-totals-row">
              <span>Deposit due ({Math.round(proposal.deposit_percentage * 100)}%)</span>
              <span>{fmtMoney(Math.round(proposal.total * proposal.deposit_percentage), proposal.currency)}</span>
            </div>
          )}
        </div>

        {proposal.notes && (
          <div className="doc-notes">
            <p className="doc-notes-label">Notes</p>
            {proposal.notes}
          </div>
        )}
        {proposal.terms && (
          <div className="doc-notes">
            <p className="doc-notes-label">Terms</p>
            {proposal.terms}
          </div>
        )}

        <div className="doc-divider" />

        {proposal.status === 'accepted' && proposal.signature ? (
          <div className="doc-status-box">
            <span className="doc-status-icon">✦</span>
            <h1 className="pay-status-title">Accepted</h1>
            <p className="pay-status-body">Thank you, {proposal.signature.signer_name}! We&apos;ll be in touch to finalize the details.</p>

            {proposal.deposit_percentage > 0 && (
              proposal.deposit_status === 'paid' ? (
                <p className="pay-status-body" style={{ marginTop: 16 }}>
                  Deposit of {fmtMoney(Math.round(proposal.total * proposal.deposit_percentage), proposal.currency)} received. Thank you!
                </p>
              ) : proposal.payment_request_token ? (
                <a
                  href={`/pay/${proposal.payment_request_token}`}
                  className="btn btn-gold"
                  style={{ display: 'inline-flex', marginTop: 20 }}
                >
                  Pay Deposit — {fmtMoney(Math.round(proposal.total * proposal.deposit_percentage), proposal.currency)}
                </a>
              ) : null
            )}
          </div>
        ) : proposal.status === 'declined' ? (
          <div className="doc-status-box">
            <h1 className="pay-status-title">Declined</h1>
            <p className="pay-status-body">You&apos;ve declined this proposal. Reach out to us any time if that changes.</p>
          </div>
        ) : (
          <ProposalSignForm token={token} />
        )}
      </div>
    </div>
  )
}
