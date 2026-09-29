import { jsPDF } from "jspdf";
import { formatDate } from "@/lib/portal";
import { drawFeeMatrix } from "./drawFeeMatrix";
import { feeProposalTotals } from "./feeProposalTotals";

const parseItems = (s) => { try { return JSON.parse(s) || []; } catch { return []; } };
const money = (n) => (n == null || n === "" ? "—" : `£${Number(n).toLocaleString("en-GB", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`);

export function exportFeeProposalPdf({ project, proposal, suppliers, poBySupplier, supplierLines, includeInternal = false }) {
  const doc = new jsPDF({ unit: "pt", format: "a4", orientation: "landscape" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 40;
  const BRAND = [234, 88, 12];
  let y = 0;

  doc.setFillColor(...BRAND); doc.rect(0, 0, W, 56, "F");
  doc.setTextColor(255, 255, 255); doc.setFont("helvetica", "bold"); doc.setFontSize(16);
  doc.text("ALSight", M, 34);
  doc.setFont("helvetica", "normal"); doc.setFontSize(11);
  doc.text("Fee Proposal", W - M, 34, { align: "right" });

  y = 84;
  doc.setTextColor(15, 23, 42); doc.setFont("helvetica", "bold"); doc.setFontSize(13);
  doc.text(project.name || "Project", M, y);
  y += 18;
  doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(100, 116, 139);
  const clientName = project.client_name || "—";
  doc.text(`Client: ${clientName}     Project no: ${project.project_number || "—"}     Revision: R${proposal.revision_number || 1}`, M, y);
  y += 13;
  doc.text(`Status: ${proposal.status || "—"}     Issued: ${formatDate(proposal.date_issued)}     Basis: ${proposal.fee_basis || "—"}`, M, y);
  y += 22;

  const supplierName = (cn) => suppliers.find((s) => s.company_number === cn)?.name || cn || "—";
  const alsLines = parseItems(proposal.line_items);
  const totals = feeProposalTotals(supplierLines, alsLines);

  const x0 = M;
  const matrix = drawFeeMatrix(doc, { supplierLines, alsLines, supplierName, money, x: x0, startY: y, width: W - 2 * M, height: H });
  y = matrix.y;
  if (y + 28 > H - 55) { doc.addPage(); y = 60; }
  doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.setTextColor(15, 23, 42);
  doc.text(`Total proposed fees: ${money(totals.proposedFees)}`, x0, y);
  const clientPageCount = doc.getNumberOfPages();

  if (includeInternal) {
    doc.addPage(); y = 84;
    doc.setFillColor(...BRAND); doc.rect(0, 0, W, 56, "F");
    doc.setFont("helvetica", "bold"); doc.setFontSize(16); doc.setTextColor(255, 255, 255);
    doc.text("ALSight", M, 34);
    doc.setFontSize(11); doc.text("Internal commercial", W - M, 34, { align: "right" });
    doc.setFontSize(13); doc.setTextColor(15, 23, 42);
    doc.text("INTERNAL COMMERCIAL — NOT FOR CLIENT DISTRIBUTION", x0, y); y += 22;
    doc.setFontSize(10); doc.text(`${project.name || "Project"} · R${proposal.revision_number || 1}`, x0, y); y += 24;
    y = drawFeeMatrix(doc, { supplierLines, alsLines, supplierName, money, x: x0, startY: y, width: W - 2 * M, height: H, mode: 'internal' }).y;
    if (y + 66 > H - 55) { doc.addPage(); y = 60; }
    doc.setFont("helvetica", "bold"); doc.setFontSize(9); doc.setTextColor(15, 23, 42);
    doc.text(`ALS fee (recorded profit): ${money(totals.alsFee)}`, x0, y); y += 16;
    doc.text(`Supplier fees: ${money(totals.supplierFees)}     Client proposal total: ${money(totals.proposedFees)}`, x0, y); y += 16;
    doc.text(`ALS fee as % of proposed fees: ${totals.alsFeePct == null ? '—' : `${totals.alsFeePct}%`}`, x0, y); y += 24;

  // Supplier vs PO comparison
  if (y + 35 > H - 55) { doc.addPage(); y = 60; }
  doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.setTextColor(15, 23, 42);
  doc.text("Supplier fees vs Purchase Orders", x0, y); y += 14;
  doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(51, 65, 85);
  const bySupplier = {};
  supplierLines.forEach((l) => { if (l.supplier_company_number) bySupplier[l.supplier_company_number] = (bySupplier[l.supplier_company_number] || 0) + (Number(l.supplier_fee) || 0); });
  const entries = Object.entries(bySupplier);
  if (entries.length === 0) { doc.text("No supplier fees entered.", x0, y); y += 12; }
  else {
    entries.forEach(([cn, supFee]) => {
      if (y > H - 80) { doc.addPage(); y = 60; }
      const poTotal = poBySupplier[cn] || 0;
      const diff = supFee - poTotal;
      const flag = poTotal === 0 ? "no PO" : diff > 0 ? `OVER PO by ${money(Math.abs(diff))}` : diff < 0 ? `under PO by ${money(Math.abs(diff))}` : "matches PO";
      doc.text(`${supplierName(cn)}: proposal ${money(supFee)} vs PO ${money(poTotal)} — ${flag}`, x0, y);
      y += 13;
    });
  }

  }

  for (let page = 1; page <= doc.getNumberOfPages(); page++) {
    doc.setPage(page);
    doc.setFontSize(8); doc.setTextColor(148, 163, 184);
    doc.text(`ALSight · ${page <= clientPageCount ? 'Client copy' : 'INTERNAL — NOT FOR CLIENT DISTRIBUTION'} · ${new Date().toLocaleDateString("en-GB")}`, M, H - 24);
  }

  doc.save(`Fee-Proposal-${project.project_number || project.name || "project"}-R${proposal.revision_number || 1}${includeInternal ? '-INTERNAL' : '-CLIENT'}.pdf`);
}