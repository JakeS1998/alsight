export const RISK_APPROVAL_PARTIES = [{ key: 'pm', label: 'PM' }, { key: 'contractor', label: 'Contractor' }, { key: 'client', label: 'Client' }, { key: 'als', label: 'ALS' }];
export const RISK_APPROVAL_EDITORS = ['admin', 'director', 'bdm', 'bsm'];
export default function riskApprovalProgress(count, approvals = []) {
  const hasAcceptance = party => approvals.some(row => row.stakeholder === party.key && row.approved && row.verified && row.approver_name?.trim());
  const approved = RISK_APPROVAL_PARTIES.filter(hasAcceptance).length;
  const weighting = '20% for the uploaded / populated register, plus 20% each for ALS, Contractor, Client and PM sign-off on the current version.';
  return { percent: count > 0 ? (1 + approved) * 20 : 0, detail: `${weighting} ${count > 0 ? `${approved} of 4 verified sign-offs complete.` : 'Upload and save the register before issuing for sign-off.'}`, checks: [{ label: 'Risk register uploaded / populated (20%)', done: count > 0, detail: `${count} risks saved to the register` }, ...RISK_APPROVAL_PARTIES.map(party => ({ label: `${party.label} sign-off (20%)`, done: count > 0 && hasAcceptance(party), detail: 'Verified acceptance of the current register version' }))] };
}