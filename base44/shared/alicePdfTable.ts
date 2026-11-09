import { reportStyle } from './aliceReportStyle.ts';
export default function alicePdfTable(ctx, block) {
  const { doc, clean, width, bottom } = ctx;
  const groups = [];
  for (let start = 0; start < block.headers.length; start += start === 0 ? 6 : 5) groups.push(start === 0 ? Array.from({ length: Math.min(6, block.headers.length) }, (_, i) => i) : [0, ...Array.from({ length: Math.min(5, block.headers.length - start) }, (_, i) => start + i)]);
  groups.forEach((indices, groupIndex) => {
    if (groupIndex) { ctx.page(); ctx.paragraph(`Table continued, columns ${indices.slice(1).map(i => i + 1).join(', ')} (first column repeated)`, 9); }
    const columnWidth = width / indices.length;
    doc.setFontSize(8); doc.setFont('helvetica', 'bold');
    const headings = indices.map(i => doc.splitTextToSize(clean(block.headers[i]), columnWidth - 12));
    const headerHeight = Math.max(...headings.map(lines => lines.length)) * 11 + 14;
    const header = () => {
      ctx.ensure(headerHeight + 25); doc.setFillColor(`#${reportStyle.navy}`); doc.rect(40, ctx.y, width, headerHeight, 'F');
      doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor('#FFFFFF');
      headings.forEach((lines, i) => doc.text(lines, 46 + i * columnWidth, ctx.y + 14, { lineHeightFactor: 1.375 }));
      ctx.y += headerHeight; doc.setFont('helvetica', 'normal'); doc.setTextColor(`#${reportStyle.navy}`);
    };
    header();
    if (!block.rows.length) ctx.paragraph('No matching rows in this report.', 10);
    block.rows.forEach((row, rowIndex) => {
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8);
      const lines = indices.map(i => doc.splitTextToSize(clean(String(row[i] ?? 'Not recorded')), columnWidth - 12));
      const total = Math.max(...lines.map(value => value.length)); let offset = 0;
      while (offset < total) {
        if (bottom - ctx.y < 25) { ctx.page(); header(); }
        const count = Math.min(total - offset, Math.max(1, Math.floor((bottom - ctx.y - 10) / 11))), height = count * 11 + 10;
        doc.setFillColor(rowIndex % 2 ? '#FFFFFF' : `#${reportStyle.pale}`); doc.rect(40, ctx.y, width, height, 'F');
        doc.setDrawColor(`#${reportStyle.border}`); doc.line(40, ctx.y + height, 40 + width, ctx.y + height);
        lines.forEach((value, i) => { const part = value.slice(offset, offset + count); if (part.length) doc.text(part, 46 + i * columnWidth, ctx.y + 12, { lineHeightFactor: 1.375 }); });
        ctx.y += height; offset += count;
      }
    });
    ctx.y += 14;
  });
}