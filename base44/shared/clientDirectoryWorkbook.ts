import ExcelJS from 'npm:exceljs@4.4.0';
export default async function clientDirectoryWorkbook(base44) {
  const file_uri = 'mp/private/6ab62433a194f918c54c8249/chat/3e28a2e15_client_directory_with_regions_and_directors.xlsx';
  const { signed_url } = await base44.asServiceRole.integrations.Core.CreateFileSignedUrl({ file_uri });
  const response = await fetch(signed_url, { signal: AbortSignal.timeout(20000) });
  if (!response.ok) throw new Error('Unable to read the supplied workbook.');
  const bytes = await response.arrayBuffer();
  if (bytes.byteLength > 1000000) throw new Error('Workbook exceeds the supported size.');
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(bytes);
  const sheet = workbook.getWorksheet('Client Directory');
  if (!sheet || sheet.rowCount > 500) throw new Error('Expected the supplied Client Directory sheet.');
  const text = cell => typeof cell.value === 'string' ? cell.value.trim() : cell.value == null ? '' : (() => { throw new Error('Workbook contains an unexpected cell type.'); })();
  const headers = [1,2,3,4].map(i => text(sheet.getRow(1).getCell(i)));
  if (headers.join('|') !== 'Client|Assigned region|Responsible director|Full Name') throw new Error('Unexpected workbook headers.');
  const rows = [];
  sheet.eachRow((row, index) => { if (index > 1 && text(row.getCell(1))) rows.push({ client: text(row.getCell(1)), region: text(row.getCell(2)), full_name: text(row.getCell(4)) }); });
  if (new Set(rows.map(row => row.client)).size !== rows.length) throw new Error('Duplicate client rows need review.');
  return rows;
}