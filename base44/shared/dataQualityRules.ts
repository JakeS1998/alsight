import { projectCompletionDates } from './projectCompletionDates.ts';

export const missing = field => ({ $or: [{ [field]: { $exists: false } }, { [field]: null }, { [field]: { $regex: '^\\s*$' } }] });
export const present = field => ({ [field]: { $regex: '\\S' } });
export const active = { status: { $ne: 'inactive' } };
export const importedEntities = ['Project', 'Contact', 'Account', 'LegalDocument', 'DMA', 'JCT', 'Warranty'];
export const checks = [
  { key: 'postcode', label: 'Missing project postcode', description: 'Active projects without a site postcode.' },
  { key: 'bdm', label: 'Missing BDM', description: 'Active projects without an assigned BDM.' },
  { key: 'bsm', label: 'Missing BSM', description: 'Active projects without an assigned BSM.' },
  { key: 'dates', label: 'RIBA stage without dates', description: 'Live, unfinished projects with neither a recorded nor calculated completion date for their current RIBA stage.' },
  { key: 'client', label: 'Live project without client', description: 'Live projects with no client/account link and no client name.' },
  { key: 'jct', label: 'Construction without JCT', description: 'Unfinished projects in RIBA 5–7 or with a commenced construction contract, without an active linked JCT.' },
  { key: 'duplicates', label: 'Duplicate contact groups', description: 'Potential duplicates sharing an exact primary email address. Review before merging; no automatic changes.' },
  { key: 'dataverse', label: 'Missing Dataverse ID', description: 'Projects, contacts, accounts, legal documents, DMAs, JCTs and warranties without a Dataverse ID. Native ALSight records may legitimately lack one.' },
  { key: 'fees', label: 'Incomplete fee proposals', description: 'Current/latest proposals missing a fee value, fee basis or valid line items (description, RIBA stage and amount). Zero amounts are valid.' },
  { key: 'supplier', label: 'Missing supplier proposals', description: 'Delivery team members without a linked fee proposal document; counted per affected project.' },
];
export const directQueries = {
  postcode: { $and: [active, missing('site_postcode')] },
  bdm: { $and: [active, missing('bdm_aad_id')] },
  bsm: { $and: [active, missing('bsm_aad_id')] },
  client: { $and: [active, { live_project: true }, missing('client_account_id'), missing('account_id'), missing('client_name')] },
};
export const blank = value => value == null || String(value).trim() === '';
export function parseList(value) {
  if (blank(value)) return [];
  try { const parsed = JSON.parse(value); return Array.isArray(parsed) ? parsed : null; } catch { return null; }
}
export function projectState(project) {
  const now = Date.now();
  const past = value => !blank(value) && Number.isFinite(Date.parse(value)) && Date.parse(value) <= now;
  const completed = ['complete', 'completed'].includes(String(project.approval_status || '').trim().toLowerCase()) || past(project.practical_completion_date);
  const stage = past(project.riba5_system_date) || past(project.riba4_end) ? 5 : past(project.riba3_end) ? 4 : past(project.riba2_end) ? 3 : past(project.riba1_end) ? 2 : 1;
  const end = stage === 5 ? project.practical_completion_date : project[`riba${stage}_end`];
  const expected = projectCompletionDates(project)[`riba${stage}_system_date`];
  const validDate = value => !blank(value) && Number.isFinite(Date.parse(value));
  return { stage, completed, missingDate: !validDate(end) && !validDate(expected), past };
}
export function feeProblems(proposal) {
  const reasons = [];
  if (blank(proposal.fee_value) || !Number.isFinite(Number(proposal.fee_value))) reasons.push('Missing or invalid fee value');
  if (blank(proposal.fee_basis)) reasons.push('Missing fee basis');
  const lines = parseList(proposal.line_items);
  if (!lines?.length) reasons.push('Missing or invalid line items');
  else if (lines.some(line => !line || blank(line.description) || blank(line.riba_stage) || blank(line.internal_fee) || !Number.isFinite(Number(line.internal_fee)))) reasons.push('Incomplete line items');
  return reasons;
}