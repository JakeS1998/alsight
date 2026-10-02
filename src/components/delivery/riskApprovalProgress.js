export const RISK_APPROVAL_PARTIES = [{ key: 'pm', label: 'PM' }, { key: 'contractor', label: 'Contractor' }, { key: 'client', label: 'Client' }, { key: 'als', label: 'ALS' }];
export const RISK_APPROVAL_EDITORS = ['admin', 'director', 'bdm', 'bsm'];
export default function riskApprovalProgress(count, approvals = []) {
  const hasAcceptance = party => approvals.some(row => row.stakeholder === party.key && row.approved && row.verified && row.approver_name?.trim());
  const approved = RISK_APPROVAL_PARTIES.filter(hasAcceptance).length;
  return { percent: count > 0 ? (1 + approved) * 20 : 0, detail: count > 0 ? `Register populated · ${approved} of 4 verified acceptances on the current version` : 'Add risks before issuing for acceptance', checks: [{ label: 'Risk register populated', done: count > 0, detail: `${count} risks recorded` }, ...RISK_APPROVAL_PARTIES.map(party => ({ label: `${party.label} acceptance verified on the current version`, done: hasAcceptance(party) }))] };
}