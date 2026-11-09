import aliceExcelFile, { parseAliceExcel } from './aliceExcelFile.ts';
import alicePdfFile from './alicePdfFile.ts';

export async function aliceDocumentFile(title, content, format) {
  const name = title.replace(/[^a-zA-Z0-9 _-]/g, '').trim().slice(0, 80) || 'ALICE document';
  if (format === 'xlsx') return aliceExcelFile(name, parseAliceExcel(content), title);
  if (format === 'txt') return new File([`${title}\n\n${content}`], `${name}.txt`, { type: 'text/plain;charset=utf-8' });
  if (format === 'docx') {
    const { Document, Packer, Paragraph, TextRun, HeadingLevel } = await import('npm:docx@9.5.1');
    const children = [new Paragraph({ text: title, heading: HeadingLevel.TITLE }), ...content.split('\n').map(line => {
      const heading = line.match(/^(#{1,3})\s+(.+)/);
      return heading ? new Paragraph({ text: heading[2], heading: [HeadingLevel.HEADING_1, HeadingLevel.HEADING_2, HeadingLevel.HEADING_3][heading[1].length - 1] }) : new Paragraph({ children: [new TextRun(line)], spacing: { after: 120 } });
    })];
    const bytes = await Packer.toBuffer(new Document({ sections: [{ children }] }));
    return new File([new Uint8Array(bytes)], `${name}.docx`, { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
  }
  return alicePdfFile(name, title, content);
}