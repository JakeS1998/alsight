export function appendRiskPdfApprovals(doc, context, summary) {
  const width = doc.internal.pageSize.getWidth(), height = doc.internal.pageSize.getHeight(), margin = 28;
  let y;
  const page = () => {
    doc.addPage(); doc.setFillColor(21,20,66); doc.rect(0,0,width,42,'F');
    doc.setTextColor(255); doc.setFont('helvetica','bold'); doc.setFontSize(15); doc.text('ALSight - Risk register approval records',margin,27);
    doc.setTextColor(21,20,66); y = 65;
  };
  const text = (value, bold = false) => {
    doc.setFont('helvetica',bold ? 'bold' : 'normal'); doc.setFontSize(9);
    const lines = doc.splitTextToSize(String(value ?? 'Not recorded').replace(/[\u2013\u2014]/g,'-'),width-margin*2);
    for (const line of lines) { if (y > height-40) page(); doc.text(line,margin,y); y += 13; }
    y += 4;
  };
  const date = value => value ? new Date(value).toLocaleString('en-GB',{timeZone:'Europe/London'}) + ' (Europe/London)' : 'Not recorded';
  const labels = {pm:'PM',contractor:'Contractor',client:'Client',als:'ALS'};
  page(); text(context.projectName,true);
  text('Certified export - approval records attached. This is the current live register; decisions relate only to their identified locked issued versions.');
  text('Latest issued records for each stakeholder are shown. Pending, declined, withdrawn and outdated records do not certify acceptance of this live register.');
  text(`Verified acceptances applicable to this live register: ${summary.approvals.length} of 4 stakeholder categories.`,true);
  text('This records explicit portal acceptance, not a qualified electronic signature.');
  if (!summary.packets.length) text('No issued approval records are available. No verified acceptance of this register is recorded.',true);
  for (const packet of summary.packets) {
    if (y > height-190) page();
    text(`${packet.reference} - ${packet.status}`,true);
    text(`Issued by: ${packet.issued_by_name || 'Not recorded'} | Issued: ${date(packet.issued_at)}`);
    text(`Version applicability: ${packet.stale ? 'OUTDATED - does not apply to the current live register' : ['active','completed'].includes(packet.status) ? 'Matches the current live register' : 'Inactive issue - not current approval evidence'}`,true);
    text(`Integrity reference: ${packet.snapshot_hash || 'Not recorded'}`);
    for (const step of packet.steps || []) {
      text(`${labels[step.party] || step.party}: ${step.name || 'Not recorded'} | ${step.email || 'Not recorded'}`,true);
      text(`Decision: ${step.status === 'waiting' ? 'Awaiting acceptance' : step.status} | Recorded: ${date(step.decided_at)} | Verification: ${step.verification_method || 'Not recorded'}`);
      if (step.decision_id) text(`Decision reference: ${step.decision_id}`);
      if (step.comment) text(`Decision comment: ${step.comment}`);
    }
    if (packet.withdrawn_at) text(`Withdrawn by: ${packet.withdrawn_by || 'Not recorded'} | ${date(packet.withdrawn_at)}`);
    y += 12;
  }
}