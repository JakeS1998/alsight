import deliveryStageCompletion from '@/components/delivery/deliveryStageCompletion';
import { preConstructionAppointments } from '@/components/delivery/preConstructionAppointments';
import agreementNames from '@/components/projects/agreementNames';
import { programmeMilestones } from '@/components/delivery/programmeMilestones';
import contractorAppointment, { savedDeliveryTeam } from '@/components/delivery/contractorAppointment';
export const JOURNEY_STAGES = [
  { id: 1, label: 'Opportunity & Scoping', short: 'Scoping' },
  { id: 2, label: 'Fee Proposal', short: 'Fees' },
  { id: 3, label: 'Pre-Construction', short: 'Readiness' },
  { id: 4, label: 'Design & Consultant Team', short: 'Design' },
  { id: 5, label: 'Programme', short: 'Programme' },
  { id: 6, label: 'Action Register', short: 'Actions', showProgress: false },
  { id: 7, label: 'Decision Register', short: 'Decisions', showProgress: false },
  { id: 8, label: 'Project Risk Register', short: 'Risks' },
  { id: 9, label: 'Construction', short: 'Construction' },
  { id: 10, label: 'Practical Completion & Close-out', short: 'Close-out' },
];
const percent = checks => Math.round(checks.filter(Boolean).length / checks.length * 100);
const APPTS = ['appointment_pm', 'appointment_pd_cdm', 'appointment_pd_br'];
export default function deliveryJourneyProgress({ project, delivery = {}, feeProposals, legalDocs, dmas, jcts, warranties, registers, suppliers = [], accountMap = {} }) {
  const completed = deliveryStageCompletion(project, delivery);
  const aa = legalDocs.find(d => d.document_type === 'access_agreement');
  const appointment = contractorAppointment({ deliveryTeam: savedDeliveryTeam(delivery), suppliers, accountMap, legalDocs });
  const pcsa = appointment.document;
  const appointments = preConstructionAppointments(legalDocs);
  const fee = feeProposals.find(f => f.is_current) || feeProposals[0];
  const check = (label, done, detail) => ({ label, done: !!done, detail });
  const labels = ['Project Manager', 'Principal Designer CDM', 'Principal Designer Building Regulations'];
  const breakdown = {
    1: [check('Feasibility complete', delivery.feasibility_status === 'complete'), check('Site visit completed', delivery.site_visit_completed)],
    2: [check('Current fee proposal recorded', !!fee), check('Current fee proposal accepted', fee?.status === 'accepted')],
    3: [check(`${agreementNames(project.project_number).access} executed`, aa?.executed === 'yes'), check('Fee proposal accepted', feeProposals.some(f => f.status === 'accepted')), check('Required appointments executed (architect optional)', appointments.done, `${appointments.completed}/${appointments.total} required appointments executed`), check('Contractor appointment executed', pcsa?.executed === 'yes', pcsa?.document_id), check(`${agreementNames(project.project_number).developmentShort} executed`, dmas[0]?.executed === 'yes'), check('RIBA 2 completion date recorded', !!project.riba2_end), check('Contractor identified', appointment.identified || jcts.length > 0 || warranties.some(w => w.category === 'contractor'))],
    4: [...APPTS.map((type, index) => { const doc = legalDocs.find(d => d.document_type === type); return check(`${labels[index]} appointment executed or PO issued`, ['yes', 'po'].includes(doc?.executed), doc?.document_id); }), check('Contractor appointment executed / PO issued, or JCT executed', ['yes', 'po'].includes(pcsa?.executed) || jcts.some(j => j.executed === 'yes'))],
    5: programmeMilestones(project, feeProposals, jcts, delivery).map(m => check(m.label, m.done ?? !!m.date, m.details?.join(' '))),
    9: [check('Practical completion achieved', completed.construction)],
    10: [check('Practical completion achieved', completed.construction), check('Final account closed', delivery.final_account_status === 'closed'), ...[['om_manuals', 'O&M manuals'], ['hs_file', 'Health & safety file'], ['warranties_status', 'Warranties'], ['training', 'Training'], ['asset_info', 'Asset information'], ['client_handover', 'Client handover']].map(([key, label]) => check(`${label} complete`, delivery[key] === 'complete'))],
  };
  const checks = {
    1: completed['opportunity & scoping'] ? 100 : percent(breakdown[1].map(item => item.done)),
    2: percent(breakdown[2].map(item => item.done)),
    3: percent(breakdown[3].map(item => item.done)),
    4: percent(breakdown[4].map(item => item.done)),
    5: percent(breakdown[5].map(item => item.done)),
    9: completed.construction ? 100 : Math.min(99, Math.max(0, Number(delivery.pct_programme) || 0)),
    10: completed['practical completion & close-out'] ? 100 : percent(breakdown[10].map(item => item.done)),
  };
  const notes = {
    4: 'Required appointments and the contractor check have equal weight. Architect appointment is optional and does not affect stage completion.',
    1: completed['opportunity & scoping'] ? 'Feasibility marked complete sets this stage to 100%, even if the site visit is outstanding.' : 'Each check has equal weight; the result is rounded to the nearest whole percentage.',
    9: completed.construction ? 'Practical completion achieved sets Construction to 100%.' : `Saved programme completion: ${Number(delivery.pct_programme) || 0}%. This is limited to 0–99% until practical completion is achieved; it is not a checklist average.`,
  };
  for (const id of [6, 7, 8]) checks[id] = registers[id]?.percent ?? null;
  return JOURNEY_STAGES.map(stage => ({ ...stage, percent: checks[stage.id], complete: checks[stage.id] === 100, detail: registers[stage.id]?.detail, checks: breakdown[stage.id] || registers[stage.id]?.checks, explanation: notes[stage.id] || ([6, 7, 8].includes(stage.id) ? registers[stage.id]?.detail : 'Each check has equal weight; the result is rounded to the nearest whole percentage.') }));
}