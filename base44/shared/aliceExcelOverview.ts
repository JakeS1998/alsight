import { reportStyle, reportDate } from './aliceReportStyle.ts';
export default function aliceExcelOverview(workbook, title, table) {
  const sheet = workbook.addWorksheet('Report overview');
  sheet.columns = [{ width: 26 }, { width: 100 }];
  sheet.mergeCells('A1:B2'); sheet.getCell('A1').value = title;
  sheet.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: reportStyle.navy } };
  sheet.getCell('A1').font = { name: 'Arial', size: 20, bold: true, color: { argb: 'FFFFFF' } };
  sheet.getCell('A1').alignment = { wrapText: true, vertical: 'middle' };
  sheet.getRow(1).height = 30; sheet.getRow(2).height = 30;
  const fields = [['Prepared by', 'ALICE | ALS Hub'], ['Generated (UK time)', reportDate()], ['Status', 'Information report, draft for human review'], ['Included rows', table.rows.length], ['Scope and filters', table.scope || 'Scope not supplied. Included rows are not necessarily the full dataset.'], ['Summary', table.summary || 'See the report data worksheet.'], ...(table.notes || []).map(value => ['Note / limitation', value]), ...(table.sources || []).map(value => ['Source', value])];
  fields.forEach(([label, value]) => {
    const row = sheet.addRow([label, value]);
    row.alignment = { vertical: 'top', wrapText: true };
    row.getCell(1).font = { name: 'Arial', bold: true, color: { argb: reportStyle.navy } };
    row.getCell(2).font = { name: 'Arial', color: { argb: reportStyle.navy } };
    row.height = Math.max(25, Math.ceil(String(value).length / 85) * 16 + 10);
    row.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: reportStyle.pale } };
  });
  sheet.pageSetup = { paperSize: 9, orientation: 'portrait', fitToPage: true, fitToWidth: 1, fitToHeight: 0 };
}