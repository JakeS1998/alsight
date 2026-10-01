import { additionalFeeTotal } from '@/components/delivery/additionalFeeStages';
import { isClientFeeLine } from '@/components/delivery/feeProposalTotals';
import { FEE_BRAND } from '@/components/delivery/feeProposalBrand';

export default function drawSingleTaskFees(doc, { supplierLines, alsLines, supplierName, money, x, startY, width, height, mode = 'client' }) {
  const grouped = new Map();
  if (mode === 'client') supplierLines.forEach(line => {
    const name = `${line.role || 'Supplier'}${line.supplier_company_number ? ' — ' + supplierName(line.supplier_company_number) : ''}`;
    grouped.set(name, (grouped.get(name) || 0) + (Number(line.supplier_fee) || 0));
  });
  const rows = [...grouped].map(([name, amount]) => ({ name, amount }));
  alsLines.filter(line => mode === 'internal' || isClientFeeLine(line)).forEach(line => rows.push({ name: line.description || 'Additional fee', amount: additionalFeeTotal(line) }));
  let y = startY;
  const header = () => { doc.setFillColor(...FEE_BRAND.navy); doc.rect(x, y, width, 25, 'F'); doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.text('Single-task fee proposal', x + 7, y + 17); doc.text('Task fee', x + width - 7, y + 17, { align: 'right' }); y += 25; };
  header();
  rows.forEach((row, index) => {
    const text = doc.splitTextToSize(row.name, width - 150), size = Math.max(26, text.length * 12 + 12);
    if (y + size > height - 64) { doc.addPage(); y = 84; header(); }
    if (index % 2 === 0) { doc.setFillColor(...FEE_BRAND.silver); doc.rect(x, y, width, size, 'F'); }
    doc.setTextColor(...FEE_BRAND.navy); doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.text(text, x + 7, y + 16); doc.text(money(row.amount), x + width - 7, y + 16, { align: 'right' }); y += size;
  });
  if (!rows.length) { doc.setTextColor(...FEE_BRAND.navy); doc.text('No fees entered.', x + 7, y + 16); y += 26; }
  return { y: y + 22 };
}