"use client";

import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Svg,
  Path,
  Rect,
} from "@react-pdf/renderer";
import { COMPANY } from "@/lib/defaults";
import { formatCurrency } from "@/lib/estimate";
import type { Estimate, ProjectInfo, ProposalConfig } from "@/lib/types";

const ARIAS_BLUE = "#0052CC";
const ARIAS_DARK = "#003584";
const SLATE_900 = "#0f172a";
const SLATE_700 = "#334155";
const SLATE_500 = "#64748b";
const SLATE_300 = "#cbd5e1";
const SLATE_100 = "#f1f5f9";
const SLATE_50 = "#f8fafc";

const styles = StyleSheet.create({
  page: {
    paddingTop: 56,
    paddingBottom: 70,
    paddingHorizontal: 48,
    fontSize: 10.5,
    color: SLATE_900,
    fontFamily: "Helvetica",
  },
  coverPage: {
    paddingTop: 56,
    paddingBottom: 56,
    paddingHorizontal: 48,
    fontSize: 11,
    color: SLATE_900,
    fontFamily: "Helvetica",
  },
  brandBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 6,
  },
  brandTitle: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: ARIAS_DARK,
    letterSpacing: 0.5,
  },
  brandSub: {
    fontSize: 9,
    color: SLATE_500,
    textTransform: "uppercase",
    letterSpacing: 1.4,
    marginTop: 2,
  },
  ruler: {
    height: 2,
    backgroundColor: ARIAS_BLUE,
    marginVertical: 14,
    width: 64,
  },
  coverHero: {
    marginTop: 30,
    paddingVertical: 26,
    paddingHorizontal: 26,
    borderRadius: 8,
    backgroundColor: ARIAS_BLUE,
    color: "#fff",
  },
  coverHeroLabel: {
    color: "#dbeafe",
    fontSize: 9,
    textTransform: "uppercase",
    letterSpacing: 1.6,
  },
  coverHeroTitle: {
    color: "#fff",
    fontSize: 26,
    fontFamily: "Helvetica-Bold",
    marginTop: 6,
    lineHeight: 1.2,
  },
  coverHeroProjectName: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    marginTop: 18,
  },
  coverHeroProjectAddress: {
    color: "#dbeafe",
    fontSize: 11,
    marginTop: 4,
  },
  metaGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 28,
  },
  metaCell: {
    width: "50%",
    paddingRight: 8,
    paddingBottom: 14,
  },
  metaLabel: {
    color: SLATE_500,
    fontSize: 8,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginBottom: 3,
  },
  metaValue: {
    color: SLATE_900,
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
  },
  totalCard: {
    marginTop: 18,
    padding: 18,
    borderRadius: 6,
    backgroundColor: SLATE_50,
    borderWidth: 1,
    borderColor: SLATE_300,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalLabel: {
    fontSize: 10,
    color: SLATE_500,
    textTransform: "uppercase",
    letterSpacing: 1.4,
  },
  totalAmount: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    color: ARIAS_DARK,
  },
  // body
  sectionTitle: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: ARIAS_DARK,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  sectionUnderline: {
    height: 1,
    backgroundColor: ARIAS_BLUE,
    width: 30,
    marginBottom: 10,
  },
  paragraph: {
    fontSize: 10.5,
    lineHeight: 1.5,
    color: SLATE_700,
    marginBottom: 6,
  },
  // table
  table: {
    borderWidth: 1,
    borderColor: SLATE_300,
    borderRadius: 4,
    overflow: "hidden",
  },
  tableHead: {
    flexDirection: "row",
    backgroundColor: SLATE_100,
    borderBottomWidth: 1,
    borderBottomColor: SLATE_300,
  },
  th: {
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    color: SLATE_500,
    textTransform: "uppercase",
    letterSpacing: 1.0,
    padding: 6,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: SLATE_100,
  },
  td: {
    fontSize: 10,
    padding: 6,
    color: SLATE_700,
  },
  totalsRow: {
    flexDirection: "row",
    backgroundColor: SLATE_50,
    borderTopWidth: 1,
    borderTopColor: SLATE_300,
  },
  totalsLabel: {
    fontSize: 10,
    padding: 6,
    color: SLATE_500,
    textAlign: "right",
  },
  totalsValue: {
    fontSize: 10,
    padding: 6,
    color: SLATE_900,
    fontFamily: "Helvetica-Bold",
    textAlign: "right",
  },
  grandTotalRow: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: SLATE_300,
    backgroundColor: "#eaf2ff",
  },
  // payment
  paymentRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: SLATE_100,
    paddingVertical: 6,
  },
  // exclusions
  bullet: {
    flexDirection: "row",
    marginBottom: 4,
  },
  bulletDot: {
    width: 8,
    color: ARIAS_BLUE,
  },
  bulletText: {
    flex: 1,
    fontSize: 10,
    color: SLATE_700,
    lineHeight: 1.4,
  },
  // signatures
  signatureRow: {
    flexDirection: "row",
    gap: 20,
    marginTop: 16,
  },
  signatureBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: SLATE_300,
    borderRadius: 4,
    padding: 12,
  },
  signLabel: {
    fontSize: 8.5,
    color: SLATE_500,
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  signLine: {
    height: 1,
    backgroundColor: SLATE_300,
    marginTop: 32,
  },
  signRoleName: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: SLATE_900,
    marginTop: 8,
  },
  signRoleTitle: {
    fontSize: 9,
    color: SLATE_500,
  },
  // footer
  footer: {
    position: "absolute",
    bottom: 24,
    left: 48,
    right: 48,
    borderTopWidth: 1,
    borderTopColor: SLATE_300,
    paddingTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 8.5,
    color: SLATE_500,
    textTransform: "uppercase",
    letterSpacing: 0.7,
  },
});

