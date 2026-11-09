import alicePdfBlocks from './alicePdfBlocks.ts';
import alicePdfTable from './alicePdfTable.ts';
import { reportStyle, reportDate } from './aliceReportStyle.ts';
export default async function alicePdfFile(name, title, content) {
  const { jsPDF } = await import('npm:jspdf@4.2.1');
  const blocks = alicePdfBlocks(content);
  const doc = new jsPDF({ unit: 'pt', format: 'a4', orientation: blocks.some(block => block.headers?.length > 4) ? 'landscape' : 'portrait' });
  doc.setProperties({ title, author: 'ALICE | ALS Hub', subject: 'Information report, draft for human review' });
  const width = doc.internal.pageSize.getWidth() - 80, bottom = doc.internal.pageSize.getHeight() - 48;
  const clean = text => String(text).replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 ($2)').replace(/\*\*|`/g, '').replace(/[\u2013\u2014]/g, '-').replace(/[\u2018\u2019]/g, "'").replace(/[\u201c\u201d]/g, '"');
  const ctx = { doc, clean, width, bottom, y: 78,
    page() { doc.addPage(); this.y = 78; },
    ensure(height) { if (this.y + height > bottom) this.page(); },
    paragraph(text, size = 10, heading = false) {
      doc.setFont('helvetica', heading ? 'bold' : 'normal'); doc.setFontSize(size); doc.setTextColor(`#${reportStyle.navy}`);
      const lines = doc.splitTextToSize(clean(text), width);
      if (heading) this.ensure(size * 1.4 * lines.length + 32);
      lines.forEach(line => { this.ensure(size * 1.45); doc.text(line, 40, this.y); this.y += size * 1.45; }); this.y += heading ? 10 : 6;
    }
  };
  ctx.paragraph(title, 22, true);
  ctx.paragraph(`Generated ${reportDate()} (UK time) | Draft for human review`, 9);
  blocks.forEach(block => block.headers ? alicePdfTable(ctx, block) : block.heading ? ctx.paragraph(block.heading, 13, true) : ctx.paragraph(block.text));
  const pages = doc.getNumberOfPages();
  for (let page = 1; page <= pages; page++) {
    doc.setPage(page); doc.setFillColor(`#${reportStyle.navy}`); doc.rect(0, 0, width + 80, 46, 'F');
    doc.setFillColor(`#${reportStyle.orange}`); doc.rect(0, 46, width + 80, 4, 'F');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(12); doc.setTextColor('#FFFFFF'); doc.text('ALS Hub | ALICE reporting', 40, 29);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(`#${reportStyle.muted}`);
    doc.text('ALICE | Information report | Draft for review', 40, bottom + 28); doc.text(`${page} / ${pages}`, width + 40, bottom + 28, { align: 'right' });
  }
  return new File([doc.output('arraybuffer')], `${name}.pdf`, { type: 'application/pdf' });
}