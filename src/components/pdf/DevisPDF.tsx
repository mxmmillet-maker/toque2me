import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const s = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: 'Helvetica', color: '#1a1a1a' },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 },
  brand: { fontSize: 20, fontWeight: 'bold', fontFamily: 'Helvetica-Bold' },
  tagline: { fontSize: 8, color: '#737373', marginTop: 2 },
  meta: { textAlign: 'right' },
  metaLine: { fontSize: 9, color: '#737373', marginBottom: 2 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 8, color: '#a3a3a3', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, fontFamily: 'Helvetica-Bold' },
  tableHeader: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#e5e5e5', paddingBottom: 6, marginBottom: 6 },
  tableRow: { flexDirection: 'row', paddingVertical: 6, borderBottomWidth: 0.5, borderBottomColor: '#f5f5f5' },
  colDesignation: { flex: 3 },
  colQty: { flex: 1, textAlign: 'center' },
  colPu: { flex: 1, textAlign: 'right' },
  colTotal: { flex: 1, textAlign: 'right' },
  thText: { fontSize: 8, color: '#a3a3a3', textTransform: 'uppercase', fontFamily: 'Helvetica-Bold' },
  tdText: { fontSize: 10 },
  tdSub: { fontSize: 8, color: '#737373', marginTop: 1 },
  totalsBox: { marginTop: 16, alignItems: 'flex-end' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', width: 200, paddingVertical: 4 },
  totalLabel: { fontSize: 10, color: '#737373' },
  totalValue: { fontSize: 10, fontFamily: 'Helvetica-Bold' },
  totalTtcRow: { flexDirection: 'row', justifyContent: 'space-between', width: 200, paddingVertical: 6, borderTopWidth: 1, borderTopColor: '#1a1a1a', marginTop: 4 },
  totalTtcLabel: { fontSize: 12, fontFamily: 'Helvetica-Bold' },
  totalTtcValue: { fontSize: 14, fontFamily: 'Helvetica-Bold' },
  footer: { position: 'absolute', bottom: 30, left: 40, right: 40 },
  footerLine: { fontSize: 7, color: '#a3a3a3', textAlign: 'center', marginBottom: 2 },
  shareBox: { marginTop: 20, padding: 12, backgroundColor: '#fafafa', borderRadius: 4 },
  shareText: { fontSize: 8, color: '#737373', textAlign: 'center' },
  shareUrl: { fontSize: 8, color: '#1a1a1a', textAlign: 'center', marginTop: 2, fontFamily: 'Helvetica-Bold' },
});

interface Ligne {
  ref: string;
  nom: string;
  categorie?: string;
  qty: number;
  prix_unitaire_ht: number;
  total_ligne_ht: number;
}

interface DevisPDFProps {
  quoteId: string;
  date: string;
  validiteDate: string;
  lignes: Ligne[];
  totalHt: number;
  tva: number;
  totalTtc: number;
  shareUrl: string;
}

export function DevisPDF({ quoteId, date, validiteDate, lignes, totalHt, tva, totalTtc, shareUrl }: DevisPDFProps) {
  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* En-tête */}
        <View style={s.header}>
          <View>
            <Text style={s.brand}>TOQUE2ME</Text>
            <Text style={s.tagline}>Textile & objets personnalisés pour professionnels</Text>
          </View>
          <View style={s.meta}>
            <Text style={s.metaLine}>Devis N° {quoteId.slice(0, 8).toUpperCase()}</Text>
            <Text style={s.metaLine}>Date : {date}</Text>
            <Text style={s.metaLine}>Validité : {validiteDate}</Text>
          </View>
        </View>

        {/* Tableau produits */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Produits</Text>
          <View style={s.tableHeader}>
            <Text style={[s.thText, s.colDesignation]}>Désignation</Text>
            <Text style={[s.thText, s.colQty]}>Qté</Text>
            <Text style={[s.thText, s.colPu]}>P.U. HT</Text>
            <Text style={[s.thText, s.colTotal]}>Total HT</Text>
          </View>
          {lignes.map((l, i) => (
            <View key={i} style={s.tableRow}>
              <View style={s.colDesignation}>
                <Text style={s.tdText}>{l.nom}</Text>
                <Text style={s.tdSub}>Réf. {l.ref}{l.categorie ? ` — ${l.categorie}` : ''}</Text>
              </View>
              <Text style={[s.tdText, s.colQty]}>{l.qty}</Text>
              <Text style={[s.tdText, s.colPu]}>{l.prix_unitaire_ht.toFixed(2)} €</Text>
              <Text style={[s.tdText, s.colTotal]}>{l.total_ligne_ht.toFixed(2)} €</Text>
            </View>
          ))}
        </View>

        {/* Totaux */}
        <View style={s.totalsBox}>
          <View style={s.totalRow}>
            <Text style={s.totalLabel}>Total HT</Text>
            <Text style={s.totalValue}>{totalHt.toFixed(2)} €</Text>
          </View>
          <View style={s.totalRow}>
            <Text style={s.totalLabel}>TVA (20%)</Text>
            <Text style={s.totalValue}>{tva.toFixed(2)} €</Text>
          </View>
          <View style={s.totalTtcRow}>
            <Text style={s.totalTtcLabel}>Total TTC</Text>
            <Text style={s.totalTtcValue}>{totalTtc.toFixed(2)} €</Text>
          </View>
        </View>

        {/* Lien de partage */}
        <View style={s.shareBox}>
          <Text style={s.shareText}>Partagez ce devis avec votre comptable ou associé :</Text>
          <Text style={s.shareUrl}>{shareUrl}</Text>
        </View>

        {/* Footer */}
        <View style={s.footer}>
          <Text style={s.footerLine}>TOQUE2ME — Textile & objets personnalisés pour professionnels</Text>
          <Text style={s.footerLine}>Devis valable 30 jours — Prix en euros, TVA 20%</Text>
          <Text style={s.footerLine}>toque2me.fr — contact@toque2me.fr</Text>
        </View>
      </Page>
    </Document>
  );
}
