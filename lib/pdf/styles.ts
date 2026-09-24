import { StyleSheet } from '@react-pdf/renderer'

export const colors = {
  text: '#1C1A18',
  textMid: '#5A5650',
  textLight: '#9A9088',
  gold: '#B8946A',
  border: '#D0C8BE',
  bg: '#F5F0EB',
}

export const styles = StyleSheet.create({
  page: { padding: 48, fontSize: 10, color: colors.text, fontFamily: 'Helvetica' },
  brand: { fontSize: 16, fontFamily: 'Helvetica-Oblique', marginBottom: 4 },
  logoWrap: { marginBottom: 12 },
  eyebrow: { fontSize: 8, color: colors.textLight, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 20 },
  title: { fontSize: 20, marginBottom: 4 },
  meta: { fontSize: 9, color: colors.textMid, marginBottom: 24 },
  table: { marginBottom: 20 },
  tableHeaderRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.border, paddingBottom: 6, marginBottom: 6 },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.border, paddingVertical: 8 },
  colTitle: { flex: 5 },
  colQty: { flex: 1, textAlign: 'right' },
  colAmount: { flex: 2, textAlign: 'right' },
  headerLabel: { fontSize: 8, color: colors.textLight, textTransform: 'uppercase', letterSpacing: 1 },
  itemDesc: { fontSize: 8, color: colors.textLight, marginTop: 2 },
  itemRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  itemImage: { width: 32, height: 32, objectFit: 'cover' },
  totals: { alignItems: 'flex-end', marginBottom: 24 },
  totalsRow: { flexDirection: 'row', justifyContent: 'space-between', width: 200, fontSize: 9, color: colors.textMid, marginBottom: 3 },
  totalsFinal: { flexDirection: 'row', justifyContent: 'space-between', width: 200, fontSize: 14, color: colors.text, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 6, marginTop: 3 },
  notesLabel: { fontSize: 8, color: colors.textLight, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  notesBody: { fontSize: 9, color: colors.textMid, marginBottom: 16, lineHeight: 1.5 },
  signatureBlock: { marginTop: 24, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 16 },
  signatureImage: { width: 160, height: 48, marginTop: 6 },
})
