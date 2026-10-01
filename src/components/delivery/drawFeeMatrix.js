import { isClientFeeLine } from '@/components/delivery/feeProposalTotals';
import proposalSupplierGroups from '@/components/delivery/proposalSupplierGroups';
import { additionalFeeStages } from '@/components/delivery/additionalFeeStages';
import { FEE_BRAND } from '@/components/delivery/feeProposalBrand';

const STAGES = ['RIBA 1', 'RIBA 2', 'RIBA 3', 'RIBA 4', 'RIBA 5-7'];

export function drawFeeMatrix(doc, { supplierLines, alsLines, supplierName, money, x, startY, width, height, mode = 'client', includeRiba57 = true }) {
  const visibleStages = includeRiba57 ? STAGES : STAGES.slice(0, 4);
  const widths = [width - visibleStages.length * 78 - 160, ...visibleStages.map(() => 78), 70, 90];
  const headers = ['Project element / consultant', ...visibleStages, 'Other', 'Total'];
  const supplierGroups = proposalSupplierGroups(supplierLines, supplierName);
  const alsRows = new Map();
  alsLines.filter(line => mode === 'internal' || isClientFeeLine(line)).forEach(line => {
    Object.entries(additionalFeeStages(line)).forEach(([stageLabel, value]) => {
      const stage = STAGES.indexOf(stageLabel);
      const name = `${line.description || 'ALS fee'}${stage < 0 && stageLabel !== 'Other' ? ` (${stageLabel})` : ''}`;
      if (!alsRows.has(name)) alsRows.set(name, { name, role: '', amounts: Array(6).fill(0) });
      alsRows.get(name).amounts[stage < 0 ? 5 : stage] += Number(value) || 0;
    });
  });
  let y = startY;
  const pageBreak = needed => { if (y + needed > height - 64) { doc.addPage(); y = 84; return true; } return false; };
  const header = () => {
    doc.setFillColor(...FEE_BRAND.navy); doc.rect(x, y, width, 26, 'F');
    doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(8);
    let cursor = x;
    headers.forEach((label, i) => { doc.text(label, i === 0 ? cursor + 7 : cursor + widths[i] - 7, y + 17, i === 0 ? {} : { align: 'right' }); cursor += widths[i]; });
    y += 26;
  };
  const row = (data, index, isTotal = false) => {
    doc.setFontSize(8); doc.setFont('helvetica', isTotal ? 'bold' : 'normal');
    const main = doc.splitTextToSize(data.name, widths[0] - 14);
    const role = data.role ? doc.splitTextToSize(data.role, widths[0] - 14) : [];
    const rowHeight = Math.max(26, 10 + (main.length + role.length) * 10);
    if (pageBreak(rowHeight)) header();
    if (isTotal || index % 2 === 0) { doc.setFillColor(...(isTotal ? FEE_BRAND.lightOrange : FEE_BRAND.silver)); doc.rect(x, y, width, rowHeight, 'F'); }
    doc.setDrawColor(...FEE_BRAND.silver); doc.line(x, y + rowHeight, x + width, y + rowHeight);
    doc.setTextColor(...FEE_BRAND.navy); doc.setFont('helvetica', isTotal ? 'bold' : 'normal'); doc.text(main, x + 7, y + 14);
    if (role.length) { doc.setTextColor(...FEE_BRAND.navy); doc.text(role, x + 7, y + 14 + main.length * 10); }
    const amounts = (data.amounts || Array(6).fill(0)).filter((_, index) => includeRiba57 || index !== 4);
    const total = amounts.reduce((sum, amount) => sum + amount, 0);
    let cursor = x + widths[0];
    [...amounts, total].forEach((amount, i) => { doc.setTextColor(...FEE_BRAND.navy); doc.text(money(amount), cursor + widths[i + 1] - 7, y + 14, { align: 'right' }); cursor += widths[i + 1]; });
    y += rowHeight;
  };
  const section = (title, rows, totalLabel) => {
    pageBreak(85);
    doc.setTextColor(...FEE_BRAND.navy); doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.text(title, x, y + 11); y += 19;
    header();
    if (!rows.length) row({ name: 'No fees entered', role: '', amounts: Array(6).fill(0) }, 0);
    rows.forEach((entry, i) => row(entry, i));
    const totals = Array(6).fill(0);
    rows.forEach(entry => entry.amounts.forEach((amount, i) => { totals[i] += amount; }));
    row({ name: totalLabel, role: '', amounts: totals }, 0, true);
    y += 22;
    return totals.reduce((sum, amount) => sum + amount, 0);
  };
  if (mode === 'client') {
    section('Consultants / professional services', supplierGroups.consultant, 'SUB-TOTAL PROFESSIONAL SERVICES');
    section('Surveys & investigations', supplierGroups.survey, 'SUB-TOTAL SURVEYS & INVESTIGATIONS');
    if (supplierGroups.authorised_activity.length) section('Contractor authorised activities (RIBA 5-7)', supplierGroups.authorised_activity, 'SUB-TOTAL AUTHORISED ACTIVITIES');
    if (supplierGroups.delivery.length) section('Delivery services', supplierGroups.delivery, 'SUB-TOTAL DELIVERY SERVICES');
    section('ALS & additional fees', [...alsRows.values()], 'SUB-TOTAL ALS & ADDITIONAL FEES');
  } else {
    section('ALS & internal fee breakdown', [...alsRows.values()], 'Total recorded fees');
  }
  return { y };
}