import { contractorBuildUp, isContractorMember } from '@/components/delivery/contractorBuildUp';
import normalizeContractorOhp from '@/components/delivery/normalizeContractorOhp';
import { contractorFsfKey } from '@/components/delivery/contractorFsf';

export function taskMemberAmounts(member) {
  const build = isContractorMember(member) ? contractorBuildUp([member], 0, 0) : null;
  const legacyTotal = build ? build.total : Object.values(member.fees || {}).reduce((sum, fee) => sum + (Number(fee) || 0), 0);
  const total = member.task_fee != null ? Number(member.task_fee) || 0 : legacyTotal;
  const ohp = Math.min(total, Math.max(0, member.task_ohp != null ? Number(member.task_ohp) || 0 : build?.ohpTotal || 0));
  return { total, ohp };
}

export default function singleTaskFees(team = [], supplierName, legacyOhp = {}) {
  const lines = [], contractors = new Map();
  normalizeContractorOhp(team, legacyOhp).forEach(member => {
    const contractor = isContractorMember(member);
    const { total, ohp } = taskMemberAmounts(member);
    const line = { riba_stage: 'Task', role: member.role || 'Supplier', description: `${member.role || 'Supplier'}${member.supplier_company_number ? ' — ' + supplierName(member.supplier_company_number) : ''}`, supplier_company_number: member.supplier_company_number || '', fsf_supplier_key: contractor ? contractorFsfKey(member) : undefined, fee_proposal_link: member.fee_proposal_link || '' };
    // Retain legacy subcontractor attribution until a task total is explicitly edited.
    if (contractor && member.task_fee == null && Array.isArray(member.contractor_fees)) {
      member.contractor_fees.forEach(fee => lines.push({ ...line, supplier_company_number: fee.supplier || line.supplier_company_number, fsf_supplier_key: !fee.supplier || fee.supplier === line.supplier_company_number ? line.fsf_supplier_key : undefined, supplier_fee: Number(fee.amount) || 0 }));
      lines.push({ ...line, supplier_fee: ohp });
    } else lines.push({ ...line, supplier_fee: total });
    if (contractor) {
      const key = contractorFsfKey(member);
      const row = contractors.get(key) || { key, supplier: member.supplier_company_number || member.role || 'Contractor', role: member.role || 'Contractor', fee_proposal_link: member.fee_proposal_link, base: 0, stageAmounts: {} };
      row.base += ohp; row.stageAmounts.Task = row.base; contractors.set(key, row);
    }
  });
  return { lines, contractors: [...contractors.values()] };
}