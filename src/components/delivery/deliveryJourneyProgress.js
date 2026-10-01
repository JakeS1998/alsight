import deliveryStageCompletion from '@/components/delivery/deliveryStageCompletion';
import { programmeMilestones } from '@/components/delivery/programmeMilestones';
import contractorAppointment, { savedDeliveryTeam } from '@/components/delivery/contractorAppointment';
export const JOURNEY_STAGES = [
  { id: 1, label: 'Opportunity & Scoping', short: 'Scoping' },
  { id: 2, label: 'Fee Proposal', short: 'Fees' },
  { id: 3, label: 'Pre-Construction', short: 'Readiness' },
  { id: 4, label: 'Design & Consultant Team', short: 'Design' },
  { id: 5, label: 'Programme', short: 'Programme' },
  { id: 6, label: 'Action Register', short: 'Actions' },
  { id: 7, label: 'Decision Register', short: 'Decisions' },
  { id: 8, label: 'Project Risk Register', short: 'Risks' },
  { id: 9, label: 'Construction', short: 'Construction' },
  { id: 10, label: 'Practical Completion & Close-out', short: 'Close-out' },
];
const percent = checks => Math.round(checks.filter(Boolean).length / checks.length * 100);
const APPTS = ['appointment_pm', 'appointment_pd_cdm', 'appointment_architect', 'appointment_pd_br'];
export default function deliveryJourneyProgress({ project, delivery = {}, feeProposals, legalDocs, dmas, jcts, warranties, registers, suppliers = [], accountMap = {} }) {
  const completed = deliveryStageCompletion(project, delivery);
  const aa = legalDocs.find(d => d.document_type === 'access_agreement');
  const appointment = contractorAppointment({ deliveryTeam: savedDeliveryTeam(delivery), suppliers, accountMap, legalDocs });
  const pcsa = appointment.document;
  const appointments = legalDocs.filter(d => APPTS.includes(d.document_type));
  const fee = feeProposals.find(f => f.is_current) || feeProposals[0];
  const checks = {
    1: completed['opportunity & scoping'] ? 100 : percent([delivery.feasibility_status === 'complete', delivery.site_visit_completed]),
    2: percent([!!fee, fee?.status === 'accepted']),
    3: percent([aa?.executed === 'yes', feeProposals.some(f => f.status === 'accepted'), appointments.filter(d => d.executed === 'yes').length >= 4, pcsa?.executed === 'yes', dmas[0]?.executed === 'yes', !!project.riba2_end, appointment.identified || jcts.length > 0 || warranties.some(w => w.category === 'contractor')]),
    4: percent([...APPTS.map(type => { const doc = legalDocs.find(d => d.document_type === type); return ['yes', 'po'].includes(doc?.executed); }), ['yes', 'po'].includes(pcsa?.executed) || jcts.some(j => j.executed === 'yes')]),
    5: percent(programmeMilestones(project, feeProposals, jcts, delivery).map(m => m.done ?? !!m.date)),
    9: completed.construction ? 100 : Math.min(99, Math.max(0, Number(delivery.pct_programme) || 0)),
    10: completed['practical completion & close-out'] ? 100 : percent([completed.construction, delivery.final_account_status === 'closed', ...['om_manuals', 'hs_file', 'warranties_status', 'training', 'asset_info', 'client_handover'].map(key => delivery[key] === 'complete')]),
  };
  for (const id of [6, 7, 8]) checks[id] = registers[id]?.percent ?? null;
  return JOURNEY_STAGES.map(stage => ({ ...stage, percent: checks[stage.id], complete: checks[stage.id] === 100, detail: registers[stage.id]?.detail }));
}