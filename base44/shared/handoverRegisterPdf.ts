import { jsPDF } from 'npm:jspdf@4.2.1';
import { handoverRegisters, handoverRegisterLines } from './handoverRegisters.ts';
export function createHandoverRegisterPdf(project, item) {
  const doc = new jsPDF(); let y = 20;
  const text = (value, size = 10) => {
    doc.setFontSize(size);
    for (const line of doc.splitTextToSize(String(value).replace(/[\u2013\u2014]/g, '-'), 175)) {
      if (y > 275) { doc.addPage(); y = 20; }
      doc.text(line, 17, y); y += size * 0.45 + 2;
    }
  };
  text(`ALS Live | ${handoverRegisters[item.key].label}`, 16);
  text(`${project.project_number || project.number || ''} - ${project.name}`, 12);
  text(`Version ${item.register_version} | Saved by ${item.register_saved_by} | ${item.register_saved_at}`, 9);
  text('Portal record only. Not an issued certificate, legal warranty or compliance certification.', 9);
  for (const line of handoverRegisterLines(item.key, item.registerData)) text(line);
  for (let p = 1; p <= doc.getNumberOfPages(); p++) { doc.setPage(p); doc.setFontSize(8); doc.text(`${p}/${doc.getNumberOfPages()}`, 180, 289); }
  return new Uint8Array(doc.output('arraybuffer'));
}