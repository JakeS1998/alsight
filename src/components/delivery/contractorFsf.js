import { contractorMembers } from '@/components/delivery/contractorBuildUp';
import { contractorStageBases, calculateStageOhp } from '@/components/delivery/contractorFeeRows';
import { supplierFsfKey } from '@/components/delivery/supplierFsf';
export const contractorFsfKey = member => supplierFsfKey({ supplier_company_number: member.supplier_company_number, description: member.role || 'Contractor', role: member.role || 'Contractor' });
const round = value => Math.round(value * 100) / 100;
export function contractorFsfRows(team, build) {
  const members = contractorMembers(team).map(member => ({ member, bases: contractorStageBases(member), amounts: {} }));
  const legacy = members.filter(row => row.member.contractor_ohp === null);
  (build?.stageRows || []).forEach(stage => {
    let explicit = 0;
    members.forEach(row => {
      const amount = row.member.contractor_ohp === null ? 0 : calculateStageOhp(row.bases[stage.stage], row.member.contractor_ohp?.[stage.stage]);
      row.amounts[stage.stage] = amount; explicit += amount;
    });
    const residual = round(stage.ohp - explicit);
    const base = legacy.reduce((sum, row) => sum + row.bases[stage.stage], 0);
    const recipients = base ? legacy.filter(row => row.bases[stage.stage]) : legacy.slice(0, 1);
    let allocated = 0;
    recipients.forEach((row, index) => {
      const amount = index === recipients.length - 1 ? round(residual - allocated) : round(residual * row.bases[stage.stage] / base);
      row.amounts[stage.stage] = amount; allocated += amount;
    });
  });
  const grouped = new Map();
  members.forEach(({ member, bases, amounts }) => {
    const key = contractorFsfKey(member);
    if (!grouped.has(key)) grouped.set(key, { key, supplier: member.supplier_company_number || member.role || 'Contractor', role: member.role || 'Contractor', fee_proposal_link: member.fee_proposal_link, stageAmounts: {}, rawStageAmounts: {} });
    const row = grouped.get(key);
    Object.entries(amounts).forEach(([stage, amount]) => {
      row.stageAmounts[stage] = round((row.stageAmounts[stage] || 0) + bases[stage] + amount);
      row.rawStageAmounts[stage] = round((row.rawStageAmounts[stage] || 0) + bases[stage]);
    });
  });
  return scopeContractorFsf([...grouped.values()]);
}
export function scopeContractorFsf(rows = [], includeRiba57 = true) {
  const total = amounts => round(Object.entries(amounts || {}).reduce((sum, [stage, amount]) => sum + (includeRiba57 || stage !== 'riba_5_7' ? amount : 0), 0));
  return rows.map(row => ({ ...row, base: total(row.stageAmounts), rawBase: total(row.rawStageAmounts) }));
}