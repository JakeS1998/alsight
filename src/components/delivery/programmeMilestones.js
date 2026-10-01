import { formatDate } from '@/lib/portal';
import agreementNames from '@/components/projects/agreementNames';
import { documentChecklistDetails } from '@/components/delivery/checklistDetails';
export function daysFromToday(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d)) return null;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  return Math.round((d - today) / 86400000);
}
export function programmeMilestones(project, feeProposals, jcts, delivery) {
  const pcDate = project.practical_completion_date || delivery?.pc_achieved;
  const pcAchieved = !!pcDate && daysFromToday(pcDate) !== null && daysFromToday(pcDate) <= 0;
  const handoverComplete = delivery?.client_handover === 'complete';
  const acceptedFee = feeProposals.find(f => f.status === 'accepted');
  const jctExec = jcts.find(j => j.executed === 'yes') || jcts[0];
  return [
    { label: 'Scoping', date: project.pq_approval_date || project.created_date, details: project.pq_approval_date ? [`PQ approval recorded: ${formatDate(project.pq_approval_date)}.`] : ['Missing: PQ approval date.', 'The displayed date is project creation, not scoping sign-off.'] },
    { label: 'Fee Proposal', date: acceptedFee?.client_approval_date || acceptedFee?.date_issued, details: acceptedFee ? ['Fee proposal accepted.', `Revision: R${acceptedFee.revision_number || 1}`, acceptedFee.client_approval_date ? `Client approval: ${formatDate(acceptedFee.client_approval_date)}` : 'Missing: client approval date; the milestone uses the issue date instead.'] : ['Outstanding: accepted fee proposal.', 'No accepted proposal date is available.'] },
    { label: 'Agreement', date: project.aa_executed_date, details: project.aa_executed_date ? [`${agreementNames(project.project_number).access} execution recorded: ${formatDate(project.aa_executed_date)}.`] : [`Missing: ${agreementNames(project.project_number).access} execution date.`] },
    ...[2, 3, 4].map(stage => ({ label: `RIBA ${stage}`, date: project[`riba${stage}_end`], details: [project[`riba${stage}_end`] ? `Recorded actual completion: ${formatDate(project[`riba${stage}_end`])}.` : `Missing: RIBA ${stage} actual completion date.`, 'The milestone uses the recorded date; separate stage approval is not recorded here.'] })),
    { label: 'Contract', date: jctExec?.date_of_execution, details: documentChecklistDetails(jctExec, 'JCT contract') },
    { label: 'Construction', date: pcDate, done: pcAchieved, details: pcDate ? [`Practical completion date recorded: ${formatDate(pcDate)}.`, pcAchieved ? 'Construction complete: PC achieved.' : 'PC date is in the future; construction is not yet complete.', 'Certificate sign-off is not confirmed by this date alone.'] : ['Outstanding: practical completion date.', 'Construction turns green when PC is achieved; no commencement date is required.'] },
    { label: 'Handover', date: null, done: handoverComplete, text: handoverComplete ? 'Complete' : 'Outstanding', details: [handoverComplete ? 'Client handover recorded as complete.' : `Client handover: ${delivery?.client_handover || 'outstanding'}.`, 'Uses the client handover status in Practical Completion & Close-out, independently of PC.', 'No handover date is recorded.'] },
  ];
}