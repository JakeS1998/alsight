import ExcelJS from 'npm:exceljs@4.4.0';
export async function readRiskWorkbook(bytes) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(bytes);
  let text = '';
  for (const sheet of workbook.worksheets) {
    text += `\nSHEET: ${sheet.name}\n`;
    if (sheet.rowCount > 1500 || sheet.columnCount > 100) throw new Error('Use a smaller workbook (up to 1,500 rows and 100 columns per sheet).');
    sheet.eachRow(row => { text += row.values.slice(1).map(value => {
      if (value == null) return '';
      if (typeof value === 'object') return String(value.result ?? value.text ?? value.richText?.map(part => part.text).join('') ?? '');
      return String(value);
    }).join(' | ') + '\n'; });
    if (text.length > 90000) throw new Error('The workbook is too long. Split the register into smaller files.');
  }
  return text;
}
export const riskHeaders = ['Ref', 'Description', 'Cause', 'Status', 'Impact', 'Probability rating', 'Impact rating', 'Risk index', 'Control strategy', 'Owner', 'Anticipated cost (£)', 'Weighted cost (£)', 'Comments'];
export const riskValues = row => [row.reference || '', row.title || '', row.cause || '', row.status === 'closed' ? 'Closed / eliminated' : 'Active', row.impact_description || '', row.probability_rating ?? '', row.impact_rating ?? '', row.risk_index ?? '', row.mitigation || '', row.owner || '', row.anticipated_cost ?? '', row.weighted_cost ?? '', row.comments || ''];
export async function createRiskWorkbook(context, rows, contingency) {
  const workbook = new ExcelJS.Workbook(); workbook.creator = 'ALSight'; workbook.created = new Date();
  const sheet = workbook.addWorksheet('Risk register', { views: [{ state: 'frozen', ySplit: 6 }], pageSetup: { paperSize: 8, orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0, printTitlesRow: '1:6' } });
  sheet.columns = [10,48,40,20,40,15,15,14,48,20,22,22,48].map(width => ({ width }));
  [context.projectName, 'Project risk register', `Client: ${context.clientName}`, `Contractor: ${context.contractor}`, `Exported: ${context.date} · All weighted values are indicative, not contractual or capped.`].forEach((value, i) => { sheet.mergeCells(i + 1, 1, i + 1, 13); sheet.getCell(i + 1, 1).value = value; });
  sheet.getRow(1).font = { size: 16, bold: true, color: { argb: 'FF151442' } }; sheet.getRow(1).height = 30;
  sheet.addRow(riskHeaders); sheet.getRow(6).height = 32;
  rows.forEach(risk => {
    const row = sheet.addRow(riskValues(risk));
    row.alignment = { wrapText: true, vertical: 'top' }; row.height = Math.min(300, Math.max(45, ...row.values.slice(1).map(v => Math.ceil(String(v).length / 40) * 13)));
    row.getCell(8).value = risk.probability_rating && risk.impact_rating ? { formula: `F${row.number}*G${row.number}`, result: risk.risk_index } : '';
    row.getCell(12).value = risk.weighted_cost != null ? { formula: `K${row.number}*H${row.number}/25`, result: risk.weighted_cost } : '';
    [11,12].forEach(i => row.getCell(i).numFmt = '£#,##0.00');
  });
  sheet.autoFilter = { from: 'A6', to: `M${Math.max(6, sheet.rowCount)}` };
  sheet.eachRow((row, index) => { if (index >= 6) row.eachCell({ includeEmpty: true }, cell => { cell.border = { bottom: { style: 'thin', color: { argb: 'FFE2E2EA' } } }; if (index === 6) { cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF151442' } }; cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }; cell.alignment = { wrapText: true }; } }); });
  const footer = sheet.addRow(['Proposed client contingency', ...Array(10).fill(''), contingency]); footer.font = { bold: true }; footer.getCell(12).numFmt = '£#,##0.00';
  const matrix = workbook.addWorksheet('Risk matrix'); matrix.addRow(['Probability / Impact',1,2,3,4,5]); [1,2,3,4,5].forEach(p => matrix.addRow([p,...[1,2,3,4,5].map(i => p*i)])); matrix.getColumn(1).width = 25;
  const guide = workbook.addWorksheet('Guidance'); guide.getColumn(1).width = 110;
  ['Use the approved register structure and clear, actionable descriptions.', 'Assign every risk to Client or Contractor, not ALS or an unspecified shared owner.', 'Use full legal names for the Client and Contractor.', 'The Project Manager maintains the register and obtains Client and Contractor approval before sign-off.', 'Cross-check contractor proposal exclusions; record Client risks and close eliminated risks.', 'Risk index = probability × impact. Weighted cost = anticipated cost × risk index ÷ 25.', 'All weighted values are indicative, not explicit contractual values or capped.'].forEach(note => { const row = guide.addRow([note]); row.alignment = { wrapText: true }; row.height = 32; });
  return new Uint8Array(await workbook.xlsx.writeBuffer());
}