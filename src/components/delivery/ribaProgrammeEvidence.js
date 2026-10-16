import { formatDate } from '@/lib/portal';
export default function ribaProgrammeEvidence(project) {
 const milestones = [2, 3, 4].flatMap(stage => {
  const date = project[`riba${stage}_end`];
  return date && Number.isFinite(Date.parse(date)) ? [{
   label: `RIBA ${stage}`, date,
   details: [`RIBA ${stage} completion date recorded: ${formatDate(date)}.`, 'Only recorded stages are included; dates and approvals for other stages are not inferred.'],
  }] : [];
 });
 return {
  recorded: milestones.length > 0,
  details: milestones.length ? [...milestones.map(item => item.details[0]), 'A recorded RIBA 2, 3 or 4 date satisfies this programme check; separate dates for every stage are not required. This does not confirm separate stage approvals.'] : ['Missing: a RIBA programme date (RIBA 2, 3 or 4).'],
  milestones: milestones.length ? milestones : [{label: 'RIBA programme', date: null, details: ['Missing: a RIBA programme date (RIBA 2, 3 or 4).']}],
 };
}