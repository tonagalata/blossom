import { Document, Page, Text, View, Image } from '@react-pdf/renderer'
import type { Invoice } from '@/lib/types'
import { styles } from './styles'

function fmtMoney(cents: number, currency: string) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(cents / 100)
}

export function InvoiceDocument({ invoice }: { invoice: Invoice }) {
  const balanceDue = invoice.total - invoice.amount_paid
  return (
    <Document title={`Invoice ${invoice.invoice_number}`}>
      <Page size="A4" style={styles.page}>
        <Text style={styles.brand}>Events in Bloom</Text>
        <Text style={styles.eyebrow}>Invoice {invoice.invoice_number}</Text>
        <Text style={styles.title}>{fmtMoney(invoice.total, invoice.currency)}</Text>
        <Text style={styles.meta}>
          {invoice.issue_date ? `Issued ${new Date(invoice.issue_date).toLocaleDateString()}` : ''}
          {invoice.due_date ? `   ·   Due ${new Date(invoice.due_date).toLocaleDateString()}` : ''}
        </Text>

        <View style={styles.table}>
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.colTitle, styles.headerLabel]}>Item</Text>
            <Text style={[styles.colQty, styles.headerLabel]}>Qty</Text>
            <Text style={[styles.colAmount, styles.headerLabel]}>Amount</Text>
          </View>
          {invoice.line_items.map(item => (
            <View style={styles.tableRow} key={item.id}>
              <View style={[styles.colTitle, styles.itemRow]}>
                {item.image_url && <Image src={item.image_url} style={styles.itemImage} />}
                <View>
                  <Text>{item.title}</Text>
                  {item.description && <Text style={styles.itemDesc}>{item.description}</Text>}
                </View>
              </View>
              <Text style={styles.colQty}>{item.qty}</Text>
              <Text style={styles.colAmount}>{fmtMoney(item.qty * item.unit_price, invoice.currency)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.totals}>
          <View style={styles.totalsRow}><Text>Subtotal</Text><Text>{fmtMoney(invoice.subtotal, invoice.currency)}</Text></View>
          {invoice.tax_rate > 0 && (
            <View style={styles.totalsRow}><Text>Tax ({(invoice.tax_rate * 100).toFixed(1)}%)</Text><Text>{fmtMoney(invoice.tax_amount, invoice.currency)}</Text></View>
          )}
          {invoice.amount_paid > 0 && (
            <View style={styles.totalsRow}><Text>Paid</Text><Text>-{fmtMoney(invoice.amount_paid, invoice.currency)}</Text></View>
          )}
          <View style={styles.totalsFinal}><Text>{invoice.amount_paid > 0 ? 'Balance Due' : 'Total'}</Text><Text>{fmtMoney(balanceDue, invoice.currency)}</Text></View>
        </View>

        {invoice.notes && (
          <View><Text style={styles.notesLabel}>Notes</Text><Text style={styles.notesBody}>{invoice.notes}</Text></View>
        )}
        {invoice.terms && (
          <View><Text style={styles.notesLabel}>Terms</Text><Text style={styles.notesBody}>{invoice.terms}</Text></View>
        )}

        {invoice.signature && (
          <View style={styles.signatureBlock}>
            <Text style={styles.notesLabel}>Signed by</Text>
            <Text>{invoice.signature.signer_name} ({invoice.signature.signer_email})</Text>
            <Text style={styles.itemDesc}>{new Date(invoice.signature.signed_at).toLocaleString()}</Text>
            {invoice.signature.signature_data && <Image src={invoice.signature.signature_data} style={styles.signatureImage} />}
          </View>
        )}
      </Page>
    </Document>
  )
}
