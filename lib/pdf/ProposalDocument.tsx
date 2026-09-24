import { Document, Page, Text, View, Image } from '@react-pdf/renderer'
import type { Proposal } from '@/lib/types'
import { styles } from './styles'
import { Logo } from './Logo'

function fmtMoney(cents: number, currency: string) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(cents / 100)
}

export function ProposalDocument({ proposal }: { proposal: Proposal }) {
  return (
    <Document title={`Proposal - ${proposal.title}`}>
      <Page size="A4" style={styles.page}>
        <View style={styles.logoWrap}>
          <Logo width={130} />
        </View>
        <Text style={styles.eyebrow}>Proposal</Text>
        <Text style={styles.title}>{proposal.title}</Text>
        <Text style={styles.meta}>
          {proposal.event_date ? `Event date: ${new Date(proposal.event_date).toLocaleDateString()}` : ''}
          {proposal.valid_until ? `   ·   Valid until ${new Date(proposal.valid_until).toLocaleDateString()}` : ''}
        </Text>

        <View style={styles.table}>
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.colTitle, styles.headerLabel]}>Item</Text>
            <Text style={[styles.colQty, styles.headerLabel]}>Qty</Text>
            <Text style={[styles.colAmount, styles.headerLabel]}>Amount</Text>
          </View>
          {proposal.line_items.map(item => (
            <View style={styles.tableRow} key={item.id}>
              <View style={[styles.colTitle, styles.itemRow]}>
                {item.image_url && <Image src={item.image_url} style={styles.itemImage} />}
                <View>
                  <Text>{item.title}</Text>
                  {item.description && <Text style={styles.itemDesc}>{item.description}</Text>}
                </View>
              </View>
              <Text style={styles.colQty}>{item.qty}</Text>
              <Text style={styles.colAmount}>{fmtMoney(item.qty * item.unit_price, proposal.currency)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.totals}>
          <View style={styles.totalsRow}><Text>Subtotal</Text><Text>{fmtMoney(proposal.subtotal, proposal.currency)}</Text></View>
          {proposal.tax_rate > 0 && (
            <View style={styles.totalsRow}><Text>Tax ({(proposal.tax_rate * 100).toFixed(1)}%)</Text><Text>{fmtMoney(proposal.tax_amount, proposal.currency)}</Text></View>
          )}
          <View style={styles.totalsFinal}><Text>Total</Text><Text>{fmtMoney(proposal.total, proposal.currency)}</Text></View>
        </View>

        {proposal.notes && (
          <View><Text style={styles.notesLabel}>Notes</Text><Text style={styles.notesBody}>{proposal.notes}</Text></View>
        )}
        {proposal.terms && (
          <View><Text style={styles.notesLabel}>Terms</Text><Text style={styles.notesBody}>{proposal.terms}</Text></View>
        )}

        {proposal.signature && (
          <View style={styles.signatureBlock}>
            <Text style={styles.notesLabel}>Signed by</Text>
            <Text>{proposal.signature.signer_name} ({proposal.signature.signer_email})</Text>
            <Text style={styles.itemDesc}>{new Date(proposal.signature.signed_at).toLocaleString()}</Text>
            {proposal.signature.signature_data && <Image src={proposal.signature.signature_data} style={styles.signatureImage} />}
          </View>
        )}
      </Page>
    </Document>
  )
}
