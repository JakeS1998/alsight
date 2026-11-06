export function parseAliceExcel(content) {
  let table;
  try { table = JSON.parse(content); } catch { return null; }
  if (!table || !Array.isArray(table.headers) || table.headers.length < 1 || table.headers.length > 50 || !table.headers.every(value => typeof value === 'string' && value.trim() && value.length <= 200)) return null;
  if (new Set(table.headers.map(value => value.trim().toLowerCase())).size !== table.headers.length) return null;
  if (!Array.isArray(table.rows) || table.rows.length > 1000 || !table.rows.every(row => Array.isArray(row) && row.length === table.headers.length && row.every(value => value === null || typeof value === 'boolean' || (typeof value === 'number' && Number.isFinite(value)) || (typeof value === 'string' && value.length <= 4000)))) return null;
  if (table.sheetName !== undefined && (typeof table.sheetName !== 'string' || !table.sheetName.trim() || table.sheetName.length > 31 || /[\\/?*\[\]:]/.test(table.sheetName) || /^'|'$/.test(table.sheetName))) return null;
  return table;
}

export default async function aliceExcelFile(name, table) {
  const { default: ExcelJS } = await import('npm:exceljs@4.4.0');
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'ALICE | ALS Hub';
  const sheet = workbook.addWorksheet(table.sheetName || 'Table', { views: [{ state: 'frozen', ySplit: 1 }] });
  if (table.rows.length) {
    sheet.addTable({ name: 'AliceTable', ref: 'A1', headerRow: true, style: { theme: 'TableStyleMedium2', showRowStripes: true }, columns: table.headers.map(name => ({ name, filterButton: true })), rows: table.rows });
  } else {
    sheet.addRow(table.headers);
    sheet.getRow(1).font = { bold: true };
  }
  sheet.columns.forEach((column, index) => {
    column.width = Math.min(60, Math.max(14, ...[table.headers[index], ...table.rows.map(row => row[index])].map(value => String(value ?? '').length + 2)));
    column.alignment = { vertical: 'top', wrapText: true };
  });
  const bytes = await workbook.xlsx.writeBuffer();
  return new File([new Uint8Array(bytes)], `${name}.xlsx`, { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}