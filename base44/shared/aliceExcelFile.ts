import aliceExcelOverview from './aliceExcelOverview.ts';
import { reportStyle } from './aliceReportStyle.ts';

export function parseAliceExcel(content) {
  let table;
  try { table = JSON.parse(content); } catch { return null; }
  if (!table || !Array.isArray(table.headers) || table.headers.length < 1 || table.headers.length > 50 || !table.headers.every(value => typeof value === 'string' && value.trim() && value.length <= 200)) return null;
  if (new Set(table.headers.map(value => value.trim().toLowerCase())).size !== table.headers.length) return null;
  if (!Array.isArray(table.rows) || table.rows.length > 1000 || !table.rows.every(row => Array.isArray(row) && row.length === table.headers.length && row.every(value => value === null || typeof value === 'boolean' || (typeof value === 'number' && Number.isFinite(value)) || (typeof value === 'string' && value.length <= 4000)))) return null;
  if (table.sheetName !== undefined && (typeof table.sheetName !== 'string' || !table.sheetName.trim() || table.sheetName.length > 31 || /[\\/?*\[\]:]/.test(table.sheetName) || /^'|'$/.test(table.sheetName))) return null;
  if (['summary', 'scope'].some(key => table[key] !== undefined && (typeof table[key] !== 'string' || table[key].length > 4000))) return null;
  if (['notes', 'sources'].some(key => table[key] !== undefined && (!Array.isArray(table[key]) || table[key].length > 30 || !table[key].every(value => typeof value === 'string' && value.length <= 2000)))) return null;
  if (table.columnFormats !== undefined && (!Array.isArray(table.columnFormats) || table.columnFormats.length !== table.headers.length || !table.columnFormats.every(value => ['text', 'number', 'integer', 'gbp', 'percent', 'date'].includes(value)))) return null;
  return table;
}

export default async function aliceExcelFile(name, table, title = name) {
  const { default: ExcelJS } = await import('npm:exceljs@4.4.0');
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'ALICE | ALS Hub'; workbook.created = new Date();
  aliceExcelOverview(workbook, title, table);
  const sheetName = table.sheetName?.toLowerCase() === 'report overview' ? 'Report data' : table.sheetName || 'Report data';
  const sheet = workbook.addWorksheet(sheetName, { views: [{ state: 'frozen', ySplit: 1 }] });
  const rows = table.rows.map(row => row.map((value, i) => table.columnFormats?.[i] === 'date' && typeof value === 'string' && /^\d{4}-\d{2}-\d{2}(T.*)?$/.test(value) && Number.isFinite(Date.parse(value)) ? new Date(value) : value));
  if (rows.length) sheet.addTable({ name: 'AliceTable', ref: 'A1', headerRow: true, style: { theme: 'TableStyleMedium2', showRowStripes: true }, columns: table.headers.map(name => ({ name, filterButton: true })), rows });
  else { sheet.addRow(table.headers); sheet.autoFilter = { from: 'A1', to: { row: 1, column: table.headers.length } }; }
  const formats = { gbp: '"£"#,##0.00;[Red]("£"#,##0.00)', number: '#,##0.00', integer: '#,##0', percent: '0.00%', date: 'dd mmm yyyy', text: '@' };
  sheet.columns.forEach((column, i) => {
    column.width = Math.min(55, Math.max(16, ...[table.headers[i], ...table.rows.map(row => row[i])].map(value => String(value ?? '').length + 3)));
    column.alignment = { vertical: 'top', wrapText: true };
    if (table.columnFormats?.[i]) column.numFmt = formats[table.columnFormats[i]];
  });
  sheet.eachRow((row, index) => {
    row.font = { name: 'Arial', size: 10, color: { argb: reportStyle.navy } };
    row.height = Math.min(240, Math.max(24, ...row.values.slice(1).map((value, i) => Math.ceil(String(value ?? '').length / Math.max(10, sheet.getColumn(i + 1).width - 3)) * 14 + 8)));
    if (index === 1) { row.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFF' } }; row.eachCell(cell => { cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: reportStyle.navy } }; }); }
  });
  sheet.pageSetup = { paperSize: 9, orientation: table.headers.length > 5 ? 'landscape' : 'portrait', fitToPage: true, fitToWidth: 1, fitToHeight: 0 };
  sheet.pageSetup.printTitlesRow = '1:1';
  sheet.headerFooter.oddFooter = '&LALICE | ALS Hub | Draft for review&RPage &P of &N';
  const bytes = await workbook.xlsx.writeBuffer();
  return new File([new Uint8Array(bytes)], `${name}.xlsx`, { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}