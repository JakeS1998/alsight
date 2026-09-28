import { isAlsFeeLine } from './feeProposalTotals';

const STAGES = ['RIBA 1', 'RIBA 2', 'RIBA 3', 'RIBA 4', 'RIBA 5-7'];

export function drawFeeMatrix(doc, { supplierLines, alsLines, supplierName, money, x, startY, width, height, mode = 'client' }) {
  const widths = [width - 550, 78, 78, 78, 78, 78, 70, 90];
  const headers = ['Supplier / role', ...STAGES, 'Other', 'Total'];
  const supplierRows = new Map();
  supplierLines.forEach(line => {
    const role = line.role || line.description?.split(' — ')[0] || 'Supplier';
    const name = supplierName(line.supplier_company_number);
    const key = `${line.supplier_company_number || name}\u0000${role}`;
    if (!supplierRows.has(key)) supplierRows.set(key, { name, role, amounts: Array(6).fill(0) });
    const stage = STAGES.indexOf(line.riba_stage);
    supplierRows.get(key).amounts[stage < 0 ? 5 : stage] += Number(line.supplier_fee) || 0;
  });
  const alsRows = new Map();
  alsLines.filter(line => mode === 'internal' || isAlsFeeLine(line)).forEach(line => {
    const stage = STAGES.indexOf(line.riba_stage);
    const name = `${line.description || 'ALS fee'}${stage < 0 && line.riba_stage ? ` (${line.riba_stage})` : ''}`;
    if (!alsRows.has(name)) alsRows.set(name, { name, role: '', amounts: Array(6).fill(0) });
    alsRows.get(name).amounts[stage < 0 ? 5 : stage] += Number(line.internal_fee) || 0;
  });
  let y = startY;
  const pageBreak = needed => { if (y + needed > height - 64) { doc.addPage(); y = 55; return true; } return false; };
  const header = () => {
    doc.setFillColor(230, 235, 241); doc.rect(x, y, width, 26, 'F');
    doc.setTextColor(15, 23, 42); doc.setFont('helvetica', 'bold'); doc.setFontSize(8);
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
    if (isTotal || index % 2 === 0) { doc.setFillColor(isTotal ? 230 : 248, isTotal ? 235 : 250, isTotal ? 241 : 252); doc.rect(x, y, width, rowHeight, 'F'); }
    doc.setDrawColor(226, 232, 240); doc.line(x, y + rowHeight, x + width, y + rowHeight);
    doc.setTextColor(15, 23, 42); doc.setFont('helvetica', isTotal ? 'bold' : 'normal'); doc.text(main, x + 7, y + 14);
    if (role.length) { doc.setTextColor(100, 116, 139); doc.text(role, x + 7, y + 14 + main.length * 10); }
    const amounts = data.amounts || Array(6).fill(0);
    const total = amounts.reduce((sum, amount) => sum + amount, 0);
    let cursor = x + widths[0];
    [...amounts, total].forEach((amount, i) => { doc.setTextColor(15, 23, 42); doc.text(amount || isTotal ? money(amount) : '—', cursor + widths[i + 1] - 7, y + 14, { align: 'right' }); cursor += widths[i + 1]; });
    y += rowHeight;
  };
  const section = (title, rows, totalLabel) => {
    pageBreak(85);
    doc.setTextColor(15, 23, 42); doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.text(title, x, y + 11); y += 19;
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
    section('Proposed supplier fees', [...supplierRows.values()], 'Total supplier fees');
    section('ALS fee', [...alsRows.values()], 'Total ALS fee');
  } else {
    section('ALS & internal fee breakdown', [...alsRows.values()], 'Total recorded fees');
  }
  return { y };
}