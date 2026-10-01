import proposalSupplierGroups from '@/components/delivery/proposalSupplierGroups';
import { additionalFeeTotal } from '@/components/delivery/additionalFeeStages';
import { isClientFeeLine } from '@/components/delivery/feeProposalTotals';
export function drawFeeProposalSummary(doc, { supplierLines, alsLines, supplierName, contractorBuild, totals, money, x, startY, width, brand, includeRiba57 = true }) {
  const groups = proposalSupplierGroups(supplierLines, supplierName);
  const sum = rows => rows.reduce((value, row) => value + row.amounts.reduce((a, b) => a + b, 0), 0);
  const rows = [
    ['Consultants / professional services', sum(groups.consultant)],
    ['Surveys & investigations', sum(groups.survey)],
    ...(includeRiba57 ? [['Contractor authorised activities (RIBA 5–7)', sum(groups.authorised_activity)]] : []),
    ['Delivery services', sum(groups.delivery)],
    ['ALS & additional fees', alsLines.filter(isClientFeeLine).reduce((value, line) => value + additionalFeeTotal(line), 0)],
    ['Contractor OHP', contractorBuild?.ohpTotal || 0],
  ];
  let y = startY;
  doc.setFont('helvetica', 'bold'); doc.setFontSize(23); doc.setTextColor(...brand.navy);
  doc.text('Fee summary', x, y);
  doc.setTextColor(...brand.orange); doc.text('.', x + doc.getTextWidth('Fee summary'), y); y += 22;
  doc.setFontSize(9); doc.setTextColor(...brand.navy); doc.text('FEE CATEGORY', x + 10, y); doc.text('PROPOSED FEE', x + width - 10, y, { align: 'right' }); y += 12;
  rows.forEach(([label, amount], index) => {
    if (index % 2 === 0) { doc.setFillColor(...brand.silver); doc.rect(x, y, width, 31, 'F'); }
    doc.setFont('helvetica', 'normal'); doc.setFontSize(11); doc.setTextColor(...brand.navy);
    doc.text(label, x + 10, y + 20); doc.text(money(amount), x + width - 10, y + 20, { align: 'right' }); y += 31;
  });
  y += 12; doc.setFillColor(...brand.orange); doc.rect(x, y, width, 43, 'F');
  doc.setFont('helvetica', 'bold'); doc.setTextColor(...brand.navy); doc.setFontSize(12);
  doc.text('PROJECT FEE TOTAL', x + 10, y + 27); doc.setFontSize(19); doc.text(money(totals.proposedFees), x + width - 10, y + 28, { align: 'right' });
}