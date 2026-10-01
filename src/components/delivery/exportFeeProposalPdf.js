import { jsPDF } from "jspdf";
import { formatDate } from "@/lib/portal";
import { drawFeeMatrix } from "./drawFeeMatrix";
import { feeProposalTotals } from "./feeProposalTotals";
import { FEE_BRAND, loadFeeProposalLogo, drawFeeProposalBrand } from '@/components/delivery/feeProposalBrand';
import { drawFeeProposalSummary } from '@/components/delivery/drawFeeProposalSummary';

const parseItems = (s) => { try { return JSON.parse(s) || []; } catch { return []; } };
const money = (n) => (n == null || n === "" ? "—" : `£${Number(n).toLocaleString("en-GB", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`);

export async function exportFeeProposalPdf({ project, proposal, suppliers, poBySupplier, supplierLines, contractorBuild, includeInternal = false }) {
  const logo = await loadFeeProposalLogo();
  const doc = new jsPDF({ unit: "pt", format: "a4", orientation: "landscape" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 40;
  const BRAND = FEE_BRAND.orange;
  let y = 94;
  doc.setProperties({ title: `Alliance Leisure fee proposal · ${project.name || 'Project'}`, author: 'Alliance Leisure' });
  doc.setTextColor(...FEE_BRAND.navy); doc.setFont("helvetica", "bold"); doc.setFontSize(13);
  doc.text(project.name || "Project", M, y);
  y += 18;
  doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(...FEE_BRAND.navy);
  const clientName = project.client_name || "—";
  doc.text(`Client: ${clientName}     Project no: ${project.project_number || "—"}     Revision: R${proposal.revision_number || 1}`, M, y);
  y += 13;
  doc.text(`Status: ${proposal.status || "—"}     Issued: ${formatDate(proposal.date_issued)}     Basis: ${proposal.fee_basis || "—"}`, M, y);
  y += 22;

  const supplierName = (cn) => suppliers.find((s) => s.company_number === cn)?.name || cn || "—";
  const alsLines = parseItems(proposal.line_items);
  const totals = feeProposalTotals(supplierLines, alsLines, contractorBuild);

  const x0 = M;
  drawFeeProposalSummary(doc, { supplierLines, alsLines, supplierName, contractorBuild, totals, money, x: x0, startY: y, width: W - 2 * M, brand: FEE_BRAND });
  doc.addPage(); y = 94;
  doc.setFont('helvetica', 'bold'); doc.setFontSize(16); doc.setTextColor(...FEE_BRAND.navy);
  doc.text('Detailed fee breakdown.', x0, y); y += 25;
  const matrix = drawFeeMatrix(doc, { supplierLines, alsLines, supplierName, money, x: x0, startY: y, width: W - 2 * M, height: H });
  y = matrix.y;
  if (contractorBuild && contractorBuild.hasContractor && (contractorBuild.ohpTotal || contractorBuild.total)) {
    if (y + (contractorBuild.hasStageOhp ? 110 : 70) > H - 55) { doc.addPage(); y = 84; }
    doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.setTextColor(...FEE_BRAND.navy);
    doc.text("Contractor build-up", x0, y); y += 14;
    doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(...FEE_BRAND.navy);
    if (contractorBuild.hasStageOhp) {
      contractorBuild.stageRows.forEach(row => {
        doc.text(`${row.label}: base ${money(row.base)} + OHP ${money(row.ohp)} = ${money(row.total)}`, x0, y); y += 13;
      });
    } else {
      doc.text(`Surveys & consultants (RIBA 1-4): ${money(contractorBuild.surveysBase)} + OHP ${contractorBuild.ohpSurveysType === 'fixed' ? money(contractorBuild.surveysOhp) + ' fixed fee' : contractorBuild.ohpSurveysPct + '%'} = ${money(contractorBuild.surveysTotal)}`, x0, y); y += 13;
      doc.text(`RIBA 5-7 authorised activities: ${money(contractorBuild.riba57Base)} + OHP ${contractorBuild.ohpRiba57Pct}% = ${money(contractorBuild.riba57Total)}`, x0, y); y += 13;
    }
    doc.setFont("helvetica", "bold"); doc.setTextColor(...FEE_BRAND.navy);
    doc.text(`Contractor total (with OHP): ${money(contractorBuild.total)}`, x0, y); y += 20;
  }
  if (y + 28 > H - 55) { doc.addPage(); y = 84; }
  doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.setTextColor(...FEE_BRAND.navy);
  doc.setFillColor(...BRAND); doc.rect(x0, y - 14, W - 2 * M, 24, 'F');
  doc.text(`PROJECT FEE TOTAL: ${money(totals.proposedFees)}`, x0 + 7, y);
  const clientPageCount = doc.getNumberOfPages();

  if (includeInternal) {
    doc.addPage(); y = 94;
    doc.setFont('helvetica', 'bold'); doc.setFontSize(13); doc.setTextColor(...FEE_BRAND.navy);
    doc.text("INTERNAL COMMERCIAL — NOT FOR CLIENT DISTRIBUTION", x0, y); y += 22;
    doc.setFontSize(10); doc.text(`${project.name || "Project"} · R${proposal.revision_number || 1}`, x0, y); y += 24;
    y = drawFeeMatrix(doc, { supplierLines, alsLines, supplierName, money, x: x0, startY: y, width: W - 2 * M, height: H, mode: 'internal' }).y;
    if (y + 66 > H - 55) { doc.addPage(); y = 84; }
    doc.setFont("helvetica", "bold"); doc.setFontSize(9); doc.setTextColor(...FEE_BRAND.navy);
    doc.text(`ALS fee (recorded profit): ${money(totals.alsFee)}`, x0, y); y += 16;
    doc.text(`Supplier fees: ${money(totals.supplierFees)}     Client proposal total: ${money(totals.proposedFees)}`, x0, y); y += 16;
    doc.text(`ALS fee as % of proposed fees: ${totals.alsFeePct == null ? '—' : `${totals.alsFeePct}%`}`, x0, y); y += 24;

  // Supplier vs PO comparison
  if (y + 35 > H - 55) { doc.addPage(); y = 84; }
  doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.setTextColor(...FEE_BRAND.navy);
  doc.text("Supplier fees vs Purchase Orders", x0, y); y += 14;
  doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(...FEE_BRAND.navy);
  const bySupplier = {};
  supplierLines.forEach((l) => { if (l.supplier_company_number) bySupplier[l.supplier_company_number] = (bySupplier[l.supplier_company_number] || 0) + (Number(l.supplier_fee) || 0); });
  const entries = Object.entries(bySupplier);
  if (entries.length === 0) { doc.text("No supplier fees entered.", x0, y); y += 12; }
  else {
    entries.forEach(([cn, supFee]) => {
      if (y > H - 80) { doc.addPage(); y = 84; }
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
    drawFeeProposalBrand(doc, { logo, width: W, height: H, margin: M, page, pages: doc.getNumberOfPages(), internal: page > clientPageCount });
  }

  doc.save(`Fee-Proposal-${project.project_number || project.name || "project"}-R${proposal.revision_number || 1}${includeInternal ? '-INTERNAL' : '-CLIENT'}.pdf`);
}