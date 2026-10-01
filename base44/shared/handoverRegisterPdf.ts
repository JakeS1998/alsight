import { jsPDF } from 'npm:jspdf@4.2.1';
import { handoverRegisters } from './handoverRegisters.ts';

const BRAND = { orange: [247, 146, 30], navy: [22, 21, 68], silver: [242, 242, 243], lightSilver: [248, 248, 250], white: [255, 255, 255] };
const LOGO_URL = 'https://base44.app/api/apps/6ab62433a194f918c54c8249/files/mp/public/6ab62433a194f918c54c8249/32d46dda1_alliance-leisure-official-logo.png';

const formatDate = (value) => {
  if (!value) return '';
  try { const d = new Date(value); return d.toLocaleDateString('en-GB'); } catch { return String(value); }
};

const displayValue = (value) => {
  if (value === '' || value == null) return '—';
  return String(value);
};

export async function createHandoverRegisterPdf(project, item) {
  const config = handoverRegisters[item.key];
  const doc = new jsPDF({ unit: 'pt', format: 'a4', orientation: 'landscape' });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 40;
  let logo = null;
  try {
    const response = await fetch(LOGO_URL);
    if (response.ok) logo = new Uint8Array(await response.arrayBuffer());
  } catch { /* logo optional */ }

  const totalPages = (pages) => {
    for (let p = 1; p <= pages; p++) {
      doc.setPage(p);
      // Footer line
      doc.setDrawColor(...BRAND.silver); doc.setLineWidth(0.5);
      doc.line(M, H - 30, W - M, H - 30);
      doc.setFontSize(8); doc.setTextColor(...BRAND.navy); doc.setFont('helvetica', 'normal');
      doc.text(`Alliance Leisure · Portal record · ${new Date().toLocaleDateString('en-GB')}`, M, H - 16);
      doc.setTextColor(...BRAND.orange); doc.text(`${p} / ${pages}`, W - M, H - 16, { align: 'right' });
    }
  };

  const drawHeader = () => {
    if (logo) doc.addImage(logo, 'PNG', M, 16, 80, 36, 'als-logo');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(16); doc.setTextColor(...BRAND.navy);
    doc.text(config.label, W - M, 32, { align: 'right' });
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(...BRAND.navy);
    doc.text(`${project.project_number || project.number || ''} · ${project.name || 'Project'}`, W - M, 48, { align: 'right' });
    if (project.client) doc.text(`Client: ${project.client}`, W - M, 62, { align: 'right' });
    doc.setDrawColor(...BRAND.orange); doc.setLineWidth(2); doc.line(M, 66, W - M, 66);
  };

  const drawMeta = (y) => {
    const meta = [
      ['Version', `v${item.register_version}`],
      ['Saved by', item.register_saved_by || '—'],
      ['Saved at', item.register_saved_at ? new Date(item.register_saved_at).toLocaleString('en-GB') : '—'],
      ['Entries', String(item.register_count ?? (item.registerData?.rows?.length || 0))],
    ];
    const colW = (W - 2 * M) / meta.length;
    meta.forEach(([label, value], i) => {
      const x = M + i * colW;
      doc.setFillColor(...BRAND.lightSilver); doc.rect(x, y, colW - 4, 44, 'F');
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(120, 120, 130);
      doc.text(label.toUpperCase(), x + 8, y + 16);
      doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(...BRAND.navy);
      doc.text(String(value), x + 8, y + 34);
    });
    return y + 44 + 16;
  };

  const drawSummary = (y) => {
    const summaryFields = config.summary || [];
    if (!summaryFields.length) return y;
    doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(...BRAND.navy);
    doc.text('Summary', M, y); y += 8;
    doc.setDrawColor(...BRAND.silver); doc.setLineWidth(0.5); doc.line(M, y, W - M, y); y += 14;
    const colW = (W - 2 * M) / Math.min(summaryFields.length, 4);
    summaryFields.forEach((f, i) => {
      const x = M + (i % 4) * colW;
      const row = Math.floor(i / 4);
      const yy = y + row * 40;
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(120, 120, 130);
      doc.text(f.label.toUpperCase(), x + 4, yy + 12);
      doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(...BRAND.navy);
      const val = displayValue(item.registerData?.summary?.[f.key]);
      const lines = doc.splitTextToSize(val, colW - 12);
      doc.text(lines, x + 4, yy + 26);
    });
    const rows = Math.ceil(summaryFields.length / 4);
    return y + rows * 40 + 12;
  };

  const drawTable = (y) => {
    const fields = config.fields;
    const rows = item.registerData?.rows || [];
    if (!rows.length) {
      doc.setFont('helvetica', 'italic'); doc.setFontSize(10); doc.setTextColor(120, 120, 130);
      doc.text('No entries recorded.', M, y + 10);
      return y + 20;
    }
    // Determine column widths — first column wider, rest equal
    const minColW = 70;
    const availW = W - 2 * M;
    const firstColW = Math.min(160, availW * 0.2);
    const restW = (availW - firstColW) / (fields.length - 1);
    const colWidths = [firstColW, ...fields.slice(1).map(() => restW)];

    const drawTableHeader = (yy) => {
      doc.setFillColor(...BRAND.navy); doc.rect(M, yy, availW, 24, 'F');
      doc.setTextColor(...BRAND.white); doc.setFont('helvetica', 'bold'); doc.setFontSize(8);
      let cursor = M;
      fields.forEach((f, i) => {
        const label = doc.splitTextToSize(f.label, colWidths[i] - 6);
        doc.text(label[0] || f.label, cursor + 4, yy + 16);
        cursor += colWidths[i];
      });
      return yy + 24;
    };

    y = drawTableHeader(y);
    rows.forEach((row, index) => {
      // Calculate row height based on content
      const cellTexts = fields.map(f => {
        const val = displayValue(row[f.key]);
        const lines = doc.splitTextToSize(val, colWidths[fields.indexOf(f)] - 8);
        return lines;
      });
      const maxLines = Math.max(...cellTexts.map(t => t.length), 1);
      const rowHeight = Math.max(24, maxLines * 11 + 8);

      if (y + rowHeight > H - 50) { doc.addPage(); y = 84; y = drawTableHeader(y); }

      if (index % 2 === 0) { doc.setFillColor(...BRAND.lightSilver); doc.rect(M, y, availW, rowHeight, 'F'); }
      doc.setDrawColor(...BRAND.silver); doc.setLineWidth(0.3); doc.line(M, y + rowHeight, M + availW, y + rowHeight);

      doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(...BRAND.navy);
      let cursor = M;
      cellTexts.forEach((lines, i) => {
        doc.setTextColor(i === 0 ? 22 : 22, i === 0 ? 21 : 21, i === 0 ? 68 : 68);
        if (i === 0) doc.setFont('helvetica', 'bold'); else doc.setFont('helvetica', 'normal');
        doc.text(lines, cursor + 4, y + 14);
        cursor += colWidths[i];
      });
      y += rowHeight;
    });
    return y;
  };

  // Page 1: header + meta + summary + table
  drawHeader();
  let y = 84;
  y = drawMeta(y);
  y = drawSummary(y);
  y = drawTable(y);

  // Disclaimer page
  doc.addPage();
  drawHeader();
  y = 84;
  doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(...BRAND.navy);
  doc.text('Notes & disclaimer', M, y); y += 8;
  doc.setDrawColor(...BRAND.silver); doc.setLineWidth(0.5); doc.line(M, y, W - M, y); y += 16;
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(80, 80, 90);
  const disclaimer = [
    'This document is a portal record of the handover information entered by the project team.',
    'It is not an issued certificate, legal warranty, or compliance certification.',
    'Statutory certificates and issued documents must be obtained from the relevant dutyholder.',
    'Where supporting documents are referenced by link, the linked document is the authoritative source.',
  ];
  for (const line of disclaimer) {
    const wrapped = doc.splitTextToSize(line, W - 2 * M);
    doc.text(wrapped, M, y); y += wrapped.length * 14;
  }
  if (config.guidance) {
    y += 10;
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(...BRAND.navy);
    doc.text('Register guidance', M, y); y += 14;
    doc.setFont('helvetica', 'normal'); doc.setTextColor(80, 80, 90);
    const guidance = doc.splitTextToSize(config.guidance, W - 2 * M);
    doc.text(guidance, M, y); y += guidance.length * 14;
  }

  totalPages(doc.getNumberOfPages());
  return new Uint8Array(doc.output('arraybuffer'));
}