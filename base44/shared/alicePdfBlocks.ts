import { parseAliceExcel } from './aliceExcelFile.ts';
import { reportValue } from './aliceReportStyle.ts';
const cells = line => line.trim().replace(/^\|/, '').replace(/\|$/, '').split(/(?<!\\)\|/).map(value => value.trim().replace(/\\\|/g, '|'));
export default function alicePdfBlocks(content) {
  const table = parseAliceExcel(content);
  if (table) return [
    ...(table.scope ? [{ heading: 'Report scope' }, { text: table.scope }] : []),
    ...(table.summary ? [{ heading: 'Summary' }, { text: table.summary }] : []),
    { heading: 'Report data' }, { headers: table.headers, rows: table.rows.map(row => row.map((value, i) => reportValue(value, table.columnFormats?.[i]))) },
    ...(table.notes?.length ? [{ heading: 'Notes and limitations' }, ...table.notes.map(text => ({ text }))] : []),
    ...(table.sources?.length ? [{ heading: 'Sources' }, ...table.sources.map(text => ({ text }))] : [])
  ];
  const lines = content.split('\n'), blocks = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i], next = lines[i + 1];
    if (line.includes('|') && next && cells(next).every(value => /^:?-{3,}:?$/.test(value))) {
      const headers = cells(line), rows = []; i += 2;
      while (i < lines.length && lines[i].includes('|') && lines[i].trim()) {
        const row = cells(lines[i]); rows.push(headers.map((_, index) => row[index] ?? '')); i++;
      }
      i--; blocks.push({ headers, rows });
    } else if (/^#{1,6}\s/.test(line)) blocks.push({ heading: line.replace(/^#{1,6}\s+/, '') });
    else blocks.push({ text: line.replace(/^\s*[-*]\s+/, '• ') });
  }
  return blocks;
}