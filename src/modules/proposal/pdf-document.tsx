import { Document, Page, View, Text, Image, StyleSheet } from "@react-pdf/renderer"

import { formatCurrency, getDisplayAddress } from "@/lib/format"
import { PROPOSAL_STATUS_LABELS } from "@/components/admin/proposals/proposal-status-badge"
import type { ProposalDetail } from "@/modules/proposal/repository"

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, color: "#2b2320", fontFamily: "Helvetica" },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
  logo: { width: 120, height: 40, objectFit: "contain" },
  status: { fontSize: 9, color: "#7a1f2b", backgroundColor: "#f7e9ea", padding: "4 10", borderRadius: 12 },
  title: { fontSize: 18, fontFamily: "Helvetica-Bold", marginBottom: 4 },
  subtitle: { fontSize: 10, color: "#6b6259", marginBottom: 20 },
  coverImage: { width: "100%", height: 220, objectFit: "cover", borderRadius: 8, marginBottom: 16 },
  sectionTitle: { fontSize: 12, fontFamily: "Helvetica-Bold", marginTop: 18, marginBottom: 8 },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  label: { color: "#6b6259" },
  value: { fontFamily: "Helvetica-Bold" },
  table: { borderWidth: 1, borderColor: "#e5ded8", borderRadius: 6, padding: 12 },
  footer: { position: "absolute", bottom: 30, left: 40, right: 40, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  qr: { width: 64, height: 64 },
  signatureLine: { marginTop: 40, borderTopWidth: 1, borderTopColor: "#2b2320", width: 220, paddingTop: 4 },
})

export function ProposalPdfDocument({
  proposal,
  logoBase64,
  qrCodeDataUrl,
}: {
  proposal: ProposalDetail
  logoBase64: string | null
  qrCodeDataUrl: string
}) {
  const cover = proposal.property.images.find((image) => image.isCover)?.url ?? proposal.property.images[0]?.url

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerRow}>
          {logoBase64 ? <Image src={logoBase64} style={styles.logo} /> : <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 14 }}>Bebiano Imóveis</Text>}
          <Text style={styles.status}>{PROPOSAL_STATUS_LABELS[proposal.status]}</Text>
        </View>

        <Text style={styles.title}>Proposta comercial</Text>
        <Text style={styles.subtitle}>
          Preparada para {proposal.client.name} · {new Date(proposal.createdAt).toLocaleDateString("pt-BR")}
        </Text>

        {cover ? <Image src={cover} style={styles.coverImage} /> : null}

        <Text style={styles.sectionTitle}>{proposal.property.title}</Text>
        <Text style={{ color: "#6b6259", marginBottom: 8 }}>{getDisplayAddress(proposal.property)}</Text>
        <View style={styles.row}>
          <Text style={styles.label}>{proposal.property.bedrooms} dormitórios · {proposal.property.bathrooms} banheiros · {proposal.property.parkingSpots} vagas</Text>
        </View>

        <Text style={styles.sectionTitle}>Valores</Text>
        <View style={styles.table}>
          {proposal.originalValue ? (
            <View style={styles.row}>
              <Text style={styles.label}>Valor anunciado</Text>
              <Text style={styles.value}>{formatCurrency(proposal.originalValue.toString())}</Text>
            </View>
          ) : null}
          <View style={styles.row}>
            <Text style={styles.label}>Valor proposto</Text>
            <Text style={styles.value}>{formatCurrency(proposal.value.toString())}</Text>
          </View>
          {proposal.downPayment ? (
            <View style={styles.row}>
              <Text style={styles.label}>Entrada</Text>
              <Text style={styles.value}>{formatCurrency(proposal.downPayment.toString())}</Text>
            </View>
          ) : null}
          {proposal.financingValue ? (
            <View style={styles.row}>
              <Text style={styles.label}>Financiamento</Text>
              <Text style={styles.value}>{formatCurrency(proposal.financingValue.toString())}</Text>
            </View>
          ) : null}
          {proposal.fgtsValue ? (
            <View style={styles.row}>
              <Text style={styles.label}>FGTS</Text>
              <Text style={styles.value}>{formatCurrency(proposal.fgtsValue.toString())}</Text>
            </View>
          ) : null}
          {proposal.installments ? (
            <View style={styles.row}>
              <Text style={styles.label}>Parcelamento</Text>
              <Text style={styles.value}>
                {proposal.installments}x {proposal.installmentValue ? formatCurrency(proposal.installmentValue.toString()) : ""}
              </Text>
            </View>
          ) : null}
        </View>

        <Text style={styles.sectionTitle}>Condições</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Forma de pagamento</Text>
          <Text style={styles.value}>{proposal.paymentMethod ?? "—"}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Válida até</Text>
          <Text style={styles.value}>
            {proposal.validUntil ? new Date(proposal.validUntil).toLocaleDateString("pt-BR") : "—"}
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Corretor responsável</Text>
          <Text style={styles.value}>{proposal.realtor.user.name}</Text>
        </View>
        {proposal.notes ? <Text style={{ marginTop: 8, color: "#6b6259" }}>{proposal.notes}</Text> : null}

        <View style={styles.signatureLine}>
          <Text style={{ fontSize: 8, color: "#6b6259" }}>{proposal.client.name}</Text>
        </View>

        <View style={styles.footer} fixed>
          <Text style={{ fontSize: 8, color: "#6b6259" }}>Bebiano Imóveis · Mogi das Cruzes, SP</Text>
          <Image src={qrCodeDataUrl} style={styles.qr} />
        </View>
      </Page>
    </Document>
  )
}
