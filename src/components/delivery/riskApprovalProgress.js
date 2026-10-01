export const RISK_APPROVAL_PARTIES = [{ key: 'pm', label: 'PM' }, { key: 'contractor', label: 'Contractor' }, { key: 'client', label: 'Client' }, { key: 'als', label: 'ALS' }];
export const RISK_APPROVAL_EDITORS = ['admin', 'director', 'bdm', 'bsm'];
export default function riskApprovalProgress(count, approvals) {
  const approved = RISK_APPROVAL_PARTIES.filter(party => approvals.some(row => row.stakeholder === party.key && row.approved && row.approver_name?.trim())).length;
  return { percent: count > 0 ? (1 + approved) * 20 : 0, detail: count > 0 ? `Register populated · ${approved} of 4 approvals recorded` : 'Add risks before recording approvals', checks: [{ label: 'Risk register populated', done: count > 0, detail: `${count} risks recorded` }, ...RISK_APPROVAL_PARTIES.map(party => ({ label: `${party.label} approval recorded with approver name`, done: approvals.some(row => row.stakeholder === party.key && row.approved && row.approver_name?.trim()) }))] };
}