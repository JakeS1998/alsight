import { additionalFeeTotal } from '@/components/delivery/additionalFeeStages';
import { isAlsFeeLine, feeProposalTotals } from '@/components/delivery/feeProposalTotals';
import { contractorBuildUp } from '@/components/delivery/contractorBuildUp';
import proposalSupplierLines from '@/components/delivery/proposalSupplierLines';
export function opportunityFeeLines(item) {
  const lines = (item.fee_lines || []).map(line => ({ ...line, internal_fee: additionalFeeTotal(line), include_on_client: line.include_on_client !== false }));
  if (!lines.some(isAlsFeeLine)) lines.unshift({ description: 'ALS Delivery fee', riba_stage: '', stage_fees: { Other: Number(item.confirmed_alliance_fee ?? item.alliance_fee) || 0 }, internal_fee: Number(item.confirmed_alliance_fee ?? item.alliance_fee) || 0, include_on_client: true });
  return lines;
}
export function opportunityFeeData(item, lines = opportunityFeeLines(item)) {
  const team = item.design_team || [];
  const supplierName = cn => team.find(member => member.supplier_company_number === cn)?.supplier_name || cn;
  const supplierLines = proposalSupplierLines(team, supplierName);
  const build = contractorBuildUp(team, 0, 0);
  const totals = feeProposalTotals(supplierLines, lines, build);
  return { lines, supplierLines, build, totals, supplierName };
}