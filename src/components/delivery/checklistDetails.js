import { formatDate, DOCUMENT_TYPE } from '@/lib/portal';
import agreementNames from '@/components/projects/agreementNames';
import { REQUIRED_PRE_CONSTRUCTION_APPOINTMENTS } from '@/components/delivery/preConstructionAppointments';

export function documentChecklistDetails(record, label) {
  if (!record) return [`Missing: ${label} record.`, 'Sign-off cannot be confirmed until a record is added.'];
  const signed = record.executed === 'yes' || (record.executed == null && !!record.date_of_execution);
  const details = [signed ? `${label}: signed / executed.` : record.executed === 'po' ? `${label}: PO issued; signed appointment still outstanding.` : `Outstanding: ${label} has not been signed / executed.`];
  const reference = record.document_id || record.warranty_id;
  if (reference) details.push(`Reference: ${reference}`);
  if (record.date_of_execution) details.push(`Execution date: ${formatDate(record.date_of_execution)}`);
  else if (signed) details.push('Execution date not recorded.');
  if (record.approvers_name) details.push(`Approved by: ${record.approvers_name}`);
  if (record.approval_date) details.push(`Approval date: ${formatDate(record.approval_date)}`);
  if (!record.link_to_file) details.push('Missing: document link.');
  return details;
}

export function readinessChecklistDetails({ project, legalDocs, dmas, jcts, warranties, feeProposals, appointment }) {
  const accepted = feeProposals.find(f => f.status === 'accepted');
  const fee = accepted || feeProposals.find(f => f.is_current) || feeProposals[0];
  const roles = REQUIRED_PRE_CONSTRUCTION_APPOINTMENTS;
  return {
    'Access Agreement': documentChecklistDetails(legalDocs.find(d => d.document_type === 'access_agreement'), agreementNames(project.project_number).access),
    'Fee Proposal': fee ? [accepted ? 'Signed off: fee proposal accepted.' : `Outstanding: client acceptance (current status: ${(fee.status || 'draft').replaceAll('_', ' ')}).`, `Revision: R${fee.revision_number || 1}`, fee.client_approval_date ? `Client approval: ${formatDate(fee.client_approval_date)}` : 'Client approval date not recorded.'] : ['Missing: fee proposal revision.', 'Outstanding: client acceptance.'],
    Appointments: ['Architect appointment is optional and does not affect pre-construction completion.', ...roles.flatMap(([type, label]) => {
      const docs = legalDocs.filter(d => d.document_type === type);
      const signed = docs.filter(d => d.executed === 'yes');
      return [`${label}: ${signed.length ? 'signed' : docs.length ? 'signature outstanding' : 'appointment missing'}${signed.length > 1 ? ` (${signed.length} signed records)` : ''}.`, ...signed.filter(d => d.date_of_execution).map(d => `${label} executed: ${formatDate(d.date_of_execution)}`)];
    })],
    PCSA: [...documentChecklistDetails(appointment?.document, 'Contractor appointment'), 'Matches a non-JCT document to the contractor in the Fee Proposal delivery team.', ...(appointment?.name ? [`Contractor: ${appointment.name}`] : []), ...(appointment?.document ? [`Document type: ${DOCUMENT_TYPE[appointment.document.document_type]?.label || appointment.document.document_type}`] : [])],
    DMA: documentChecklistDetails(dmas[0], agreementNames(project.project_number).developmentShort),
    'Programme (RIBA 2)': project.riba2_end ? [`RIBA 2 completion date recorded: ${formatDate(project.riba2_end)}.`, 'This readiness check uses the recorded completion date, not a separate approval.'] : ['Missing: RIBA 2 completion date.'],
    'Contractor identified': appointment?.identified ? [`Contractor identified from the Fee Proposal delivery team${appointment.name ? `: ${appointment.name}` : ''}.`] : jcts.length ? ['Contractor identified from a JCT record.', ...documentChecklistDetails(jcts.find(j => j.executed === 'yes') || jcts[0], 'JCT')] : warranties.some(w => w.category === 'contractor') ? ['Contractor identified from a contractor warranty.', 'No JCT record; contract execution cannot be confirmed.'] : ['Missing: JCT or contractor warranty identifying the contractor.'],
  };
}