import { jsPDF } from 'npm:jspdf@4.2.1';
import { handoverRegisterLines } from './handoverRegisters.ts';

export function createHandoverReport(pack) {
  const doc = new jsPDF(); let y = 20;
  const text = (value, size = 10, bold = false) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal'); doc.setFontSize(size);
    const lines = doc.splitTextToSize(String(value ?? '').replace(/[\u2013\u2014]/g, '-'), 175);
    for (const line of lines) { if (y > 275) { doc.addPage(); y = 20; } doc.text(line, 17, y); y += size * 0.45 + 2; }
  };
  text('ALSight | Project handover pack', 18, true);
  text(`${pack.project.number} - ${pack.project.name}`, 13, true);
  text(`Client: ${pack.project.client || 'Not recorded'} | PC: ${pack.project.pcDate || 'Not recorded'}`);
  text(`Started: ${pack.startedAt} by ${pack.startedBy}`);
  text(`Checked: ${pack.checkedAt} | Source updated: ${pack.sourceUpdatedAt || 'Not recorded'}`);
  text(`Dataset completeness: ${pack.percentage}% (${pack.completed}/${pack.required})`, 13, true);
  text(`Gateway: ${pack.ready ? 'Ready - recorded evidence only' : 'Not ready'} | Statutory/applicability outstanding: ${pack.statutoryOutstanding} | Contractual outstanding: ${pack.contractualOutstanding} | Project outstanding: ${pack.projectOutstanding}`);
  text(`Golden-thread applicability: ${pack.applicability.replace(/_/g, ' ')}`);
  if (pack.goldenThreadDecision) text(`Assessment: ${pack.goldenThreadDecision.reason} | ${pack.goldenThreadDecision.decided_by} | ${pack.goldenThreadDecision.decided_at}`, 9);
  text(pack.disclaimer, 9); text(pack.guidance, 8); y += 4;
  for (const item of pack.items) {
    text(`${item.label}: ${item.status.toUpperCase()}`, 11, true);
    text(`Classification: ${item.classification.replace(/_/g, ' ')} | Source status: ${item.sourceStatus} | Review: ${item.review_status}`, 9);
    text(item.guidance, 9); if (item.source) text(item.source, 8);
    if (item.decision) text(`Applicability: ${item.decision.value} | ${item.decision.reason} | ${item.decision.decided_by} | ${item.decision.decided_at}`, 9);
    for (const field of item.complianceFields || []) text(`${field.label}: ${field.type === 'contact' ? item.compliance_details.recipient_name || 'Not recorded' : item.compliance_details[field.key] || 'Not recorded'}`, 9);
    if (item.gap) text(`Missing / action: ${item.gap}`, 9);
    if (item.notes) text(item.notes, 9);
    if (item.registerData) {
      text(`Portal register version ${item.register_version} | ${item.register_saved_by} | ${item.register_saved_at}`, 9, true);
      for (const line of handoverRegisterLines(item.key, item.registerData)) text(line, 9);
    }
    if (item.reviewed_at) text(`Reviewed by ${item.reviewed_by} at ${item.reviewed_at}`, 8);
    for (const file of item.documents) text(`${file.superseded ? '[SUPERSEDED] ' : ''}${file.name}${file.version ? ` | Version ${file.version}` : ''} | ${file.link || 'Private evidence'}${file.actor ? ` | ${file.actor} | ${file.at}` : ''}`, 8);
    y += 3;
  }
  text('Change history', 12, true);
  for (const event of pack.audit) { text(`${event.at} | ${event.actor} | ${event.action} | ${event.key || ''}`, 8); if (event.detail) text(event.detail, 7); }
  for (let page = 1; page <= doc.getNumberOfPages(); page++) { doc.setPage(page); doc.setFontSize(8); doc.text(`ALSight handover | ${page}/${doc.getNumberOfPages()}`, 17, 289); }
  return new Uint8Array(doc.output('arraybuffer'));
}