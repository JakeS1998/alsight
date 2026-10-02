import { jsPDF } from 'npm:jspdf@4.2.1';

const PAGE_W = 595.28, PAGE_H = 841.89, M = 40, CW = PAGE_W - M * 2;
const NAVY: [number, number, number] = [22, 21, 68];
const BLACK: [number, number, number] = [0, 0, 0];
const LINE: [number, number, number] = [200, 200, 210];

function gbp(n: number): string {
  return '\u00A3' + (Number(n) || 0).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(s: string): string {
  if (!s) return '';
  const d = new Date(s.length === 10 ? s + 'T00:00:00' : s);
  if (isNaN(d.getTime())) return s;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

function numberToWords(num: number): string {
  const ones = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
  const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
  const scales = ['', 'thousand', 'million', 'billion'];
  function two(n: number): string { if (n < 20) return ones[n]; return tens[Math.floor(n / 10)] + (n % 10 ? '-' + ones[n % 10] : ''); }
  function three(n: number): string { const h = Math.floor(n / 100), r = n % 100; let s = ''; if (h) s += ones[h] + ' hundred'; if (r) s += (h ? ' and ' : '') + two(r); return s; }
  const pounds = Math.floor(Math.abs(num)), pence = Math.round((Math.abs(num) - pounds) * 100);
  if (pounds === 0 && pence === 0) return 'Nil';
  const groups: number[] = []; let rem = pounds;
  while (rem > 0) { groups.push(rem % 1000); rem = Math.floor(rem / 1000); }
  let words = '';
  for (let i = groups.length - 1; i >= 0; i--) { if (!groups[i]) continue; const g = three(groups[i]); words += (words ? ', ' : '') + g + (scales[i] ? ' ' + scales[i] : ''); }
  let result = words + ' pounds';
  if (pence > 0) result += ' and ' + two(pence) + ' pence';
  return result.charAt(0).toUpperCase() + result.slice(1);
}

function textLines(doc: jsPDF, text: string, x: number, y: number, maxW: number, lineHeight: number): number {
  const lines = doc.splitTextToSize(text || '', maxW);
  lines.forEach((line: string, i: number) => doc.text(line, x, y + i * lineHeight));
  return y + lines.length * lineHeight;
}

function drawLogo(doc: jsPDF, logo: Uint8Array | null, y: number): void {
  if (!logo) return;
  try { doc.addImage(logo, 'PNG', doc.internal.pageSize.getWidth() - M - 130, y, 130, 45); } catch { try { doc.addImage(logo, 'JPEG', doc.internal.pageSize.getWidth() - M - 130, y, 130, 45); } catch {} }
}

function statusNote(doc: jsPDF, status: string): void {
  if (!status || status === 'approved' || status === 'paid') return;
  doc.setFont('helvetica', 'italic'); doc.setFontSize(8); doc.setTextColor(120, 120, 120);
  doc.text(`Status: ${status.replaceAll('_', ' ')}`, M, 18);
  doc.setTextColor(...BLACK);
}

function drawFooter(doc: jsPDF, preparedBy: string, page: number, pages: number): void {
  doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(120, 120, 120);
  doc.text(`${preparedBy || 'ALSight'} | ${page} / ${pages}`, M, doc.internal.pageSize.getHeight() - 20);
  doc.setTextColor(...BLACK);
}

function metadataBlock(doc: jsPDF, y: number, label: string, lines: string[], x: number, w: number): number {
  doc.setFont('helvetica', 'bold'); doc.setFontSize(7); doc.setTextColor(100, 100, 110);
  doc.text(label, x, y);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(...BLACK);
  let cy = y + 12;
  lines.filter(Boolean).forEach(line => { cy = textLines(doc, line, x, cy, w, 11) + 1; });
  return cy;
}

function financialLine(doc: jsPDF, y: number, label: string, value: string, bold = false, underline = false, doubleLine = false): number {
  doc.setFont('helvetica', bold ? 'bold' : 'normal'); doc.setFontSize(10);
  if (underline) { doc.setDrawColor(...BLACK); doc.setLineWidth(0.5); doc.line(PAGE_W - M - 150, y - 11, PAGE_W - M, y - 11); }
  doc.text(label, M, y); doc.text(value, PAGE_W - M, y, { align: 'right' });
  if (doubleLine) { doc.setDrawColor(...BLACK); doc.setLineWidth(0.5); doc.line(PAGE_W - M - 150, y + 3, PAGE_W - M, y + 3); doc.line(PAGE_W - M - 150, y + 6, PAGE_W - M, y + 6); }
  return y + 18;
}

function drawIssueRecord(doc: jsPDF, data: any, y: number): void {
  const issue = data.issue;
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(...BLACK);
  const stamp = value => new Date(value).toLocaleString('en-GB', { timeZone: 'Europe/London', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', timeZoneName: 'short' });
  const lines = issue ? [
    `Authorised by: ${issue.authorised_by_name} | ${stamp(issue.authorised_at)}`,
    `Issued by: ${issue.issued_by_name} | ${stamp(issue.issued_at)}`,
    `Issuer organisation: ${issue.issuer_organisation}`,
    `For the named authorised party: ${issue.named_authorised_party}`,
    `Executed contract: ${issue.contract_reference}`,
    `Authority clause / appointment: ${issue.authority_clause}`,
    `Issue reference: ${issue.issue_reference}`,
    'Contractual authority confirmed by the issuer for this document; not independently verified by ALSight.',
    'Recorded PDF issue does not constitute service on the contractor.'
  ] : ['DRAFT - NOT ISSUED', 'No formal authorisation or issue has been recorded for this preview.'];
  const wrapped = lines.flatMap(line => doc.splitTextToSize(line, CW));
  if (y + wrapped.length * 11 > PAGE_H - 45) { doc.addPage(); y = M; }
  wrapped.forEach(line => { if (y > PAGE_H - 45) { doc.addPage(); y = M; } doc.text(line, M, y); y += 11; });
}

function drawPaymentNotice(doc: jsPDF, data: any, logo: Uint8Array | null): void {
  let y = M + 10;
  drawLogo(doc, logo, M);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(13); doc.setTextColor(...NAVY);
  y = textLines(doc, `${data.projectName} | Main Contract`, M, y, CW - 140, 16);
  doc.setFontSize(16); y = textLines(doc, 'PAYMENT NOTICE', M, y + 4, CW, 20);
  doc.setDrawColor(...NAVY); doc.setLineWidth(1.5); doc.line(M, y, PAGE_W - M, y); y += 16;
  doc.setTextColor(...BLACK);
  const colW = (CW - 20) / 2;
  const leftEnd = metadataBlock(doc, y, 'PREPARED BY', [data.preparedBy.name, data.preparedBy.address], M, colW);
  const rightEnd = metadataBlock(doc, y, 'SITE ADDRESS', [data.projectName, data.siteAddress], M + colW + 20, colW);
  y = Math.max(leftEnd, rightEnd) + 6;
  const leftEnd2 = metadataBlock(doc, y, 'EMPLOYER', [data.employer.name, data.employer.address], M, colW);
  const rightEnd2 = metadataBlock(doc, y, 'CONTRACTOR', [data.contractor.name, data.contractor.address], M + colW + 20, colW);
  y = Math.max(leftEnd2, rightEnd2) + 6;
  y = metadataBlock(doc, y, 'CLIENT', [data.client.name, data.client.address], M, colW) + 6;
  const dates = [['CONTRACT DATE (LOI)', fmtDate(data.contractDate)], ['DUE DATE', fmtDate(data.paymentDueDate)], [data.issue ? 'ISSUE DATE' : 'VALUATION DATE', fmtDate(data.issue?.issued_at || data.valuationDate)], ['INSTALMENT NUMBER', String(data.valuationNumber)]];
  dates.forEach(([label, val]) => { doc.setFont('helvetica', 'bold'); doc.setFontSize(7); doc.setTextColor(100, 100, 110); doc.text(label, M, y); doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(...BLACK); doc.text(val || '\u2014', M + 130, y); y += 14; });
  y += 8;
  let fy = y;
  fy = financialLine(doc, fy, 'CONTRACT SUM (LOI):', gbp(data.contractSum));
  fy = financialLine(doc, fy, "Contractor's Interim Application:", gbp(data.gross));
  fy = financialLine(doc, fy, 'Adjustment (as QS back-up):', gbp(0));
  fy = financialLine(doc, fy, 'GROSS VALUATION:', gbp(data.gross), true, true);
  fy = financialLine(doc, fy, `LESS RETENTION: ${data.retentionPercent}%`, gbp(data.retention));
  fy = financialLine(doc, fy, '', gbp(data.net), false, true);
  fy = financialLine(doc, fy, 'LESS AMOUNT PREVIOUSLY CERTIFIED:', gbp(data.previouslyCertified));
  fy = financialLine(doc, fy, 'TOTAL NOW DUE TO CONTRACTOR (excluding V.A.T.):', gbp(data.due), true, false, true);
  y = fy + 14;
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
  y = textLines(doc, `${data.issue ? 'I/We certify' : 'Draft for review: proposed confirmation'} that under the terms of the contract, payment is now due from the Employer to the Contractor in the sum of: ${numberToWords(data.due)}.`, M, y, CW, 12) + 8;
  doc.setFont('helvetica', 'italic'); doc.setFontSize(8); doc.setTextColor(80, 80, 90);
  y = textLines(doc, data.issue ? 'This Payment Notice is issued on the contractual authority confirmed by the named issuer below. All amounts are exclusive of VAT. CIS deductions apply where relevant.' : 'Draft Payment Notice for review only; not issued. All amounts are exclusive of VAT. CIS deductions apply where relevant.', M, y, CW, 11) + 20;
  drawIssueRecord(doc, data, y);
}

function drawInterimCertificate(doc: jsPDF, data: any, logo: Uint8Array | null): void {
  let y = M + 10;
  drawLogo(doc, logo, M);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(15); doc.setTextColor(...NAVY);
  y = textLines(doc, `Interim Certificate ${data.valuationNumber}`, M, y, CW - 140, 18);
  y += 8; doc.setTextColor(...BLACK);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
  const details = [['Employer', data.employer.name], ['Client', data.client.name], ['Contractor', data.contractor.name], ['Location of the works', data.projectName], [data.issue ? 'Issue date' : 'Valuation date', fmtDate(data.issue?.issued_at || data.valuationDate)]];
  details.forEach(([label, val]) => { doc.setFont('helvetica', 'bold'); doc.text(label + ':', M, y); doc.setFont('helvetica', 'normal'); y = textLines(doc, val || '\u2014', M + 140, y, CW - 140, 13) + 4; });
  y += 6;
  doc.setFont('helvetica', 'bold'); doc.text('Contract Sum:', M, y); doc.setFont('helvetica', 'normal'); doc.text(gbp(data.contractSum), PAGE_W - M, y, { align: 'right' });
  doc.setDrawColor(...BLACK); doc.setLineWidth(0.5); doc.line(PAGE_W - M - 150, y - 11, PAGE_W - M, y - 11); y += 20;
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
  y = textLines(doc, `${data.issue?.named_authorised_party || 'Draft for review'} ${data.issue ? 'hereby certifies' : 'sets out the proposed certification'} that in accordance with the Contract payment, as detailed below, is due from the Employer to the Contractor.`, M, y, CW, 12) + 10;
  let fy = y;
  fy = financialLine(doc, fy, 'Total value:', gbp(data.gross));
  fy = financialLine(doc, fy, `Retention (${data.retentionPercent}%):`, gbp(data.retention));
  fy = financialLine(doc, fy, 'Net Valuation:', gbp(data.net), false, true);
  fy = financialLine(doc, fy, 'Previously Certified:', gbp(data.previouslyCertified));
  fy = financialLine(doc, fy, 'Amount payable on this certificate:', gbp(data.due), true, false, true);
  y = fy + 14;
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
  y = textLines(doc, numberToWords(data.due) + '.', M, y, CW, 12) + 6;
  doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.text(gbp(data.due), PAGE_W - M, y, { align: 'right' });
  doc.setDrawColor(...BLACK); doc.setLineWidth(0.5); doc.line(PAGE_W - M - 150, y + 3, PAGE_W - M, y + 3); doc.line(PAGE_W - M - 150, y + 6, PAGE_W - M, y + 6); y += 20;
  doc.setFont('helvetica', 'italic'); doc.setFontSize(8); doc.setTextColor(80, 80, 90);
  doc.text('All of the above amounts are exclusive of VAT.', M, y); y += 24;
  drawIssueRecord(doc, data, y);
}

function drawRow(doc: jsPDF, y: number, cells: any[], widths: number[], rowH: number, bold = false, fill = false): void {
  doc.setFont('helvetica', bold ? 'bold' : 'normal');
  let x = M;
  cells.forEach((c, i) => {
    if (fill) { doc.setFillColor(240, 240, 245); doc.rect(x, y, widths[i], rowH, 'F'); }
    doc.setDrawColor(...(bold ? BLACK : LINE)); doc.setLineWidth(bold ? 0.7 : 0.5); doc.rect(x, y, widths[i], rowH); doc.setLineWidth(0.5);
    doc.setFontSize(8);
    const lines = String(c).split('\n');
    const widest = Math.max(...lines.map(line => doc.getTextWidth(line)));
    if (widest > widths[i] - 8) doc.setFontSize(8 * (widths[i] - 8) / widest);
    doc.text(String(c), i === 0 ? x + 4 : x + widths[i] - 4, y + 12, { align: i === 0 ? 'left' : 'right', lineHeightFactor: 1.15 });
    x += widths[i];
  });
}

function drawStatementOfRetention(doc: jsPDF, data: any, logo: Uint8Array | null): void {
  const PAGE_W = doc.internal.pageSize.getWidth(), PAGE_H = doc.internal.pageSize.getHeight(), CW = PAGE_W - M * 2;
  let y = M + 10;
  drawLogo(doc, logo, M);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(13); doc.setTextColor(...NAVY);
  y = textLines(doc, `${data.projectName} | Main Contract`, M, y, CW - 140, 16);
  doc.setFontSize(16); y = textLines(doc, 'STATEMENT OF RETENTION', M, y + 4, CW, 20);
  doc.setDrawColor(...NAVY); doc.setLineWidth(1.5); doc.line(M, y, PAGE_W - M, y); y += 16;
  doc.setTextColor(...BLACK);
  const colW = (CW - 20) / 3;
  const e1 = metadataBlock(doc, y, 'PREPARED BY', [data.preparedBy.name, data.preparedBy.address], M, colW);
  const e2 = metadataBlock(doc, y, 'WORKS', [data.projectName, data.siteAddress], M + colW + 10, colW);
  const refLines = ['Payment Notice No. ' + data.valuationNumber, 'Date of Issue: ' + fmtDate(data.valuationDate), 'EA Ref: ' + (data.projectNumber || '\u2014')];
  const e3 = metadataBlock(doc, y, 'THIS STATEMENT RELATES TO', refLines, M + colW * 2 + 20, colW);
  y = Math.max(e1, e2, e3) + 10;
  const halfPct = (data.retentionPercent / 2).toFixed(2).replace(/\.?0+$/, '');
  const headers = ['Item', 'Gross\nValuation', `Full\nRetention\n${data.retentionPercent}%`, `Half\nRetention\n${halfPct}%`, 'No\nRetention\n0%', 'Amount of\nRetention', 'Net\nValuation', 'Previously\nCertified', 'Balance'];
  const widths = [145, ...Array(8).fill((CW - 145) / 8)];
  const rowH = 28, headerH = 42;
  doc.setFont('helvetica', 'bold'); doc.setFontSize(8);
  const headerCells = headers.map((h, i) => doc.splitTextToSize(h, widths[i] - 8).join('\n'));
  drawRow(doc, y, headerCells, widths, headerH, true, true);
  y += headerH;
  const totals = { gross: 0, full: 0, half: 0, none: 0, retention: 0, net: 0, prev: data.previouslyCertified, balance: 0 };
  (data.items || []).forEach((item: any) => {
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8);
    const description = doc.splitTextToSize(item.description || '', widths[0] - 8);
    const itemH = Math.max(rowH, description.length * 10 + 12);
    if (y + itemH > PAGE_H - 60) { doc.addPage(); y = M; drawRow(doc, y, headerCells, widths, headerH, true, true); y += headerH; }
    const full = item.retentionCategory === 'full' ? item.gross : 0;
    const half = item.retentionCategory === 'half' ? item.gross : 0;
    const none = item.retentionCategory === 'none' ? item.gross : 0;
    totals.gross += item.gross; totals.full += full; totals.half += half; totals.none += none; totals.retention += item.retentionAmount; totals.net += item.net; totals.balance += item.net;
    drawRow(doc, y, [description.join('\n'), gbp(item.gross), gbp(full), gbp(half), gbp(none), gbp(item.retentionAmount), gbp(item.net), '\u2014', gbp(item.net)], widths, itemH);
    y += itemH;
  });
  if (y + rowH + 50 > PAGE_H - 40) { doc.addPage(); y = M; drawRow(doc, y, headerCells, widths, headerH, true, true); y += headerH; }
  drawRow(doc, y, ['Total', gbp(totals.gross), gbp(totals.full), gbp(totals.half), gbp(totals.none), gbp(totals.retention), gbp(totals.net), gbp(totals.prev), gbp(totals.balance)], widths, rowH, true, true);
  y += rowH + 16;
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(80, 80, 90);
  textLines(doc, 'This statement shows the retention position across all contract items. Retention is calculated at the full rate, half rate (post practical completion) or nil per item category.', M, y, CW, 11);
  doc.setTextColor(...BLACK);
}

export function createValuationPdf(type: string, data: any, logo: Uint8Array | null): Uint8Array {
  const doc = new jsPDF({ orientation: type === 'statement_of_retention' ? 'landscape' : 'portrait', unit: 'pt', format: 'a4' });
  statusNote(doc, data.status);
  if (type === 'payment_notice') drawPaymentNotice(doc, data, logo);
  else if (type === 'interim_certificate') drawInterimCertificate(doc, data, logo);
  else if (type === 'statement_of_retention') drawStatementOfRetention(doc, data, logo);
  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p);
    if (data.isDraftDocument) { doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(...NAVY); doc.text('DRAFT - NOT ISSUED', PAGE_W - M, 18, { align: 'right' }); }
    drawFooter(doc, data.preparedBy?.name || '', p, pages);
  }
  return new Uint8Array(doc.output('arraybuffer'));
}