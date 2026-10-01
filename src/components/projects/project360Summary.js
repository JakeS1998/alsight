import { projectStage } from '@/components/dashboard/pipelineStage';
import { projectCompletionDates } from '@/components/projects/projectCompletionDates';
import { valuationTotals } from '@/components/valuations/valuationUtils';
import { formatCurrency, formatDate } from '@/lib/portal';
const PHASES = { 'RIBA 1': 'Preparation & Brief', 'RIBA 2': 'Concept Design', 'RIBA 3': 'Spatial Coordination', 'RIBA 4': 'Technical Design', 'RIBA 5–7': 'Construction' };
export default function project360Summary(project, data = {}, singleTask = false) {
  const delivery = data.delivery || {};
  const pc = delivery.pc_achieved || project.practical_completion_date;
  const complete = pc && !Number.isNaN(Date.parse(pc)) && new Date(pc) <= new Date();
  const stage = projectStage(project);
  const phase = singleTask ? `Single task · ${complete ? 'Completion' : delivery.contract_start ? 'Works' : 'Agreement'}` : complete ? 'RIBA 5–7 · Close-out' : stage ? `${stage} · ${PHASES[stage]}` : 'Stage not recorded';
  const gateway = delivery.pso_dma_date || data.dmaSigned ? 'Development PSO signed off' : data.alternativeSigned ? 'Agreement PSO signed off' : delivery.pso_aa_variations_date ? 'AA variations PSO signed off' : delivery.pso_aa_date ? 'Access PSO signed off' : delivery.pso_pq_date ? 'PQ PSO signed off' : 'Not recorded';
  const valuation = data.valuation && valuationTotals(data.valuation);
  const commercial = valuation?.contract ? `${formatCurrency(valuation.revised)} revised contract` : delivery.contract_sum != null && delivery.contract_sum !== '' ? `${formatCurrency(delivery.contract_sum)} contract sum` : project.estimated_value != null ? `${formatCurrency(project.estimated_value)} estimate` : 'Not recorded';
  const pcDate = complete ? pc : delivery.forecast_pc || project.practical_completion_date || delivery.original_pc || projectCompletionDates(project).riba5_system_date;
  return { phase, fields: [
    { label: 'Programme', value: project.construction_term_weeks != null ? `${project.construction_term_weeks} weeks` : 'Not recorded', detail: 'Recorded construction term, not the full design programme.' },
    { label: 'Gateway', value: gateway, detail: 'Latest recorded PSO gateway. PSO sign-off is shown as recorded; it does not imply separate construction authorisation.' },
    { label: 'Commercial', value: commercial, detail: data.valuation ? `Latest non-draft, non-rejected valuation ${data.valuation.number} (${data.valuation.status}); original contract plus schedule variations. If no contract is recorded, the delivery contract sum or project estimate is shown.` : 'Delivery contract sum where recorded; otherwise the project estimate.' },
    { label: 'Recorded legal', value: !data.legalTotal ? 'Not recorded' : data.legalPending ? `${data.legalPending} outstanding` : 'Complete', detail: 'Execution or PO status of recorded legal documents, development agreements and JCTs. This is not a check for missing required documents; superseded unexecuted documents are excluded.' },
    { label: 'Warranties', value: `${data.outstanding ?? 0} outstanding`, detail: 'Active warranties without execution status/date; product warranties are excluded.' },
    { label: 'PC', value: formatDate(pcDate), detail: complete ? 'Achieved practical completion (recorded date).' : delivery.forecast_pc ? 'Forecast practical completion.' : project.practical_completion_date ? 'Project recorded practical completion date.' : delivery.original_pc ? 'Original practical completion target.' : 'Expected construction completion from the RIBA programme.' },
  ] };
}