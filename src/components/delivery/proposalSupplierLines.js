import { contractorFsfKey } from '@/components/delivery/contractorFsf';
import { isContractorMember } from '@/components/delivery/contractorBuildUp';
const STAGES = { riba_1: 'RIBA 1', riba_2: 'RIBA 2', riba_3: 'RIBA 3', riba_4: 'RIBA 4', riba_5_7: 'RIBA 5-7' };
export default function proposalSupplierLines(team = [], supplierName) {
  return team.flatMap(member => {
    const name = member.supplier_company_number ? supplierName(member.supplier_company_number) : member.supplier_name;
    if (isContractorMember(member) && Array.isArray(member.contractor_fees)) return member.contractor_fees.map(fee => ({
      riba_stage: STAGES[fee.stage] || (fee.type === 'authorised_activity' ? 'RIBA 5-7' : 'Survey'),
      role: member.role || 'Supplier',
      description: `${member.role || 'Supplier'}${name ? ' — ' + name : ''}${fee.supplier ? ' · ' + (supplierName(fee.supplier) || fee.supplier) : ''}${fee.description ? ' — ' + fee.description : ''}`,
      supplier_company_number: fee.supplier || member.supplier_company_number || '',
      fsf_supplier_key: !fee.supplier || fee.supplier === member.supplier_company_number ? contractorFsfKey(member) : undefined,
      fee_category: fee.type, item_description: fee.description || '', supplier_fee: Number(fee.amount) || 0, fee_proposal_link: member.fee_proposal_link || '',
    }));
    return Object.entries(STAGES).map(([stage, label]) => ({
      riba_stage: label, role: member.role || 'Supplier', description: `${member.role || 'Supplier'}${name ? ' — ' + name : ''}`,
      supplier_company_number: member.supplier_company_number || '', fsf_supplier_key: isContractorMember(member) ? contractorFsfKey(member) : undefined,
      supplier_fee: Number(member.fees?.[stage]) || 0, fee_proposal_link: member.fee_proposal_link || '',
    }));
  });
}