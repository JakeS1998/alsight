import { fsfBandLabels, supplierFsfTotals } from '@/components/delivery/supplierFsf';
import { FEE_BRAND } from '@/components/delivery/feeProposalBrand';
export default function drawSupplierFsf(doc, { rates, contractors, alsFee, supplierName, money, x, startY, height }) {
  const fsf = supplierFsfTotals(rates, contractors);
  let y = startY;
  const room = needed => { if (y + needed > height - 60) { doc.addPage(); y = 84; } };
  room(45); doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(...FEE_BRAND.navy);
  doc.text('Supplier FSF commission — ALS INTERNAL ONLY', x, y); y += 17;
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
  fsf.rows.forEach(row => row.bands.forEach(band => {
    const text = doc.splitTextToSize(`${supplierName(row.supplier)} · ${fsfBandLabels[band.key]}: fees including OHP ${money(band.base)} · FSF ${band.pct}% · Commission ${money(band.commission)}`, 730);
    room(text.length * 12 + 8); doc.text(text, x, y); y += text.length * 12 + 5;
  }));
  room(50); doc.setFont('helvetica', 'bold');
  doc.text(`Supplier FSF commission: ${money(fsf.total)}`, x, y); y += 16;
  doc.text(`Total ALS Value (ALS fee + FSF): ${money(alsFee + fsf.total)}`, x, y); y += 24;
  return y;
}