function LogoMarkPDF() {
  return (
    <Svg width={36} height={36} viewBox="0 0 40 40">
      <Rect width={40} height={40} rx={8} fill={ARIAS_BLUE} />
      <Path d="M11 28 L20 11 L29 28 H24.5 L20 19 L15.5 28 Z" fill="#ffffff" />
      <Rect x={17} y={24} width={6} height={2} fill={ARIAS_BLUE} />
    </Svg>
  );
}

function Footer() {
  return (
    <View style={styles.footer} fixed>
      <Text>
        {COMPANY.name} {COMPANY.tagline} - {COMPANY.license}
      </Text>
      <Text
        render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
      />
    </View>
  );
}

function BrandHeader() {
  return (
    <View style={styles.brandBar}>
      <LogoMarkPDF />
      <View>
        <Text style={styles.brandTitle}>{COMPANY.name}</Text>
        <Text style={styles.brandSub}>{COMPANY.tagline}</Text>
      </View>
    </View>
  );
}

function formatDate(s: string) {
  if (!s) return "";
  try {
    const d = new Date(s + "T00:00:00");
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return s;
  }
}

export function ProposalDocument({
  project,
  proposal,
  estimate,
}: {
  project: ProjectInfo;
  proposal: ProposalConfig;
  estimate: Estimate;
}) {
  const colWidths = {
    desc: "40%",
    qty: "10%",
    unit: "8%",
    labor: "14%",
    material: "14%",
    total: "14%",
  };

  return (
    <Document
      title={`${project.proposalNumber || "Proposal"} - ${COMPANY.name}`}
      author={COMPANY.name}
      subject="Drywall & Metal Stud Framing Proposal"
    >
      {/* COVER PAGE */}
      <Page size="LETTER" style={styles.coverPage}>
        <BrandHeader />
        <View style={styles.ruler} />
        <Text style={[styles.brandSub, { color: SLATE_500 }]}>
          {COMPANY.license} · {COMPANY.address}
        </Text>

        <View style={styles.coverHero}>
          <Text style={styles.coverHeroLabel}>Proposal &amp; Agreement</Text>
          <Text style={styles.coverHeroTitle}>
            Drywall &amp; Metal Stud Framing
          </Text>
          {project.projectName ? (
            <Text style={styles.coverHeroProjectName}>{project.projectName}</Text>
          ) : null}
          {project.projectAddress ? (
            <Text style={styles.coverHeroProjectAddress}>{project.projectAddress}</Text>
          ) : null}
        </View>

        <View style={styles.metaGrid}>
          <View style={styles.metaCell}>
            <Text style={styles.metaLabel}>Proposal #</Text>
            <Text style={styles.metaValue}>{project.proposalNumber || "—"}</Text>
          </View>
          <View style={styles.metaCell}>
            <Text style={styles.metaLabel}>Date</Text>
            <Text style={styles.metaValue}>{formatDate(project.proposalDate)}</Text>
          </View>
          <View style={styles.metaCell}>
            <Text style={styles.metaLabel}>Prepared for</Text>
            <Text style={styles.metaValue}>
              {project.clientName || "—"}
              {project.clientCompany ? ` · ${project.clientCompany}` : ""}
            </Text>
          </View>
          <View style={styles.metaCell}>
            <Text style={styles.metaLabel}>General contractor</Text>
            <Text style={styles.metaValue}>{project.generalContractor || "—"}</Text>
          </View>
          <View style={styles.metaCell}>
            <Text style={styles.metaLabel}>Prepared by</Text>
            <Text style={styles.metaValue}>{project.preparedBy || COMPANY.name}</Text>
          </View>
          <View style={styles.metaCell}>
            <Text style={styles.metaLabel}>Valid for</Text>
            <Text style={styles.metaValue}>{project.validForDays} days</Text>
          </View>
        </View>

        <View style={styles.totalCard}>
          <View>
            <Text style={styles.totalLabel}>Total proposal amount</Text>
            <Text style={{ fontSize: 9, color: SLATE_500, marginTop: 4 }}>
              Itemized breakdown on the next page
            </Text>
          </View>
          <Text style={styles.totalAmount}>{formatCurrency(estimate.grandTotal)}</Text>
        </View>

        <Footer />
      </Page>

      {/* SCOPE + PRICING */}
      <Page size="LETTER" style={styles.page}>
        <BrandHeader />
        <View style={styles.ruler} />

        <Text style={styles.sectionTitle}>Scope of Work</Text>
        <View style={styles.sectionUnderline} />
        <Text style={styles.paragraph}>{proposal.scopeOfWork}</Text>
        {proposal.notes ? (
          <Text style={[styles.paragraph, { marginTop: 6 }]}>{proposal.notes}</Text>
        ) : null}

        <Text style={[styles.sectionTitle, { marginTop: 18 }]}>Itemized Pricing</Text>
        <View style={styles.sectionUnderline} />

        <View style={styles.table}>
          <View style={styles.tableHead}>
            <Text style={[styles.th, { width: colWidths.desc }]}>Description</Text>
            <Text style={[styles.th, { width: colWidths.qty, textAlign: "right" }]}>Qty</Text>
            <Text style={[styles.th, { width: colWidths.unit }]}>Unit</Text>
            <Text style={[styles.th, { width: colWidths.labor, textAlign: "right" }]}>
              Labor
            </Text>
            <Text style={[styles.th, { width: colWidths.material, textAlign: "right" }]}>
              Material
            </Text>
            <Text style={[styles.th, { width: colWidths.total, textAlign: "right" }]}>
              Ext. Price
            </Text>
          </View>

          {estimate.lineItems.map((li, idx) => (
            <View
              key={li.rateId + idx}
              style={[
                styles.tableRow,
                idx % 2 === 1 ? { backgroundColor: SLATE_50 } : {},
              ]}
              wrap={false}
            >
              <Text style={[styles.td, { width: colWidths.desc }]}>{li.description}</Text>
              <Text style={[styles.td, { width: colWidths.qty, textAlign: "right" }]}>
                {li.quantity.toLocaleString()}
              </Text>
              <Text style={[styles.td, { width: colWidths.unit }]}>{li.unit}</Text>
              <Text style={[styles.td, { width: colWidths.labor, textAlign: "right" }]}>
                {formatCurrency(li.laborTotal)}
              </Text>
              <Text style={[styles.td, { width: colWidths.material, textAlign: "right" }]}>
                {formatCurrency(li.materialTotal)}
              </Text>
              <Text
                style={[
                  styles.td,
                  {
                    width: colWidths.total,
                    textAlign: "right",
                    fontFamily: "Helvetica-Bold",
                    color: SLATE_900,
                  },
                ]}
              >
                {formatCurrency(li.total)}
              </Text>
            </View>
          ))}

          <View style={styles.totalsRow}>
            <Text style={[styles.totalsLabel, { width: "86%" }]}>Labor subtotal</Text>
            <Text style={[styles.totalsValue, { width: "14%" }]}>
              {formatCurrency(estimate.laborSubtotal)}
            </Text>
          </View>
          <View style={styles.totalsRow}>
            <Text style={[styles.totalsLabel, { width: "86%" }]}>Material subtotal</Text>
            <Text style={[styles.totalsValue, { width: "14%" }]}>
              {formatCurrency(estimate.materialSubtotal)}
            </Text>
          </View>
          <View style={styles.grandTotalRow}>
            <Text
              style={[
                styles.totalsLabel,
                {
                  width: "86%",
                  color: ARIAS_DARK,
                  fontFamily: "Helvetica-Bold",
                  fontSize: 11,
                },
              ]}
            >
              Grand Total
            </Text>
            <Text
              style={[
                styles.totalsValue,
                { width: "14%", color: ARIAS_DARK, fontSize: 12 },
              ]}
            >
              {formatCurrency(estimate.grandTotal)}
            </Text>
          </View>
        </View>

        <Footer />
      </Page>

      {/* PAYMENT + EXCLUSIONS + SIGNATURES */}
      <Page size="LETTER" style={styles.page}>
        <BrandHeader />
        <View style={styles.ruler} />

        <Text style={styles.sectionTitle}>Payment Schedule</Text>
        <View style={styles.sectionUnderline} />
        <View style={styles.table}>
          <View style={styles.tableHead}>
            <Text style={[styles.th, { width: "55%" }]}>Milestone</Text>
            <Text style={[styles.th, { width: "15%", textAlign: "right" }]}>%</Text>
            <Text style={[styles.th, { width: "30%", textAlign: "right" }]}>Amount</Text>
          </View>
          {proposal.paymentSchedule.map((m, idx) => {
            const amount = (estimate.grandTotal * (Number(m.percent) || 0)) / 100;
            return (
              <View
                key={idx}
                style={[
                  styles.tableRow,
                  idx % 2 === 1 ? { backgroundColor: SLATE_50 } : {},
                ]}
                wrap={false}
              >
                <Text style={[styles.td, { width: "55%" }]}>{m.label}</Text>
                <Text style={[styles.td, { width: "15%", textAlign: "right" }]}>
                  {Number(m.percent).toFixed(1)}%
                </Text>
                <Text
                  style={[
                    styles.td,
                    {
                      width: "30%",
                      textAlign: "right",
                      fontFamily: "Helvetica-Bold",
                      color: SLATE_900,
                    },
                  ]}
                >
                  {formatCurrency(amount)}
                </Text>
              </View>
            );
          })}
          <View style={styles.grandTotalRow}>
            <Text
              style={[
                styles.totalsLabel,
                {
                  width: "70%",
                  color: ARIAS_DARK,
                  fontFamily: "Helvetica-Bold",
                  fontSize: 11,
                },
              ]}
            >
              Total
            </Text>
            <Text
              style={[
                styles.totalsValue,
                { width: "30%", color: ARIAS_DARK, fontSize: 11 },
              ]}
            >
              {formatCurrency(estimate.grandTotal)}
            </Text>
          </View>
        </View>

        <Text style={[styles.sectionTitle, { marginTop: 18 }]}>Exclusions</Text>
        <View style={styles.sectionUnderline} />
        <View>
          {proposal.exclusions.map((e, idx) => (
            <View key={idx} style={styles.bullet}>
              <Text style={styles.bulletDot}>•</Text>
              <Text style={styles.bulletText}>{e}</Text>
            </View>
          ))}
        </View>

        <Text style={[styles.sectionTitle, { marginTop: 18 }]}>Acceptance</Text>
        <View style={styles.sectionUnderline} />
        <Text style={styles.paragraph}>
          By signing below, the parties accept this proposal and agree to the scope,
          pricing, and payment schedule above. This proposal is valid for{" "}
          {project.validForDays} days from {formatDate(project.proposalDate)}.
        </Text>

        <View style={styles.signatureRow}>
          <View style={styles.signatureBox}>
            <Text style={styles.signLabel}>Contractor</Text>
            <View style={styles.signLine} />
            <Text style={styles.signRoleName}>{COMPANY.name}</Text>
            <Text style={styles.signRoleTitle}>{project.preparedBy || "Authorized signer"}</Text>
            <Text style={[styles.signRoleTitle, { marginTop: 2 }]}>
              Date: ____________________
            </Text>
          </View>
          <View style={styles.signatureBox}>
            <Text style={styles.signLabel}>Client</Text>
            <View style={styles.signLine} />
            <Text style={styles.signRoleName}>{project.clientName || "Client signer"}</Text>
            <Text style={styles.signRoleTitle}>
              {project.clientCompany || project.generalContractor || "Authorized signer"}
            </Text>
            <Text style={[styles.signRoleTitle, { marginTop: 2 }]}>
              Date: ____________________
            </Text>
          </View>
        </View>

        <Footer />
      </Page>
    </Document>
  );
}
