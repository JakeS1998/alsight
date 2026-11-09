export const powerAppUrl = 'https://alslive.crm11.dynamics.com/main.aspx?appid=e986c390-c4b0-f011-bbd3-6045bd0e7eeb';
export const bssRegisters = {
  projects: { label: 'Projects', entity: 'Project', reference: 'project_number', search: ['name', 'project_number', 'client_name'], icon: 'FolderKanban' },
  documents: { label: 'Drafting documents', entity: 'LegalDocument', reference: 'document_id', search: ['document_id', 'document_type'], icon: 'FileText' },
  dma: { label: 'Development agreements', entity: 'DMA', reference: 'document_id', search: ['document_id'], icon: 'FileCheck2' },
  jct: { label: 'JCT contracts', entity: 'JCT', reference: 'document_id', search: ['document_id'], icon: 'Scale' },
  warranties: { label: 'Warranties', entity: 'Warranty', reference: 'warranty_id', search: ['warranty_id', 'services'], icon: 'ShieldCheck' },
};
export const bssLinks = [
  ['Approvals', '/approvals', true], ['Clients', '/clients', true], ['Suppliers', '/suppliers', true], ['People', '/people', true],
  ['SharePoint', 'https://allianceleisureservice.sharepoint.com/sites/AllianceLeisure'],
  ['Framework', '/framework', true], ['Adobe Sign', 'https://secure.eu1.adobesign.com/account/homeJS'],
  ['Local Authority Search', 'https://www.gov.uk/find-local-council'],
  ['Companies House', 'https://www.gov.uk/government/organisations/companies-house'],
];
export const commonFields = [
  ['Drafting', [['Drafted date', 'drafted_date', 'date'], ['Drafting due', 'drafting_due_date', 'date'], ['BSM document owner', 'is_bsm_document_owner']]],
  ['Approval', [['Approval status', 'approval_status'], ['Approver', 'approvers_name'], ['Approval date', 'approval_date', 'date'], ['Approval comments', 'approval_comments']]],
  ['Execution', [['Executed', 'executed'], ['Date of execution', 'date_of_execution', 'date'], ['Signing target', 'signing_target_date', 'date']]],
  ['Comments & files', [['Comments', 'comments'], ['File', 'link_to_file', 'link']]],
];
export const extraFields = {
  documents: [['Document', [['Document type', 'document_type'], ['RIBA stage', 'riba_stage'], ['Sent to client', 'sent_to_client', 'date'], ['Shared with supplier', 'shared_with_supplier'], ['PSO sign-off', 'pso_signoff'], ['Client proposal', 'link_to_client_proposal', 'link'], ['Fee proposal', 'link_to_fee_proposal', 'link']]]],
  dma: [['Development agreement', [['Sent for signing', 'sent_for_signing', 'date'], ['Shared with council', 'shared_with_council'], ['DMA version', 'dma_version'], ['PSO sign-off', 'pso_signoff'], ['Conditions precedent', 'conditions_precedent'], ['Conditions precedent agreed', 'conditions_precedent_agreed']]]],
  jct: [['Construction contract', [['Form of JCT', 'form_of_jct'], ['Sent for signing', 'sent_for_signing', 'date'], ['Shared with contractor', 'shared_with_contractor'], ['LOI expiry', 'loi_expiry_date', 'date'], ['Practical completion', 'practical_completion', 'date'], ['Variation comments', 'variation_comments']]]],
  warranties: [['Warranty', [['Services', 'services'], ['Beneficiary', 'beneficiary'], ['Category', 'category'], ['Warranty status', 'warranty_status'], ['Format', 'format'], ['Warranty due', 'warranty_due', 'date'], ['JCT signed', 'jct_signed', 'date'], ['Practical completion', 'practical_completion', 'date'], ['Reminder date', 'reminder_date', 'date']]]],
};
export function safeBssLink(value) { return typeof value === 'string' && /^https:\/\//i.test(value) ? value : null; }
export function bssStatus(record, tab) {
  if (tab === 'projects') return record.legal_status || 'Not recorded';
  if (record.date_of_execution || record.executed === 'yes') return 'Executed';
  if (tab === 'warranties') return record.warranty_status?.replaceAll('_', ' ') || 'Not recorded';
  if (record.sent_for_signing || record.sent_to_client) return 'Sent for signing';
  return record.approval_status || (record.drafted_date ? 'Drafted' : 'Not drafted');
}