import { notFound } from 'next/navigation'
import { getInvoiceByToken, markInvoiceViewed } from '@/lib/db'
import InvoiceSignForm from './InvoiceSignForm'

export const dynamic = 'force-dynamic'

function fmtMoney(cents: number, currency: string) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(cents / 100)
}

export default async function InvoicePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  let invoice = await getInvoiceByToken(token)
  if (!invoice) notFound()

  if (invoice.status === 'sent') {
    await markInvoiceViewed(token)
    invoice = await getInvoiceByToken(token)
    if (!invoice) notFound()
  }

  const needsSignature = Boolean(invoice.terms) && !invoice.signature
  const balanceDue = invoice.total - invoice.amount_paid

  return (
    <div className="doc-page">
      <div className="doc-box">
        <p className="doc-brand">Events in Bloom</p>
        <p className="doc-eyebrow">
          Invoice {invoice.invoice_number} · <a href={`/api/invoice/${token}/pdf`} className="doc-pdf-link">Download PDF</a>
        </p>
        <h1 className="doc-title">{fmtMoney(invoice.total, invoice.currency)}</h1>
        <p className="doc-meta">
          {invoice.issue_date && <>Issued {new Date(invoice.issue_date).toLocaleDateString()} · </>}
          {invoice.due_date && <>Due {new Date(invoice.due_date).toLocaleDateString()}</>}
        </p>

        <table className="doc-table">
          <thead>
            <tr><th>Item</th><th>Qty</th><th className="doc-num">Amount</th></tr>
          </thead>
          <tbody>
            {invoice.line_items.map(item => (
              <tr key={item.id}>
                <td>
                  {item.title}
                  {item.description && <div className="doc-item-desc">{item.description}</div>}
                </td>
                <td>{item.qty}</td>
                <td className="doc-num">{fmtMoney(item.qty * item.unit_price, invoice.currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="doc-totals">
          <div className="doc-totals-row"><span>Subtotal</span><span>{fmtMoney(invoice.subtotal, invoice.currency)}</span></div>
          {invoice.tax_rate > 0 && (
            <div className="doc-totals-row"><span>Tax ({(invoice.tax_rate * 100).toFixed(1)}%)</span><span>{fmtMoney(invoice.tax_amount, invoice.currency)}</span></div>
          )}
          {invoice.amount_paid > 0 && (
            <div className="doc-totals-row"><span>Paid</span><span>-{fmtMoney(invoice.amount_paid, invoice.currency)}</span></div>
          )}
          <div className="doc-totals-row doc-total"><span>{invoice.amount_paid > 0 ? 'Balance Due' : 'Total'}</span><span>{fmtMoney(balanceDue, invoice.currency)}</span></div>
        </div>

        {invoice.notes && (
          <div className="doc-notes">
            <p className="doc-notes-label">Notes</p>
            {invoice.notes}
          </div>
        )}
        {invoice.terms && (
          <div className="doc-notes">
            <p className="doc-notes-label">Terms</p>
            {invoice.terms}
          </div>
        )}

        <div className="doc-divider" />

        {invoice.status === 'paid' ? (
          <div className="doc-status-box">
            <span className="doc-status-icon">✦</span>
            <h1 className="pay-status-title">Paid</h1>
            <p className="pay-status-body">Thank you! This invoice has been paid in full.</p>
          </div>
        ) : invoice.status === 'void' ? (
          <div className="doc-status-box">
            <h1 className="pay-status-title">Void</h1>
            <p className="pay-status-body">This invoice is no longer active.</p>
          </div>
        ) : (
          <>
            {invoice.signature && (
              <div className="doc-signed-block">
                <p className="doc-notes-label">Signed by</p>
                <p>{invoice.signature.signer_name} ({invoice.signature.signer_email})</p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={invoice.signature.signature_data} alt="Signature" />
              </div>
            )}

            {needsSignature ? (
              <InvoiceSignForm token={token} />
            ) : invoice.payment_request_token ? (
              <a href={`/pay/${invoice.payment_request_token}`} className="btn btn-gold" style={{ width: '100%', justifyContent: 'center' }}>
                Pay {fmtMoney(balanceDue, invoice.currency)}
              </a>
            ) : (
              <p className="doc-notes">This invoice is not yet ready for payment. Please check back soon.</p>
            )}
          </>
        )}
      </div>
    </div>
  )
}
