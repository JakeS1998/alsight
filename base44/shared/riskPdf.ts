import { jsPDF } from 'npm:jspdf@4.2.1';
import { riskHeaders, riskValues } from './riskWorkbook.ts';
import { appendRiskPdfApprovals } from './riskPdfApprovals.ts';
export function createRiskPdf(context, rows, contingency, approvals = null) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a3' });
  const width = doc.internal.pageSize.getWidth(), height = doc.internal.pageSize.getHeight(), margin = 28;
  const ratios = [0.035,0.13,0.115,0.065,0.105,0.045,0.045,0.04,0.13,0.055,0.065,0.065,0.105];
  const widths = ratios.map(n => n * (width - margin * 2)); let y;
  const heading = () => {
    doc.setFillColor(21,20,66); doc.rect(0,0,width,42,'F'); doc.setTextColor(255); doc.setFont('helvetica','bold'); doc.setFontSize(15); doc.text(`ALSight · Project risk register${approvals ? ' · Certified export' : ''}`,margin,27);
    doc.setTextColor(21,20,66); doc.setFontSize(11); doc.text(doc.splitTextToSize(context.projectName, width - margin*2), margin,61);
    doc.setFont('helvetica','normal'); doc.setFontSize(8); doc.text(`Client: ${context.clientName} | Contractor: ${context.contractor}`,margin,87); doc.text(`Exported: ${context.date} · Weighted values are indicative, not contractual or capped.`,margin,100);
    let x = margin; y = 115; doc.setFont('helvetica','bold'); doc.setFontSize(7);
    riskHeaders.forEach((label,i) => { doc.setFillColor(235,235,242); doc.rect(x,y,widths[i],35,'F'); doc.text(doc.splitTextToSize(label,widths[i]-8),x+4,y+11); x += widths[i]; });
    y += 35; doc.setFont('helvetica','normal');
  };
  heading();
  rows.forEach(row => {
    const lines = riskValues(row).map((value,i) => doc.splitTextToSize(String(value ?? '').replace(/\u2013|\u2014/g,'-'), widths[i]-8));
    let start = 0; const count = Math.max(...lines.map(cell => cell.length),1);
    while (start < count) {
      if (height - 40 - y < 30) { doc.addPage(); heading(); }
      const take = Math.min(count-start, Math.floor((height-40-y-10)/9)); const h = take*9+10; let x = margin;
      lines.forEach((cell,i) => { doc.setDrawColor(210,210,220); doc.rect(x,y,widths[i],h); const part = cell.slice(start,start+take); if (part.length) doc.text(part,x+4,y+11); x += widths[i]; });
      y += h; start += take;
    }
  });
  if (y+35 > height-40) { doc.addPage(); heading(); }
  doc.setFont('helvetica','bold'); doc.setFontSize(10); doc.text(`Proposed client contingency: £${contingency.toLocaleString('en-GB',{minimumFractionDigits:2,maximumFractionDigits:2})}`,margin,y+22);
  if (approvals) appendRiskPdfApprovals(doc, context, approvals);
  for (let page=1;page<=doc.getNumberOfPages();page++) { doc.setPage(page); doc.setFont('helvetica','normal'); doc.setFontSize(8); doc.text(`ALSight | ${page} / ${doc.getNumberOfPages()}`,margin,height-18); }
  return new Uint8Array(doc.output('arraybuffer'));
}