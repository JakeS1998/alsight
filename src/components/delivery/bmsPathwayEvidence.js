import { preConstructionAppointments } from '@/components/delivery/preConstructionAppointments';
import contractorAppointment, { savedDeliveryTeam } from '@/components/delivery/contractorAppointment';
import ribaProgrammeEvidence from '@/components/delivery/ribaProgrammeEvidence';
const dated = value => !!value && Number.isFinite(Date.parse(value)) && Date.parse(value) <= Date.now();
export default function bmsPathwayEvidence({project,delivery={},feeProposals=[],legalDocs=[],dmas=[],jcts=[],warranties=[],registers={},suppliers=[],accountMap={},pdBrDecision,uklfComplete=false}) {
 const aa=legalDocs.find(d=>d.document_type==='access_agreement');
 const appointment=contractorAppointment({deliveryTeam:savedDeliveryTeam(delivery),suppliers,accountMap,legalDocs});
 const fee=feeProposals.find(f=>f.is_current)||feeProposals[0];
 const result=(done,detail='',url='')=>({done:!!done,detail,url});
 const pso=key=>result(!!delivery[`pso_${key}_approved_by`]?.trim()&&dated(delivery[`pso_${key}_date`]),`PSO: ${delivery[`pso_${key}_approved_by`]||'approver outstanding'} · ${delivery[`pso_${key}_date`]||'date outstanding'}`,project.link_to_pso);
 const pack=key=>delivery.handover_items?.find(item=>item.key===key);
 const handover=(field,key)=>result(delivery[field]==='complete'||pack(key)?.review_status==='complete',pack(key)?.notes||delivery[`${field}_notes`]||'Uses existing close-out / handover evidence.',pack(key)?.link);
 const appts=preConstructionAppointments(legalDocs,pdBrDecision);
 const variation=legalDocs.find(d=>/variation/i.test(d.document_type||'')&&/access|agreement/i.test(d.document_type||''));
 return {
  procurement_route:result(typeof project.procurement_route==='boolean',project.procurement_route===false?'Non-framework route':'UKLF route'),
  requirements:result(delivery.scope_summary?.trim()&&delivery.client_objectives?.trim(),'Scope summary and client objectives in Scope.'),
  funding:result(delivery.funding_route?.trim()&&Number(project.estimated_value)>0,'Existing funding route and indicative project value; not a funding approval.'),
  site_visit:result(delivery.site_visit_completed,'Initial visit recorded in Scope.'),feasibility:result(delivery.feasibility_status==='complete','Existing feasibility status; does not override the other Scope checks.'),
  pso_pq:pso('pq'),pso_aa:pso('aa'),pso_dma:pso('dma'),
  pq_approved:result(dated(project.pq_approval_date),'Project PQ approval date from the existing approved project record.',project.link_to_project_questionnaire),
  fee_recorded:result(fee,'Existing current fee proposal.'),fee_accepted:result(fee?.status==='accepted','Uses the current proposal acceptance status, not an issue date.'),
  aa_executed:result(aa?.executed==='yes',aa?.document_id,aa?.link_to_file),dma_executed:result(dmas.some(d=>d.executed==='yes'),dmas[0]?.document_id,dmas[0]?.link_to_file),
  agreement_variation:result(variation?.executed==='yes'&&pso('aa_variations').done,variation?.document_id,variation?.link_to_file),
  contractor_selected:result(appointment.identified||jcts.length||warranties.some(w=>w.category==='contractor'),'Existing contractor/team records.'),
  appointments:result(appts.done,`${appts.completed}/${appts.total} required appointments executed. Architect optional; existing PD BR applicability retained.`),
  contractor_appointment:result(appointment.document?.executed==='yes',appointment.document?.document_id,appointment.document?.link_to_file),
  riba_dates:result(ribaProgrammeEvidence(project).recorded,ribaProgrammeEvidence(project).details.join(' ')),
  actions:{...result(registers[6]?.percent===100,registers[6]?.detail),pending:registers[6]?.percent==null},decisions:{...result(registers[7]?.percent===100,registers[7]?.detail),pending:registers[7]?.percent==null},
  risks:{...result(registers[8]?.percent===100,registers[8]?.detail),pending:registers[8]?.percent==null,subchecks:registers[8]?.checks},
  jct:result(jcts.some(j=>j.executed==='yes'),'Uses executed contract status, not its milestone date.',jcts.find(j=>j.executed==='yes')?.link_to_file),
  progress_meetings:result(dated(delivery.last_progress_meeting),delivery.last_progress_meeting?'Latest recorded meeting: '+delivery.last_progress_meeting:'Record the latest progress meeting in Build.'),
  pc:result(dated(delivery.pc_achieved||project.practical_completion_date),'Practical completion date must have been reached. This does not approve a stage report.'),
  final_account:result(delivery.final_account_status==='closed'||pack('final_account')?.review_status==='complete','Existing final-account close-out / handover record.'),
  om:handover('om_manuals','om'),hs:handover('hs_file','hs'),warranties:handover('warranties_status','warranties'),training:handover('training','training'),assets:handover('asset_info','assets'),
  handover_checklist:result(delivery.handover_items?.length&&delivery.handover_items.every(item=>item.review_status==='complete'),'Uses the existing handover checklist. Automatic/unreviewed items are not assumed complete.'),
  client_handover:result(delivery.client_handover==='complete','Existing official client handover status.'),uklf:result(uklfComplete,'Existing UKLF framework record/KPI completion.'),lessons:result(delivery.lessons_learned?.trim(),'Uses the existing lessons learned field in Handover.'),
 };
}