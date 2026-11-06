import { jsPDF } from 'npm:jspdf@4.2.1';
import aliceExcelFile, { parseAliceExcel } from './aliceExcelFile.ts';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'npm:docx@9.5.1';

export async function aliceDocumentFile(title, content, format) {
  const name = title.replace(/[^a-zA-Z0-9 _-]/g, '').trim().slice(0, 80) || 'ALICE document';
  if (format === 'xlsx') return aliceExcelFile(name, parseAliceExcel(content));
  if (format === 'txt') return new File([`${title}\n\n${content}`], `${name}.txt`, { type: 'text/plain;charset=utf-8' });
  if (format === 'docx') {
    const children = [new Paragraph({ text: title, heading: HeadingLevel.TITLE }), ...content.split('\n').map(line => {
      const heading = line.match(/^(#{1,3})\s+(.+)/);
      return heading ? new Paragraph({ text: heading[2], heading: [HeadingLevel.HEADING_1, HeadingLevel.HEADING_2, HeadingLevel.HEADING_3][heading[1].length - 1] }) : new Paragraph({ children: [new TextRun(line)], spacing: { after: 120 } });
    })];
    const bytes = await Packer.toBuffer(new Document({ sections: [{ children }] }));
    return new File([new Uint8Array(bytes)], `${name}.docx`, { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
  }
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const clean = text => text.replace(/[\u2013\u2014]/g, '-').replace(/[\u2018\u2019]/g, "'").replace(/[\u201c\u201d]/g, '"').replace(/\u2022/g, '-');
  let y = 48;
  for (const [index, line] of [title, '', ...content.split('\n')].entries()) {
    const heading = line.match(/^#{1,3}\s+/);
    const size = index === 0 ? 19 : heading ? 13 : 10;
    doc.setFont('helvetica', index === 0 || heading ? 'bold' : 'normal');
    doc.setFontSize(size);
    for (const wrapped of doc.splitTextToSize(clean(line.replace(/^#{1,3}\s+/, '')), 499)) {
      if (y + size * 1.4 > 790) { doc.addPage(); y = 48; }
      doc.text(wrapped, 48, y); y += size * 1.4;
    }
    y += 6;
  }
  const count = doc.getNumberOfPages();
  for (let page = 1; page <= count; page++) { doc.setPage(page); doc.setFontSize(8); doc.text(`ALICE | Draft for review | ${page} / ${count}`, 48, 820); }
  return new File([doc.output('arraybuffer')], `${name}.pdf`, { type: 'application/pdf' });
}