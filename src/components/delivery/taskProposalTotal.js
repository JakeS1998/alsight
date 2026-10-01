import { additionalFeeTotal } from '@/components/delivery/additionalFeeStages';

export default function taskProposalTotal(proposal) {
  let lines = [];
  try { lines = JSON.parse(proposal.line_items || '[]'); } catch { return Number(proposal.external_cost) || 0; }
  return (Number(proposal.external_cost) || 0) + lines.filter(line => line.include_on_client !== false).reduce((sum, line) => sum + additionalFeeTotal(line), 0);
}